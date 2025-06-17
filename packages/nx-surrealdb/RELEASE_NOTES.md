# Release Notes

## Release Candidate (Unreleased)

### 🐛 Bug Fixes
- fix: correct generator and executor paths in published package to use src/ instead of dist/src/
- fix: remove duplicate project.json template causing "project already exists" error in init generator
- fix: correct package.json main/types paths for published package
- fix: ensure schema files are copied to built package
- fix: change "depends" to "dependencies" in config.json template to match validation
- fix: add dependency labels to status command pending files display for clarity

### ✨ Features  
- feat: add helpful console output after init with next steps
- feat: add dependency checking in executors with helpful error messages
- feat: improve README template with troubleshooting and dependency installation guide
- feat: auto-add required dependencies to package.json during init

### 🔧 Maintenance
- chore: add install target to ensure dependencies are installed before build
- chore: include pnpm-lock.yaml in published package for reproducible builds

### ⚠️ Breaking Changes

## v0.1.0 - Initial Release

### ✨ Features
- feat: SurrealDB migration system with dependency resolution
- feat: Repository pattern architecture with clean separation
- feat: Module-based migration organization
- feat: Generators for init, migration, export-module, import-module
- feat: Executors for migrate, rollback, status, reset
- feat: Comprehensive configuration system
- feat: Transaction support and safety checks