# Release Commands

Release management commands and workflows for this NX monorepo with automated
semantic versioning.

## Quick Release Commands

### Automated Release (Recommended)

```bash
# Create release PR (automated)
gh workflow run "Release Please"

# Manual release creation
nx run-many --target=version --all

# Publish packages after merge
nx run-many --target=publish --all
```

### Manual Release Process

```bash
# 1. Version packages
nx affected --target=version --base=main

# 2. Build packages
nx affected --target=build --base=main

# 3. Publish packages
nx affected --target=publish --base=main
```

## Release Workflow

### 1. Pre-Release Preparation

```bash
# Ensure all tests pass
nx affected --target=test --base=main

# Ensure all linting passes
nx affected --target=lint --base=main

# Build all affected packages
nx affected --target=build --base=main

# Check for unreleased changes
git log --oneline main..HEAD
```

### 2. Release Creation

```bash
# Create release branch
git checkout -b release/v$(date +%Y.%m.%d)

# Run version bump
nx run-many --target=version --all

# Review version changes
git diff --name-only | grep package.json

# Commit version changes
git add . && git commit -m "chore: bump package versions for release"
```

### 3. Release Publishing

```bash
# Build packages for publishing
nx run-many --target=build --all --configuration=production

# Dry run publish (test)
nx run-many --target=publish --all --dry-run

# Publish packages
nx run-many --target=publish --all
```

## Package-Specific Releases

### TypeScript Packages

```bash
# Version specific TypeScript package
nx version nx-surrealdb

# Build for npm publishing
nx build nx-surrealdb --configuration=production

# Publish to npm
nx publish nx-surrealdb
```

### Rust Packages

```bash
# Version Rust package
nx version claude-code-toolkit

# Build Rust package
nx build claude-code-toolkit --configuration=release

# Publish to crates.io
nx publish claude-code-toolkit
```

### Documentation Updates

```bash
# Update package documentation
nx run package-name:docs

# Update changelog
nx run package-name:changelog

# Generate API documentation
nx run package-name:api-docs
```

## Semantic Versioning

### Version Types

```bash
# Patch release (bug fixes)
# Triggered by: fix: commits
nx version package-name --release-as=patch

# Minor release (new features)
# Triggered by: feat: commits
nx version package-name --release-as=minor

# Major release (breaking changes)
# Triggered by: BREAKING CHANGE: in commit
nx version package-name --release-as=major
```

### Conventional Commits

```bash
# Patch version bump
git commit -m "fix(nx-surrealdb): resolve migration timeout issue"

# Minor version bump
git commit -m "feat(nx-surrealdb): add rollback migration support"

# Major version bump
git commit -m "feat(nx-surrealdb): redesign migration API

BREAKING CHANGE: Migration API now requires explicit transaction handling"
```

## Release Automation

### GitHub Actions Workflow

The repository uses automated release management:

1. **Release Please** creates release PRs automatically
2. **PR merge** triggers version bumping
3. **GitHub Actions** publishes packages to registries
4. **Changelog** generation happens automatically

### Manual Trigger

```bash
# Trigger release workflow manually
gh workflow run "Release Please"

# Check workflow status
gh run list --workflow="Release Please"

# View specific run
gh run view [run-id]
```

## Pre-Release Testing

### Release Candidate

```bash
# Create release candidate
nx version package-name --prerelease=rc

# Publish release candidate
nx publish package-name --tag=rc

# Test release candidate
npm install package-name@rc
```

### Beta Release

```bash
# Create beta release
nx version package-name --prerelease=beta

# Publish beta
nx publish package-name --tag=beta
```

## Release Verification

### Post-Release Checks

```bash
# Verify package was published
npm view package-name versions --json

# Check published package contents
npm pack package-name
tar -tzf package-name-*.tgz

# Verify release on GitHub
gh release list
```

### Integration Testing

```bash
# Test published package in clean environment
docker run -it node:18 bash
npm install package-name
node -e "console.log(require('package-name'))"
```

## Hotfix Releases

### Emergency Hotfix Process

```bash
# 1. Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-fix

# 2. Make minimal fix
# Edit files and commit with fix: prefix

# 3. Test fix
nx affected --target=test

# 4. Create emergency release
nx version package-name --release-as=patch

# 5. Publish immediately
nx build package-name --configuration=production
nx publish package-name

# 6. Create PR to merge back to main
gh pr create --title "hotfix: critical production fix"
```

## Release Notes

### Automatic Generation

Release notes are generated automatically from conventional commits:

- **Features** (feat:) → Added section
- **Bug Fixes** (fix:) → Fixed section
- **Breaking Changes** → Breaking Changes section
- **Performance** (perf:) → Performance section

### Manual Enhancements

```bash
# Edit release notes after generation
gh release edit v1.2.3

# Add additional context
# - Migration guides for breaking changes
# - Upgrade instructions
# - Known issues
```

## Rollback Procedures

### Package Rollback

```bash
# Unpublish problematic version (within 24h)
npm unpublish package-name@1.2.3

# Deprecate version (after 24h)
npm deprecate package-name@1.2.3 "Critical bug, use 1.2.2 instead"
```

### Git Rollback

```bash
# Revert release commit
git revert [release-commit-hash]

# Create hotfix with correct version
git checkout -b hotfix/rollback-v1.2.3
```

## Release Monitoring

### Package Health

```bash
# Check download stats
npm info package-name

# Monitor for issues
npm view package-name bugs

# Check dependency health
npm audit
```

### Release Metrics

```bash
# View release history
gh release list

# Check package usage
npm view package-name

# Monitor build status
gh run list
```

## Multi-Package Releases

### Coordinated Release

```bash
# Release all affected packages together
nx affected --target=version --base=main
nx affected --target=build --base=main
nx affected --target=publish --base=main
```

### Independent Releases

```bash
# Release packages independently
nx version nx-surrealdb
nx version nx-rust
nx version claude-config

# Publish separately
nx publish nx-surrealdb
nx publish nx-rust
nx publish claude-config
```

## Troubleshooting

### Common Release Issues

**Issue: Version bump fails**

```bash
# Solution: Check for uncommitted changes
git status
git add . && git commit -m "chore: prepare for release"
```

**Issue: Publish fails due to authentication**

```bash
# Solution: Check npm authentication
npm whoami
npm login

# For GitHub Packages
npm config set @organization:registry=https://npm.pkg.github.com
```

**Issue: Build fails before publish**

```bash
# Solution: Clean and rebuild
nx reset
nx build package-name --configuration=production
```

**Issue: Release notes missing**

```bash
# Solution: Check conventional commit format
git log --oneline HEAD~10..HEAD

# Ensure commits follow format: type(scope): description
```

### Release Recovery

**Incomplete release:**

```bash
# Check what was published
npm view package-name versions

# Complete missing publications
nx publish package-name
```

**Wrong version published:**

```bash
# Deprecate wrong version
npm deprecate package-name@wrong-version "Incorrect version, use x.y.z"

# Publish correct version
nx version package-name --release-as=patch
nx publish package-name
```

---

**Release Checklist:**

- [ ] All tests pass
- [ ] All builds successful
- [ ] Changelog updated
- [ ] Version bumped correctly
- [ ] Package published successfully
- [ ] Release notes created
- [ ] Documentation updated
- [ ] Team notified of release
