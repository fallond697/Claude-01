"""
Generate a standalone HTML Change Management Calendar.
No Excel needed — opens in any browser, embeddable in SharePoint/Teams.
"""
import json
import os
from datetime import datetime, timedelta
from collections import defaultdict
import calendar

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, "calendar_changes.json")
OUTPUT = os.path.expanduser(
    r"~\OneDrive - Vituity\Documents\Change Management\Change_Management_Calendar.html"
)
SNOW_URL = "https://vituity.service-now.com/nav_to.do?uri=change_request.do?sysparm_query=number="
EXCLUDE_STATES = {"Canceled", "New", "Assess"}

with open(DATA_FILE, "r", encoding="utf-8") as f:
    all_changes = json.load(f)

today = datetime.now().date()
window_start = today - timedelta(days=30)
window_end = today + timedelta(days=14)

changes = []
for c in all_changes:
    if c.get("state", "") in EXCLUDE_STATES:
        continue
    ps = c.get("planned_start", "")
    if ps and len(ps) >= 10:
        try:
            dt = datetime.strptime(ps[:10], "%Y-%m-%d").date()
            if window_start <= dt <= window_end:
                changes.append(c)
        except ValueError:
            pass

print(f"Filtered to {len(changes)} changes ({window_start} to {window_end})")

# Build date lookup
by_date = defaultdict(list)
for c in changes:
    by_date[c.get("planned_start", "")[:10]].append(c)

# Determine months
months = sorted(set(c.get("planned_start", "")[:7] for c in changes))
print(f"Months: {', '.join(months)}")

# Count by type
from collections import Counter
type_counts = Counter(c.get("type", "") for c in changes)
state_counts = Counter(c.get("state", "") for c in changes)

TYPE_COLORS = {
    "Normal": ("#4472C4", "#fff"),
    "Standard": ("#70AD47", "#fff"),
    "Emergency": ("#FF4444", "#fff"),
}

