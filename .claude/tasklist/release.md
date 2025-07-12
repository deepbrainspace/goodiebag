# Release Process ToDoList

Create the following ToDoList in a Plan then confirm with the user to create a
release.

## Branch Strategy

### 1. Create Release Branch

- [ ] **Check current branch**: `git branch --show-current`
- [ ] **Ensure on main**: `git checkout main && git pull origin main`
- [ ] **Create release branch**:
      `git checkout -b release/[package-name]-v[version]`

## Pre-Release Preparation

### 2. Code Quality Verification

- [ ] **Run linting**: `nx lint [package-name]`
- [ ] **Run tests**: `nx test [package-name]`
- [ ] **Build package**: `nx build [package-name]`
- [ ] **Verify all checks pass**: No failing tests or lint errors

### 3. Version Planning

- [ ] **Determine version type**:
  - `patch` for bug fixes (0.1.0 → 0.1.1)
  - `minor` for new features (0.1.0 → 0.2.0)
  - `major` for breaking changes (0.1.0 → 1.0.0)
- [ ] **Check current version**: Review `package.json` in the target package
- [ ] **Review commit history**: Use conventional commits to determine
      appropriate bump

## Release Execution

### 4. Generate Release

- [ ] **Run nx release**: `nx release --projects=[package-name] --skip-publish`
- [ ] **Review generated changes**:
  - Version bump in `package.json`
  - Updated `CHANGELOG.md`
  - Updated `pnpm-lock.yaml`

### 5. Commit Release Changes

- [ ] **Stage changes**: `git add .`
- [ ] **Commit release**:
      `git commit -m "feat([package-name]): release version [version]"`
- [ ] **Push branch**: `git push -u origin release/[package-name]-v[version]`

### 6. Create Pull Request

- [ ] **Create PR**:
      `gh pr create --title "feat([package-name]): release version [version]" --body "..."`
- [ ] **Monitor CI builds**: Wait for all checks to pass
- [ ] **Review PR**: Ensure all changes are correct

## Publishing

### 7. Publish to NPM

- [ ] **Build package**: `nx build [package-name]`
- [ ] **Publish from dist**:
      `cd dist/packages/[package-name] && pnpm publish --access=public --no-git-checks`
- [ ] **Verify publication**: Check on npmjs.com that new version is available

### 8. Git Tagging

- [ ] **Create git tag**: `git tag [package-name]@[version]`
- [ ] **Push tag**: `git push origin [package-name]@[version]`

## Post-Release Updates

### 9. Update Internal Dependencies

- [ ] **Update root package.json**: Update devDependency version to new release
- [ ] **Update lockfile**: `pnpm install`
- [ ] **Commit dependency update**:
      `git commit -m "chore: update [package-name] to v[version]"`

### 10. Merge and Cleanup

- [ ] **Merge PR**: After CI passes and review approval
- [ ] **Switch to main**: `git checkout main && git pull origin main`
- [ ] **Delete release branch**:
      `git branch -d release/[package-name]-v[version]`
- [ ] **Delete remote branch**:
      `git push origin --delete release/[package-name]-v[version]`

## Verification

### 11. Final Checks

- [ ] **Verify npm package**:
      `npm view @deepbrainspace/[package-name]@[version]`
- [ ] **Test installation**:
      `npm install @deepbrainspace/[package-name]@[version]`
- [ ] **Check GitHub release**: Verify tag and release notes on GitHub
- [ ] **Update documentation**: If needed, update README or docs

## Commands Quick Reference

```bash
# Pre-release
nx test [package-name]
nx lint [package-name]
nx build [package-name]

# Release
git checkout -b release/[package-name]-v[version]
nx release --projects=[package-name] --skip-publish
git add . && git commit -m "feat([package-name]): release version [version]"
git push -u origin release/[package-name]-v[version]

# Publish
nx build [package-name]
cd dist/packages/[package-name]
pnpm publish --access=public --no-git-checks

# Tagging
git tag [package-name]@[version]
git push origin [package-name]@[version]

# Dependencies
# Update root package.json version
pnpm install
git commit -m "chore: update [package-name] to v[version]"
```

## Notes

- **NEVER skip tests or lints** - All quality checks must pass
- **Follow conventional commits** - Use proper commit message format
- **Use regular merge** - Not squash merge to preserve commit history
- **Monitor CI builds** - Ensure all checks pass before proceeding
- **Respect branch protection** - Use feature branches, never commit directly to
  main
