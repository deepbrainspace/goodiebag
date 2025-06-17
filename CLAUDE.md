# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the **DeepBrain NX Plugins** monorepo containing NX plugins for DeepBrain projects. The primary plugin is `@deepbrainspace/nx-surrealdb` which provides comprehensive SurrealDB migration management with modular architecture support.

## Key Commands

### Build & Test
- **Build all packages**: `pnpm build` or `nx run-many --target=build --all`
- **Build specific plugin**: `nx build nx-surrealdb`
- **Run all tests**: `pnpm test` or `nx run-many --target=test --all`
- **Run single test**: `nx run nx-surrealdb:test --testFile=src/lib/client.spec.ts`
- **Lint all**: `pnpm lint` or `nx run-many --target=lint --all`

### Publishing
- **Publish all packages**: `pnpm publish:all`
- **Manual publish**: Navigate to `packages/nx-surrealdb` and run `npm publish`

## Architecture & Code Organization

### NX SurrealDB Plugin Architecture

The plugin follows a **Repository Pattern** with clean separation of concerns:

```
packages/nx-surrealdb/src/lib/
├── infrastructure/          # Database connectivity, utilities
│   ├── client.ts           # SurrealDB client wrapper
│   ├── debug.ts            # Debugging utilities
│   ├── env.ts              # Environment variable handling
│   └── project.ts          # NX project integration
├── configuration/          # Configuration management
│   ├── config-loader.ts    # Module config loading
│   └── types.ts           # Type definitions
├── filesystem/            # File system operations
│   ├── migration-file-processor.ts  # Migration file handling
│   └── tree-utils.ts                # NX Tree utilities
└── domain/               # Core business logic
    ├── dependency-resolver.ts       # Module dependency management
    ├── migration-repository.ts      # Data access layer
    ├── migration-service.ts         # Business logic orchestration
    └── module-lock-manager.ts       # Module lock protection
```

### Critical Development Rules

1. **Repository Pattern Enforcement**:
   - `MigrationService` should NEVER directly access `client` for migration data operations
   - Always use `MigrationRepository` methods for database operations
   - Keep business logic in Service layer, data operations in Repository layer

2. **Layer Communication**:
   - Domain → Repository → Database (never bypass)
   - Repository should NOT call Service methods
   - Infrastructure can be used by any layer

3. **Build Process**:
   - NEVER edit files in `dist/` folders manually
   - Always rebuild after changes: `nx build nx-surrealdb`
   - Schema files are automatically copied during build

## Important Architecture Details

### NX Plugin Structure
- **Executors**: Located in `src/executors/` - implement the actual commands (migrate, rollback, status)
- **Generators**: Located in `src/generators/` - create new migrations and modules
- **Schema Files**: JSON schemas define the options for executors and generators

### Key Business Logic Components

1. **MigrationRepository** (Data Access Layer):
   - Handles all database operations
   - CRUD operations on `system_migrations` table
   - No business logic, only data operations

2. **MigrationService** (Business Logic Layer):
   - Orchestrates migration workflows
   - Implements business rules
   - Coordinates between repository, resolver, and file processor

3. **DependencyResolver**:
   - Manages module dependencies
   - Performs topological sorting
   - Validates rollback safety

4. **ModuleLockManager**:
   - Handles module lock protection
   - Prevents accidental rollbacks of critical modules

## Environment Setup

The repository requires:
- **Node.js**: 18+ or 20+
- **pnpm**: 9.0.0+
- **NX Cloud Token**: Replace `your-nx-cloud-token-here` in `nx.json`
- **NPM Token**: Required for CircleCI publishing

## CI/CD Integration

- **GitHub Actions**: Primary CI/CD pipeline (`.github/workflows/`)
- **NX Cloud**: Distributed caching and execution
- **Publishing**: Automatic on merge to main (semantic versioning)

## Pull Request Format

When creating PRs for this repository, use the following structured format. This enables our automated CI/CD to properly version and release multiple packages.

### PR Title Format
Use conventional commit format: `type: description`
- `feat:` for new features (triggers minor version bump)
- `fix:` for bug fixes (triggers patch version bump)
- `chore:` for maintenance tasks (triggers patch version bump)
- `docs:` for documentation (triggers patch version bump)
- `breaking:` or `feat!:` for breaking changes (triggers major version bump)

### PR Description Template
```markdown
## Summary
Brief description of what this PR accomplishes.

## Packages
### @deepbrainspace/package-name
- feat: description of new feature
- fix: description of bug fix
- chore: description of maintenance task

### @deepbrainspace/another-package
- feat: another feature description
- docs: documentation update

## Breaking Changes
None
OR
- Description of breaking change
- Migration instructions

## Testing
- Description of tests added/modified
- How to test the changes
```

### Example PR

**Title**: `feat: add migration rollback validation system`

**Description**:
```markdown
## Summary
This PR adds a new migration rollback validation system with dependency conflict detection to prevent data corruption during rollbacks.

## Packages
### @deepbrainspace/nx-surrealdb
- feat: add migration rollback validation
- feat: implement dependency conflict detection
- fix: resolve connection timeout in long migrations
- docs: update rollback documentation

### @deepbrainspace/mcp-server-surrealdb
- feat: add rollback support to MCP server
- chore: update dependencies to support rollback

## Breaking Changes
None

## Testing
- Added unit tests for rollback validation logic
- Added integration tests for dependency detection
- Manual testing: nx rollback nx-surrealdb --to=3
```

### Important Notes
1. **Package sections are parsed automatically** - use exact package names or folder names
2. **Each change must start with a type prefix** (feat:, fix:, chore:, etc.)
3. **Breaking changes affect ALL packages** - use sparingly
4. **The CI will generate semantic versions** based on the change types
5. **Release notes are auto-generated** from the PR description