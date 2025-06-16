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

- **CircleCI**: Primary CI/CD pipeline (`.circleci/config.yml`)
- **NX Cloud**: Distributed caching and execution
- **Publishing**: Triggered by git tags (e.g., `v1.0.0`)