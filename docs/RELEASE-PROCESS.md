# Release Process

This document describes the release process for the Goodie-Bag monorepo, which uses pre-commit changelog generation to streamline releases.

## Overview

The release process consists of three workflows:

1. **Workflow 1: Pre-commit (Husky)** - Generates changelog-rc.md files for affected packages
2. **Workflow 2: Post-PR CI** - Validates code quality (lint → test → build)
3. **Workflow 3: Post-merge Release** - Publishes packages using pre-generated changelogs

## Workflow Architecture

```
 Development         Pre-commit         CI (PR)           Release
     │                  │                │                 │
     ▼                  ▼                ▼                 ▼
┌─────────┐       ┌──────────┐     ┌──────────┐     ┌──────────┐
│ Code    │──────▶│ Generate │────▶│ Validate │────▶│ Publish  │
│ Changes │commit │ Changelog│ PR  │ & Build  │merge│ Packages │
└─────────┘       └──────────┘     └──────────┘     └──────────┘
                        │                │                 │
                        ▼                ▼                 ▼
                  changelog-rc.md   cached builds    npm packages
```

### Pre-commit Changelog Generation

The system generates changelogs during the commit process:

1. **Automatic Detection**: Uses nx affected to find changed packages
2. **Version Calculation**: Determines version from conventional commits
3. **Changelog Creation**: Generates changelog-rc.md with RC version
4. **Release Indicator**: Presence of changelog-rc.md signals readiness for release

## 🔄 Complete Release Flow

### 1. Development with Auto-Changelog (Pre-commit Hook)

```bash
# Make changes to packages
git checkout -b feat/new-feature
# ... make changes to packages/nx-surrealdb/ ...

# On commit, Husky pre-commit hook automatically:
# 1. Detects affected packages via nx affected
# 2. Calculates version from conventional commits
# 3. Generates changelog-rc.md with RC version
git commit -m "feat: add new migration feature"

# Result: packages/nx-surrealdb/changelog-rc.md created
# Content: Version 0.2.1-rc.1703123456789 with changelog

# Push includes the changelog-rc.md file
git push origin feat/new-feature
```

### 2. CI Workflow (PR Validation)

When you create a PR, the **CI workflow** validates code quality:

#### **Parallel Execution Per Package:**
```
┌─────────────┐
│   detect    │ ← Finds affected packages using NX
│     ✅      │
└─────────────┘
       │
   ┌───┴───┐
   │       │
┌──────┐ ┌──────┐
│ lint │ │ lint │  ← Parallel linting
│pkg-A │ │pkg-B │
│  ✅  │ │  ✅  │
└──────┘ └──────┘
   │       │
┌──────┐ ┌──────┐
│ test │ │ test │  ← Parallel testing
│pkg-A │ │pkg-B │
│  ✅  │ │  ✅  │
└──────┘ └──────┘
   │       │
┌──────┐ ┌──────┐
│build │ │build │  ← Parallel building (cached)
│pkg-A │ │pkg-B │
│  ✅  │ │  ✅  │
└──────┘ └──────┘
```

#### **What Happens:**

1. **🔍 Detection**: NX finds affected packages
2. **⚡ Parallel Validation**: Each package validated independently
3. **📦 Build Caching**: Build artifacts cached for release
4. **📝 Changelog Validation**: Ensures changelog-rc.md is valid

**Note**: The changelog-rc.md file is already in the PR for review!

### 3. Release Workflow (Post-merge)

**Triggered manually** via GitHub Actions when ready to release (automatic triggers planned):

