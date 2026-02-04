# Implementation Plan: {{FEATURE_NAME}}

> **Spec**: [spec.md](./spec.md)
> **Status**: Draft | In Review | Approved
> **Author**: {{AUTHOR}}
> **Date**: {{DATE}}

## Constitutional Compliance

This plan adheres to the following constitutional principles:
- {{Reference specific clauses from .specify/memory/constitution.md}}

## Technical Approach

### Overview
{{High-level description of the implementation approach}}

### Architecture Decision Records (ADRs)

#### ADR-1: {{Decision Title}}
- **Context**: {{Why this decision is needed}}
- **Decision**: {{What was decided}}
- **Consequences**: {{Trade-offs and implications}}

## Components

### New Components
| Component | Purpose | Location |
|-----------|---------|----------|
| {{Name}} | {{Purpose}} | `{{path}}` |

### Modified Components
| Component | Changes | Reason |
|-----------|---------|--------|
| {{Name}} | {{What changes}} | {{Why}} |

## Data Model

```typescript
// {{Description of data structures}}
interface {{Name}} {
  {{properties}}
}
```

## API Design

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| {{METHOD}} | `{{/path}}` | {{Description}} |

### Request/Response Examples
```json
// Request
{{request example}}

// Response
{{response example}}
```

## Dependencies

### External Packages
| Package | Version | Purpose |
|---------|---------|---------|
| {{name}} | {{version}} | {{why needed}} |

### Internal Dependencies
- {{Other modules or features this depends on}}

## Testing Strategy

### Unit Tests
- {{What will be unit tested}}

### Integration Tests
- {{What will be integration tested}}

### E2E Tests
- {{Critical user flows to test}}

## Rollout Plan

1. **Phase 1**: {{Description}}
2. **Phase 2**: {{Description}}

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| {{Risk}} | High/Med/Low | High/Med/Low | {{How to mitigate}} |

## Success Metrics

- {{How will we measure success?}}
