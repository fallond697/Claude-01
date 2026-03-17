"""
Live Calendar Refresh: Query ServiceNow REST API, rebuild cache, regenerate Excel.
Designed to run unattended via Windows Task Scheduler.
"""
import json
import os
import sys
import urllib.request
import urllib.parse
import urllib.error
from datetime import datetime, timedelta
from pathlib import Path

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INSTANCE_URL = "https://vituity.service-now.com"
TOKEN_FILE = os.path.join(Path.home(), ".servicenow-mcp", "tokens.json")
CLIENT_ID = "dc4638c33c104aa6ac3d37249ff8590b"
CLIENT_SECRET = r"-w`h6Gat0IMuMM5&e@@3}?Q|KFmW71Xo"
CACHE_FILE = os.path.join(SCRIPT_DIR, "calendar_changes.json")
EXCLUDE_STATES = {"Canceled", "New", "Assess"}

LOG_FILE = os.path.join(SCRIPT_DIR, "refresh-calendar.log")


def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")


def load_tokens():
    with open(TOKEN_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data.get(INSTANCE_URL, {})


def save_tokens(tokens):
    with open(TOKEN_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)
    data[INSTANCE_URL] = tokens
    with open(TOKEN_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


def refresh_token(tokens):
    """Refresh expired access token using refresh_token grant."""
    log("Refreshing access token...")
    params = urllib.parse.urlencode({
        "grant_type": "refresh_token",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "refresh_token": tokens["refreshToken"],
    }).encode("utf-8")

    req = urllib.request.Request(
        f"{INSTANCE_URL}/oauth_token.do",
        data=params,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req) as resp:
        result = json.loads(resp.read().decode("utf-8"))

    new_tokens = {
        "accessToken": result["access_token"],
        "refreshToken": result["refresh_token"],
        "expiresAt": int(datetime.now().timestamp() * 1000) + (result.get("expires_in", 1800) * 1000),
    }
    save_tokens(new_tokens)
    log("Token refreshed successfully")
    return new_tokens


def get_access_token():
    tokens = load_tokens()
    # Check if token is expired (5 min buffer)
    if tokens.get("expiresAt", 0) - 300000 < int(datetime.now().timestamp() * 1000):
        tokens = refresh_token(tokens)
    return tokens["accessToken"]


def query_changes(access_token, encoded_query, fields, limit=200):
    """Query ServiceNow change_request table via REST API.
    Uses sysparm_display_value=all to get both raw and display values."""
    all_results = []
    offset = 0
    while True:
        params = urllib.parse.urlencode({
            "sysparm_query": encoded_query,
            "sysparm_fields": fields,
            "sysparm_limit": limit,
            "sysparm_offset": offset,
            "sysparm_display_value": "all",
        })
        url = f"{INSTANCE_URL}/api/now/table/change_request?{params}"
        req = urllib.request.Request(url, headers={
            "Authorization": f"Bearer {access_token}",
            "Accept": "application/json",
        })
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        batch = data.get("result", [])
        all_results.extend(batch)
        if len(batch) < limit:
            break
        offset += limit
    return all_results


def main():
    log("=" * 60)
    log("Calendar refresh started")

    try:
        access_token = get_access_token()
    except Exception as e:
        log(f"ERROR: Failed to get access token: {e}")
        log("Re-authenticate via: cd C:\\servicenow-mcp && npm run auth")
        sys.exit(1)

    # Query last 30 days + upcoming 2 weeks
    today = datetime.now()
    start_date = today - timedelta(days=30)
    end_date = today + timedelta(days=14)

    # State codes: -5=New, -4=Assess, -3=Authorize, -2=Scheduled, -1=Implement,
    #              0=Review, 3=Closed, 4=Canceled
    # Exclude: New(-5), Assess(-4), Canceled(4)
    encoded_query = (
        f"start_date>={start_date.strftime('%Y-%m-%d')}"
        f"^start_date<{end_date.strftime('%Y-%m-%d')}"
        f"^stateNOT IN-5,-4,4"
        f"^ORDERBYstart_date"
    )

    fields = ",".join([
        "number", "short_description", "type", "state",
        "assignment_group", "assigned_to", "start_date", "end_date",
        "cmdb_ci", "close_code", "priority",
    ])

    log(f"Querying changes: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}")

    try:
        results = query_changes(access_token, encoded_query, fields)
    except urllib.error.HTTPError as e:
        if e.code == 401:
            log("Token expired, attempting refresh...")
            access_token = get_access_token()
            results = query_changes(access_token, encoded_query, fields)
        else:
            log(f"ERROR: ServiceNow API returned {e.code}: {e.read().decode()}")
            sys.exit(1)

    log(f"Retrieved {len(results)} changes from ServiceNow")

    # Transform to our cache format
    # With sysparm_display_value=all, each field is {"display_value": ..., "value": ...}
    def dv(field):
        """Get display_value from a field (handles both all and simple modes)."""
        if isinstance(field, dict):
            return field.get("display_value", "") or ""
        return field or ""

    def rv(field):
        """Get raw value from a field."""
        if isinstance(field, dict):
            return field.get("value", "") or ""
        return field or ""

    changes = []
    seen = set()
    for r in results:
        num = dv(r.get("number", ""))
        if not num or num in seen:
            continue
        seen.add(num)

        # Use raw start_date value (YYYY-MM-DD HH:MM:SS format)
        raw_start = rv(r.get("start_date", ""))
        if raw_start and len(raw_start) >= 10:
            planned_start = raw_start[:10]
        else:
            continue  # skip changes without dates

        raw_end = rv(r.get("end_date", ""))
        planned_end = raw_end[:10] if raw_end and len(raw_end) >= 10 else ""

        changes.append({
            "number": num,
            "short_description": dv(r.get("short_description", "")),
            "type": dv(r.get("type", "")) or "Normal",
            "state": dv(r.get("state", "")),
            "assignment_group": dv(r.get("assignment_group", "")),
            "assigned_to": dv(r.get("assigned_to", "")),
            "planned_start": planned_start,
            "planned_end": planned_end,
            "cmdb_ci": dv(r.get("cmdb_ci", "")),
            "close_code": dv(r.get("close_code", "")),
            "priority": dv(r.get("priority", "")),
        })

    log(f"Processed {len(changes)} changes (after dedup/filter)")

    # Save cache
    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(changes, f, indent=2)
    log(f"Cache saved: {CACHE_FILE}")

    # Regenerate Excel + HTML
    import subprocess
    for label, script_name in [("Excel", "create-calendar-only.py"), ("HTML", "create-calendar-html.py")]:
        log(f"Regenerating {label}...")
        script = os.path.join(SCRIPT_DIR, script_name)
        result = subprocess.run(
            [sys.executable, script],
            capture_output=True, text=True, cwd=SCRIPT_DIR,
        )
        if result.returncode == 0:
            for line in result.stdout.strip().split("\n"):
                log(f"  {line}")
        else:
            log(f"ERROR generating {label}: {result.stderr}")

    # Post notification to Teams via Graph API
    log("Posting notification to Teams...")
    try:
        post_teams_notification(len(changes))
    except Exception as e:
        log(f"ERROR posting to Teams: {e}")

    log("Calendar refresh complete")


def post_teams_notification(change_count):
    """Post a calendar update notification with link to Teams channel via Graph API."""
    import msal as _msal

    TENANT_ID = "56b24b68-e3c8-4895-89a0-05a74d0f8c84"
    MSAL_CLIENT_ID = "ff4acc71-0fd8-459d-afda-0ec31f2e7bab"
    MSAL_TOKEN_CACHE = os.path.join(Path.home(), ".email_ingest", "vituity_token_cache.json")
    GROUP_ID = "fb1fa849-3b0d-4d15-a72f-f1b56d60186a"
    CHANNEL_ID = "19:77c7ce1868b546108d5e77c65eff8a3b@thread.skype"
    CALENDAR_URL = "https://vituity.sharepoint.com/sites/PM-ITSEngineering-DEPT/Shared%20Documents/CCB/Change_Management_Calendar.html"
    SN_DASHBOARD = "https://vituity.service-now.com/now/platform-analytics-workspace/dashboards/params/edit/false/sys-id/27df42dbe6770153e1186e1215e19ffb"

    cache = _msal.SerializableTokenCache()
    cache.deserialize(Path(MSAL_TOKEN_CACHE).read_text())
    app = _msal.PublicClientApplication(
        MSAL_CLIENT_ID,
        authority=f"https://login.microsoftonline.com/{TENANT_ID}",
        token_cache=cache,
    )
    accounts = app.get_accounts()
    result = app.acquire_token_silent(["Group.ReadWrite.All", "ChannelMessage.Send"], account=accounts[0])
    if not result or "access_token" not in result:
        result = app.acquire_token_silent(["Group.ReadWrite.All"], account=accounts[0])
    token = result["access_token"]

    date_str = datetime.now().strftime("%B %d, %Y")
    html = (
        f'<h3 style="color:#003366;margin:0">Change Management Calendar Updated</h3>'
        f'<p style="margin:6px 0;font-size:14px">'
        f'<strong>{change_count}</strong> changes refreshed &mdash; {date_str}</p>'
        f'<p style="margin:4px 0">'
        f'<a href="{SN_DASHBOARD}">Open Calendar in ServiceNow</a>'
        f'</p>'
    )

    import urllib.request
    msg = json.dumps({"body": {"contentType": "html", "content": html}}).encode("utf-8")
    req = urllib.request.Request(
        f"https://graph.microsoft.com/v1.0/teams/{GROUP_ID}/channels/{CHANNEL_ID}/messages",
        data=msg,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        status = resp.status
    log(f"  Teams notification posted (HTTP {status})")


if __name__ == "__main__":
    main()
