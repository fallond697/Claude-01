#!/usr/bin/env python3
"""Fetch full change details including activity, impacted CIs, and attachments."""
import json
import sys
import urllib.request
import urllib.parse
from pathlib import Path

TOKEN_FILE = Path.home() / ".servicenow-mcp" / "tokens.json"
INSTANCE = "https://vituity.service-now.com"

def get_token():
    data = json.loads(TOKEN_FILE.read_text(encoding="utf-8"))
    tokens = data.get(INSTANCE, data)
    return tokens["accessToken"]

def sn_get(path):
    headers = {"Authorization": f"Bearer {get_token()}", "Accept": "application/json"}
    req = urllib.request.Request(f"{INSTANCE}{path}", headers=headers)
    resp = urllib.request.urlopen(req, timeout=30)
    return json.loads(resp.read().decode())

def dv(field):
    if isinstance(field, dict):
        return field.get("display_value", "") or ""
    return field or ""

def main():
    chg = sys.argv[1] if len(sys.argv) > 1 else "CHG0039613"

    # Get work_notes + comments
    q = urllib.parse.urlencode({
        "sysparm_query": f"number={chg}",
        "sysparm_fields": "number,work_notes,comments,sys_id",
        "sysparm_display_value": "all",
        "sysparm_limit": "1"
    })
    result = sn_get(f"/api/now/table/change_request?{q}").get("result", [])
    if not result:
        print(f"{chg} not found")
        return

    r = result[0]
    sys_id = dv(r.get("sys_id", ""))
    wn = dv(r.get("work_notes", ""))
    cm = dv(r.get("comments", ""))

    print("--- Work Notes ---")
    print(wn[:2000] if wn else "(empty)")
    print()
    print("--- Comments ---")
    print(cm[:2000] if cm else "(empty)")

    # Impacted CIs
    ci_q = urllib.parse.urlencode({
        "sysparm_query": f"task={sys_id}",
        "sysparm_fields": "cmdb_ci_service,task",
        "sysparm_display_value": "true",
        "sysparm_limit": "50"
    })
    cis = sn_get(f"/api/now/table/task_cmdb_ci_service?{ci_q}").get("result", [])
    print(f"\n--- Impacted Services/CIs ({len(cis)}) ---")
    for ci in cis:
        print(f"  - {dv(ci.get('cmdb_ci_service', ''))}")

    # Attachments
    att_q = urllib.parse.urlencode({
        "sysparm_query": f"table_name=change_request^table_sys_id={sys_id}",
        "sysparm_fields": "file_name,size_bytes,sys_created_by,sys_created_on",
        "sysparm_display_value": "true",
        "sysparm_limit": "20"
    })
    atts = sn_get(f"/api/now/table/sys_attachment?{att_q}").get("result", [])
    print(f"\n--- Attachments ({len(atts)}) ---")
    for a in atts:
        print(f"  {a.get('file_name','')} | {a.get('sys_created_by','')} | {a.get('sys_created_on','')}")

if __name__ == "__main__":
    main()
