# NX SurrealDB Migrations Plugin - Claude Development Guide

## Architecture Overview

This plugin follows a **Repository Pattern** with clean separation of concerns. 

**📖 See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete system design, component responsibilities, data flows, and architectural principles.**

## Key Development Rules for Claude

### **Repository Pattern Enforcement**
- **MigrationService** should NEVER directly access `client` for migration data operations
- **Always use MigrationRepository methods** for database operations
- **Keep business logic in Service layer**, data operations in Repository layer


## Build Commands

- Build package: `nx run nx-surrealdb:build`
- Run tests: `nx run nx-surrealdb:test`
- Run single test: `nx run nx-surrealdb:test --testFile=src/lib/client.spec.ts`

## Critical Reminders

- **NEVER edit contents in dist or compiled folder manually**
- Always rebuild the package after making changes
- Schema files are copied during build process