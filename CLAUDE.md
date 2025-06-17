# CLAUDE.md

## Repository Overview
DeepBrain NX Plugins monorepo. Primary plugin: `@deepbrainspace/nx-surrealdb` for SurrealDB migration management.

## Key Commands
- **Build**: `nx build nx-surrealdb`
- **Test**: `nx test nx-surrealdb` 
- **Lint**: `nx lint nx-surrealdb`
- **Check affected**: `nx show projects --affected --with-target=publish`

## Release Process
1. **CI**: Every PR runs lint/test/build
2. **Prepare**: Comment `prepare_release` on PR 
3. **Release**: Merge to main auto-publishes packages

## Architecture Rules
**Repository Pattern**: MigrationService → MigrationRepository → Database
- NEVER bypass repository layer
- Keep business logic in Service, data operations in Repository
- Always rebuild after changes: `nx build nx-surrealdb`

## CRITICAL: Release Notes Management
**MANDATORY**: Update RELEASE_NOTES.md Release Candidate section after every code change.

### Required Format:
```markdown
## Release Candidate (Unreleased)

### 🐛 Bug Fixes
- fix: description

### ✨ Features  
- feat: description

### 🔧 Maintenance
- chore: description

### ⚠️ Breaking Changes
- break: description
```

### Rules:
1. Update Release Candidate section with every commit
2. Use conventional prefixes: feat:, fix:, chore:, docs:, break:
3. Prepare workflow reads these to determine semantic versions
4. Never modify released versions

### Example:
```bash
1. Fix bug in nx-surrealdb
2. MUST update packages/nx-surrealdb/RELEASE_NOTES.md
3. Add: "- fix: resolve connection timeout"
4. Commit both code AND release notes
```