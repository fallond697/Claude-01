#!/bin/bash
# session-end.sh - Digital Twin Session End Hook
#
# Triggered before session close. Instructs the agent to:
# 1. Capture session decisions to Obsidian vault
# 2. Prompt for ADR creation on architectural decisions
# 3. Store patterns to Neo4j (L4)
#
# This hook outputs session cleanup instructions for the agent
# to follow before completing the session.

cat << 'EOF'
## Session End — Digital Twin Capture

Before closing this session, complete these steps:

### 1. Session Decision Capture
If any decisions were made during this session (CCB, architecture, process):
- Use SessionCaptureService to flush decisions to Obsidian vault
- Path: `1-Projects/ht-095-digital-twin/sessions/{date}-{sessionId}.md`
- Include: decision text, context, related CHG numbers, whether architectural

### 2. ADR Prompt
If any **architectural decisions** were made (new patterns, tool choices, system design):
- Ask: "This session included architectural decisions. Create an ADR? (y/n)"
- If yes: use KnowledgeAdrService to create ADR in vault
- ADR path: `1-Projects/ht-095-digital-twin/decisions/adr-{id}-{slug}.md`

### 3. Neo4j Pattern Storage (L4)
If CCB decisions were recorded, store to Neo4j for cross-project learning:
```cypher
MERGE (d:CcbDecision {changeNumber: $chg})
SET d.decision = $decision,
    d.assignmentGroup = $group,
    d.riskImpact = $ri,
    d.changeType = $type,
    d.decidedAt = $timestamp
```

### 4. Standard Session Close
Then proceed with the normal session close protocol (git status, commit, sync, push).

NOTE: If no decisions were made, skip steps 1-3 and proceed directly to close.
EOF
