# Release Process

This document describes the automated release process for the Goodie-Bag
monorepo, which uses an event-driven GitHub Actions pipeline for continuous
integration, release preparation, and publishing.

## Overview

The release process consists of multiple automated workflows orchestrated by PR
events:

1. **Build Feature PR** - Automated code quality checks (lint → test → build) +
   artifact storage
2. **Create Release PRs** - Automated version bumping and release PR creation
3. **Publish Packages** - Automated tagging and publishing using CI artifacts
4. **Validation** - PR routing and release branch validation

## Workflow Architecture

The CI/CD system uses event-driven GitHub Actions with PR routing:

```
 PR Events                 Router Workflows              Build/Release Workflows
     │                          │                             │
     ▼                          ▼                             ▼
┌─────────────┐         ┌─────────────────┐        ┌─────────────────────┐
│ PR Opened/  │────────▶│ on-pr-opened    │───────▶│ build-feature-pr    │
│ Synchronized│         │ (Router)        │        │ (Lint→Test→Build)   │
└─────────────┘         └─────────────────┘        └─────────────────────┘
                                 │                             │
                                 ▼                             ▼
                        ┌─────────────────┐        ┌─────────────────────┐
                        │ validate-       │        │ Artifacts Stored    │
                        │ release-pr      │        │ (1 day retention)   │
                        │ (for release/*) │        └─────────────────────┘
                        └─────────────────┘

┌─────────────┐         ┌─────────────────┐        ┌─────────────────────┐
│ PR Merged   │────────▶│ on-pr-merged    │───────▶│ create-release-prs  │
│             │         │ (Router)        │        │ (Changelog + PRs)   │
└─────────────┘         └─────────────────┘        └─────────────────────┘
                                 │                             │
                                 ▼                             ▼
                        ┌─────────────────┐        ┌─────────────────────┐
                        │ publish-        │        │ Release PRs Created │
                        │ packages        │        │ (release/pkg@ver)   │
                        │ (Tag + Publish) │        └─────────────────────┘
                        └─────────────────┘
```

### Event-Driven Pipeline Benefits

1. **Smart Routing**: PRs automatically routed to correct workflow based on
   branch type
2. **Parallel Processing**: Matrix strategy for affected packages in build phase
3. **Artifact Reuse**: Build artifacts stored and reused for publishing
4. **Branch-Based Logic**: Release vs feature branches trigger different
   workflows
5. **Concurrency Control**: Prevents duplicate builds with cancellation groups
6. **Comprehensive Validation**: Separate validation for feature vs release PRs

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

- **on-pr-opened** router workflow detects feature branch
- Routes to **build-feature-pr** workflow via API dispatch
- Detects affected packages using NX with matrix strategy
- Runs lint, test, build in parallel for each affected package
- Stores build artifacts with 1-day retention
- Reports status back via GitHub check runs

### 2. PR Merge & Changelog Generation

```bash
# Merge the feature PR
gh pr merge --squash  # or merge via GitHub UI
```

**What happens automatically:**

- **on-pr-merged** router workflow detects feature branch merge
- Routes to **create-release-prs** workflow via API dispatch
- Detects affected packages using NX affected
- Runs `nx release --skip-publish` for version bump + changelog
- Creates release branch: `release/package@version`
- Opens release PR with comprehensive changelog and version changes

**Control Options:**

- Add `do-not-release` label to PR to skip automatic release
- Use manual workflow dispatch for selective package releases

```bash
# Optional: Skip automatic release
gh pr edit {pr-number} --add-label "do-not-release"

# Optional: Manual release trigger
gh workflow run create-release-prs.yml -f package="nx-surrealdb" -f version="patch"
```

### 3. Release PR Review & Publish

```bash
# Review the generated release PR
gh pr view {release-pr-number}  # Review changelog and version changes
gh pr merge {release-pr-number} # Merge when ready to publish
```

**What happens automatically:**

- **on-pr-merged** router workflow detects release branch merge
- Routes to **publish-packages** workflow via API dispatch
- Extracts package and version from merge commit message
- Downloads CI build artifacts using `dawidd6/action-download-artifact`
- Creates git tag and pushes to GitHub
- Publishes to npm/cargo using `nx run {package}:nx-release-publish`
- Cleans up release branch automatically

#### **Detailed Publishing Process:**

1. **🔍 Detection**:

   - Router detects `release/*` branch merge
   - Extracts package/version from PR title:
     `🚀 Release Request for package@version`

2. **📦 Artifact Retrieval**:

   - Downloads build artifacts from original feature PR build
   - Verifies artifacts exist before proceeding
   - Uses exact same builds that passed all CI tests

3. **📦 Publishing**:

   - Creates git tag: `{package}@{version}` (e.g., `nx-surrealdb@1.2.3`)
   - Pushes tag to GitHub repository
   - Publishes to npm/cargo: `nx run {package}:nx-release-publish`
   - Creates GitHub release with extracted changelog

4. **🧹 Cleanup**:

   - Deletes release branch after successful publish
   - Maintains clean branch structure

5. **🔄 Artifact Flow**:
   ```
   Feature PR → CI Artifacts → Stored (1 day) → Release Workflow → Publish
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

- Release branches: `release/{package}@{version}` (e.g.,
  `release/nx-surrealdb@1.2.3`)
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
gh workflow run create-release-prs.yml
```

**Selective Releases:**

```bash
# Release specific package manually
gh workflow run create-release-prs.yml -f package="nx-surrealdb" -f version="minor"
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
