#!/usr/bin/env python3
"""
ServiceNow Post-Implementation Review (PIR) Automation

Analyzes changes in Review state against ISMS-STA-11.01-01 required fields,
generates standardized PIR work notes, and optionally posts them.

Usage:
    python pir_review.py                              # Dry run: analyze all Review changes
    python pir_review.py --post                       # Analyze and post work notes
    python pir_review.py --post --changes CHG0039282,CHG0039278
    python pir_review.py --post-note CHG0039282 "Your note text"
"""

import argparse
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

try:
    import requests
except ImportError:
    print("ERROR: 'requests' package required. Install with: pip install requests")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

INSTANCE_URL = "https://vituity.service-now.com"
TOKEN_FILE = Path.home() / ".servicenow-mcp" / "tokens.json"
VSCODE_MCP_CONFIG = Path.home() / "AppData" / "Roaming" / "Code" / "User" / "mcp.json"

# 14 policy-required fields per ISMS-STA-11.01-01
REQUIRED_FIELDS = {
    "type":                 "Change Request Type",
    "requested_by":         "Requested By",
    "cmdb_ci":              "Configuration Item",
    "u_environment":        "Environment",
    "assignment_group":     "Assignment Group",
    "short_description":    "Short Description",
    "description":          "Description",
    "justification":        "Justification/Business Value",
    "implementation_plan":  "Implementation Plan",
    "risk_impact_analysis": "Risk and Impact Analysis",
    "backout_plan":         "Backout Plan",
    "test_plan":            "Test Plan",
    "start_date":           "Planned Start Date",
    "end_date":             "Planned End Date",
}

PLAN_FIELDS = {"implementation_plan", "backout_plan", "test_plan"}

# Review state = 0 in ServiceNow change_request state field (display value "Review")
REVIEW_STATE = "0"

# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def _get_client_creds() -> tuple[str, str]:
    """Read client ID/secret from env vars or VSCode MCP config."""
    cid = os.environ.get("SERVICENOW_CLIENT_ID")
    csec = os.environ.get("SERVICENOW_CLIENT_SECRET")
    if cid and csec:
        return cid, csec

    if VSCODE_MCP_CONFIG.exists():
        cfg = json.loads(VSCODE_MCP_CONFIG.read_text(encoding="utf-8"))
        env = cfg.get("servers", {}).get("servicenow", {}).get("env", {})
        cid = env.get("SERVICENOW_CLIENT_ID")
        csec = env.get("SERVICENOW_CLIENT_SECRET")
        if cid and csec:
            return cid, csec

    print("ERROR: Cannot find ServiceNow client credentials.")
    print("Set SERVICENOW_CLIENT_ID and SERVICENOW_CLIENT_SECRET env vars,")
    print(f"or ensure {VSCODE_MCP_CONFIG} contains them.")
    sys.exit(1)


def _load_tokens() -> dict:
    """Load tokens from the MCP token file."""
    if not TOKEN_FILE.exists():
        print(f"ERROR: Token file not found: {TOKEN_FILE}")
        print("Run the ServiceNow MCP server first to generate tokens.")
        sys.exit(1)
    data = json.loads(TOKEN_FILE.read_text(encoding="utf-8"))
    return data.get(INSTANCE_URL, data)


def _save_tokens(tokens: dict) -> None:
    """Save refreshed tokens back to the MCP token file."""
    data = {}
    if TOKEN_FILE.exists():
        data = json.loads(TOKEN_FILE.read_text(encoding="utf-8"))
    data[INSTANCE_URL] = tokens
    TOKEN_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


def _refresh_token(tokens: dict) -> dict:
    """Refresh the OAuth token using the refresh_token grant."""
    cid, csec = _get_client_creds()
    resp = requests.post(
        f"{INSTANCE_URL}/oauth_token.do",
        data={
            "grant_type": "refresh_token",
            "client_id": cid,
            "client_secret": csec,
            "refresh_token": tokens["refreshToken"],
        },
        timeout=30,
    )
    resp.raise_for_status()
    body = resp.json()
    new_tokens = {
        "accessToken": body["access_token"],
        "refreshToken": body["refresh_token"],
        "expiresAt": int(time.time() * 1000) + body["expires_in"] * 1000,
        "scope": tokens.get("scope", ""),
    }
    _save_tokens(new_tokens)
    return new_tokens


def get_access_token() -> str:
    """Return a valid access token, refreshing if expired."""
    tokens = _load_tokens()
    expires_at_ms = tokens.get("expiresAt", 0)
    now_ms = int(time.time() * 1000)
    # Refresh if expiring within 60 seconds
    if now_ms >= expires_at_ms - 60_000:
        print("Token expired, refreshing...")
        tokens = _refresh_token(tokens)
        print("Token refreshed successfully.")
    return tokens["accessToken"]


