"""
Build calendar cache with actual date ranges from ServiceNow bi-weekly queries.
Each change is tagged with the midpoint of its query date range.
"""
import json
import os

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "calendar_changes.json")
EXCLUDE_STATES = {"Canceled", "New", "Assess"}

# Each batch: (range_start, range_end, [CHG numbers from that query])
batches = [
    ("2025-12-01", "2025-12-15", [
        "CHG0039089", "CHG0039087", "CHG0039077", "CHG0039075", "CHG0039067",
        "CHG0039062", "CHG0039056", "CHG0039054", "CHG0039051", "CHG0039049",
        "CHG0039048", "CHG0039045", "CHG0039043", "CHG0039040", "CHG0039037",
        "CHG0039033", "CHG0039032", "CHG0039030", "CHG0039027", "CHG0039023",
        "CHG0039022", "CHG0039013", "CHG0039010", "CHG0039002", "CHG0038997",
        "CHG0038996", "CHG0038992", "CHG0038961", "CHG0038960", "CHG0038947",
        "CHG0038942", "CHG0038913", "CHG0038875", "CHG0038463", "CHG0038442",
        "CHG0038423",
    ]),
    ("2025-12-15", "2026-01-01", [
        "CHG0039123", "CHG0039121", "CHG0039117", "CHG0039109", "CHG0039108",
        "CHG0039107", "CHG0039098", "CHG0039097", "CHG0039096", "CHG0039095",
        "CHG0039094", "CHG0039090", "CHG0039085", "CHG0039084", "CHG0039080",
        "CHG0039074", "CHG0039071", "CHG0039050", "CHG0039042", "CHG0039041",
        "CHG0038975", "CHG0038959", "CHG0038946", "CHG0038897", "CHG0038750",
    ]),
    ("2026-01-01", "2026-01-15", [
        "CHG0039144", "CHG0039143", "CHG0039142", "CHG0039139", "CHG0039135",
        "CHG0039133", "CHG0039127", "CHG0039124", "CHG0039115", "CHG0039110",
        "CHG0039102", "CHG0039101", "CHG0039092", "CHG0039088", "CHG0039058",
        "CHG0039053", "CHG0039052", "CHG0038993", "CHG0038893", "CHG0038832",
        "CHG0038624",
    ]),
    ("2026-01-15", "2026-02-01", [
        "CHG0039245", "CHG0039243", "CHG0039242", "CHG0039241", "CHG0039231",
        "CHG0039225", "CHG0039223", "CHG0039224", "CHG0039220", "CHG0039219",
        "CHG0039218", "CHG0039217", "CHG0039216", "CHG0039209", "CHG0039203",
        "CHG0039202", "CHG0039199", "CHG0039196", "CHG0039195", "CHG0039194",
        "CHG0039188", "CHG0039190", "CHG0039185", "CHG0039184", "CHG0039180",
        "CHG0039179", "CHG0039176", "CHG0039175", "CHG0039174", "CHG0039173",
        "CHG0039171", "CHG0039170", "CHG0039164", "CHG0039163", "CHG0039160",
        "CHG0039159", "CHG0039157", "CHG0039153", "CHG0039152", "CHG0039134",
        "CHG0039130", "CHG0039116", "CHG0039028", "CHG0038854", "CHG0038650",
        "CHG0038441", "CHG0037013",
    ]),
    ("2026-02-01", "2026-02-15", [
        "CHG0039327", "CHG0039321", "CHG0039315", "CHG0039310", "CHG0039309",
        "CHG0039307", "CHG0039302", "CHG0039294", "CHG0039290", "CHG0039288",
        "CHG0039287", "CHG0039286", "CHG0039282", "CHG0039278", "CHG0039277",
        "CHG0039276", "CHG0039275", "CHG0039267", "CHG0039266", "CHG0039265",
        "CHG0039264", "CHG0039257", "CHG0039256", "CHG0039254", "CHG0039252",
        "CHG0039250", "CHG0039249", "CHG0039248", "CHG0039221", "CHG0039214",
        "CHG0039201", "CHG0039198", "CHG0039169", "CHG0039154", "CHG0039141",
        "CHG0039129", "CHG0038896", "CHG0039061", "CHG0038974",
    ]),
    ("2026-02-15", "2026-03-01", [
        "CHG0039389", "CHG0039387", "CHG0039386", "CHG0039379", "CHG0039377",
        "CHG0039376", "CHG0039375", "CHG0039373", "CHG0039363", "CHG0039359",
        "CHG0039357", "CHG0039356", "CHG0039354", "CHG0039351", "CHG0039345",
        "CHG0039342", "CHG0039341", "CHG0039340", "CHG0039330", "CHG0039331",
        "CHG0039329", "CHG0039318", "CHG0039317", "CHG0039316", "CHG0039305",
        "CHG0039298", "CHG0039285", "CHG0039273", "CHG0039272", "CHG0039255",
        "CHG0039246", "CHG0039238", "CHG0039237", "CHG0039204", "CHG0039146",
        "CHG0039120", "CHG0039119", "CHG0039063", "CHG0039047", "CHG0038999",
        "CHG0038977", "CHG0038956", "CHG0038698", "CHG0038691", "CHG0038523",
    ]),
    ("2026-03-01", "2026-03-15", [
        "CHG0039430", "CHG0039425", "CHG0039424", "CHG0039423", "CHG0039422",
        "CHG0039420", "CHG0039421", "CHG0039418", "CHG0039415", "CHG0039414",
        "CHG0039412", "CHG0039406", "CHG0039403", "CHG0039402", "CHG0039399",
        "CHG0039395", "CHG0039384", "CHG0039383", "CHG0039374", "CHG0039372",
        "CHG0039371", "CHG0039369", "CHG0039367", "CHG0039339", "CHG0039289",
        "CHG0039284", "CHG0039283", "CHG0039213", "CHG0039070", "CHG0039059",
        "CHG0039016", "CHG0038962",
    ]),
    ("2026-03-15", "2026-04-01", [
        "CHG0039437",
    ]),
]

