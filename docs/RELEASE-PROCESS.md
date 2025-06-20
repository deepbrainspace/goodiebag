# Release Process

This document explains the revolutionary AI-assisted release process for the Goodie-Bag monorepo, featuring a unique pre-commit changelog generation system that provides zero-friction releases.

## Overview

Our release process uses a **three-part architecture** with AI-assisted changelog generation:

1. **Pre-commit Hook** - AI generates changelog-rc.md files for affected packages
2. **CI Workflow** - Validates code quality (lint → test → build)
3. **Release Workflow** - Publishes packages using pre-generated changelogs

## 🎨 Three-Part Release Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                     AI-ASSISTED CONTINUOUS CHANGELOG SYSTEM                      │
└─────────────────────────────────────────────────────────────────────────────────┘

    👨‍💻 Development               🤖 Pre-commit (Husky)           ✅ CI (PR)              🚀 Release (Manual)
    
┌─────────────────┐         ┌─────────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │         │                     │      │                 │      │                 │
│  Code Changes   │────────▶│  AI Changelog Gen   │─────▶│  Code Quality   │─────▶│  Publishing     │
│                 │ commit  │                     │  PR  │                 │merge │                 │
│ • feat: new API │         │ • nx affected       │      │ • Lint          │      │ • Find RC files │
│ • fix: bug      │         │ • Version calc      │      │ • Test          │      │ • Strip RC      │
│ • docs: update  │         │ • changelog-rc.md   │      │ • Build         │      │ • Publish npm   │
│                 │         │   0.2.1-rc.{ts}     │      │ • Cache builds  │      │ • Git tag       │
└─────────────────┘         └─────────────────────┘      └─────────────────┘      └─────────────────┘
                                       │                          │                          │
                                       ▼                          ▼                          ▼
                               packages/nx-surrealdb/      CI validates all       packages published
                               changelog-rc.md             code & builds         with final versions
```

### Key Innovation: Pre-commit Changelog Generation

**No other monorepo has this!** Our system generates reviewable changelogs BEFORE the PR is created:

1. **Zero Developer Overhead**: Changelogs generated automatically on commit
2. **PR Reviewability**: See exactly what will be released before merge
3. **AI-Assisted**: Intelligent version calculation from conventional commits
4. **Release Signal**: `changelog-rc.md` indicates package is ready for release

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

### 3. Release Workflow (Manual Trigger)

**Triggered manually** via GitHub Actions when ready to release:

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

## 🎨 System Benefits

### Unique Innovation
- ✅ **First-of-its-kind** - No other monorepo has AI-assisted pre-commit changelogs
- ✅ **Zero-friction releases** - Changelog ready before PR is even created
- ✅ **Full transparency** - Reviewers see exact release notes in PR
- ✅ **AI-powered** - Leverages Claude Code for intelligent changelog generation

### Developer Experience
- ✅ **Zero manual work** - Changelogs generated automatically on commit
- ✅ **No version guessing** - AI calculates from conventional commits
- ✅ **Skip when needed** - Easy override with --no-verify or [skip-changelog]
- ✅ **Review before release** - See changelog in PR before merge

### Release Reliability
- ✅ **Predictable releases** - changelog-rc.md acts as release signal
- ✅ **Independent packages** - Each package releases on its own schedule
- ✅ **Cached builds** - No rebuilding between CI and release
- ✅ **Clean git history** - Release commits marked with [skip-changelog]

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

## 🔗 Related Documentation

- [Husky Documentation](https://typicode.github.io/husky/)
- [NX Affected Documentation](https://nx.dev/ci/features/affected)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [pnpm Workspaces](https://pnpm.io/workspaces)