# Tasks: MCP Server Health Monitor

> **Spec**: [spec.md](./spec.md)
> **Plan**: [plan.md](./plan.md)
> **Status**: Complete

## Task Breakdown

### Phase 1: Project Setup
- [x] **Task 1.1**: Initialize TypeScript project
  - Files: `package.json`, `tsconfig.json`, `.eslintrc.json`
  - Estimate: S
  - Dependencies: None

- [x] **Task 1.2**: Create directory structure
  - Files: `src/cli/`, `src/services/`, `src/formatters/`, `src/types/`, `src/errors/`
  - Estimate: S
  - Dependencies: Task 1.1

- [x] **Task 1.3**: Install dependencies
  - Files: `package.json`, `package-lock.json`
  - Estimate: S
  - Dependencies: Task 1.1

### Phase 2: Core Types & Errors
- [x] **Task 2.1**: Define TypeScript interfaces
  - Files: `src/types/server-status.ts`
  - Estimate: S
  - Dependencies: Phase 1

- [x] **Task 2.2**: Create custom error classes
  - Files: `src/errors/health-check-error.ts`
  - Estimate: S
  - Dependencies: Task 2.1

### Phase 3: Core Implementation
- [x] **Task 3.1**: Implement MCP config reader
  - Files: `src/services/mcp-config-reader.ts`
  - Estimate: M
  - Dependencies: Phase 2
  - Notes: Parse ~/.claude.json and project configs

- [x] **Task 3.2**: Implement health checker service
  - Files: `src/services/health-checker.ts`
  - Estimate: M
  - Dependencies: Task 3.1
  - Notes: Parallel checks with Promise.allSettled()

- [x] **Task 3.3**: Implement table formatter
  - Files: `src/formatters/table-formatter.ts`
  - Estimate: M
  - Dependencies: Task 2.1
  - Notes: Support table, JSON, and plain text modes

- [x] **Task 3.4**: Create CLI entry point
  - Files: `src/cli/mcp-health.ts`
  - Estimate: M
  - Dependencies: Tasks 3.2, 3.3
  - Notes: Use commander for arg parsing

- [x] **Task 3.5**: Create package entry point
  - Files: `src/index.ts`
  - Estimate: S
  - Dependencies: Task 3.2

### Phase 4: Testing
- [x] **Task 4.1**: Write unit tests for config reader
  - Files: `src/services/mcp-config-reader.test.ts`
  - Estimate: M
  - Dependencies: Task 3.1

- [x] **Task 4.2**: Write unit tests for error classes
  - Files: `src/errors/health-check-error.test.ts`
  - Estimate: S
  - Dependencies: Task 2.2

- [x] **Task 4.3**: Write unit tests for formatter
  - Files: `src/formatters/table-formatter.test.ts`
  - Estimate: S
  - Dependencies: Task 3.3

### Phase 5: Documentation & Finalization
- [x] **Task 5.1**: Write README with usage examples
  - Files: `README.md`
  - Estimate: S
  - Dependencies: Phase 3

- [x] **Task 5.2**: Add npm scripts for build/test/lint
  - Files: `package.json`
  - Estimate: S
  - Dependencies: Phase 4

- [x] **Task 5.3**: Configure CLI binary in package.json
  - Files: `package.json`
  - Estimate: S
  - Dependencies: Task 3.4

## Progress Tracker

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| Setup | 3 | 3 | Complete |
| Types & Errors | 2 | 2 | Complete |
| Core | 5 | 5 | Complete |
| Testing | 3 | 3 | Complete |
| Docs | 3 | 3 | Complete |
| **Total** | **16** | **16** | **Complete** |

## Blockers

| Blocker | Impact | Owner | Resolution |
|---------|--------|-------|------------|
| None | - | - | - |

## Notes

- All code complies with `.specify/memory/constitution.md`
- Build passes with `npm run build`
- All 21 tests pass with `npm test`
- Package located at `mcp-health/`
