# Release Process

This document describes the simplified release process for the Goodie-Bag
monorepo, which uses GitHub Actions for CI validation and NX commands for
publishing.

## Overview

The release process consists of two main phases:

1. **CI Validation** - Automated code quality checks when PRs are opened
2. **Manual Publishing** - Simple NX commands to release packages

## Workflow Architecture

```
PR opened → GitHub Actions CI → lint, test, build (affected packages only)
Ready to release → NX commands → version, publish
```

### Benefits of This Approach

- **Simple**: Two NX commands to release any package
- **Reliable**: Fewer moving parts means fewer failure points
- **Transparent**: No complex workflow orchestration to debug
- **Local Control**: Test and validate releases locally before publishing
- **Fast CI**: Only validates changed packages

## 🔄 Complete Release Flow

### 1. Feature Development

```bash
# Create feature branch and make changes
git checkout -b feat/new-feature
# ... make changes to packages/nx-surrealdb/ ...
git add .
git commit -m "feat(nx-surrealdb): add new migration functionality"
git push origin feat/new-feature

# Create PR
gh pr create --title "feat: add new migration functionality" --body "Description..."
```

**What happens automatically:**

- GitHub Actions detects PR opened
- Runs lint, test, and build on affected packages only
- Reports status back as PR checks
- No artifacts stored - just validation

### 2. PR Review & Merge

```bash
# Review and merge the PR normally
gh pr merge --merge  # Use regular merge to preserve conventional commits
```

**What happens:**

- PR is merged to main
- No automatic release triggers
- Ready for manual publishing when desired

### 3. Manual Release & Publish

**Release Branch Workflow (Recommended):**

```bash
# 1. Create release branch
git checkout -b release/package-name-v1.2.3

# 2. Preview release
nx release --projects=package-name --dry-run

# 3. Execute release (commits, tags, publishes)
nx release --projects=package-name

# 4. Push release branch
git push -u origin release/package-name-v1.2.3

# 5. Create PR for review
gh pr create --title "Release package-name v1.2.3" --body "Release notes..."

# 6. Merge with "Create a merge commit" (preserves tags)
```

**Direct Release (Alternative):**

```bash
# From main branch - one command does everything
nx release --projects=package-name
```

## 📋 Publishing Examples

### Single Package Release

```bash
# Release nx-surrealdb with automatic version detection
nx release --projects=nx-surrealdb
nx release publish --projects=nx-surrealdb

# Or specify version bump type
nx release minor --projects=nx-surrealdb
nx release publish --projects=nx-surrealdb
```

### Multiple Package Release

```bash
# Release all affected packages
nx release
nx release publish

# Or specify multiple packages
nx release --projects=nx-surrealdb,claude-code-toolkit
nx release publish --projects=nx-surrealdb,claude-code-toolkit
```

### What Each Command Does

**`nx release` (prepare):**

- Analyzes conventional commits to determine version bump
- Updates package.json version
- Generates/updates CHANGELOG.md
- Creates git tag
- Commits changes and pushes

**`nx release publish`:**

- Builds the package (if needed)
- Publishes to npm/cargo registry
- Uses credentials from environment variables

## 🎯 Version Strategy

### Automatic Version Calculation

NX analyzes conventional commit messages:

- `fix:` → patch (0.2.0 → 0.2.1)
- `feat:` → minor (0.2.0 → 0.3.0)
- `feat!:` or `BREAKING CHANGE:` → major (0.2.0 → 1.0.0)

### Git Tags and Releases

- **Git tags**: `{package}@{version}` (e.g., `nx-surrealdb@1.2.3`)
- **npm packages**: Published with `latest` tag
- **Independent versioning**: Each package maintains its own version

## 🛠️ Available Commands

### Release Commands

```bash
# Prepare release with interactive version selection
nx release --projects=package-name

# Prepare release with specific version bump
nx release patch --projects=package-name
nx release minor --projects=package-name
nx release major --projects=package-name

# Prepare release for all affected packages
nx release

# Publish prepared packages
nx release publish --projects=package-name
nx release publish  # publishes all prepared packages

# Combined release and publish
nx release --projects=package-name && nx release publish --projects=package-name
```

### Validation Commands

```bash
# Check which packages would be affected
nx show projects --affected

# Test build before releasing
nx affected --target=build

# Run tests on affected packages
nx affected --target=test

# Check npm authentication
npm whoami
```

## 🔍 Monitoring & Debugging

### Pre-Release Validation

```bash
# Check affected packages since last release
nx show projects --affected

# Validate builds work
nx affected --target=build

# Run full test suite
nx affected --target=test

# Preview what release would do (dry run)
nx release --dry-run --projects=package-name
```

### Post-Release Verification

```bash
# Check published versions
npm view @deepbrainspace/nx-surrealdb versions

# Verify git tags
git tag | grep nx-surrealdb

# Check latest version
npm view @deepbrainspace/nx-surrealdb version
```

## 🚨 Troubleshooting

### Common Issues

**Build failures before release:**

```bash
# Check what's failing
nx affected --target=build --verbose

# Fix issues and try again
nx affected --target=test
nx affected --target=lint
```

**Authentication issues:**

```bash
# Check npm auth
npm whoami

# Login if needed
npm login

# Verify registry
npm config get registry
```

**Version conflicts:**

```bash
# Check current version
cat packages/package-name/package.json | grep version

# Check what's on npm
npm view @deepbrainspace/package-name version

# Reset if needed
git reset --hard HEAD~1  # if you need to undo a release commit
```

## 📦 Environment Setup

### Required Environment Variables

For publishing, ensure these are set:

```bash
# For npm packages
NPM_TOKEN=npm_xxxxxxxxxxxx

# For cargo packages (if applicable)
CARGO_REGISTRY_TOKEN=xxxxxxxxxx
```

### Local Development

```bash
# Install dependencies
pnpm install

# Build all packages
nx run-many --target=build --all

# Test all packages
nx run-many --target=test --all
```

## System Benefits

### Developer Experience

- **Two simple commands** for any release
- **Local control** - test everything before publishing
- **Clear process** - no hidden automation to debug
- **Fast feedback** - immediate results from commands

### Release Process

- **Conventional commits** drive version selection
- **Independent packages** - release what you want, when you want
- **Build validation** - CI ensures quality before merge
- **No surprise releases** - nothing happens without explicit commands

## 🔗 Related Documentation

- [NX Release Documentation](https://nx.dev/features/manage-releases)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [npm Publishing](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [GitHub CLI](https://cli.github.com/manual/)
