#!/bin/bash
# Create a new feature specification from templates
# Usage: ./new-spec.sh <feature-number> <feature-name>
# Example: ./new-spec.sh 002 user-authentication

set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: ./new-spec.sh <feature-number> <feature-name>"
    echo "Example: ./new-spec.sh 002 user-authentication"
    exit 1
fi

FEATURE_NUM=$1
FEATURE_NAME=$2
SPEC_DIR=".specify/specs/${FEATURE_NUM}-${FEATURE_NAME}"
TEMPLATE_DIR=".specify/templates"
DATE=$(date +%Y-%m-%d)
AUTHOR=$(git config user.name 2>/dev/null || echo "Author")

# Create spec directory
mkdir -p "$SPEC_DIR"

# Copy and customize templates
for template in spec plan tasks; do
    if [ -f "$TEMPLATE_DIR/${template}-template.md" ]; then
        sed -e "s/{{FEATURE_NAME}}/${FEATURE_NAME}/g" \
            -e "s/{{AUTHOR}}/${AUTHOR}/g" \
            -e "s/{{DATE}}/${DATE}/g" \
            "$TEMPLATE_DIR/${template}-template.md" > "$SPEC_DIR/${template}.md"
        echo "Created: $SPEC_DIR/${template}.md"
    fi
done

echo ""
echo "Specification created at: $SPEC_DIR/"
echo "Next steps:"
echo "  1. Edit $SPEC_DIR/spec.md to define the feature"
echo "  2. Edit $SPEC_DIR/plan.md to design the implementation"
echo "  3. Edit $SPEC_DIR/tasks.md to break down the work"