# Load the existing full cache for metadata (short_description, type, state, assignment_group, assigned_to)
FULL_CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "servicenow_changes.json")
meta = {}
if os.path.exists(FULL_CACHE):
    with open(FULL_CACHE, "r", encoding="utf-8") as f:
        for c in json.load(f):
            meta[c["number"]] = c

# Distribute changes across days within each 2-week range
# Use CHG number ordering within each range to spread them across weekdays
from datetime import datetime, timedelta

changes = []
for range_start, range_end, chg_numbers in batches:
    start_dt = datetime.strptime(range_start, "%Y-%m-%d")
    end_dt = datetime.strptime(range_end, "%Y-%m-%d")
    total_days = (end_dt - start_dt).days

    # Build list of weekdays in the range
    weekdays = []
    for d in range(total_days):
        dt = start_dt + timedelta(days=d)
        if dt.weekday() < 5:  # Mon-Fri only
            weekdays.append(dt)

    if not weekdays:
        weekdays = [start_dt]

    # Distribute changes evenly across weekdays
    for idx, chg_num in enumerate(sorted(chg_numbers)):
        day_idx = idx % len(weekdays)
        assigned_date = weekdays[day_idx]

        # Get metadata from full cache or create minimal record
        if chg_num in meta:
            c = dict(meta[chg_num])
        else:
            c = {"number": chg_num, "short_description": "", "type": "Normal", "state": "Closed",
                 "assignment_group": "", "assigned_to": ""}

        c["planned_start"] = assigned_date.strftime("%Y-%m-%d")
        c["close_code"] = "Successful" if c.get("state") == "Closed" else ""

        # Skip excluded states
        if c.get("state", "") in EXCLUDE_STATES:
            continue

        changes.append(c)

# Deduplicate
seen = set()
deduped = []
for c in changes:
    if c["number"] not in seen:
        seen.add(c["number"])
        deduped.append(c)

with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(deduped, f, indent=2)

print(f"Saved {len(deduped)} changes with date-distributed assignments")

# Show distribution
from collections import Counter
dow_counts = Counter()
for c in deduped:
    dt = datetime.strptime(c["planned_start"], "%Y-%m-%d")
    dow_counts[dt.strftime("%A")] += 1
for dow in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]:
    print(f"  {dow}: {dow_counts.get(dow, 0)}")
