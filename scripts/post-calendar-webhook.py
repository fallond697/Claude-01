#!/usr/bin/env python3
"""
Post Change Calendar to Teams Change Control channel via Incoming Webhook.
Replicates the Friday/Monday card (Scheduled changes, next 7 days, on-hold excluded)
but posts through the webhook URL so it needs no MSAL/Graph token.

Reads SN OAuth accessToken from ~/.servicenow-mcp/tokens.json and the webhook URL
from .webhook-url next to this script.
"""
import json
import sys
from datetime import datetime
from pathlib import Path

import requests

SN_INSTANCE = "vituity.service-now.com"
SN_TOKEN_CACHE = Path.home() / ".servicenow-mcp" / "tokens.json"
WEBHOOK_FILE = Path(__file__).resolve().parent / ".webhook-url"
CARD_OUT = Path(__file__).resolve().parent / "live-adaptive-card.json"
DASHBOARD_URL = "https://vituity.service-now.com/now/platform-analytics-workspace/dashboards/params/edit/false/sys-id/27df42dbe6770153e1186e1215e19ffb"


def get_sn_token():
    with open(SN_TOKEN_CACHE) as f:
        data = json.load(f)
    tokens = data.get(f"https://{SN_INSTANCE}")
    if not tokens:
        raise SystemExit("No ServiceNow token in tokens.json")
    if tokens["expiresAt"] <= datetime.now().timestamp() * 1000:
        raise SystemExit("ServiceNow token expired. Run refresh_snow_token.py prod")
    return tokens["accessToken"]


def get_field(field):
    if isinstance(field, str):
        return field
    if isinstance(field, dict):
        return field.get("display_value") or field.get("value", "")
    return str(field) if field else ""


def format_date(sn_date):
    if not sn_date:
        return "TBD"
    try:
        dt = datetime.fromisoformat(str(sn_date).replace("Z", "+00:00"))
        return dt.strftime("%m/%d %H:%M")
    except Exception:
        return str(sn_date)


def fetch(query, fields, limit=50):
    token = get_sn_token()
    url = (
        f"https://{SN_INSTANCE}/api/now/table/change_request"
        f"?sysparm_query={query}&sysparm_display_value=true"
        f"&sysparm_fields={fields}&sysparm_limit={limit}"
    )
    r = requests.get(url, headers={"Accept": "application/json", "Authorization": f"Bearer {token}"})
    r.raise_for_status()
    return r.json().get("result", [])


def build_card(changes, on_hold_count):
    date_str = datetime.now().strftime("%b %d, %Y")
    body = [
        {"type": "TextBlock", "text": "Change Calendar — Scheduled Changes",
         "weight": "bolder", "size": "large", "color": "accent"},
        {"type": "TextBlock",
         "text": f"{len(changes)} scheduled change(s)  |  {on_hold_count} on-hold excluded  |  Updated {date_str}",
         "size": "small", "isSubtle": True, "spacing": "none"},
    ]
    for c in changes:
        num = get_field(c.get("number"))
        desc = get_field(c.get("short_description")) or "(no description)"
        risk = get_field(c.get("risk")) or "Low"
        assigned = get_field(c.get("assigned_to")) or "Unassigned"
        group = get_field(c.get("assignment_group")) or ""
        tag = f"{assigned} ({group})" if group else assigned
        risk_color = "attention" if "high" in risk.lower() else "warning" if "moderate" in risk.lower() else "good"
        body.append({
            "type": "Container", "separator": True, "items": [
                {"type": "ColumnSet", "columns": [
                    {"type": "Column", "width": "auto", "items": [
                        {"type": "TextBlock",
                         "text": f"[{num}](https://{SN_INSTANCE}/nav_to.do?uri=change_request.do?sysparm_query=number={num})",
                         "color": "accent", "size": "small", "weight": "bolder"}]},
                    {"type": "Column", "width": "stretch", "items": [
                        {"type": "TextBlock", "text": desc, "size": "small", "wrap": True}]},
                    {"type": "Column", "width": "auto", "items": [
                        {"type": "TextBlock", "text": risk, "size": "small", "weight": "bolder", "color": risk_color}]},
                ]},
                {"type": "TextBlock",
                 "text": f"{format_date(c.get('start_date'))} → {format_date(c.get('end_date'))}  |  {tag}",
                 "size": "small", "isSubtle": True, "spacing": "none"},
            ],
        })
    adaptive_card = {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard", "version": "1.2", "body": body,
        "actions": [{"type": "Action.OpenUrl", "title": "View Full Calendar in ServiceNow", "url": DASHBOARD_URL}],
    }
    return {"type": "message", "attachments": [
        {"contentType": "application/vnd.microsoft.card.adaptive", "content": adaptive_card}]}


def main():
    changes = fetch(
        "state=-2^on_hold=false^start_dateRELATIVELE@hour@ahead@168^ORDERBYstart_date",
        "number,short_description,risk,start_date,end_date,assigned_to,assignment_group",
    )
    on_hold = len(fetch(
        "state=-2^on_hold=true^start_dateRELATIVELE@hour@ahead@168", "number", limit=50))
    print(f"  Built: {len(changes)} scheduled changes, {on_hold} on-hold excluded")

    msg = build_card(changes, on_hold)
    CARD_OUT.write_text(json.dumps(msg, indent=2), encoding="utf-8")

    webhook = WEBHOOK_FILE.read_text(encoding="utf-8").strip()
    r = requests.post(webhook, json=msg, headers={"Content-Type": "application/json"})
    print(f"  Posted to Teams webhook: HTTP {r.status_code}")
    if r.status_code not in (200, 202):
        print(f"  Response: {r.text}")
        sys.exit(1)
    print("  Done!")


if __name__ == "__main__":
    main()
