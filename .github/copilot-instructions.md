## Copilot instructions for this repository

Follow these concise, actionable rules when editing or extending this codebase.

- **Big picture:** This workspace contains a small TypeScript CLI tool `mcp-health` (see `mcp-health/src`) plus a secondary package `packages/obsidian-para-sync`.
- **Primary flow:** `mcp-health` reads Claude CLI configuration (see `mcp-health/src/services/mcp-config-reader.ts`), runs external `claude` subprocesses (`mcp-health/src/services/health-checker.ts`), formats output (`mcp-health/src/formatters/*`), and optionally persists history (`mcp-health/src/services/history-storage.ts`). The CLI entry is `mcp-health/src/cli/mcp-health.ts`.

- **Build / run / test:**
  - Node requirement: `node >= 20.0.0` (see `mcp-health/package.json`).
  - To build: `cd mcp-health && npm install && npm run build` (compiles to `dist/`).
  - To run the CLI locally after build: `node dist/cli/mcp-health.js` or use `npm run start` from `mcp-health`.
  - Tests: `npm run test` (uses `vitest`, configuration in `mcp-health/vitest.config.ts`). Use `npm run test:watch` for iterative work.

- **Module style / imports:** This project uses ESM (`type: module` in `mcp-health/package.json`). Notice source files import internal modules with `.js` extensions (e.g. `import { checkHealth } from '../services/health-checker.js'`). Keep those `.js` specifiers in source files so compiled output resolves correctly. Do not change to bare imports without updating build outputs.

- **External integration caution:** `health-checker.ts` spawns the external `claude` binary. Unit tests and CI should NOT invoke the real `claude` CLI. Mock or stub `child_process.spawn` (or abstract the spawn behind a small wrapper) when writing tests. Look at existing tests under `mcp-health/src/*/*.test.ts` for examples.

- **Testing patterns:** Tests use `vitest` with `node` environment and include patterns `src/**/*.test.ts` and `tests/**/*.test.ts`. Prefer mocking filesystem and child-process interactions. Keep tests deterministic by avoiding time-sensitive integration with the real `claude` binary.

- **Project conventions:**
  - Small services are grouped under `mcp-health/src/services` (config reader, checker, history, notification).
  - Formatters live under `mcp-health/src/formatters` — follow the pattern of returning formatted `string` outputs for both `table` and `json` modes.
  - Error types are centralized in `mcp-health/src/errors` and custom error classes drive CLI behavior (see `HealthCheckError` and subclasses).

- **Where to make changes for common tasks:**
  - Add CLI flags or commands: modify `mcp-health/src/cli/mcp-health.ts` and update TypeScript types in `mcp-health/src/types`.
  - Add health checks / server parsing: modify `mcp-health/src/services/health-checker.ts` and `mcp-health/src/services/mcp-config-reader.ts`.
  - Persisting history: `mcp-health/src/services/history-storage.ts` — be mindful of default history path behavior.

- **Monorepo note:** The repository contains `packages/obsidian-para-sync` as a separate package. It is not wired into the `mcp-health` build; treat it as an independent package unless you were asked to centralize publishing or scripts.

- **Commit and delivery:** Keep changes minimal and focused. Run `npm run typecheck`, `npm run lint` (if relevant), then `npm run test` before proposing larger PRs.

If anything here is unclear or you'd like more details (examples of mocking `spawn`, test scaffold, or a sample PR checklist), tell me which area to expand and I will update this file.
