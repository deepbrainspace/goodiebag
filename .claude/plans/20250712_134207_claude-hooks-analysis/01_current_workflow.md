# Current Git Workflow Documentation

## Nayeem's Established Development Workflow

### 1. Branch Creation Pattern

**Safety-First Approach**: Always asks explicit permission before branch
operations

```bash
# Permission request pattern
"Can I create a new branch called feat/feature-name?"

# Standard branch creation
git checkout main
git pull origin main
git checkout -b feat/feature-name
```

**Branch Naming Conventions**:

- `feat/feature-name` - New features
- `fix/issue-description` - Bug fixes
- `chore/task-description` - Maintenance tasks
- `docs/topic-name` - Documentation updates

### 2. Development and Testing Cycle

```bash
# Use affected commands for efficiency
nx affected --target=test
nx affected --target=lint
nx affected --target=build

# Development iteration
# Make changes → Test affected → Commit
```

### 3. Commit Strategy (Critical for Monorepo)

**Rule**: Separate commits per affected package for proper semantic versioning

**✅ Correct Approach**:

```bash
# Package 1 changes
git add packages/package-name/
git commit -m "feat(package-name): description"

# Package 2 changes
git add packages/other-package/
git commit -m "fix(other-package): description"

# Infrastructure changes
git add .github/ nx.json
git commit -m "chore: update CI workflow"
```

**❌ Wrong Approach**:

```bash
# Mixed package changes - breaks semantic versioning
git add packages/pkg1/ packages/pkg2/ .github/
git commit -m "feat: update multiple packages"
```

### 4. PR Creation Process

**Title Format**: Conventional commit style

- `feat(scope): description`
- `fix(scope): description`

**Description Template** (via HEREDOC):

```bash
gh pr create --title "feat(package-name): feature description" --body "$(cat <<'EOF'
## Summary
Brief description of the feature and its purpose.

## Changes
- List of major changes
- New functionality added
- Any breaking changes

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] E2E tests updated if needed

## Documentation
- [ ] README updated if needed
- [ ] API documentation updated
- [ ] Changelog entry added
- [ ] Migration guide created (if breaking)

## Checklist
- [ ] All tests pass
- [ ] Linting passes
- [ ] Build succeeds
- [ ] No breaking changes (or properly documented)
- [ ] Backward compatibility maintained
EOF
)"
```

### 5. CI Monitoring (Mandatory)

**Critical Rule**: Always monitor CI until completion

```bash
# Initial status check
gh pr view [PR_NUMBER] --json statusCheckRollup

# Active monitoring loop (used in every PR)
while true; do
  STATUS=$(gh pr view [PR_NUMBER] --json statusCheckRollup | jq -r '.statusCheckRollup[] | "\(.name): \(.status) - \(.conclusion)"' | grep -E "(QUEUED|IN_PROGRESS|PENDING)")
  if [ -z "$STATUS" ]; then
    echo "All checks completed!"
    gh pr view [PR_NUMBER] --json statusCheckRollup | jq -r '.statusCheckRollup[] | "\(.name): \(.status) - \(.conclusion)"'
    break
  else
    echo "Still running: $STATUS"
    sleep 30
  fi
done
```

### 6. Merge Strategy

**Always Use Regular Merge** (never squash)

**Command**: `gh pr merge --merge`

**Why Regular Merges Are Critical**:

- Preserves conventional commit history for semantic versioning
- Enables per-package version detection by NX release automation
- Maintains granular audit trail of individual changes
- Prevents version detection issues from collapsed commits

### 7. Post-Merge Cleanup

**Mandatory Steps After Every Merge**:

```bash
# 1. Switch to main branch
git checkout main

# 2. Pull latest changes (includes the merge)
git pull origin main

# 3. Verify merge success
git log --oneline -10
```

**Starting New Work**:

- Always start from updated main
- Create new branch from main
- Never reuse old feature branches

### 8. Key Safety Rules

1. **Never bypass safety mechanisms** (no HUSKY=0, --force, etc.)
2. **Explicit permission for branch operations**
3. **Separate commits per package**
4. **Complete CI monitoring before merge**
5. **Regular merge only, never squash**
6. **Post-merge main branch synchronization**

### 9. Conventional Commits Impact

**Version Bumping**:

- `fix:` → patch version bump (0.1.0 → 0.1.1)
- `feat:` → minor version bump (0.1.0 → 0.2.0)
- `feat!:` or `BREAKING CHANGE:` → major version bump (0.1.0 → 1.0.0)
- `chore:`, `docs:`, `style:` → no version bump

**Scope Guidelines**:

- Use package names: `feat(nx-surrealdb):`, `fix(claude-config):`
- Infrastructure changes: `chore:` (no scope)

This workflow ensures proper semantic versioning per package, maintains code
quality through automation, and provides complete audit trails for monorepo
management.
