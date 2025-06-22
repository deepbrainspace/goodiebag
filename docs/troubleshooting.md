# Troubleshooting Guide

## Release Workflow Issues

### GitHub Actions Permission Errors

#### Issue: "GitHub Actions is not permitted to create or approve pull requests"

**Error Message:**
```
pull request create failed: GraphQL: GitHub Actions is not permitted to create or approve pull requests (createPullRequest)
```

**Root Cause:**
GitHub has security settings that prevent the default `GITHUB_TOKEN` from creating pull requests.

**Solutions:**

1. **Organization Level** (Admin Required):
   - Go to Organization Settings → Actions → General → Workflow permissions
   - Enable "Allow GitHub Actions to create and approve pull requests"

2. **Repository Level**:
   - Go to Repository Settings → Actions → General → Workflow permissions 
   - Enable "Allow GitHub Actions to create and approve pull requests"
   - Set permissions to "Read and write permissions"

3. **Use Personal Access Token (Recommended)**:
   ```yaml
   - name: Create Pull Request
     uses: peter-evans/create-pull-request@v7
     with:
       token: ${{ secrets.GH_PAT }}  # Use PAT instead of GITHUB_TOKEN
   ```

4. **Add Explicit Permissions**:
   ```yaml
   permissions:
     contents: write
     pull-requests: write
   ```

### NX Release + Squash Merge Issues

#### Issue: "No changes were detected using git history and the conventional commits standard"

**Root Cause:**
NX Release has a known bug (GitHub issue #26241) where squash merges break conventional commit parsing. GitHub uses `----` separator in squash commits, which conflicts with NX's parser.

**Symptoms:**
- NX detects version bump correctly (e.g., 0.0.0 → 0.1.0)
- But shows "No changes detected for changelogs"
- Changelog generation fails despite having valid conventional commits

**Solutions:**

1. **Use Regular Merges** (Recommended):
   - Avoid "Squash and merge" option in GitHub
   - Use "Create a merge commit" option instead
   - This preserves individual conventional commit history

2. **Repository Policy**:
   - Disable squash merges at repository/organization level
   - Enforce regular merges only

3. **Alternative: Use `--from` and `--to` flags**:
   ```bash
   nx release --from=HEAD~1 --to=HEAD --skip-publish
   ```

### Pre-commit Hook Failures

#### Issue: "husky - pre-commit script failed (code 1)" with no error message

**Root Cause:**
Shell commands in hooks failing without proper error handling or output.

**Common Causes:**

1. **Empty Commits**:
   - Trying to commit with no staged files
   - Solution: Add files first or use `--allow-empty`

2. **Unstaged Changes**:
   - Modified files not added to staging area
   - Solution: Run `git add <files>` before commit

3. **Formatter Issues**:
   - NX formatter modifying files during pre-commit
   - Especially `tsconfig.base.json` (known NX bug #10937)

**Debugging:**
```bash
# Run pre-commit hook manually to see actual error
.husky/pre-commit

# Check git status
git status --porcelain

# Check for unstaged changes
git diff --name-only
```

### NX Formatter Issues

#### Issue: tsconfig.base.json constantly reformatted

**Root Cause:**
Known NX bug where `nx format:write` gets stuck in formatting loop with `tsconfig.base.json`.

**Solution:**
Add to `.prettierignore`:
```
# Known NX formatting bug - exclude tsconfig.base.json
# See: https://github.com/nrwl/nx/issues/10937
tsconfig.base.json
```

## Lockfile Sync Issues

#### Issue: "Lockfile out of sync" messages during push

**Root Cause:**
Pre-push hook checking lockfile sync with `pnpm install --frozen-lockfile` but finding discrepancies.

**Solutions:**

1. **Run lockfile sync**:
   ```bash
   pnpm install
   git add pnpm-lock.yaml
   git commit -m "fix: sync lockfile"
   ```

2. **Check hook configuration**:
   - Ensure pre-push hook handles exit codes properly
   - Add `|| true` to commands that may legitimately fail

## Best Practices

### Workflow Permissions
```yaml
permissions:
  contents: write
  pull-requests: write
```

### Git Merge Policy
- ✅ **Use**: "Create a merge commit" option
- ❌ **NEVER use**: "Squash and merge" option
- **Reason**: Preserves conventional commit history for NX Release

### Token Management
- Use Personal Access Token (PAT) for workflow actions
- Store in repository secrets as `GH_PAT`
- Grant minimal required permissions (contents:write, pull-requests:write)

### Error Handling in Hooks
```bash
# Good: Handle exit codes properly
RESULT=$(some_command 2>/dev/null || true)

# Bad: Let command fail silently
RESULT=$(some_command)
```

### Debugging Hooks
Add debug output to understand what's happening:
```bash
echo "🔍 Starting step..."
# do work
echo "✅ Step completed successfully"
```

## References

- [NX Squash Merge Issue #26241](https://github.com/nrwl/nx/issues/26241)
- [NX tsconfig.base.json formatting issue #10937](https://github.com/nrwl/nx/issues/10937)
- [GitHub Actions PR Creation Permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)
- [peter-evans/create-pull-request](https://github.com/peter-evans/create-pull-request)