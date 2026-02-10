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
cat << 'EOF'
[EA SESSION START]

## Step 0: LOAD CONTEXT (2 parallel calls)

Call these in parallel:
1. mcp__outlook__get_calendar_today()
2. mcp__neo4j__read-cypher(query: "MATCH (n {name: 'EA Bootstrap Identity'}) RETURN n LIMIT 1")

**Evaluate:**

| Service | Success Indicator | Critical? |
|---------|-------------------|-----------|
| outlook | Returns calendar (empty OK, error = fail) | YES |
| neo4j | Returns node or empty result | NO |

**On critical failure:** State the failure, provide fix hint, STOP.
- outlook: "Check ~/.haute/tokens/ auth status"

EOF

cat << EOF
## Step 1: TEXT Greeting with Summary

Say: "Hey Dan, EA here."

Then immediately provide:
- Date: ${CURRENT_DATE} (${DAY_OF_WEEK})
- Meeting count and brief overview (from calendar loaded in Step 0)
- Note any degraded services

## Step 2: Ready

Ask if there's anything specific to work on, or offer to review calendar/tasks.

CRITICAL: 2-call bootstrap -> greeting -> ready. No extra calls.
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