def escape(s):
    return (s or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")

# Build HTML
html_parts = []
html_parts.append(f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Change Management Calendar</title>
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{ font-family: 'Segoe UI', Calibri, Arial, sans-serif; background: #f9f9f9; color: #333; padding: 20px; }}
  .header {{ margin-bottom: 20px; }}
  .header h1 {{ color: #003366; font-size: 24px; margin-bottom: 4px; }}
  .header .subtitle {{ color: #666; font-size: 13px; }}
  .legend {{ display: flex; gap: 16px; margin: 12px 0 20px; align-items: center; flex-wrap: wrap; }}
  .legend-item {{ padding: 4px 14px; border-radius: 4px; font-size: 12px; font-weight: 600; color: #fff; }}
  .legend-stat {{ font-size: 13px; color: #555; margin-left: 12px; }}
  .month-block {{ margin-bottom: 30px; }}
  .month-title {{ font-size: 18px; font-weight: 700; color: #003366; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: baseline; }}
  .month-title .count {{ font-size: 13px; color: #888; font-weight: 400; font-style: italic; }}
  table {{ width: 100%; border-collapse: collapse; table-layout: fixed; }}
  th {{ background: #003366; color: #fff; padding: 8px 4px; font-size: 12px; text-align: center; }}
  td {{ border: 1px solid #e0e0e0; vertical-align: top; padding: 0; min-height: 80px; height: auto; }}
  td.weekend {{ background: #f5f5f5; }}
  td.today {{ border: 2px solid #FF6600; background: #FFF3E0; }}
  td.empty {{ background: #fafafa; }}
  .day-num {{ font-size: 13px; font-weight: 700; color: #333; padding: 4px 6px; }}
  .day-num .badge {{ font-size: 11px; font-weight: 400; color: #888; margin-left: 4px; }}
  .chg {{ display: block; margin: 1px 2px; padding: 2px 5px; border-radius: 3px; font-size: 10px; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }}
  .chg:hover {{ opacity: 0.85; filter: brightness(1.1); }}
  .chg-Normal {{ background: #4472C4; color: #fff; }}
  .chg-Standard {{ background: #70AD47; color: #fff; }}
  .chg-Emergency {{ background: #FF4444; color: #fff; font-weight: 700; }}
  .chg-more {{ background: none; color: #888; font-style: italic; font-size: 10px; padding: 1px 5px; }}
  .state-badge {{ font-size: 9px; padding: 1px 4px; border-radius: 2px; margin-left: 3px; }}
  .state-Scheduled {{ background: #FFF3CD; color: #856404; }}
  .state-Implement {{ background: #D4EDDA; color: #155724; }}
  .state-Review {{ background: #CCE5FF; color: #004085; }}
  .summary {{ display: flex; gap: 30px; margin-top: 20px; padding: 16px; background: #fff; border-radius: 8px; border: 1px solid #e0e0e0; flex-wrap: wrap; }}
  .summary-group h3 {{ font-size: 13px; color: #003366; margin-bottom: 6px; }}
  .summary-group div {{ font-size: 12px; color: #555; line-height: 1.8; }}
  .footer {{ margin-top: 20px; font-size: 11px; color: #aaa; text-align: center; }}
</style>
</head>
<body>
<div class="header">
  <h1>Change Management Calendar</h1>
  <div class="subtitle">Source: ServiceNow &nbsp;|&nbsp; Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')} &nbsp;|&nbsp; {len(changes)} changes &nbsp;|&nbsp; {window_start.strftime('%b %d')} – {window_end.strftime('%b %d, %Y')}</div>
</div>
<div class="legend">
  <span class="legend-item" style="background:#4472C4">Normal ({type_counts.get('Normal',0)})</span>
  <span class="legend-item" style="background:#70AD47">Standard ({type_counts.get('Standard',0)})</span>
  <span class="legend-item" style="background:#FF4444">Emergency ({type_counts.get('Emergency',0)})</span>
  <span class="legend-stat">Closed: {state_counts.get('Closed',0)} &nbsp;|&nbsp; Scheduled: {state_counts.get('Scheduled',0)} &nbsp;|&nbsp; In Progress: {state_counts.get('Implement',0) + state_counts.get('Review',0)}</span>
</div>
""")

DOW_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
MAX_SHOW = 8

for month_str in months:
    year, month = int(month_str[:4]), int(month_str[5:7])
    month_name = calendar.month_name[month]
    month_count = sum(1 for c in changes if c.get("planned_start", "")[:7] == month_str)

    html_parts.append(f'<div class="month-block">')
    html_parts.append(f'<div class="month-title">{month_name} {year} <span class="count">{month_count} changes</span></div>')
    html_parts.append('<table><thead><tr>')
    for dow in DOW_NAMES:
        html_parts.append(f'<th>{dow}</th>')
    html_parts.append('</tr></thead><tbody>')

    cal = calendar.Calendar(firstweekday=6)
    month_days = cal.monthdayscalendar(year, month)

    for week in month_days:
        html_parts.append('<tr>')
        for col_idx, day in enumerate(week):
            if day == 0:
                html_parts.append('<td class="empty">&nbsp;</td>')
                continue

            date_key = f"{year:04d}-{month:02d}-{day:02d}"
            day_changes = by_date.get(date_key, [])
            is_weekend = col_idx in (0, 6)
            is_today = False
            try:
                is_today = datetime(year, month, day).date() == today
            except ValueError:
                pass

            classes = []
            if is_weekend:
                classes.append("weekend")
            if is_today:
                classes.append("today")
            cls = f' class="{" ".join(classes)}"' if classes else ""

            html_parts.append(f'<td{cls}>')
            badge = f' <span class="badge">({len(day_changes)})</span>' if day_changes else ""
            html_parts.append(f'<div class="day-num">{day}{badge}</div>')

            for i, chg in enumerate(day_changes[:MAX_SHOW]):
                num = escape(chg.get("number", ""))
                desc = escape(chg.get("short_description", ""))
                typ = chg.get("type", "Normal")
                state = chg.get("state", "")
                label = f"{num}: {desc}"
                if len(label) > 35:
                    label = escape(label[:33] + "..")
                else:
                    label = escape(label)

                href = f"{SNOW_URL}{chg.get('number', '')}"
                state_badge = ""
                if state and state != "Closed":
                    state_badge = f' <span class="state-badge state-{escape(state)}">{escape(state)}</span>'

                html_parts.append(
                    f'<a class="chg chg-{escape(typ)}" href="{href}" target="_blank" title="{escape(chg.get("short_description",""))}">'
                    f'{label}{state_badge}</a>'
                )

            if len(day_changes) > MAX_SHOW:
                remaining = len(day_changes) - MAX_SHOW
                html_parts.append(f'<span class="chg chg-more">+{remaining} more...</span>')

            html_parts.append('</td>')
        html_parts.append('</tr>')

    html_parts.append('</tbody></table></div>')

# Summary section
closed = state_counts.get("Closed", 0)
successful = sum(1 for c in changes if c.get("close_code") == "Successful")
rate = round(successful / closed * 100, 1) if closed > 0 else 0

ag_counts = Counter(c.get("assignment_group", "") or "(not set)" for c in changes)
top_groups = ag_counts.most_common(5)

html_parts.append(f"""
<div class="summary">
  <div class="summary-group">
    <h3>Key Metrics</h3>
    <div>Total Changes: <b>{len(changes)}</b></div>
    <div>Success Rate: <b>{rate}%</b></div>
    <div>Closed: <b>{closed}</b> &nbsp;|&nbsp; Scheduled: <b>{state_counts.get('Scheduled',0)}</b></div>
  </div>
  <div class="summary-group">
    <h3>By Type</h3>
    <div>Normal: <b>{type_counts.get('Normal',0)}</b></div>
    <div>Standard: <b>{type_counts.get('Standard',0)}</b></div>
    <div>Emergency: <b>{type_counts.get('Emergency',0)}</b></div>
  </div>
  <div class="summary-group">
    <h3>Top Assignment Groups</h3>
""")
for ag, cnt in top_groups:
    html_parts.append(f'    <div>{escape(ag)}: <b>{cnt}</b></div>')
html_parts.append("""
  </div>
</div>
""")

html_parts.append(f'<div class="footer">Auto-refreshed daily at 6:30 AM PST from ServiceNow &nbsp;|&nbsp; Last update: {datetime.now().strftime("%Y-%m-%d %H:%M")}</div>')
html_parts.append('</body></html>')

with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write("\n".join(html_parts))

print(f"\nHTML calendar saved to: {OUTPUT}")
print(f"  {len(changes)} changes across {len(months)} months")