# ---------------------------------------------------------------------------
# ServiceNow API
# ---------------------------------------------------------------------------

def _headers() -> dict:
    return {
        "Authorization": f"Bearer {get_access_token()}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }


def query_review_changes() -> list[dict]:
    """Fetch all change_requests in Review state."""
    url = (
        f"{INSTANCE_URL}/api/now/table/change_request"
        f"?sysparm_query=state={REVIEW_STATE}"
        f"&sysparm_display_value=all"
        f"&sysparm_limit=50"
    )
    resp = requests.get(url, headers=_headers(), timeout=30)
    resp.raise_for_status()
    return resp.json().get("result", [])


def get_change_detail(number: str) -> dict | None:
    """Fetch a single change by number (e.g., CHG0039282)."""
    url = (
        f"{INSTANCE_URL}/api/now/table/change_request"
        f"?sysparm_query=number={number}"
        f"&sysparm_display_value=all"
        f"&sysparm_limit=1"
    )
    resp = requests.get(url, headers=_headers(), timeout=30)
    resp.raise_for_status()
    results = resp.json().get("result", [])
    return results[0] if results else None


def post_work_note(sys_id: str, note: str) -> bool:
    """PATCH a work note onto a change request."""
    url = f"{INSTANCE_URL}/api/now/table/change_request/{sys_id}"
    resp = requests.patch(
        url,
        headers=_headers(),
        json={"work_notes": note},
        timeout=30,
    )
    if resp.status_code in (200, 204):
        return True
    print(f"  WARN: PATCH returned {resp.status_code}: {resp.text[:200]}")
    return False


# ---------------------------------------------------------------------------
# Analysis
# ---------------------------------------------------------------------------

def _field_value(change: dict, field: str) -> str:
    """Extract display value for a field, handling SNOW's nested format."""
    val = change.get(field, "")
    if isinstance(val, dict):
        val = val.get("display_value", "") or val.get("value", "")
    return (val or "").strip()


def _assess_plan(text: str) -> str:
    """Assess a plan field: OK, WEAK, or MISSING."""
    if not text or text.lower() in ("n/a", "na", "none", "null", "-", "tbd"):
        return "MISSING"

    # Check for discrete steps: numbered lists, bullets, or multiple sentences
    has_numbered = bool(re.search(r'(?m)^\s*\d+[\.\)]\s', text))
    has_bullets = bool(re.search(r'(?m)^\s*[-*•]\s', text))
    sentence_count = len(re.findall(r'[.!]\s+[A-Z]', text)) + 1

    if has_numbered or has_bullets or sentence_count >= 3:
        return "OK"

    if len(text) > 50:
        return "WEAK"

    return "WEAK"


def analyze_change(change: dict) -> dict:
    """Analyze a change against policy requirements. Returns analysis dict."""
    number = _field_value(change, "number")
    short_desc = _field_value(change, "short_description")

    gaps = []
    field_status = {}

    for field, label in REQUIRED_FIELDS.items():
        val = _field_value(change, field)

        if field in PLAN_FIELDS:
            status = _assess_plan(val)
            field_status[field] = status
            if status != "OK":
                gaps.append(f"- **{label}**: {status}")
        elif not val:
            field_status[field] = "MISSING"
            gaps.append(f"- **{label}**: MISSING")
        else:
            field_status[field] = "OK"

    # Summary counts
    ok_count = sum(1 for s in field_status.values() if s == "OK")
    total = len(REQUIRED_FIELDS)

    return {
        "number": number,
        "short_description": short_desc,
        "sys_id": change.get("sys_id", {}).get("value", change.get("sys_id", "")),
        "field_status": field_status,
        "gaps": gaps,
        "score": f"{ok_count}/{total}",
        "ok_count": ok_count,
        "total": total,
        "assigned_to": _field_value(change, "assigned_to"),
        "assignment_group": _field_value(change, "assignment_group"),
        "start_date": _field_value(change, "start_date"),
        "end_date": _field_value(change, "end_date"),
        "type": _field_value(change, "type"),
        "impl_plan": _field_value(change, "implementation_plan"),
        "backout_plan": _field_value(change, "backout_plan"),
        "test_plan": _field_value(change, "test_plan"),
    }


def generate_pir_note(analysis: dict) -> str:
    """Generate a standardized PIR work note from analysis."""
    number = analysis["number"]
    score = analysis["score"]
    gaps = analysis["gaps"]

    lines = [
        f"[PIR Review - {datetime.now(timezone.utc).strftime('%Y-%m-%d')}]",
        f"",
        f"Change: {number} - {analysis['short_description']}",
        f"Policy Compliance: {score} required fields complete",
        f"",
    ]

    # Plan assessments
    for field, label in [
        ("implementation_plan", "Implementation Plan"),
        ("backout_plan", "Backout Plan"),
        ("test_plan", "Test Plan"),
    ]:
        status = analysis["field_status"].get(field, "MISSING")
        lines.append(f"{label}: {status}")
    lines.append("")

    if gaps:
        lines.append("Gaps identified:")
        lines.extend(gaps)
        lines.append("")

    if analysis["ok_count"] == analysis["total"]:
        lines.append("Recommendation: All required fields present. Change may proceed to closure.")
    elif analysis["ok_count"] >= analysis["total"] - 2:
        lines.append("Recommendation: Minor gaps. Address items above, then change may proceed to closure.")
    else:
        lines.append("Recommendation: Significant gaps. Implementer should address items above before closure.")

    lines.append("")
    lines.append("-- Automated PIR review per ISMS-STA-11.01-01")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def print_scorecard(analyses: list[dict]) -> None:
    """Print a summary scorecard to stdout."""
    print("\n" + "=" * 70)
    print("PIR REVIEW SCORECARD")
    print("=" * 70)
    for a in analyses:
        status = "PASS" if a["ok_count"] == a["total"] else "GAPS"
        print(f"  {a['number']}  {a['score']:>5}  [{status}]  {a['short_description'][:50]}")
    print("=" * 70)
    total_changes = len(analyses)
    passing = sum(1 for a in analyses if a["ok_count"] == a["total"])
    print(f"  {passing}/{total_changes} changes fully compliant")
    print()


def main():
    parser = argparse.ArgumentParser(description="ServiceNow PIR Review Automation")
    parser.add_argument("--post", action="store_true", help="Post generated work notes to ServiceNow")
    parser.add_argument("--changes", type=str, help="Comma-separated CHG numbers (default: all in Review)")
    parser.add_argument("--post-note", nargs=2, metavar=("CHG", "NOTE"), help="Post a raw note to a single change")
    args = parser.parse_args()

    # Mode: post a raw note
    if args.post_note:
        chg_number, note_text = args.post_note
        print(f"Fetching {chg_number}...")
        change = get_change_detail(chg_number)
        if not change:
            print(f"ERROR: Change {chg_number} not found.")
            sys.exit(1)
        sys_id = change.get("sys_id", {})
        if isinstance(sys_id, dict):
            sys_id = sys_id.get("value", "")
        print(f"Posting work note to {chg_number} ({sys_id})...")
        if post_work_note(sys_id, note_text):
            print(f"SUCCESS: Work note posted to {chg_number}")
        else:
            print(f"FAILED: Could not post work note to {chg_number}")
            sys.exit(1)
        return

    # Mode: analyze (and optionally post)
    if args.changes:
        chg_numbers = [c.strip() for c in args.changes.split(",")]
        print(f"Fetching {len(chg_numbers)} specified changes...")
        changes = []
        for num in chg_numbers:
            c = get_change_detail(num)
            if c:
                changes.append(c)
            else:
                print(f"  WARN: {num} not found, skipping")
    else:
        print("Querying all changes in Review state...")
        changes = query_review_changes()

    if not changes:
        print("No changes found.")
        return

    print(f"Found {len(changes)} change(s). Analyzing...\n")

    analyses = []
    notes = []
    for change in changes:
        analysis = analyze_change(change)
        note = generate_pir_note(analysis)
        analyses.append(analysis)
        notes.append(note)

        # Print each analysis
        print(f"--- {analysis['number']} ---")
        print(f"  {analysis['short_description']}")
        print(f"  Score: {analysis['score']}")
        for field, label in REQUIRED_FIELDS.items():
            status = analysis["field_status"][field]
            marker = "OK" if status == "OK" else f"** {status} **"
            print(f"    {label}: {marker}")
        print()
        if not args.post:
            print("  Generated note:")
            for line in note.split("\n"):
                print(f"    {line}")
            print()

    print_scorecard(analyses)

    if args.post:
        print("Posting work notes to ServiceNow...\n")
        for analysis, note in zip(analyses, notes):
            sys_id = analysis["sys_id"]
            number = analysis["number"]
            print(f"  Posting to {number}...", end=" ")
            if post_work_note(sys_id, note):
                print("OK")
            else:
                print("FAILED")
        print("\nDone.")
    else:
        print("DRY RUN - no notes posted. Use --post to post work notes.")


if __name__ == "__main__":
    main()
