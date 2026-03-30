#!/usr/bin/env python
"""Refresh calendar_changes.json from ServiceNow change_request table."""

import json
import os
import ssl
import urllib.request
import urllib.parse

INSTANCE = "https://vituity.service-now.com"
TOKEN_FILE = os.path.expanduser("~/.servicenow-mcp/tokens.json")
OUTPUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "calendar_changes.json")

FIELDS = "number,short_description,type,state,assignment_group,assigned_to,start_date,end_date,cmdb_ci,close_code,priority,risk"
QUERY = "start_date>=2026-02-01^start_date<=2026-05-10"

# Field name mapping for output
RENAME = {"start_date": "planned_start", "end_date": "planned_end"}

# Date fields to truncate to YYYY-MM-DD
DATE_FIELDS = {"start_date", "end_date"}


def load_token():
    with open(TOKEN_FILE, "r") as f:
        tokens = json.load(f)
    return tokens[INSTANCE]["accessToken"]


def fetch_changes(token):
    params = urllib.parse.urlencode({
        "sysparm_query": QUERY,
        "sysparm_fields": FIELDS,
        "sysparm_display_value": "true",
        "sysparm_limit": "200",
    })
    url = f"{INSTANCE}/api/now/table/change_request?{params}"

    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    })

    ctx = ssl.create_default_context()
    with urllib.request.urlopen(req, context=ctx) as resp:
        data = json.loads(resp.read().decode())

    return data.get("result", [])


def parse_display_date(val):
    """Convert MM/DD/YYYY or MM/DD/YYYY HH:MM:SS to YYYY-MM-DD."""
    if not val:
        return val
    # Take date portion only (before any space)
    date_part = val.split(" ")[0]
    parts = date_part.split("/")
    if len(parts) == 3:
        mm, dd, yyyy = parts
        return f"{yyyy}-{mm.zfill(2)}-{dd.zfill(2)}"
    # Fallback: already YYYY-MM-DD or other format, take first 10 chars
    return val[:10]


def unwrap(val):
    """Extract display_value from reference fields that return as objects."""
    if isinstance(val, dict):
        return val.get("display_value", "")
    return val


def transform(records):
    out = []
    for rec in records:
        row = {}
        for key, val in rec.items():
            val = unwrap(val)
            # Convert date fields to YYYY-MM-DD
            if key in DATE_FIELDS:
                val = parse_display_date(val)
            out_key = RENAME.get(key, key)
            row[out_key] = val
        out.append(row)

    # Sort by planned_start ascending
    out.sort(key=lambda r: r.get("planned_start", ""))
    return out


def main():
    token = load_token()
    records = fetch_changes(token)
    results = transform(records)

    with open(OUTPUT, "w") as f:
        json.dump(results, f, indent=2)

    print(f"Wrote {len(results)} changes to {OUTPUT}")


if __name__ == "__main__":
    main()
