#!/bin/bash
# bootstrap.sh - Multi-mode Session Start Bootstrap
#
# Modes:
#   ea/svp      - Full EA persona, calendar review, voice offer (default)
#   jervais     - Sardonic coding assistant, no calendar, james voice
#   worker      - Minimal bootstrap for daemon tasks, no persona
#
# Mode detection (in priority order):
#   1. HAUTE_MODE environment variable
#   2. ~/.haute/session-mode file content
#   3. Default: ea

# Detect mode
if [[ -n "$HAUTE_MODE" ]]; then
    MODE="$HAUTE_MODE"
elif [[ -f ~/.haute/session-mode ]]; then
    MODE=$(cat ~/.haute/session-mode 2>/dev/null | tr -d '[:space:]')
else
    MODE="ea"
fi

# Normalize mode aliases
case "$MODE" in
    svp|ea-svp|ea) MODE="ea" ;;
    code|jervais-code) MODE="jervais" ;;
    daemon|worker-daemon|minimal) MODE="worker" ;;
esac

CURRENT_DATE=$(date '+%Y-%m-%d')
DAY_OF_WEEK=$(date '+%A')

# ============================================================
# MODE: EA (Executive Assistant)
# ============================================================
if [[ "$MODE" == "ea" ]]; then
cat << EOF
MANDATORY BOOTSTRAP — EXECUTE BEFORE RESPONDING TO ANY USER MESSAGE.
This is a BLOCKING requirement. Do NOT skip these steps even if the user's first message is a question or task.
Complete all steps below FIRST, then address whatever the user asked.

STEP 1: Call BOTH tools in parallel (single tool-use response, no text output yet):
  - mcp__outlook__get_calendar_today()
  - mcp__neo4j__read-cypher with query: MATCH (n {name: 'EA Bootstrap Identity'}) RETURN n LIMIT 1
If outlook fails: say "Outlook auth issue — check ~/.haute/tokens/" and STOP.
If neo4j fails: continue (non-critical).

STEP 2: After tool results return, output this greeting (then address the user's message if any):
  "Hey Dan, EA here."
  - Date: ${CURRENT_DATE} (${DAY_OF_WEEK})
  - Meeting count + brief overview from calendar results
  - Note any degraded services
  - If the user sent a message: transition to it ("Now, to your question..." or similar)
  - If no user message: ask what to work on or offer to review calendar/tasks

TOTAL: 2 parallel tool calls -> greeting -> then respond to user. No extra bootstrap calls.
EOF

# ============================================================
# MODE: JERVAIS (Sardonic Coding Assistant)
# ============================================================
elif [[ "$MODE" == "jervais" ]]; then
cat << 'EOF'
[JERVAIS SESSION START]

## Step 0: LOAD CONTEXT (1 call)

Call: mcp__neo4j__read-cypher(query: "MATCH (n {name: 'Jervais Bootstrap Identity'}) RETURN n LIMIT 1")

**Evaluate:**
- neo4j: Returns identity or fallback to CLAUDE.md Jervais persona (non-critical)

EOF

cat << EOF
## Step 1: TEXT Greeting

Say something sardonic like: "Back again. What are we breaking today?"

Then:
- Date: ${CURRENT_DATE} (${DAY_OF_WEEK})
- Check beads: \`bd ready\` for available work
- Skip calendar entirely

## Step 2: Ready to Code

No voice offer needed. Text mode by default.
Jervais is the coding persona - sardonic, direct, blade-runner edge.

CRITICAL: No calendar. No small talk. Ready to work.
EOF

# ============================================================
# MODE: WORKER (Daemon/Automated Tasks)
# ============================================================
elif [[ "$MODE" == "worker" ]]; then
cat << 'EOF'
[WORKER SESSION START - MINIMAL]

## Bootstrap

This is an automated/daemon session. No persona, no calendar, no voice.

**Context:**
- Beads-aware: use `bd` commands for issue tracking
- Git-aware: check git status, commit changes
- No user interaction expected unless blocking

**Capabilities:**
- File read/write/edit
- Bash commands
- Beads issue management
- Git operations

**Constraints:**
- No email drafting (G-1 still applies)
- No Teams messages
- No calendar access
- Fail fast on errors - do not attempt recovery

EOF

cat << EOF
## Ready

Date: ${CURRENT_DATE} (${DAY_OF_WEEK})
Mode: worker (daemon)

Awaiting task assignment.
EOF

else
    echo "[ERROR] Unknown mode: $MODE"
    echo "Valid modes: ea, jervais, worker"
    exit 1
fi
