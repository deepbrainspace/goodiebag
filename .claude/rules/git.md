# Git Rules

## Git Safety Rules

- **ALWAYS ask explicit permission before any git checkout, git switch, or
  branch creation**
- Explain why branch switch is needed before requesting permission
- Wait for user confirmation before proceeding with branch operations
- **NEVER run git commands that modify history** (e.g. `git rebase`,
  `git reset`) without explicit user approval
- NEVER use the force flag without explicit user approval.

## Husky

- Husky handles formatting, commit validation, lockfile sync, and security
  checks automatically.
- DO NOT circumvent the husky hooks or run commands.

## Conventional Commits

- Use format: `type: description` or `type(scope): description` Types: feat,
  fix, chore, docms, test, refactor

## Commit Rules:

- When committing code, always include a clear message that describes the
  change.
- Use imperative mood: "Add feature" instead of "Added feature"
- Include scope if applicable: `feat(api): add user authentication`
- Branching: Use feature branches for new work, e.g.
  `feature/add-user-authentication`
- Use descriptive names: `feature/add-user-authentication`,
  `bugfix/fix-login-issue`
- dont add 'Co-Authored-By: Claude noreply@anthropic.com' to commits or PR
  messages.
- make separate commits for each affected package to ensure correct semantic
  versioning per package. eg:

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

## Merge Policy

**IMPORTANT**: When merging PRs, always use **regular merge** instead of squash
merge.

- ✅ **Use**: "Create a merge commit" option
- ❌ **NEVER use**: "Squash and merge" option

**Why Regular Merges?**

- **Preserves conventional commit history** for accurate semantic versioning
- **Enables per-package version detection** by NX release automation
- **Maintains granular audit trail** of individual changes
- **Prevents version detection issues** caused by collapsed commits
