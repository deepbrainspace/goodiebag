# Release Process

This document describes the automated release process for the Goodie-Bag monorepo, which uses a 3-workflow GitHub Actions pipeline for continuous integration, changelog generation, and publishing.

## Overview

The release process consists of three automated workflows:

1. **CI Workflow** - Automated code quality checks (lint → test → build) + artifact storage
2. **Changelog Workflow** - Automated version bumping and release PR creation  
3. **Release Workflow** - Automated tagging and publishing using CI artifacts

## Workflow Architecture

```
  Feature PR        CI Workflow        Changelog         Release PR        Release
      │                 │             Workflow             │             Workflow
      ▼                 ▼                 │                 ▼                 │
┌───────────┐     ┌────────────┐     ┌───────────┐     ┌─────────┐     ┌─────────┐
│ Developer │────▶│ Build +    │────▶│ Generate  │────▶│ Review  │────▶│ Tag +   │
│ Opens PR  │     │ Test +     │     │ Changelog │     │ Release │     │ Publish │
│           │     │ Store      │     │ + Version │     │ Changes │     │ to npm/ │
│           │     │ Artifacts  │     │ Bump      │     │         │     │ cargo   │
└───────────┘     └────────────┘     └───────────┘     └─────────┘     └─────────┘
      │                 │                 │                 │                 │
      ▼                 ▼                 ▼                 ▼                 ▼
  Triggers CI       Tested Build      Release PR        Manual          Published
  Validation        Artifacts         Created           Review          Packages
```

### 3-Workflow Pipeline Benefits

1. **Zero Duplicate Builds**: CI artifacts are reused for publishing
2. **Permission Compliant**: No direct pushes to main, everything via PRs  
3. **Build Integrity**: Publishes exact same artifacts that passed CI tests
4. **Flexible Control**: `do-not-release` label for batching changes
5. **Manual Override**: Always available for selective releases
6. **Clean Separation**: CI→validate, Changelog→prepare, Release→publish

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
- **CI Workflow** triggers on PR creation
- Runs lint, test, build for affected packages
- Stores build artifacts for later release use
- Build artifacts cached for 7 days

### 2. PR Merge & Changelog Generation

```bash
# Merge the feature PR
gh pr merge --squash  # or merge via GitHub UI
```

**What happens automatically:**
- **Changelog Workflow** triggers on PR merge to main
- Detects affected packages using NX
- Runs `nx release --skip-publish` for version bump + changelog
- Creates release branch: `release/nx-surrealdb@1.2.3`
- Opens release PR with changelog and version changes

**Control Options:**
- Add `do-not-release` label to PR to skip automatic release
- Use manual workflow dispatch for selective package releases

```bash
# Optional: Skip automatic release
gh pr edit {pr-number} --add-label "do-not-release"

# Optional: Manual release trigger
gh workflow run changelog.yml -f package="nx-surrealdb" -f version="patch"
```

### 3. Release PR Review & Publish

```bash
# Review the generated release PR
gh pr view {release-pr-number}  # Review changelog and version changes
gh pr merge {release-pr-number} # Merge when ready to publish
```

**What happens automatically:**
- **Release Workflow** triggers on release PR merge
- Downloads CI build artifacts (from original feature PR)
- Extracts package and version from branch name: `release/nx-surrealdb@1.2.3`
- Creates git tag: `nx-surrealdb@1.2.3`
- Publishes to npm/cargo using exact CI artifacts
- Creates GitHub release with changelog

#### **What Happens:**

1. **🔍 Detection**: Detects release branch merge via PR event

2. **📦 Artifact Retrieval**:
   - Downloads CI build artifacts using `dawidd6/action-download-artifact`
   - Verifies artifacts exist before proceeding
   - Uses exact same builds that passed CI tests

3. **📦 Publishing**:
   - Create git tag: `{package}@{version}` (e.g., `nx-surrealdb@1.2.3`)
   - Push tag to GitHub
   - Publish to npm: `nx run {package}:nx-release-publish`
   - Create GitHub release with changelog content

4. **🔄 Artifact Flow**:
   ```
   Feature PR → CI Artifacts → Stored (7 days) → Release Workflow → Publish
   ```

**Safety**: 
- Only publishes if CI artifacts are found
- Uses branch-based triggers (not commit message parsing)
- Every action documented via PR audit trail

## 📋 Version Strategy

### Automatic Version Calculation

**NX Conventional Commits:**
- `fix:` → patch (0.2.0 → 0.2.1)
- `feat:` → minor (0.2.0 → 0.3.0) 
- `feat!:` or `BREAKING CHANGE:` → major (0.2.0 → 1.0.0)

**Branch Naming:**
- Release branches: `release/{package}@{version}` (e.g., `release/nx-surrealdb@1.2.3`)
- Git tags: `{package}@{version}` (e.g., `nx-surrealdb@1.2.3`)

**Package Versioning:**
- **Format**: `x.y.z` (semantic versioning)
- **npm tag**: `latest`
- **GitHub**: Tagged as `{package}@{version}`
- **Independent**: Each package maintains own version cycle

**Root Project:**
- **No versioning**: Root project doesn't get published
- **Tags**: Only packages get git tags
- **Releases**: GitHub releases created for each package

### Control Mechanisms

**Batching Changes:**
```bash
# Add label to skip automatic release
gh pr edit {pr-number} --add-label "do-not-release"

# Manual release when ready (accumulates all changes)
gh workflow run changelog.yml
```

**Selective Releases:**
```bash
# Release specific package manually
gh workflow run changelog.yml -f package="nx-surrealdb" -f version="minor"
```

### Installation

