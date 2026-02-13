from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

doc = Document()

# Styles
style = doc.styles['Normal']
font = style.font
font.name = 'Calibri'
font.size = Pt(11)

# Title
title = doc.add_heading('Changes in Review State \u2014 Post-Implementation Analysis', level=0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER

# Subtitle
sub = doc.add_paragraph()
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = sub.add_run('Enterprise Change Management\nFebruary 13, 2026')
run.font.size = Pt(12)
run.font.color.rgb = RGBColor(89, 89, 89)

doc.add_paragraph()

# Meta table
meta = doc.add_table(rows=4, cols=2)
meta.style = 'Light Shading Accent 1'
meta.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_data = [
    ('Prepared by', 'Dan Fallon, Enterprise Architecture'),
    ('Source', 'ServiceNow Change Management \u2014 Review State Query'),
    ('Policy Reference', 'ISMS-STA-11.01-01 Enterprise Change Management Program'),
    ('Classification', 'Internal Use Only'),
]
for i, (k, v) in enumerate(meta_data):
    meta.rows[i].cells[0].text = k
    meta.rows[i].cells[1].text = v

doc.add_paragraph()

# Executive Summary
doc.add_heading('Executive Summary', level=1)
doc.add_paragraph(
    'There are 11 change requests currently in Review state (8 Normal, 3 Standard), all '
    'with planned implementation dates of February 12, 2026. These changes require '
    'post-implementation validation confirmation before they can be advanced to Closed. '
    'Nine changes are rated Low risk, one Moderate (CHG0039221), and one Very High '
    '(CHG0039266) with High impact. The Very High change warrants closer review of its '
    'post-deployment validation.'
)

doc.add_paragraph()

# Summary table
doc.add_heading('Change Summary', level=1)

doc.add_heading('Normal Changes (8)', level=2)

summary_table = doc.add_table(rows=9, cols=7)
summary_table.style = 'Medium Shading 1 Accent 1'
summary_table.alignment = WD_TABLE_ALIGNMENT.CENTER

headers = ['Change', 'Short Description', 'Risk', 'Assigned To', 'Impl Plan', 'Backout', 'Test Plan']
for i, h in enumerate(headers):
    cell = summary_table.rows[0].cells[i]
    cell.text = h

rows_data = [
    ('CHG0039321', 'BugFix: Expiring Credentials Notifications', 'Low', 'Yang Lee', 'OK', 'OK', 'OK'),
    ('CHG0039310', 'JAMF: Deploy Tanium to Mac', 'Low', 'Jason Nguyen', 'OK', 'OK', 'OK'),
    ('CHG0039294', 'Enable Salesforce CDC for Workato', 'Low', 'Derrick Chin', 'OK', 'OK', 'OK'),
    ('CHG0039290', 'PE-1: Retire email inbox notifications', 'Low', 'Paramasivan Arunachalam', 'OK', 'WEAK', 'OK'),
    ('CHG0039267', 'Expirables Extract Report Scheduling', 'Low', 'Divyarani Bhat', 'OK', 'OK', 'OK'),
    ('CHG0039266', 'Update Informational Materials on Cred App', 'V.High', 'Niraj Ganani', 'OK', 'OK', 'OK'),
    ('CHG0039154', 'MOOV Email Automation in HCM', 'Low', 'Bala Tadisetty', 'OK', 'OK', 'OK'),
    ('CHG0039141', 'Convert Comments Field to Rich Text', 'Low', 'Parvathi Arun', 'OK', 'OK', 'OK'),
]
for i, row_data in enumerate(rows_data):
    row = summary_table.rows[i + 1]
    for j, val in enumerate(row_data):
        row.cells[j].text = val

doc.add_paragraph()

# Standard Changes table
doc.add_heading('Standard Changes (3)', level=2)

std_table = doc.add_table(rows=4, cols=7)
std_table.style = 'Medium Shading 1 Accent 1'
std_table.alignment = WD_TABLE_ALIGNMENT.CENTER

for i, h in enumerate(headers):
    std_table.rows[0].cells[i].text = h

std_rows = [
    ('CHG0039315', 'New Configuration Items in ServiceNow', 'Low', 'Ray Blor', 'OK', 'OK', 'OK'),
    ('CHG0039286', 'Create AI Analysis fields on NewHire/Recred', 'Low', 'Niraj Ganani', 'OK', 'OK', 'OK'),
    ('CHG0039221', 'Add survey responses to Survey Sender report', 'Moderate', 'Niraj Ganani', 'OK', 'OK', 'OK'),
]
for i, row_data in enumerate(std_rows):
    row = std_table.rows[i + 1]
    for j, val in enumerate(row_data):
        row.cells[j].text = val

doc.add_paragraph()

# Findings
doc.add_heading('Findings & Observations', level=1)

# Finding 1 - CHG0039266
doc.add_heading('CHG0039266 \u2014 Very High Risk Rating for Content Update', level=2)
p = doc.add_paragraph()
p.add_run('Risk: ').bold = True
p.add_run('Very High | ')
p.add_run('Impact: ').bold = True
p.add_run('1 - High')
doc.add_paragraph()
p = doc.add_paragraph()
p.add_run('Finding: ').bold = True
p.add_run(
    'This change updates informational materials on the credentialing application in '
    'Salesforce. It is rated Very High risk with High impact, which appears disproportionate '
    'for a content update. The description is minimal ("Updates to the Informational '
    'Materials on Cred App") and does not explain what materials are changing or why the '
    'risk rating is so high. Implementation, backout, and test plans are all adequate.'
)
p = doc.add_paragraph()
p.add_run('Recommendation: ').bold = True
p.add_run(
    'Before closing, confirm with Selena LomeliGraham that post-deployment validation was '
    'completed successfully. Consider whether the Very High / High rating is appropriate '
    'for a content update, or if the risk assessment needs recalibration.'
)

doc.add_paragraph()

# Finding 2 - CHG0039290 backout
doc.add_heading('CHG0039290 \u2014 Incomplete Backout Plan', level=2)
p = doc.add_paragraph()
p.add_run('Risk: ').bold = True
p.add_run('Low | ')
p.add_run('Impact: ').bold = True
p.add_run('3 - Low')
doc.add_paragraph()
p = doc.add_paragraph()
p.add_run('Finding: ').bold = True
p.add_run(
    'The PE-1 production release involves a Salesforce changeset with permission sets, '
    'record types, page layouts, and an activated flow. The backout plan only addresses '
    'removing the permission set ("Remove PE IEC Task Set"), but does not cover reverting '
    'the deployed changeset, deactivating the flow, or restoring prior page layout assignments. '
    'If a rollback were needed, removing the permission set alone would not fully revert the '
    'system to its pre-implementation state.'
)
p = doc.add_paragraph()
p.add_run('Recommendation: ').bold = True
p.add_run(
    'Since the change is already implemented and in Review, this is noted for process '
    'improvement. Future Salesforce changeset deployments should document rollback steps '
    'for each component deployed (permission sets, flows, page layouts, record types). '
    'Assigned to has been notified.'
)

doc.add_paragraph()

# Finding 3 - CHG0039310 blank field
doc.add_heading('CHG0039310 \u2014 Sites/Business Units Field Blank', level=2)
p = doc.add_paragraph()
p.add_run('Risk: ').bold = True
p.add_run('Low | ')
p.add_run('Impact: ').bold = True
p.add_run('3 - Low')
doc.add_paragraph()
p = doc.add_paragraph()
p.add_run('Finding: ').bold = True
p.add_run(
    'The JAMF/Tanium Mac deployment affects all managed Mac devices across the organization, '
    'but the "What sites or business units are impacted?" field in the Risk & Impact Analysis '
    'is blank. This was previously flagged during CCB prep for the February 12 meeting.'
)
p = doc.add_paragraph()
p.add_run('Recommendation: ').bold = True
p.add_run(
    'Request that Jason Nguyen update the Sites/BU field before the change is closed. '
    'This field supports audit trail completeness.'
)

doc.add_paragraph()

# Detailed Change Cards
doc.add_heading('Detailed Change Review', level=1)

changes = [
    {
        'number': 'CHG0039321',
        'title': 'BugFix: Expiring Credentials Notification Emails',
        'risk': 'Low',
        'impact': '3 - Low',
        'group': 'Enterprise Applications',
        'assigned': 'Yang Lee',
        'requested': 'Jill Truesdale',
        'planned': '02/12/2026 09:00 \u2013 11:00',
        'description': (
            'Bug fix for notification service failing with "too many parameters" error '
            'when provider count exceeds 2,100. Fix updates SQL query in the '
            'Portal-Credentialing Notifications exe on ordc-prdweb3.'
        ),
        'impl_rating': 'OK',
        'impl_notes': 'Replace exe build files on ordc-prdweb3 with latest build from repo.',
        'backout_rating': 'OK',
        'backout_notes': 'Re-enable backed up exe. Backout trigger: error when building exe.',
        'test_rating': 'OK',
        'test_notes': 'Tested in dev. Jill validates post-deploy; INC created if issues.',
        'review_action': 'Confirm with Jill Truesdale that notification emails are sending correctly.',
    },
    {
        'number': 'CHG0039310',
        'title': 'JAMF: Deploy Tanium Client to Mac Devices',
        'risk': 'Low',
        'impact': '3 - Low',
        'group': 'Service Delivery Optimization',
        'assigned': 'Jason Nguyen',
        'requested': 'Andrew Sanchez',
        'planned': '02/12/2026 16:00 \u2013 16:30',
        'description': (
            'Deploy Tanium client (v7.8.2.1111) to all managed Mac devices via Jamf Pro '
            'policy/configuration profile. Silent background install, no user interaction.'
        ),
        'impl_rating': 'OK',
        'impl_notes': 'Deploy via Jamf Pro policy/config profile scoped to all managed Macs.',
        'backout_rating': 'OK',
        'backout_notes': 'Revoke config profile by adjusting scope; near-instant via APNS.',
        'test_rating': 'OK',
        'test_notes': 'Tested on IT test group. Verified via Jamf logs and Tanium dashboard.',
        'review_action': 'Confirm Tanium client reporting from Mac endpoints. Update Sites/BU field.',
    },
    {
        'number': 'CHG0039294',
        'title': 'Enable Salesforce Change Data Capture (CDC) for Workato',
        'risk': 'Low',
        'impact': '3 - Low',
        'group': 'Enterprise Applications',
        'assigned': 'Derrick Chin',
        'requested': 'Anjali Mewara',
        'planned': '02/12/2026 09:00 \u2013 10:00',
        'description': (
            'Enable CDC on Contact, Contract, and Contract Implementation objects so '
            'Workato can receive real-time change events for data synchronization.'
        ),
        'impl_rating': 'OK',
        'impl_notes': 'Step-by-step: Setup > CDC > select objects > Save.',
        'backout_rating': 'OK',
        'backout_notes': 'Remove objects from CDC tracking.',
        'test_rating': 'OK',
        'test_notes': 'Tested in Sandbox by Rosie and Anjali. Savannah validates post-deploy.',
        'review_action': 'Confirm with Savannah that Workato is receiving CDC events.',
    },
    {
        'number': 'CHG0039290',
        'title': 'PE-1: Retire Email Inbox Notifications, Replace with System Notifications',
        'risk': 'Low',
        'impact': '3 - Low',
        'group': 'Enterprise Applications',
        'assigned': 'Paramasivan Arunachalam',
        'requested': 'Nancy Nair',
        'planned': '02/12/2026 09:00 \u2013 11:00',
        'description': (
            'Deploy Salesforce changeset PE-1 to replace email inbox-based PE intake '
            'with system-level notifications and a task queue for IEC creation. Includes '
            'permission sets, record types, page layouts, and a flow trigger.'
        ),
        'impl_rating': 'OK',
        'impl_notes': '6 detailed steps: deploy changeset, assign permissions, verify record types, layouts, flow, login validation.',
        'backout_rating': 'WEAK',
        'backout_notes': 'Only covers removing permission set. Does not address reverting the deployed changeset, deactivating the flow, or restoring page layouts.',
        'test_rating': 'OK',
        'test_notes': 'Tested in SB2 by Nancy Nair and team. Sara Jew/Nancy Nair validate post-deploy.',
        'review_action': 'Confirm with Nancy Nair/Sara Jew that PE notification queue is functional.',
    },
    {
        'number': 'CHG0039267',
        'title': 'Expirables Extract Report \u2014 Production Scheduling',
        'risk': 'Low',
        'impact': '3 - Low',
        'group': 'Enterprise Applications',
        'assigned': 'Divyarani Bhat',
        'requested': 'Jennifer Dorais',
        'planned': '02/12/2026 09:00 \u2013 11:00',
        'description': (
            'Schedule Workato recipes to generate Expirables Extract report 5 and 3 '
            'business days before month-end. Includes SQL data prep, notifications, '
            'and daily summary.'
        ),
        'impl_rating': 'OK',
        'impl_notes': '5 steps: configure SQL, build recipes, configure notifications, test, deploy. Recipe links provided.',
        'backout_rating': 'OK',
        'backout_notes': 'Disable Workato recipes immediately; no downtime.',
        'test_rating': 'OK',
        'test_notes': 'Validated SQL logic, executed test runs with controlled recipients.',
        'review_action': 'Confirm first scheduled run executes correctly. Side-by-side comparison with existing reports at month-end.',
    },
    {
        'number': 'CHG0039266',
        'title': 'Updates to Informational Materials on Cred App',
        'risk': 'Very High',
        'impact': '1 - High',
        'group': 'Enterprise Applications',
        'assigned': 'Niraj Ganani',
        'requested': 'Selena LomeliGraham',
        'planned': '02/12/2026 10:00 \u2013 10:30',
        'description': (
            'Update informational materials within the online credentialing application '
            'in Salesforce. Update flow and upload files to folder libraries.'
        ),
        'impl_rating': 'OK',
        'impl_notes': 'Navigate to Setup > Flow > update Credentialing Application flow, upload files to folder libraries, link in flow. Changeset from SB2 provided.',
        'backout_rating': 'OK',
        'backout_notes': 'Reactivate old version of flow.',
        'test_rating': 'OK',
        'test_notes': 'Tested in Sandbox with Selena LomeliGraham.',
        'review_action': 'PRIORITY: Confirm with Selena that post-deploy validation is complete. Assess whether Very High / High rating is appropriate for a content update.',
    },
    {
        'number': 'CHG0039154',
        'title': 'MOOV Email Automation in HCM',
        'risk': 'Low',
        'impact': '3 - Low',
        'group': 'Enterprise Applications',
        'assigned': 'Bala Subramanyam Tadisetty',
        'requested': 'Melinda Chiem',
        'planned': '02/12/2026 14:00 \u2013 16:00',
        'description': (
            'Automate MOOV employee email domain setup: set primary email to @moov.health, '
            'add @vituity.com alias, add to MOOV employee list. Workato recipe update with '
            'department and job ID filtering.'
        ),
        'impl_rating': 'OK',
        'impl_notes': '4 steps: log in to Workato, update recipe with MOOV domain logic, start recipe, log off.',
        'backout_rating': 'OK',
        'backout_notes': 'Revert to previous working version of recipe.',
        'test_rating': 'OK',
        'test_notes': 'Validated and tested email generation in lower env.',
        'review_action': 'Confirm Bala has monitored jobs with no errors. Verify MOOV email routing is working.',
    },
    {
        'number': 'CHG0039141',
        'title': 'Convert Comments Field to Rich Text',
        'risk': 'Low',
        'impact': '3 - Low',
        'group': 'Enterprise Applications',
        'assigned': 'Parvathi Arun',
        'requested': 'Taylor Heberling',
        'planned': '02/12/2026 09:00 \u2013 11:00',
        'description': (
            'Convert the Comments field on the Line of Business object from Long Text Area '
            'to Rich Text Area in Salesforce. Requires updating dependent Apex classes and '
            'a flow before and after the data type change.'
        ),
        'impl_rating': 'OK',
        'impl_notes': 'Comprehensive: changeset with 5 components, test class validation, step-by-step deploy.',
        'backout_rating': 'OK',
        'backout_notes': 'Detailed rollback: disable dependencies, revert field type, redeploy prior versions, reactivate, regression test.',
        'test_rating': 'OK',
        'test_notes': 'Impact analysis, unit tests, functional tests, deployment validation all completed in SB2.',
        'review_action': 'Confirm with Taylor Heberling that rich text formatting is working as expected.',
    },
    {
        'number': 'CHG0039315',
        'title': 'New Configuration Items in ServiceNow',
        'risk': 'Low',
        'impact': '3 - Low',
        'group': 'Enterprise Applications',
        'assigned': 'Ray Blor',
        'requested': 'Rosalinda Rafael',
        'planned': '02/12/2026 09:00 \u2013 11:00',
        'type': 'Standard',
        'description': (
            'Add 6 new Configuration Items to ServiceNow CMDB: Novarad PACS, NovaRis, '
            'Mmodal, Mirth Connect, Rscriptor (AI), Vendor Neutral Archive (VNA). '
            'Deployed via update set RB-CHG0039315.'
        ),
        'impl_rating': 'OK',
        'impl_notes': 'Deploy update set from dev to production. Tested and reviewed by Vinod.',
        'backout_rating': 'OK',
        'backout_notes': 'Back out the update set. Trigger: update set errors out.',
        'test_rating': 'OK',
        'test_notes': 'Tested and reviewed by Vinod in dev. Ray reviews deployment in prod.',
        'review_action': 'Confirm CIs are visible in CMDB and available for incident/CR assignment.',
    },
    {
        'number': 'CHG0039286',
        'title': 'Create AI Analysis Fields on NewHire/Recred Object',
        'risk': 'Low',
        'impact': '3 - Low',
        'group': 'Enterprise Applications',
        'assigned': 'Niraj Ganani',
        'requested': 'Racquel Llavore',
        'planned': '02/12/2026 10:00 \u2013 10:30',
        'type': 'Standard',
        'description': (
            'Create 3 new AI Analysis fields (Licensure & Privileges, Education, Work History) '
            'on the NewHire/Recred object in Salesforce to enable Workato Recredentialing '
            'integration. Preboarding integration already working; these fields unblock Recred.'
        ),
        'impl_rating': 'OK',
        'impl_notes': '2 steps: create fields via Object Manager, update VF pages (NewHireRecredVF, NewHireRecredEdit). Changeset from SB2.',
        'backout_rating': 'OK',
        'backout_notes': 'Restore VF page backups, remove FLS for new fields, deploy changeset if required.',
        'test_rating': 'OK',
        'test_notes': 'Tested in Sandbox with Racquel Llavore.',
        'review_action': 'Confirm with Racquel that AI fields are visible and Workato can write Recred analysis results.',
    },
    {
        'number': 'CHG0039221',
        'title': 'Add New Survey Responses to Survey Sender Report',
        'risk': 'Moderate',
        'impact': '3 - Low',
        'group': 'Enterprise Applications',
        'assigned': 'Niraj Ganani',
        'requested': 'Kelly Tremper',
        'planned': '02/12/2026 10:00 \u2013 10:30',
        'type': 'Standard',
        'description': (
            'Add SMS and Email survey responses to the existing Survey Sender report in '
            'Salesforce. Create new Survey, Survey Questions, and Notes records. No changeset '
            'needed \u2014 direct production data entry. Tracks NPS metric reviewed by the board.'
        ),
        'impl_rating': 'OK',
        'impl_notes': 'Create records directly in Prod: App Launcher > Survey Tab > New. Standard data entry, no changeset.',
        'backout_rating': 'OK',
        'backout_notes': 'Delete newly created records.',
        'test_rating': 'OK',
        'test_notes': 'Tested in Sandbox with Savannah.',
        'review_action': 'Confirm with Savannah that survey responses appear in report with correct source (SMS/Email) attribution.',
    },
]

for chg in changes:
    doc.add_heading(f"{chg['number']} \u2014 {chg['title']}", level=2)

    # Metadata card
    card = doc.add_table(rows=5, cols=4)
    card.style = 'Light List Accent 1'
    card.alignment = WD_TABLE_ALIGNMENT.CENTER

    card.rows[0].cells[0].text = 'Risk'
    card.rows[0].cells[1].text = chg['risk']
    card.rows[0].cells[2].text = 'Impact'
    card.rows[0].cells[3].text = chg['impact']

    card.rows[1].cells[0].text = 'Assignment Group'
    card.rows[1].cells[1].text = chg['group']
    card.rows[1].cells[2].text = 'Assigned To'
    card.rows[1].cells[3].text = chg['assigned']

    card.rows[2].cells[0].text = 'Requested By'
    card.rows[2].cells[1].text = chg['requested']
    card.rows[2].cells[2].text = 'Planned Window'
    card.rows[2].cells[3].text = chg['planned']

    card.rows[3].cells[0].text = 'Impl Plan'
    card.rows[3].cells[1].text = chg['impl_rating']
    card.rows[3].cells[2].text = 'Backout Plan'
    card.rows[3].cells[3].text = chg['backout_rating']

    card.rows[4].cells[0].text = 'Test Plan'
    card.rows[4].cells[1].text = chg['test_rating']
    card.rows[4].cells[2].text = ''
    card.rows[4].cells[3].text = ''

    doc.add_paragraph()

    p = doc.add_paragraph()
    p.add_run('Description: ').bold = True
    p.add_run(chg['description'])

    p = doc.add_paragraph()
    p.add_run('Implementation: ').bold = True
    p.add_run(f"[{chg['impl_rating']}] {chg['impl_notes']}")

    p = doc.add_paragraph()
    p.add_run('Backout: ').bold = True
    p.add_run(f"[{chg['backout_rating']}] {chg['backout_notes']}")

    p = doc.add_paragraph()
    p.add_run('Testing: ').bold = True
    p.add_run(f"[{chg['test_rating']}] {chg['test_notes']}")

    p = doc.add_paragraph()
    p.add_run('Review Action: ').bold = True
    p.add_run(chg['review_action'])

    doc.add_paragraph()

# Closure readiness
doc.add_heading('Closure Readiness Assessment', level=1)

closure_table = doc.add_table(rows=12, cols=4)
closure_table.style = 'Medium Shading 1 Accent 1'
closure_table.alignment = WD_TABLE_ALIGNMENT.CENTER
cl_headers = ['Change', 'Post-Deploy Validated?', 'Outstanding Items', 'Ready to Close?']
for i, h in enumerate(cl_headers):
    closure_table.rows[0].cells[i].text = h

cl_data = [
    ('CHG0039321', 'Pending \u2014 Jill Truesdale', 'None identified', 'Yes, pending validation'),
    ('CHG0039310', 'Pending \u2014 Jason Nguyen', 'Sites/BU field blank', 'Yes, after field update'),
    ('CHG0039294', 'Pending \u2014 Savannah', 'None identified', 'Yes, pending validation'),
    ('CHG0039290', 'Pending \u2014 Nancy Nair/Sara Jew', 'Backout plan incomplete (process note)', 'Yes, pending validation'),
    ('CHG0039267', 'Pending \u2014 first month-end run', 'Side-by-side comparison needed', 'Yes, after month-end'),
    ('CHG0039266', 'Pending \u2014 Selena LomeliGraham', 'Risk rating review recommended', 'Yes, pending validation'),
    ('CHG0039154', 'Pending \u2014 Bala Tadisetty', 'None identified', 'Yes, pending validation'),
    ('CHG0039141', 'Pending \u2014 Taylor Heberling', 'None identified', 'Yes, pending validation'),
    ('CHG0039315', 'Pending \u2014 Ray Blor/Vinod', 'None identified', 'Yes, pending validation'),
    ('CHG0039286', 'Pending \u2014 Racquel Llavore', 'None identified', 'Yes, pending validation'),
    ('CHG0039221', 'Pending \u2014 Savannah', 'None identified', 'Yes, pending validation'),
]
for i, (chg, validated, outstanding, ready) in enumerate(cl_data):
    row = closure_table.rows[i + 1]
    row.cells[0].text = chg
    row.cells[1].text = validated
    row.cells[2].text = outstanding
    row.cells[3].text = ready

doc.add_paragraph()

# Recommendations
doc.add_heading('Recommendations', level=1)

doc.add_paragraph(
    'Change owners should add post-deployment validation comments to each CR and '
    'advance to Closed once confirmed successful.',
    style='List Number'
)
doc.add_paragraph(
    'CHG0039310: Jason Nguyen should update the Sites/BU impacted field before closure.',
    style='List Number'
)
doc.add_paragraph(
    'CHG0039266: Review whether Very High / High risk rating is appropriate for a '
    'content-only update.',
    style='List Number'
)
doc.add_paragraph(
    'CHG0039290: Backout plan does not cover changeset rollback. Assigned to has been notified.',
    style='List Number'
)
doc.add_paragraph(
    'CHG0039267: This change cannot be fully validated until the first month-end run. '
    'Consider leaving in Review until the side-by-side comparison is complete.',
    style='List Number'
)

doc.add_paragraph()

# Footer
footer = doc.add_paragraph()
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = footer.add_run('Enterprise Architecture | Vituity Information Technology Services')
run.font.size = Pt(9)
run.font.color.rgb = RGBColor(128, 128, 128)

import shutil
temp_path = r'C:\Users\FallonD\Code\Claude-01\Changes in Review State Analysis 2026-02-13.docx'
final_path = r'C:\Users\FallonD\OneDrive - Vituity\Documents\Change Management\CCB\2026\Changes in Review State Analysis 2026-02-13.docx'
doc.save(temp_path)
try:
    shutil.copy2(temp_path, final_path)
    print(f'Saved to: {final_path}')
except PermissionError:
    print(f'Saved to temp: {temp_path}')
    print(f'OneDrive copy locked. Close the file in Word/browser, then copy manually.')
