---
title: "{{date}}"
created: "{{created}}"
modified: "{{modified}}"
category: inbox
tags:
  - daily-note
---

# {{date}}

## Sessions Today

{{#if sessions.length}}
{{#each sessions}}
- {{time}} - [[{{path}}|{{title}}]] ({{project}})
{{/each}}
{{else}}
_No sessions logged today._
{{/if}}

## Quick Captures

{{#if captures.length}}
{{#each captures}}
- [[{{this}}]]
{{/each}}
{{else}}
_No quick captures today._
{{/if}}

## Notes

{{notes}}

---

_Last updated: {{updatedAt}}_
