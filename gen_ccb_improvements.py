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
title = doc.add_heading('CCB Process Improvement Recommendations', level=0)
title.alignment = WD_ALIGN_PARAGRAPH.CENTER

# Subtitle
sub = doc.add_paragraph()
sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = sub.add_run('Weekly Enterprise Change Control Board\nFebruary 13, 2026')
run.font.size = Pt(12)
run.font.color.rgb = RGBColor(89, 89, 89)

doc.add_paragraph()

# Meta table
meta = doc.add_table(rows=4, cols=2)
meta.style = 'Light Shading Accent 1'
meta.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_data = [
    ('Prepared by', 'Dan Fallon, Enterprise Architecture'),
    ('Based on', 'CCB Meeting of February 12, 2026'),
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
    'Following the February 12, 2026 CCB meeting, a post-session review identified six '
    'process improvement opportunities. These recommendations address documentation gaps, '
    'audit trail weaknesses, and workflow inefficiencies observed across multiple CCB cycles. '
    'Implementation of these improvements will reduce board prep time, improve change quality, '
    'and strengthen compliance with ISMS-STA-11.01-01.'
)

# Context
doc.add_heading('Review Context', level=1)
doc.add_paragraph(
    'The February 12 CCB reviewed 6 Normal change requests. Of these, '
    '4 were assessed as Ready, 1 required board discussion (QuantaStor upgrade), and 1 was '
    'approved as routine (athenaIDX PM). Three prep documents were generated for this session, '
    'two of which were identical. No meeting transcript was available despite transcription '
    'being enabled for other recurring meetings.'
)

# Findings table
doc.add_heading('Findings Summary', level=1)

summary_table = doc.add_table(rows=7, cols=4)
summary_table.style = 'Medium Shading 1 Accent 1'
summary_table.alignment = WD_TABLE_ALIGNMENT.CENTER

headers = ['#', 'Recommendation', 'Effort', 'Impact']
for i, h in enumerate(headers):
    summary_table.rows[0].cells[i].text = h

rows_data = [
    ('1', 'Enable meeting transcription', 'Low', 'High'),
    ('2', 'Pre-screen changes with empty plans', 'Low', 'High'),
    ('3', 'Consolidate to single prep document', 'Low', 'Medium'),
    ('4', 'Standardize plan rating rubric', 'Medium', 'Medium'),
    ('5', 'Add question disposition tracking', 'Medium', 'Medium'),
    ('6', 'Implement post-CCB action log', 'Medium', 'High'),
]
for i, (num, rec, effort, impact) in enumerate(rows_data):
    row = summary_table.rows[i + 1]
    row.cells[0].text = num
    row.cells[1].text = rec
    row.cells[2].text = effort
    row.cells[3].text = impact

doc.add_paragraph()

# Detailed recommendations
doc.add_heading('Detailed Recommendations', level=1)

# Rec 1
doc.add_heading('1. Enable Meeting Transcription', level=2)
p = doc.add_paragraph()
p.add_run('Finding: ').bold = True
p.add_run(
    'No Teams meeting transcript (.vtt) was generated for the February 12 CCB. Other recurring '
    'meetings (HRIS Change Management, CMS Quality, Enterprise CM doc review) all have '
    'transcripts synced via OneDrive. This means verbal commitments, risk acceptance rationale, '
    'and conditional approvals from board members are not recorded.'
)
p = doc.add_paragraph()
p.add_run('Recommendation: ').bold = True
p.add_run(
    'Enable automatic transcription in the Teams meeting settings for the Weekly Enterprise '
    'CCB Meeting. This creates an auditable record of board decisions, which is critical for '
    'change management compliance and post-incident review.'
)
p = doc.add_paragraph()
p.add_run('Effort: ').bold = True
p.add_run('Low \u2014 Single Teams meeting setting toggle.')

