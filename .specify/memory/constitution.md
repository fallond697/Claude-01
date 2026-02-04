# Constitution

> This document establishes non-negotiable principles for this project. AI agents must read and reference these principles before any planning or implementation.

## Tech Stack Constraints

- Runtime must be Node.js 20+ with ES modules
- TypeScript 5.0+ with strict mode enabled in tsconfig.json
- Package manager must be npm or pnpm; yarn is prohibited
- Dependencies must be explicitly versioned (no `*` or `latest` in package.json)

## Code Quality

### TypeScript Standards
- Strict TypeScript is mandatory; `any` type is forbidden except in type guards
- All functions must have explicit return types
- Prefer `interface` over `type` for object shapes
- Use `readonly` for properties that should not be mutated
- Discriminated unions preferred over type assertions

### Naming Conventions
- Files: kebab-case (e.g., `user-service.ts`)
- Classes/Interfaces/Types: PascalCase (e.g., `UserService`)
- Functions/Variables: camelCase (e.g., `getUserById`)
- Constants: SCREAMING_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)
- Boolean variables must use `is`, `has`, `can`, or `should` prefix

### Code Structure
- Maximum function length: 50 lines
- Maximum file length: 300 lines
- Maximum cyclomatic complexity: 10
- Single responsibility principle must be followed
- Avoid deep nesting (max 3 levels)
- Early returns preferred over nested conditionals

### Documentation
- Public APIs must have JSDoc comments with `@param` and `@returns`
- Complex business logic must include inline comments explaining "why"
- README.md required for each major module/package

### Error Handling
- Use custom error classes extending `Error` with meaningful names
- Never swallow errors silently; always log or rethrow
- Async functions must have proper try/catch or `.catch()` handlers
- Error messages must be actionable and include context

### Imports & Exports
- Use named exports; default exports are discouraged
- Group imports: external packages, then internal modules, then types
- Absolute imports preferred over deep relative paths (`../../../`)

## Testing Requirements

### Coverage Standards
- Minimum 80% line coverage for business logic (`src/services/`)
- 100% coverage for error handling paths
- All public APIs must have corresponding tests

### Testing Frameworks
- Use Vitest for unit and integration tests
- Test files must be colocated with source (`*.test.ts`)
- Use `describe`/`it` structure with clear test names

### Testing Patterns
- Prefer unit tests over integration tests where possible
- Mock external dependencies (file system, network, child processes)
- Each test must be independent and idempotent
- Use factories or fixtures for test data, not inline objects
- Async tests must use `async`/`await`, not callbacks

## Security Standards

### Secrets Management
- Never hardcode API keys, tokens, or credentials in source code
- Use environment variables for all secrets
- Never log secrets, even in debug mode
- Config files containing secrets must be in `.gitignore`

### Input Validation
- Validate all external input at system boundaries
- Use schema validation (Zod, Joi) for API inputs
- Sanitize user input before database queries
- Never trust client-side validation alone

### Authentication & Authorization
- Use secure HTTP-only cookies for session tokens
- Implement proper CSRF protection on state-changing endpoints
- Follow principle of least privilege for permissions
- Log authentication failures for monitoring

### Dependency Security
- Run `npm audit` before merging PRs
- No dependencies with known critical vulnerabilities
- Pin exact versions for production dependencies
- Review dependency updates before upgrading

## Performance Requirements

### Response Times
- API endpoints must respond within 200ms (p95)
- CLI commands must complete within 5 seconds
- Background operations must not block the main thread

### Resource Efficiency
- Avoid loading entire files into memory for large data
- Use streams for file operations over 1MB
- Implement pagination for list endpoints (max 100 items)
- Cache expensive computations when inputs are stable

### Bundle & Startup
- Keep dependencies minimal; audit unused packages
- Prefer native Node.js APIs over polyfills
- Lazy-load optional features and heavy dependencies

## Prohibited Patterns

- `eval()` or `Function()` constructor
- `console.log` in production code (use proper logging)
- Synchronous file system operations in async contexts
- Circular dependencies between modules
- Magic numbers without named constants
- Commented-out code in commits
- Storing secrets in version control
- Unbounded loops or recursion without safeguards
- Catching errors without handling or rethrowing

## AI Agent Tool Rules

### Email & Communication (Outlook, Teams)
- NEVER send emails or messages automatically
- ALWAYS create drafts for human review before sending
- Include AI disclosure statement in all draft communications
- Never access contacts or distribution lists without explicit instruction
- Do not read emails unless specifically requested by the user

### Calendar Operations
- NEVER create or modify calendar events without explicit confirmation
- Always show proposed changes before executing
- Include clear meeting descriptions and agendas

### Document Operations (SharePoint, OneDrive)
- Read-only access to controlled (Level 3) documents by default
- Never modify, delete, or move organizational documents
- Log access to sensitive documents for audit purposes
- Respect document classification and retention labels

### Knowledge Capture
- Use `/capture` for session insights destined for explicit memory
- Use `/promote` to elevate learnings to permanent Obsidian resources
- Tag all captured knowledge with source and confidence level
- Follow PARA methodology for Obsidian organization
