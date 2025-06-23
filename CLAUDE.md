# CLAUDE.md

# conversations
- stop saying the user is right about everything . always analyze independently and then say what you think is right. three is no issue if your analysis is different from the user's. always explain your reasoning.

## Git Safety Rules
- **ALWAYS ask explicit permission before any git checkout, git switch, or branch creation**
- Explain why branch switch is needed before requesting permission
- Wait for user confirmation before proceeding with branch operations

## Environment

- we are running on WSL, so avoid trying to open GUI browsers. Use headless
  browsers for any browsing needs.

## Git Strategy

- dont add 'Co-Authored-By: Claude noreply@anthropic.com' to commits or PR
  messages.

## Automated Workflow

Husky handles formatting, commit validation, lockfile sync, and security checks automatically.

## Package Manager Preference

**IMPORTANT**: Always use NX commands first, then pnpm. NEVER use npm.

- ✅ `nx build`, `nx test`, `nx lint`, `nx release`
- ✅ `pnpm install`
- ❌ `npm install`, `npm publish` (NEVER use)

## NX Command Preference

**PREFER AFFECTED OPERATIONS**: Use `nx affected` for efficiency in CI/CD and
development.

- ✅ `nx affected --target=build` (only builds changed packages)
- ✅ `nx affected --target=test` (only tests affected packages)
- ✅ `nx affected --target=lint` (only lints changed code)
- ⚠️ `nx run-many --target=build --all` (builds everything, slower)
- ❌ Individual package commands (defeats monorepo benefits)

## Critical Rule: NEVER Skip Tests or Lints

**MANDATORY**: All tests and lints MUST pass before any publish or release.

- ❌ NEVER skip tests or lints
- ❌ NEVER publish with failing tests
- ✅ Always fix the root cause of test/lint failures

## TypeScript Code Quality Rules

**MANDATORY**: Always use proper TypeScript typing to avoid runtime errors.

- ❌ NEVER use `any` type (causes type system bypass and runtime errors)
- ✅ Use specific types: `string`, `number`, `object`, `unknown`, etc.
- ✅ Use `Parameters<typeof func>[0]` pattern for library parameter types
- ✅ Use `as const` for literal types instead of `as any`
- ✅ Use proper type assertions: `value as SpecificType` not `value as any`

## Release Process

GitHub Actions workflow: PR merge → prepare release → merge release PR → publish.

### Automatic Release Features:

- ✅ **Version Determination**: Automatic based on conventional commits
  - `fix:` → patch (0.1.0 → 0.1.1)
  - `feat:` → minor (0.1.0 → 0.2.0)
  - `BREAKING CHANGE:` → major (0.1.0 → 1.0.0)
- ✅ **Changelog**: Auto-generated from commits since last tag
- ✅ **Git Operations**: Auto-commit, tag, and push
- ✅ **Publishing**: Auto-publish to npm with proper dependencies
- ✅ **GitHub Releases**: Auto-created with changelog

## Git Strategy - Merge Policy

**IMPORTANT**: When merging PRs, always use **regular merge** instead of squash merge.

- ✅ **Use**: "Create a merge commit" option  
- ❌ **NEVER use**: "Squash and merge" option

**Why Regular Merges?**
- **Preserves conventional commit history** for accurate semantic versioning
- **Enables per-package version detection** by NX release automation  
- **Maintains granular audit trail** of individual changes
- **Prevents version detection issues** caused by collapsed commits

## Architecture Rules

**Repository Pattern**: MigrationService → MigrationRepository → Database

- NEVER bypass repository layer
- Keep business logic in Service, data operations in Repository
- Always rebuild after changes: `nx build nx-surrealdb`

**Rust Workspace Rules**:

- ⚠️ **NEVER run cargo commands from repository root** (creates root target/
  folder)
- ✅ Always use NX commands: `nx build claude-code`, `nx test claude-code`
- ✅ If using cargo directly, always `cd packages/claude-code-toolkit` first
- Keep build artifacts in package directories only

## Conventional Commits

Use format: `type: description` or `type(scope): description`
Types: feat, fix, chore, docs, test, refactor

## Project-Specific Commit Strategy

**CRITICAL**: In monorepos, make separate commits for each affected package to
ensure correct semantic versioning per package.

### ✅ Correct Approach - Separate Commits per Package:

```bash
# Commit 1: nx-rust changes (minor release justified)
git add packages/nx-rust/
git commit -m "feat(nx-rust): upgrade for Nx 21 compatibility and enhance README"

# Commit 2: nx-surrealdb changes (patch release appropriate)
git add packages/nx-surrealdb/
git commit -m "fix(nx-surrealdb): correct release command template in project.json"

# Commit 3: Global changes (no package release)
git add .github/ nx.json
git commit -m "chore: update CI workflow and nx parallel settings"
```

### ❌ Wrong Approach - Mixed Package Changes:

```bash
# BAD: This causes incorrect version bumps across all packages
git add packages/nx-rust/ packages/nx-surrealdb/ .github/ nx.json
git commit -m "feat: enhance release workflow and prepare nx-rust v3.0.0"
# Results in: nx-rust gets minor bump (correct) + nx-surrealdb gets minor bump (incorrect!)
```

### Scope Guidelines:

- **Use package names as scopes**: `feat(nx-rust):`, `fix(nx-surrealdb):`,
  `chore(claude-code):`
- **Separate infrastructure changes**: Use `chore:` for CI/CD, root config files
- **Match commit type to actual change significance**:
  - Configuration fixes → `fix:`
  - New features → `feat:`
  - Build/tooling updates → `chore:`