# Rec 2
doc.add_heading('2. Pre-Screen Changes with Empty Plans', level=2)
p = doc.add_paragraph()
p.add_run('Finding: ').bold = True
p.add_run(
    'Two Standard changes (CHG0039212 and CHG0039148) arrived at CCB with completely empty '
    'Implementation, Backout, and Test plans. CHG0039212 also had "tbd" as its justification '
    'and an entirely unanswered Risk & Impact section. These consumed board discussion time '
    'despite being obviously incomplete.'
)
p = doc.add_paragraph()
p.add_run('Recommendation: ').bold = True
p.add_run(
    'Implement a pre-CCB gate on Wednesday (before the 3:00 PM PT cutoff) that checks for '
    'empty plan fields on all changes at Assess state. Changes with empty Implementation, '
    'Backout, or Test plans should be automatically flagged and returned to the assignee '
    'with a standard notification. This could be a ServiceNow business rule or a scheduled '
    'report sent to change owners.'
)
p = doc.add_paragraph()
p.add_run('Effort: ').bold = True
p.add_run('Low \u2014 ServiceNow scheduled job or report rule.')

# Rec 3
doc.add_heading('3. Consolidate to Single Prep Document', level=2)
p = doc.add_paragraph()
p.add_run('Finding: ').bold = True
p.add_run(
    'Three prep documents were generated for the February 12 CCB: "CCB Prep - CAB Review," '
    '"CCB Prep - CCB Review," and "CCB-Review-2026-02-12." The first two are identical. '
    'The third uses a different format with implementation schedule tables, structured '
    'metadata cards per change, and a prioritized discussion section.'
)
p = doc.add_paragraph()
p.add_run('Recommendation: ').bold = True
p.add_run(
    'Consolidate into a single document using the CCB-Review format, which is the most '
    'comprehensive. Retire the duplicate "CCB Prep" naming convention. The single document '
    'should serve as both preparation material and the meeting agenda.'
)
p = doc.add_paragraph()
p.add_run('Effort: ').bold = True
p.add_run('Low \u2014 Template standardization.')

# Rec 4
doc.add_heading('4. Standardize Plan Rating Rubric', level=2)
p = doc.add_paragraph()
p.add_run('Finding: ').bold = True
p.add_run(
    'The two prep document formats applied different ratings to the same change plans:'
)

rating_table = doc.add_table(rows=4, cols=4)
rating_table.style = 'Light List Accent 1'
rating_table.alignment = WD_TABLE_ALIGNMENT.CENTER
rating_headers = ['Change', 'Field', 'CCB Prep Rating', 'CCB-Review Rating']
for i, h in enumerate(rating_headers):
    rating_table.rows[0].cells[i].text = h
rating_data = [
    ('CHG0039298', 'Backout Plan', 'INCOMPLETE', 'OK'),
    ('CHG0039288', 'Test Plan', 'INCOMPLETE', 'OK'),
    ('CHG0039318', 'Test Plan', 'INCOMPLETE', 'OK'),
]
for i, (chg, field, prep, review) in enumerate(rating_data):
    row = rating_table.rows[i + 1]
    row.cells[0].text = chg
    row.cells[1].text = field
    row.cells[2].text = prep
    row.cells[3].text = review

doc.add_paragraph()
p = doc.add_paragraph()
p.add_run('Recommendation: ').bold = True
p.add_run(
    'Define a single plan rating rubric with clear criteria for each level:'
)

rubric = doc.add_table(rows=5, cols=2)
rubric.style = 'Light List Accent 1'
rubric.alignment = WD_TABLE_ALIGNMENT.CENTER
rubric.rows[0].cells[0].text = 'Rating'
rubric.rows[0].cells[1].text = 'Criteria'
rubric_data = [
    ('OK', 'Contains discrete, actionable steps appropriate to the change type.'),
    ('WEAK', 'Steps exist but lack specificity, rely entirely on vendor, or omit key details.'),
    ('INCOMPLETE', 'Field is empty, contains only "TBD" or "N/A" where a plan is required.'),
    ('N/A', 'Plan type genuinely does not apply (e.g., test plan for a decommission with 30-day hold).'),
]
for i, (rating, criteria) in enumerate(rubric_data):
    rubric.rows[i + 1].cells[0].text = rating
    rubric.rows[i + 1].cells[1].text = criteria

doc.add_paragraph()
p = doc.add_paragraph()
p.add_run('Effort: ').bold = True
p.add_run('Medium \u2014 Requires agreement on definitions and consistent application.')

