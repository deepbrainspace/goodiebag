# CLAUDE.md

## Repository Overview
DeepBrain NX Plugins monorepo. Primary plugin: `@deepbrainspace/nx-surrealdb` for SurrealDB migration management.

## Key Commands
- **Build**: `nx build nx-surrealdb`
- **Test**: `nx test nx-surrealdb` 
- **Lint**: `nx lint nx-surrealdb`
- **Release**: `nx release` or `nx release --dry-run`

## Package Manager Preference
**IMPORTANT**: Always use NX commands first, then pnpm. NEVER use npm.
- ✅ `nx build`, `nx test`, `nx lint`, `nx release`
- ✅ `pnpm install`
- ❌ `npm install`, `npm publish` (NEVER use)

## Critical Rule: NEVER Skip Tests or Lints
**MANDATORY**: All tests and lints MUST pass before any publish or release.
- ❌ NEVER skip tests or lints
- ❌ NEVER publish with failing tests
- ✅ Always fix the root cause of test/lint failures

## Release Process
**Manual Release (Primary)**:
1. **Development**: Make changes with conventional commits (feat:, fix:, chore:, etc.)
2. **CI**: Every PR runs lint/test/build validation
3. **Release**: Run manually when ready:
   ```bash
   git checkout main && git pull
   nx release --dry-run  # Preview what will happen
   nx release           # Execute release
   ```

**Optional CI Release**:
- Use GitHub Actions "Manual Release" workflow for CI-based releases
- Available in Actions tab with optional version override

### Automatic Release Features:
- ✅ **Version Determination**: Automatic based on conventional commits
  - `fix:` → patch (0.1.0 → 0.1.1)
  - `feat:` → minor (0.1.0 → 0.2.0)
  - `BREAKING CHANGE:` → major (0.1.0 → 1.0.0)
- ✅ **Changelog**: Auto-generated from commits since last tag
- ✅ **Git Operations**: Auto-commit, tag, and push
- ✅ **Publishing**: Auto-publish to npm with proper dependencies
- ✅ **GitHub Releases**: Auto-created with changelog

## Architecture Rules
**Repository Pattern**: MigrationService → MigrationRepository → Database
- NEVER bypass repository layer
- Keep business logic in Service, data operations in Repository
- Always rebuild after changes: `nx build nx-surrealdb`

**Rust Workspace Rules**:
- ⚠️ **NEVER run cargo commands from repository root** (creates root target/ folder)
- ✅ Always use NX commands: `nx build claude-code`, `nx test claude-code`
- ✅ If using cargo directly, always `cd packages/claude-code` first
- Keep build artifacts in package directories only

## Conventional Commits
**REQUIRED**: Use conventional commit format for automatic version determination:

```bash
# Patch release
git commit -m "fix: resolve connection timeout issue"

# Minor release  
git commit -m "feat: add new migration rollback functionality"

# Major release
git commit -m "feat!: redesign migration API

BREAKING CHANGE: Migration interface has changed"
```

### Commit Types:
- `fix:` → Bug fixes (patch release)
- `feat:` → New features (minor release)
- `chore:` → Maintenance (no release)
- `docs:` → Documentation (no release)
- `test:` → Tests (no release)
- `refactor:` → Code refactoring (no release)
- `BREAKING CHANGE:` → Major version bump