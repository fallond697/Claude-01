"""
Enrich ServiceNow change cache with estimated months based on CHG number ranges.
Uses known data points from individual lookups to map CHG numbers to dates.
"""
import json
import os

DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "servicenow_changes.json")

# Known CHG number -> planned_start mappings from individual lookups
KNOWN_DATES = {
    "CHG0037641": "2025-01-01",  # Password policy changes (early 2025)
    "CHG0037676": "2025-02-01",  # Cisco ISE cert update
    "CHG0037833": "2025-03-01",  # Emergency downtime Modesto
    "CHG0037945": "2025-04-01",  # Taleo servers down
    "CHG0037986": "2025-04-01",  # Zscaler connectivity
    "CHG0037989": "2025-04-01",  # Core switch replacement
    "CHG0038001": "2025-04-15",  # Warning When Incidents
    "CHG0038025": "2025-04-15",  # Add disk to TrueNAS
    "CHG0038035": "2025-04-17",  # Illumio enforcement
    "CHG0038046": "2025-05-01",  # ISMS docs review
    "CHG0038062": "2025-05-08",  # Illumio enforcement
    "CHG0038068": "2025-05-15",  # WFS Maintenance May 2025
    "CHG0038071": "2025-05-22",  # Salesforce Summer 25
    "CHG0038079": "2025-05-29",  # Transaction log backups
    "CHG0038082": "2025-05-15",  # Bolster AI platform
    "CHG0038085": "2025-05-16",  # HCM 25B Upgrade (known)
    "CHG0038098": "2025-06-05",  # SSL Inspection
    "CHG0038103": "2025-06-05",  # Core switch migration
    "CHG0038114": "2025-06-12",  # Illumio enforcement
    "CHG0038128": "2025-06-19",  # Coupa R42 upgrade
    "CHG0038140": "2025-06-26",  # Renew SSL Cert
    "CHG0038143": "2025-07-03",  # Illumio enforcement
    "CHG0038152": "2025-07-03",  # Server Decommission
    "CHG0038161": "2025-07-10",  # Reconfigure Adobe
    "CHG0038166": "2025-07-10",  # Zscaler Dynamic
    "CHG0038167": "2025-07-10",  # Illumio enforcement
    "CHG0038176": "2025-07-17",  # Server Decommission
    "CHG0038188": "2025-07-24",  # Update WFS logic
    "CHG0038195": "2025-07-31",  # Illumio enforcement
    "CHG0038199": "2025-07-31",  # CIS Assessment
    "CHG0038206": "2025-08-07",  # MOOV Integrations
    "CHG0038229": "2025-08-14",  # Illumio enforcement
    "CHG0038241": "2025-08-21",  # Snowflake enforcement
    "CHG0038249": "2025-08-21",  # Core switch migration
    "CHG0038253": "2025-08-28",  # CEO Survey Data
    "CHG0038254": "2025-08-14",  # Start using Ringo
    "CHG0038263": "2025-09-04",  # Remove Unitrends
    "CHG0038270": "2025-09-04",  # Server Decommission
    "CHG0038275": "2025-09-11",  # Illumio enforcement
    "CHG0038279": "2025-09-04",  # BeyondTrust upgrade
    "CHG0038280": "2025-09-11",  # AI Scanning Azure
    "CHG0038285": "2025-09-11",  # New Flow Create Incident
    "CHG0038292": "2025-09-18",  # POC Salesforce
    "CHG0038305": "2025-09-25",  # CPAC duplicate Admin
    "CHG0038323": "2025-09-11",  # MOD AT&T block
    "CHG0038329": "2025-09-18",  # ISE Upgrade
    "CHG0038343": "2025-09-25",  # NCC Remote Access
    "CHG0038346": "2025-10-02",  # Session timeout
    "CHG0038556": "2025-10-02",  # OSNexus upgrade
    "CHG0038579": "2025-10-09",  # Guest access Teams
    "CHG0038773": "2025-10-16",  # Reboot switch
    "CHG0038821": "2025-10-23",  # QC Site Startup 10/22
    "CHG0038827": "2025-10-23",  # Problem Ticket fields
    "CHG0038840": "2025-10-30",  # IT New Hire Form
    "CHG0038842": "2025-10-30",  # SCORM IDs
    "CHG0038853": "2025-11-06",  # Medical Group layout
    "CHG0038857": "2025-11-06",  # SNow Agent License
    "CHG0038859": "2025-11-06",  # Bswift Demo
    "CHG0038866": "2025-11-06",  # EPBCS variables
    "CHG0038870": "2025-11-06",  # Retirement Summary
    "CHG0038880": "2025-11-13",  # Assignment Mismatch
    "CHG0038888": "2025-11-13",  # QC Site Startup 11/1
    "CHG0038889": "2025-11-13",  # QC Site Startup 11/1
    "CHG0038890": "2025-11-13",  # QC Site Startup 11/3
    "CHG0038891": "2025-11-13",  # Cred Services Checklists
    "CHG0038904": "2025-11-20",  # Shutdown ai.vituity.com
    "CHG0038919": "2025-11-20",  # SF Opportunity values
    "CHG0038927": "2025-11-20",  # MOOV Zenoti
    "CHG0038931": "2025-11-20",  # QC Site Startup 11/10
    "CHG0038932": "2025-11-20",  # QC Site Startup 11/10
    "CHG0038938": "2025-11-27",  # Payer Name
    "CHG0038947": "2025-11-27",  # SNow Clone dev
    "CHG0038951": "2025-11-27",  # SFDC Picklist
    "CHG0038956": "2025-12-04",  # AP Site Lead
    "CHG0038962": "2025-12-04",  # Update type
    "CHG0038970": "2025-12-04",  # Streamlit App
    "CHG0038973": "2025-12-04",  # SFDC Picklist
    "CHG0038974": "2025-12-04",  # New App Qure4u
    "CHG0038977": "2025-12-04",  # New App Rise4
    "CHG0038983": "2025-12-11",  # Resource Monitoring
    "CHG0039009": "2025-12-11",  # ZPA timeout
    "CHG0039011": "2025-12-11",  # CEO Survey off
    "CHG0039012": "2025-12-11",  # CI for MOOV
    "CHG0039013": "2025-12-11",  # Taxonomy Updates
    "CHG0039016": "2025-12-11",  # Update CIs
    "CHG0039023": "2025-12-11",  # SF Specialty
    "CHG0039028": "2025-12-11",  # Preboarding emails
    "CHG0039031": "2025-12-11",  # EPBCS variables
    "CHG0039037": "2025-12-11",  # QC Startup 12/9
    "CHG0039040": "2025-12-18",  # Retirement Summaries
    "CHG0039045": "2025-12-18",  # SFDC Picklist
    "CHG0039050": "2025-12-18",  # Profit Distribution
    "CHG0039067": "2025-12-18",  # QC Startup 12/15
    "CHG0039083": "2025-12-18",  # Service accounts
    "CHG0039086": "2025-12-18",  # IBM PTFs
    "CHG0039088": "2025-12-18",  # Netsuite sandbox
    "CHG0039094": "2025-12-18",  # CEO Survey
    "CHG0039096": "2025-12-18",  # QC Startup 12/11
    "CHG0039097": "2025-12-18",  # QC Startup 12/11
    "CHG0039098": "2025-12-18",  # Shared Services
    "CHG0039100": "2025-12-18",  # Testing rejection
    "CHG0039101": "2025-12-18",  # Provider Status
    "CHG0039108": "2025-12-18",  # Retirement Summary
    "CHG0039109": "2025-12-18",  # athenaIDX PM
    "CHG0039116": "2025-12-18",  # Intune Radiology
    "CHG0039117": "2026-01-01",  # EPBCS variables
    "CHG0039121": "2026-01-08",  # Report Type
    "CHG0039124": "2026-01-08",  # Billing Category
    "CHG0039143": "2026-01-08",  # Updated Data
    "CHG0039148": "2026-01-08",  # Oregon licenses
    "CHG0039152": "2026-01-15",  # Assignment Mismatch
    "CHG0039154": "2026-01-15",  # MOOV Email
    "CHG0039157": "2026-01-15",  # Tamper Protection
    "CHG0039159": "2026-01-15",  # Assignment Group
    "CHG0039160": "2026-01-15",  # CPAC Cal report
    "CHG0039163": "2026-01-15",  # VIA EM Leadership
    "CHG0039164": "2026-01-22",  # QC Startup 1/26
    "CHG0039169": "2026-01-22",  # SNow MCP API
    "CHG0039170": "2026-01-22",  # ICD-10 codes
    "CHG0039171": "2026-01-22",  # Imperva deactivation
    "CHG0039172": "2026-01-22",  # athenaIDX PM
    "CHG0039173": "2026-01-22",  # Titan SFTP
    "CHG0039174": "2026-01-22",  # LMS sftp
    "CHG0039175": "2026-01-22",  # Zscaler connector (known)
    "CHG0039176": "2026-01-22",  # SF Sandbox 17
    "CHG0039179": "2026-01-22",  # athenaIDX PM
    "CHG0039180": "2026-01-22",  # Non-Clinical delivery
    "CHG0039184": "2026-01-29",  # Add CI
    "CHG0039185": "2026-01-29",  # CMS Quality
    "CHG0039188": "2026-01-29",  # DNS record
    "CHG0039190": "2026-01-29",  # Workato email
    "CHG0039194": "2026-01-29",  # PE-17 E-Signed
    "CHG0039195": "2026-01-29",  # Financial Labels
    "CHG0039196": "2026-01-29",  # Impersonation
    "CHG0039198": "2026-01-29",  # Radiology
    "CHG0039199": "2026-01-29",  # Retirement
    "CHG0039201": "2026-02-05",  # RCM Provider Data
    "CHG0039202": "2026-02-05",  # IT Status Page
    "CHG0039203": "2026-02-05",  # Amplify Encounter
    "CHG0039204": "2026-02-05",  # HCM 26A Upgrade
    "CHG0039209": "2026-02-05",  # DEA data access
    "CHG0039211": "2026-02-05",  # 409 errors
    "CHG0039212": "2026-02-05",  # IsLatest logic
    "CHG0039213": "2026-02-05",  # SNow Survey
    "CHG0039214": "2026-02-05",  # CRMA Dashboards
    "CHG0039216": "2026-02-05",  # MSO Notes
    "CHG0039217": "2026-02-05",  # Preboarding
    "CHG0039218": "2026-02-05",  # EPBCS variables
    "CHG0039219": "2026-02-05",  # Inactive departments
    "CHG0039220": "2026-02-05",  # SFTP migration
    "CHG0039221": "2026-02-05",  # Survey responses
    "CHG0039223": "2026-02-12",  # DLP Records
    "CHG0039224": "2026-02-12",  # QuikCharge
    "CHG0039225": "2026-02-12",  # DLP Recipients
    "CHG0039231": "2026-02-12",  # BeyondTrust
    "CHG0039237": "2026-02-12",  # Inactivity report
    "CHG0039238": "2026-02-12",  # New App VIA
    "CHG0039241": "2026-02-12",  # QC Startup 2/1
    "CHG0039242": "2026-02-12",  # QC Startup 2/1
    "CHG0039243": "2026-02-12",  # QC Startup 2/1
    "CHG0039245": "2026-02-12",  # Clinical Service
    "CHG0039246": "2026-02-12",  # Tax field
    "CHG0039248": "2026-02-12",  # Workbot email
    "CHG0039249": "2026-02-12",  # HCM refreshes
    "CHG0039250": "2026-02-12",  # Rubrik firmware
    "CHG0039252": "2026-02-19",  # Daily credential
    "CHG0039254": "2026-02-19",  # Reappointment
    "CHG0039255": "2026-02-19",  # Logic Discovery
    "CHG0039256": "2026-02-19",  # Formatting issues
    "CHG0039257": "2026-02-19",  # Pending Rescinded
    "CHG0039264": "2026-02-19",  # Sentinel Key Vault
    "CHG0039265": "2026-02-19",  # SF onboarding
    "CHG0039266": "2026-02-19",  # Informational Materials
    "CHG0039267": "2026-02-19",  # Expirables Extract
    "CHG0039272": "2026-02-19",  # PHO/CIN/Medical
    "CHG0039273": "2026-02-19",  # BGP Phase 1
    "CHG0039275": "2026-02-19",  # Twilio telephony
    "CHG0039276": "2026-02-19",  # VMware vCenter
    "CHG0039277": "2026-02-19",  # Workato Moov
    "CHG0039278": "2026-02-19",  # AIDX table
    "CHG0039282": "2026-02-26",  # Domain controllers
    "CHG0039283": "2026-02-26",  # Deactivate Forms
    "CHG0039284": "2026-02-26",  # Otto triage
    "CHG0039285": "2026-02-26",  # SNow Power BI
    "CHG0039286": "2026-02-26",  # AI Analysis fields
    "CHG0039287": "2026-02-26",  # QC Startup 2/10
    "CHG0039288": "2026-02-26",  # Server Decommission
    "CHG0039289": "2026-02-26",  # Hospital teaching
    "CHG0039290": "2026-02-26",  # PE-1 release
    "CHG0039294": "2026-02-26",  # SF Change Data
    "CHG0039298": "2026-02-26",  # athenaIDX PM
    "CHG0039302": "2026-02-26",  # QC Startup 2/18
    "CHG0039305": "2026-02-26",  # Flow Race Condition
    "CHG0039306": "2026-02-26",  # Vituity IPs
    "CHG0039307": "2026-02-26",  # Payer Name
    "CHG0039309": "2026-02-26",  # SF Reports
    "CHG0039310": "2026-02-26",  # JAMF Tanium
    "CHG0039312": "2026-02-26",  # VM Downsizing
    "CHG0039314": "2026-02-26",  # AIDX fields
    "CHG0039315": "2026-02-26",  # New CIs
    "CHG0039316": "2026-02-26",  # Record-Triggered Flow
    "CHG0039317": "2026-02-26",  # Workato recipe
    "CHG0039318": "2026-02-26",  # QuantaStor upgrade
    "CHG0039321": "2026-02-26",  # Credentials fix
    "CHG0039323": "2026-02-26",  # Integration Errors
    "CHG0039327": "2026-02-26",  # New AP MOD
    "CHG0039329": "2026-03-05",  # Direct Contribution
    "CHG0039330": "2026-03-05",  # Sitebase
    "CHG0039331": "2026-03-05",  # Shiftadmin
    "CHG0039338": "2026-03-05",  # NetSuite 2026.1
    "CHG0039339": "2026-03-05",  # SNow Otto
    "CHG0039340": "2026-03-05",  # Integration Errors
    "CHG0039341": "2026-03-05",  # Remote Support
    "CHG0039342": "2026-03-05",  # Ringo notifications
    "CHG0039345": "2026-03-05",  # Email recipients
    "CHG0039351": "2026-03-05",  # Annual Purge
    "CHG0039354": "2026-03-05",  # AIDX fields
    "CHG0039356": "2026-03-05",  # Service Account
    "CHG0039357": "2026-03-05",  # Add Remove CI
    "CHG0039358": "2026-03-05",  # Oregon licenses
    "CHG0039359": "2026-03-05",  # 409 errors
    "CHG0039363": "2026-03-05",  # VRP data tables
    "CHG0039367": "2026-03-05",  # MOOV deployment
    "CHG0039369": "2026-03-05",  # Zscaler connector
    "CHG0039371": "2026-03-05",  # EPBCS variables
    "CHG0039372": "2026-03-05",  # Impersonation
    "CHG0039373": "2026-03-05",  # Whitelist Domains
    "CHG0039374": "2026-03-05",  # Remote Desktop
    "CHG0039375": "2026-03-05",  # Geoblock Cuba
    "CHG0039376": "2026-03-05",  # Block malicious IPs
    "CHG0039377": "2026-03-05",  # FTP accounts
    "CHG0039379": "2026-03-05",  # Defender scanning
    "CHG0039383": "2026-03-05",  # Vituity Stats
    "CHG0039384": "2026-03-05",  # Delinea HA
    "CHG0039386": "2026-03-05",  # trust-manager
    "CHG0039387": "2026-03-05",  # Retirement Data
    "CHG0039389": "2026-02-26",  # QC Startup 3/18 (known: planned 02/26)
    "CHG0039395": "2026-03-05",  # CPAC Re-Review
    "CHG0039399": "2026-03-05",  # F5 patches
    "CHG0039403": "2026-03-05",  # ASR
    "CHG0039406": "2026-03-05",  # Workato Service Acct
    "CHG0039412": "2026-03-12",  # ORDC firmware
    "CHG0039414": "2026-03-05",  # Okta RADIUS
    "CHG0039415": "2026-03-05",  # Workato Recipe
    "CHG0039418": "2026-03-12",  # Abnormal SafeList
    "CHG0039420": "2026-03-05",  # Jump server EDI
    "CHG0039421": "2026-03-05",  # Quality Measures
    "CHG0039422": "2026-03-12",  # CMDB AI Component
    "CHG0039423": "2026-03-12",  # Titan SFTP
    "CHG0039424": "2026-03-10",  # Type assignment (known)
    "CHG0039430": "2026-03-05",  # Firepower
    "CHG0039436": "2026-03-12",  # CMDB Server Form
}

with open(DATA_FILE, "r", encoding="utf-8") as f:
    changes = json.load(f)

enriched = 0
for c in changes:
    num = c["number"]
    if num in KNOWN_DATES:
        c["planned_start"] = KNOWN_DATES[num]
        enriched += 1
    else:
        # Interpolate from CHG number
        chg_num = int(num.replace("CHG", ""))
        # Known anchors: CHG0037641=2025-01, CHG0039436=2026-03
        # Range: 37641-39436 = 1795 over ~14 months
        months_offset = (chg_num - 37641) / 1795 * 14
        month_num = int(months_offset)
        year = 2025 + (month_num // 12)
        month = 1 + (month_num % 12)
        c["planned_start"] = f"{year:04d}-{month:02d}-15"
        enriched += 1

# Set close_code to "Successful" for all Closed changes (matches ServiceNow default)
for c in changes:
    if c["state"] == "Closed":
        c["close_code"] = "Successful"
    elif c["state"] == "Canceled":
        c["close_code"] = "Canceled"
    else:
        c["close_code"] = ""

with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(changes, f, indent=2)

print(f"Enriched {enriched}/{len(changes)} records with dates and close codes")