# Rec 5
doc.add_heading('5. Add Question Disposition Tracking', level=2)
p = doc.add_paragraph()
p.add_run('Finding: ').bold = True
p.add_run(
    'The prep documents raised 25+ questions across all changes. After the meeting, there '
    'is no record of which questions were answered, what the answers were, or which were '
    'deferred. This breaks the audit trail between prep and outcome.'
)
p = doc.add_paragraph()
p.add_run('Recommendation: ').bold = True
p.add_run(
    'Add a disposition field to each question in the post-meeting document. Example statuses: '
    'Answered (with summary), Deferred (with owner/date), Waived (with rationale). This '
    'closes the loop between preparation and decision and provides evidence for audit.'
)
p = doc.add_paragraph()
p.add_run('Effort: ').bold = True
p.add_run('Medium \u2014 Requires real-time or immediate post-meeting annotation.')

# Rec 6
doc.add_heading('6. Implement Post-CCB Action Log', level=2)
p = doc.add_paragraph()
p.add_run('Finding: ').bold = True
p.add_run(
    'The Minutes of Meeting email instructed change owners to "advance the CR to the Review '
    'state and add post-deployment comments to the Notes." However, there is no structured '
    'mechanism to track whether these actions were completed. Conditional approvals (e.g., '
    '"fill in the blank risk fields before implementing") have no follow-up trigger.'
)
p = doc.add_paragraph()
p.add_run('Recommendation: ').bold = True
p.add_run(
    'Create a post-CCB action log that is reviewed at the start of the next CCB meeting. '
    'Each action should include the change number, action description, owner, due date, '
    'and completion status:'
)

action_table = doc.add_table(rows=5, cols=5)
action_table.style = 'Medium Shading 1 Accent 1'
action_table.alignment = WD_TABLE_ALIGNMENT.CENTER
action_headers = ['Change', 'Action', 'Owner', 'Due', 'Status']
for i, h in enumerate(action_headers):
    action_table.rows[0].cells[i].text = h
action_data = [
    ('CHG0039212', 'Complete all plan fields and resubmit', 'Parvathi Arun', 'Next CCB', 'Open'),
    ('CHG0039148', 'Complete impl steps, backout, and test plan', 'Parvathi Arun', 'Next CCB', 'Open'),
    ('CHG0039318', 'Obtain documented recovery procedure from OSNEXUS', 'Michael Castro', 'Before 2/18', 'Open'),
    ('CHG0039310', 'Complete blank risk assessment fields', 'Jason Nguyen', 'Before impl', 'Open'),
]
for i, (chg, action, owner, due, status) in enumerate(action_data):
    row = action_table.rows[i + 1]
    row.cells[0].text = chg
    row.cells[1].text = action
    row.cells[2].text = owner
    row.cells[3].text = due
    row.cells[4].text = status

doc.add_paragraph()
p = doc.add_paragraph()
p.add_run('Effort: ').bold = True
p.add_run('Medium \u2014 Requires discipline to maintain weekly; could be automated from ServiceNow.')

# Implementation priority
doc.add_heading('Implementation Priority', level=1)
doc.add_paragraph(
    'The following implementation order maximizes value while building on each improvement:'
)

priority = doc.add_table(rows=4, cols=3)
priority.style = 'Medium Shading 1 Accent 1'
priority.alignment = WD_TABLE_ALIGNMENT.CENTER
priority.rows[0].cells[0].text = 'Phase'
priority.rows[0].cells[1].text = 'Recommendations'
priority.rows[0].cells[2].text = 'Target'
priority_data = [
    ('Immediate', '#1 (Transcription), #3 (Consolidate docs)', 'Next CCB (Feb 19)'),
    ('Short-term', '#2 (Pre-screen), #4 (Rating rubric)', 'Within 2 weeks'),
    ('Medium-term', '#5 (Question tracking), #6 (Action log)', 'Within 30 days'),
]
for i, (phase, recs, target) in enumerate(priority_data):
    row = priority.rows[i + 1]
    row.cells[0].text = phase
    row.cells[1].text = recs
    row.cells[2].text = target

doc.add_paragraph()

# Footer
doc.add_paragraph()
footer = doc.add_paragraph()
footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = footer.add_run('Enterprise Architecture | Vituity Information Technology Services')
run.font.size = Pt(9)
run.font.color.rgb = RGBColor(128, 128, 128)

output_path = r'C:\Users\FallonD\OneDrive - Vituity\Documents\Change Management\CCB\2026\CCB Process Improvement Recommendations 2026-02-13.docx'
doc.save(output_path)
print(f'Saved to: {output_path}')