#### **Release Flow for Packages with changelog-rc.md:**
```
┌─────────────┐
│   detect    │ ← Find packages with changelog-rc.md
│     ✅      │
└─────────────┘
       │
   ┌───┴───┐
   │       │
┌──────────┐ ┌──────────┐
│ process  │ │ process  │  ← Process RC changelogs
│  pkg-A   │ │  pkg-B   │
│ 0.2.1-rc │ │ 1.0.0-rc │
│    ↓     │ │    ↓     │
│  0.2.1   │ │  1.0.0   │
└──────────┘ └──────────┘
       │           │
┌──────────┐ ┌──────────┐
│ publish  │ │ publish  │  ← Publish to npm
│  pkg-A   │ │  pkg-B   │    (uses cached builds)
│    ✅    │ │    ✅    │
└──────────┘ └──────────┘
       │           │
┌──────────┐ ┌──────────┐
│   tag    │ │   tag    │  ← Git tags & GitHub releases
│ pkg-A-   │ │ pkg-B-   │
│ v0.2.1   │ │ v1.0.0   │
└──────────┘ └──────────┘
       │           │
       └─────┬─────┘
             │
      ┌─────────────┐
      │  finalize   │  ← Commit versions & cleanup
      │     ✅      │
      └─────────────┘
```

#### **What Happens:**

1. **🔍 Detection**: Find packages with `changelog-rc.md` files

2. **📝 Changelog Processing** (per package):
   - Strip `-rc.{timestamp}` from version
   - Merge `changelog-rc.md` → `CHANGELOG.md`
   - Update `package.json` with final version

3. **📦 Publishing** (parallel per package):
   - Use **cached builds** from CI
   - Publish to npm with pnpm
   - Apply appropriate npm tags

4. **🏷️ Git Operations**:
   - Create release commit: `chore(release): {package}@{version} [skip-changelog]`
   - Tag: `{package}-v{version}`
   - Create GitHub release
   - Delete `changelog-rc.md`

5. **🔄 Finalization**:
   - Push all commits and tags
   - Cleanup RC files

## 📋 Version Strategy

### Pre-commit RC Versions
- **Format**: `x.y.z-rc.{timestamp}` (e.g., `0.2.1-rc.1703123456789`)
- **Location**: `packages/{package}/changelog-rc.md`
- **Purpose**: Preview version for PR review
- **Calculation**: Based on conventional commits since last release

### Release Versions
- **Format**: `x.y.z` (semantic versioning)
- **Determination**: Strip RC suffix from changelog-rc.md
- **npm tag**: `latest`
- **GitHub**: Tagged as `{package}-v{version}`

### Automatic Release Triggers (TODO)
- **Trigger**: Merge to main with changelog-rc.md present
- **Timing**: Immediate or batched (configurable)
- **Safety**: Require approval for major versions
- **Notification**: Slack/Discord webhook on release

```bash
# Version calculation from commits:
# fix: → patch (0.2.0 → 0.2.1)
# feat: → minor (0.2.0 → 0.3.0) 
# feat!: or BREAKING CHANGE: → major (0.2.0 → 1.0.0)

# Install released version
pnpm add @deepbrainspace/nx-surrealdb@latest
# or specific version
pnpm add @deepbrainspace/nx-surrealdb@0.2.1
```

## 🎯 Multi-Package Scenarios

### Single Package Changed
```
PR affects: nx-surrealdb
Result: 1 parallel runner for each phase
```

### Multiple Packages Changed
```
PR affects: nx-surrealdb, mcp-server-claude
Result: 2 parallel runners for each phase
- lint (nx-surrealdb) + lint (mcp-server-claude)  
- test (nx-surrealdb) + test (mcp-server-claude)
- build (nx-surrealdb) + build (mcp-server-claude)
- etc.
```

### No Packages Affected
```
PR affects: README.md, docs/
Result: "No packages affected" notification
```

## 🛠️ Manual Testing & Override Options

### Testing the Release Process Locally

```bash
# Test nx release commands
nx release --dry-run
nx release --projects=nx-surrealdb --dry-run

# Test changelog generation
nx release changelog --projects=nx-surrealdb --dry-run

# Test publishing
nx release publish --projects=nx-surrealdb --dry-run
```

### Manual Changelog Generation

If pre-commit hook doesn't run or you need to manually create:

```bash
# Generate changelog-rc.md manually
nx release version --projects=nx-surrealdb
# This creates the version and changelog

# Or use custom version
echo "0.2.1-rc.$(date +%s)" > packages/nx-surrealdb/changelog-rc.md
# Then add your changelog content
```

