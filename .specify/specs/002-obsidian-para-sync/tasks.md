# Tasks: Obsidian PARA Sync

> **Spec**: [spec.md](./spec.md)
> **Plan**: [plan.md](./plan.md)
> **Status**: Not Started

## Task Breakdown

### Phase 1: Foundation
- [ ] **Task 1.1**: Initialize package structure
  - Files: `packages/obsidian-para-sync/package.json`, `tsconfig.json`
  - Estimate: S
  - Dependencies: None

- [ ] **Task 1.2**: Create type definitions
  - Files: `src/types/index.ts`
  - Estimate: S
  - Dependencies: Task 1.1

- [ ] **Task 1.3**: Create custom error classes
  - Files: `src/errors/sync-errors.ts`
  - Estimate: S
  - Dependencies: Task 1.2

- [ ] **Task 1.4**: Implement VaultService (MCP wrapper)
  - Files: `src/services/vault-service.ts`
  - Estimate: M
  - Dependencies: Task 1.3
  - Notes: Wrap create_note, update_note, search_vault, list_vault_files

- [ ] **Task 1.5**: Implement ParaManager
  - Files: `src/services/para-manager.ts`
  - Estimate: M
  - Dependencies: Task 1.4
  - Notes: PARA folder creation, path resolution, category helpers

- [ ] **Task 1.6**: Create `/para.capture` skill
  - Files: `.claude/skills/para-capture.md`
  - Estimate: S
  - Dependencies: Task 1.5

### Phase 2: Session Sync
- [ ] **Task 2.1**: Create session summary template
  - Files: `src/templates/session-summary.md`
  - Estimate: S
  - Dependencies: Phase 1

- [ ] **Task 2.2**: Create daily note template
  - Files: `src/templates/daily-note.md`
  - Estimate: S
  - Dependencies: Phase 1

- [ ] **Task 2.3**: Implement SessionSync service
  - Files: `src/services/session-sync.ts`
  - Estimate: L
  - Dependencies: Tasks 2.1, 2.2
  - Notes: Summary generation, frontmatter, daily note updates

- [ ] **Task 2.4**: Create `/para.sync` skill
  - Files: `.claude/skills/para-sync.md`
  - Estimate: M
  - Dependencies: Task 2.3

- [ ] **Task 2.5**: Create `/para.summary` skill
  - Files: `.claude/skills/para-summary.md`
  - Estimate: S
  - Dependencies: Task 2.3

### Phase 3: Context Retrieval
- [ ] **Task 3.1**: Implement ContextRetriever service
  - Files: `src/services/context-retriever.ts`
  - Estimate: M
  - Dependencies: Phase 1
  - Notes: Semantic search via Smart Connections, result ranking

- [ ] **Task 3.2**: Create `/para.search` skill
  - Files: `.claude/skills/para-search.md`
  - Estimate: M
  - Dependencies: Task 3.1

- [ ] **Task 3.3**: Add context injection hook
  - Files: `.claude/hooks/session-start.md`
  - Estimate: M
  - Dependencies: Task 3.1
  - Notes: Auto-query vault on session start

### Phase 4: ADRs & Templates
- [ ] **Task 4.1**: Create ADR template
  - Files: `src/templates/adr.md`
  - Estimate: S
  - Dependencies: Phase 1

- [ ] **Task 4.2**: Implement TemplateEngine service
  - Files: `src/services/template-engine.ts`
  - Estimate: M
  - Dependencies: Task 4.1
  - Notes: Variable substitution, Templater integration

- [ ] **Task 4.3**: Create `/para.adr` skill
  - Files: `.claude/skills/para-adr.md`
  - Estimate: M
  - Dependencies: Task 4.2

- [ ] **Task 4.4**: Create quick-capture template
  - Files: `src/templates/quick-capture.md`
  - Estimate: S
  - Dependencies: Phase 1

### Phase 5: Testing & Polish
- [ ] **Task 5.1**: Write VaultService tests
  - Files: `src/services/vault-service.test.ts`
  - Estimate: M
  - Dependencies: Task 1.4

- [ ] **Task 5.2**: Write ParaManager tests
  - Files: `src/services/para-manager.test.ts`
  - Estimate: M
  - Dependencies: Task 1.5

- [ ] **Task 5.3**: Write SessionSync tests
  - Files: `src/services/session-sync.test.ts`
  - Estimate: M
  - Dependencies: Task 2.3

- [ ] **Task 5.4**: Write ContextRetriever tests
  - Files: `src/services/context-retriever.test.ts`
  - Estimate: M
  - Dependencies: Task 3.1

- [ ] **Task 5.5**: Write TemplateEngine tests
  - Files: `src/services/template-engine.test.ts`
  - Estimate: S
  - Dependencies: Task 4.2

- [ ] **Task 5.6**: Create package entry point & exports
  - Files: `src/index.ts`
  - Estimate: S
  - Dependencies: Phases 1-4

- [ ] **Task 5.7**: Write README with setup instructions
  - Files: `packages/obsidian-para-sync/README.md`
  - Estimate: M
  - Dependencies: Task 5.6

### Phase 0: Prerequisites (Manual)
- [ ] **Task 0.1**: Install Obsidian (if not installed)
  - Manual step
  - Estimate: S

- [ ] **Task 0.2**: Install Local REST API plugin
  - Manual step in Obsidian
  - Estimate: S

- [ ] **Task 0.3**: Install MCP Tools plugin
  - Manual step in Obsidian
  - Estimate: S

- [ ] **Task 0.4**: Configure MCP Tools & get API key
  - Manual step
  - Estimate: S

- [ ] **Task 0.5**: Add obsidian MCP server to Claude config
  - Files: `~/.claude.json` or `.claude/settings.json`
  - Estimate: S

## Progress Tracker

| Phase | Tasks | Completed | Status |
|-------|-------|-----------|--------|
| Prerequisites | 5 | 0 | Not Started |
| Foundation | 6 | 0 | Not Started |
| Session Sync | 5 | 0 | Not Started |
| Context Retrieval | 3 | 0 | Not Started |
| ADRs & Templates | 4 | 0 | Not Started |
| Testing & Polish | 7 | 0 | Not Started |
| **Total** | **30** | **0** | **Not Started** |

## Blockers

| Blocker | Impact | Owner | Resolution |
|---------|--------|-------|------------|
| Obsidian not installed | High | User | Install Obsidian first |
| MCP Tools plugin missing | High | User | Install from Community Plugins |
| No API key configured | High | User | Get from Local REST API settings |

## Task Dependencies Graph

```
Phase 0 (Prerequisites)
    │
    ▼
Phase 1 (Foundation)
    ├── 1.1 → 1.2 → 1.3 → 1.4 → 1.5 → 1.6
    │
    ├────────────────┬────────────────┐
    ▼                ▼                ▼
Phase 2          Phase 3          Phase 4
(Session)        (Context)        (ADRs)
    │                │                │
    └────────────────┴────────────────┘
                     │
                     ▼
              Phase 5 (Testing)
```

## Notes

- Phase 0 must be completed manually before implementation
- Phases 2, 3, 4 can be worked on in parallel after Phase 1
- All code must comply with `.specify/memory/constitution.md`
- MCP calls should be mocked in tests