```bash
# Install released version
pnpm add @deepbrainspace/nx-surrealdb@latest
# or specific version  
pnpm add @deepbrainspace/nx-surrealdb@1.2.3
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

## 🛠️ Available Commands

### GitHub Workflow Commands

```bash
# Manual changelog generation (bypass automatic trigger)
gh workflow run changelog.yml

# Manual changelog with specific package
gh workflow run changelog.yml -f package="nx-surrealdb" -f version="patch"

# View workflow runs
gh run list --workflow=ci.yml
gh run list --workflow=changelog.yml  
gh run list --workflow=release.yml

# Control release behavior via labels
gh pr edit {pr-number} --add-label "do-not-release"
gh pr edit {pr-number} --remove-label "do-not-release"
```

### Testing and Validation

```bash
# Test affected package detection
nx show projects --affected

# Validate builds before release
nx affected --target=build

# Check npm authentication  
pnpm whoami

# View stored artifacts
gh api repos/deepbrainspace/goodiebag/actions/artifacts

# Check workflow permissions
gh api repos/deepbrainspace/goodiebag --jq .permissions
```

### Manual Release Process

```bash
# Bypass automated workflows entirely
git checkout -b manual-release
# ... make changes manually ...
nx release --projects=nx-surrealdb --skip-publish
# ... create PR manually ...
```

## 🔍 Monitoring & Debugging

### Workflow Monitoring

```bash
# Check affected packages  
nx show projects --affected

# Monitor workflow runs
gh run list --workflow=ci.yml --limit=5
gh run list --workflow=changelog.yml --limit=5
gh run list --workflow=release.yml --limit=5

# View specific run details
gh run view {run-id} --log

# Check workflow status
gh workflow list
```

### CI Pipeline Monitoring

- **GitHub Actions**: View lint/test/build execution in Actions tab
- **Build Artifacts**: Check stored artifacts in workflow runs
- **PR Status**: View CI checks on PRs

### Release Process Monitoring

```bash
# Check published versions
pnpm view @deepbrainspace/nx-surrealdb versions --json

# Verify git tags
git tag | grep nx-surrealdb

# Check GitHub releases
gh release list --repo deepbrainspace/goodiebag

# View artifact storage
gh api repos/deepbrainspace/goodiebag/actions/artifacts --jq '.artifacts[] | {name, size_in_bytes, created_at}'
```

## 🚨 Troubleshooting

### Workflow Issues

**Changelog workflow not triggering:**

```bash
# Check if PR has do-not-release label
gh pr view {pr-number} --json labels

# Check if PR was actually merged (not just closed)
gh pr view {pr-number} --json merged

# Manual trigger
gh workflow run changelog.yml
```

**Release workflow not running:**

```bash
# Check if release branch was merged
gh pr list --state merged --head "release/*"

# Check workflow permissions
gh api repos/deepbrainspace/goodiebag --jq .permissions

# View workflow run logs
gh run view {run-id} --log
```

### Artifact Issues

**Build artifacts not found:**

```bash
# Check if CI workflow completed successfully
gh run list --workflow=ci.yml --limit=5

# View artifact storage
gh api repos/deepbrainspace/goodiebag/actions/artifacts

# Check artifact retention (expires after 7 days)
```

**Publishing failures:**

```bash
# Check npm authentication
pnpm whoami

# Verify NX publish target exists
nx show project nx-surrealdb --json | jq .targets

# Check versions
pnpm view @deepbrainspace/nx-surrealdb versions
```

**Permission issues:**

```bash
# Check repository permissions
gh api repos/deepbrainspace/goodiebag --jq .permissions

# Verify secrets are configured
gh secret list

# Check workflow permissions in .github/workflows/
```

## System Benefits

### Developer Experience

- **Fully automated** - No manual release commands needed
- **PR-based workflow** - All changes documented and reviewable
- **Flexible control** - Skip releases with labels, manual triggers available
- **Zero duplicate builds** - CI artifacts reused for publishing

### Release Process  

- **Branch-driven** - Logic based on branch names, not commit parsing
- **Independent packages** - Each package maintains own release cycle
- **Build integrity** - Publishes exact artifacts that passed CI
- **Permission compliant** - No direct pushes to main, everything via PRs

## 🚀 Implementation Status

### ✅ Phase 1: 3-Workflow Pipeline (Complete)

1. ✅ CI Workflow - Build, test, store artifacts
2. ✅ Changelog Workflow - Version bump, create release PRs  
3. ✅ Release Workflow - Tag, publish using CI artifacts
4. ✅ Cross-workflow artifact sharing

### ✅ Phase 2: Advanced Features (Complete)

1. ✅ `do-not-release` label control
2. ✅ Manual workflow triggers
3. ✅ Branch-based detection (not commit parsing)
4. ✅ Tech-agnostic version extraction

### 🔄 Phase 3: Testing & Validation (Current)

1. Test complete flow: feature PR → CI → changelog → release
2. Validate cross-workflow artifact download
3. Test release branch exclusions
4. Verify npm/cargo publishing

### 📋 Phase 4: Optimization (Future)

1. Add webhook notifications (Slack/Discord)
2. Implement release approval workflows for major versions
3. Add dependency update automation
4. Enhanced error reporting and retry mechanisms

## 🔗 Related Documentation

- [GitHub Actions Workflows](https://docs.github.com/en/actions/using-workflows)
- [NX Affected Documentation](https://nx.dev/ci/features/affected)
- [NX Release Documentation](https://nx.dev/features/manage-releases)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Cross-Workflow Artifacts](https://github.com/dawidd6/action-download-artifact)
- [GitHub CLI](https://cli.github.com/manual/)