### Skipping Pre-commit Hook

```bash
# Skip Husky hooks
git commit --no-verify -m "chore: skip changelog generation"

# Or with environment variable
HUSKY=0 git commit -m "chore: skip hooks"

# Release commits automatically skip via [skip-changelog] pattern
git commit -m "chore(release): nx-surrealdb@0.2.1 [skip-changelog]"
```

## 🔍 Monitoring & Debugging

### Pre-commit Hook Debugging
```bash
# Check if Husky is installed
ls -la .husky/

# Test hook manually
.husky/pre-commit

# Check affected packages
nx show projects --affected

# Verify changelog-rc.md generation
find packages -name "changelog-rc.md"
```

### CI Pipeline Monitoring
- **GitHub Actions**: View parallel lint/test/build execution
- **Build Cache**: Verify artifacts are cached for release
- **Affected Detection**: Check which packages are detected

### Release Process Monitoring
```bash
# Check published versions
pnpm view @deepbrainspace/nx-surrealdb versions --json

# Verify git tags
git tag | grep nx-surrealdb

# Check GitHub releases
gh release list --repo deepbrainspace/goodiebag
```

## 🚨 Troubleshooting

### Pre-commit Issues

**Hook not running:**
```bash
# Reinstall Husky
pnpm add -D husky
pnpm exec husky install

# Add pre-commit hook
pnpm exec husky add .husky/pre-commit "pnpm run pre-commit"
```

**Changelog not generated:**
```bash
# Check if package has changes
nx show projects --affected

# Manually run changelog generation
pnpm run generate-changelog nx-surrealdb
```

### Release Issues

**Can't find changelog-rc.md:**
```bash
# Verify file exists
ls packages/*/changelog-rc.md

# Check file content
cat packages/nx-surrealdb/changelog-rc.md
```

**Version already exists:**
```bash
# Check npm versions
pnpm view @deepbrainspace/nx-surrealdb versions

# Force republish (careful!)
pnpm publish --force --no-git-checks
```

**Authentication issues:**
```bash
# Check npm auth
pnpm whoami

# Set npm token
npm config set //registry.npmjs.org/:_authToken=$NPM_TOKEN
```

## System Benefits

### Developer Experience
- **Automated changelog generation** - Created during commit process
- **Version calculation** - Based on conventional commits
- **Skip capability** - Use --no-verify or [skip-changelog] when needed
- **PR visibility** - Changelog visible for review before merge

### Release Process
- **Clear release signals** - changelog-rc.md indicates readiness
- **Independent packages** - Each package maintains own release cycle
- **Build caching** - Reuses CI artifacts during release
- **Clean commits** - Release commits marked with [skip-changelog]

## 🚀 Implementation Roadmap

### Phase 1: Husky Setup (Immediate)
1. Install Husky: `pnpm add -D husky`
2. Initialize: `pnpm exec husky install`
3. Create TypeScript pre-commit script
4. Test with nx-surrealdb package

### Phase 2: Pre-commit Script Development
1. Implement nx affected detection
2. Add conventional commit parsing
3. Generate changelog-rc.md with timestamp
4. Handle skip conditions ([skip-changelog])

### Phase 3: Release Workflow Update
1. Update release.yml to find changelog-rc.md
2. Implement RC stripping and publishing
3. Add [skip-changelog] to release commits
4. Test end-to-end with nx-surrealdb

### Phase 4: Rollout to All Packages
1. Enable for nx-rust
2. Enable for claude-code-toolkit
3. Monitor and optimize performance
4. Add caching for faster pre-commits

### Phase 5: Automatic Release Triggers (Future)
1. Detect merge to main with changelog-rc.md
2. Auto-trigger release workflow for affected packages
3. Configure release cadence (immediate vs batched)
4. Add safety checks and notifications

## 🔗 Related Documentation

- [Husky Documentation](https://typicode.github.io/husky/)
- [NX Affected Documentation](https://nx.dev/ci/features/affected)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [pnpm Workspaces](https://pnpm.io/workspaces)