# Release Process

This document explains the automated release process for the Goodie-Bag monorepo, which uses an enhanced parallel CI/CD pipeline powered by GitHub Actions and NX.

## Overview

Our release process is fully automated and uses **AI-driven semantic versioning**:

1. **CI Workflow** - Analyzes code changes to determine semantic versions (patch/minor/major)
2. **Release Workflow** - Uses AI-determined versions to publish packages when merged to main

## 🎨 Complete Pipeline Architecture

```
                             📋 GOODIE-BAG ENHANCED PARALLEL PIPELINE

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        🔄 DEVELOPMENT FLOW                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

    👨‍💻 Developer                    🤖 CI Workflow (PR)                     🚀 Release Workflow (Main)
    
┌─────────────────┐           ┌─────────────────────────────────┐           ┌─────────────────────────────────┐
│                 │           │                                 │           │                                 │
│  Feature Work   │──────────▶│         PARALLEL MATRIX         │           │       PARALLEL SHIPPING         │
│                 │   PR      │                                 │           │                                 │
│ • Code changes  │           │  ┌─────────────────────────────┐ │           │  ┌─────────────────────────────┐ │
│ • Git commit    │           │  │     🔍 NX Affected         │ │           │  │     🔍 NX Affected         │ │
│ • Push branch   │           │  │   ┌─────────────────────┐   │ │           │  │   ┌─────────────────────┐   │ │
│                 │           │  │   │ nx-surrealdb       │   │ │           │  │   │ nx-surrealdb       │   │ │
└─────────────────┘           │  │   │ mcp-server-claude  │   │ │           │  │   │ mcp-server-claude  │   │ │
                               │  │   └─────────────────────┘   │ │           │  │   └─────────────────────┘   │ │
                               │  └─────────────────────────────┘ │           │  └─────────────────────────────┘ │
                               │              │                  │           │              │                  │
                               │              ▼                  │           │              ▼                  │
                               │  ┌─────────────────────────────┐ │           │  ┌─────────────────────────────┐ │
                               │  │    ⚡ PARALLEL VALIDATION   │ │           │  │     📦 PARALLEL PUBLISH     │ │
                               │  │                             │ │           │  │                             │ │
                               │  │ ┌────────┐  ┌────────────┐  │ │           │  │ ┌────────┐  ┌────────────┐  │ │
                               │  │ │ lint   │  │ lint       │  │ │           │  │ │publish │  │ publish    │  │ │
                               │  │ │ pkg-A  │  │ pkg-B      │  │ │           │  │ │ pkg-A  │  │ pkg-B      │  │ │
                               │  │ │   ✅   │  │    ✅      │  │ │           │  │ │v1.2.0  │  │ v0.3.0     │  │ │
                               │  │ └────────┘  └────────────┘  │ │           │  │ └────────┘  └────────────┘  │ │
                               │  │                             │ │           │  │      │            │        │ │
                               │  │ ┌────────┐  ┌────────────┐  │ │           │  │      ▼            ▼        │ │
                               │  │ │ test   │  │ test       │  │ │           │  │ ┌────────┐  ┌────────────┐  │ │
                               │  │ │ pkg-A  │  │ pkg-B      │  │ │           │  │ │release │  │ release    │  │ │
                               │  │ │   ✅   │  │    ✅      │  │ │           │  │ │ pkg-A  │  │ pkg-B      │  │ │
                               │  │ └────────┘  └────────────┘  │ │           │  │ │   ✅   │  │    ✅      │  │ │
                               │  │                             │ │           │  │ └────────┘  └────────────┘  │ │
                               │  │ ┌────────┐  ┌────────────┐  │ │  CACHED   │  │              │              │ │
                               │  │ │ build  │  │ build      │  │ │ ARTIFACTS │  │              ▼              │ │
                               │  │ │ pkg-A  │  │ pkg-B      │  │ │ ────────▶ │  │ ┌─────────────────────────┐  │ │
                               │  │ │   ✅   │  │    ✅      │  │ │           │  │ │    🔄 FINALIZE          │  │ │
                               │  │ └────────┘  └────────────┘  │ │           │  │ │                         │  │ │
                               │  │              │              │ │           │  │ │ • Update package.json   │  │ │
                               │  │              ▼              │ │           │  │ │ • Commit to main        │  │ │
                               │  │ ┌─────────────────────────┐  │ │           │  │ │ • Push version updates  │  │ │
                               │  │ │   🧠 AI ANALYSIS        │  │ │           │  │ │                         │  │ │
                               │  │ │                         │  │ │           │  │ └─────────────────────────┘  │ │
                               │  │ │ ┌─────────┐ ┌─────────┐ │  │ │           │  └─────────────────────────────┘ │
                               │  │ │ │analyze  │ │analyze  │ │  │ │           │                                 │
                               │  │ │ │ pkg-A   │ │ pkg-B   │ │  │ │           └─────────────────────────────────┘
                               │  │ │ │patch ✅ │ │minor ✅ │ │  │ │           
                               │  │ │ └─────────┘ └─────────┘ │  │ │           ┌─────────────────────────────────┐
                               │  │ └─────────────────────────┘  │ │           │          📊 RESULTS             │
                               │  │              │              │ │           │                                 │
                               │  │              ▼              │ │           │ 📦 npm packages:               │
                               │  │ ┌─────────────────────────┐  │ │           │ • pkg-A@v1.2.0 (next)          │
                               │  │ │   📝 RELEASE PREVIEW    │  │ │           │ • pkg-B@sha.def456 (next)      │
                               │  │ │                         │ │ │           │                                 │
                               │  │ │ ┌─────────┐ ┌─────────┐ │  │ │           │ 🏷️ GitHub releases:            │
                               │  │ │ │preview  │ │preview  │ │  │ │           │ • nx-surrealdb-v1.2.0           │
                               │  │ │ │ pkg-A   │ │ pkg-B   │ │  │ │           │ • mcp-server-claude-sha.def456  │
                               │  │ │ │   ✅    │ │   ✅    │ │  │ │           │                                 │
                               │  │ │ └─────────┘ └─────────┘ │  │ │           │ 🔄 Version commits:             │
                               │  │ └─────────────────────────┘  │ │           │ • package.json updated         │
                               │  │              │              │ │           │ • Changes pushed to main       │
                               │  │              ▼              │ │           │                                 │
                               │  │ ┌─────────────────────────┐  │ │           └─────────────────────────────────┘
                               │  │ │     💬 PR COMMENT      │  │ │           
                               │  │ │                         │  │ │           
                               │  │ │ 🚀 Release Preview      │  │ │           
                               │  │ │                         │  │ │           
                               │  │ │ Affected Packages: 2    │  │ │           
                               │  │ │ • nx-surrealdb (patch)  │  │ │           
                               │  │ │ • mcp-server (minor)    │  │ │           
                               │  │ │                         │  │ │           
                               │  │ │ Ready for review! ✅    │  │ │           
                               │  │ └─────────────────────────┘  │ │           
                               │  └─────────────────────────────┘ │           
                               └─────────────────────────────────┘           

┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       ⚡ KEY FEATURES                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

🎯 MATRIX PARALLELIZATION              📊 INTELLIGENT ANALYSIS               🚀 AUTOMATED SHIPPING
• Each package = separate runner        • AI-powered semantic versioning      • Semantic version publishing
• True parallel execution              • Git diff analysis                    • npm + GitHub releases
• Independent failure isolation        • Automated release notes             • Version commit automation
• Scales linearly with packages        • PR preview transparency             • Cache reuse efficiency

🔄 DEVELOPER EXPERIENCE                📈 PERFORMANCE BENEFITS               🛡️ RELIABILITY FEATURES
• Zero manual release work             • ~50% faster than sequential         • Granular failure isolation
• Clear PR release previews            • Cached builds between workflows     • Individual job retry capability
• Beautiful parallel UI visualization  • Affected-only operations            • Comprehensive per-package logs
• One-click merge = automatic ship     • Efficient resource utilization      • Rollback-friendly version commits
```

## 🔄 Complete Release Flow

### 1. Development & PR Creation

```bash
# Make changes to packages
git checkout -b feat/new-feature
# ... make changes to packages/nx-surrealdb/ ...
git commit -m "feat: add new migration feature"
git push origin feat/new-feature
```

### 2. CI Workflow (PR Validation)

When you create a PR, the **CI workflow** automatically:

#### **Parallel Matrix Execution:**
```
        ┌─────────────┐
        │   detect    │ ← Finds affected packages using NX
        │     ✅      │
        └─────────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐
│ lint  │ │ lint  │ │ test  │ │ test  │  ← Parallel per package
│ pkg-A │ │ pkg-B │ │ pkg-A │ │ pkg-B │
│  ✅   │ │  ✅   │ │  ✅   │ │  ✅   │
└───────┘ └───────┘ └───────┘ └───────┘
    │         │         │         │
    └─────────┼─────────┼─────────┘
              │         │
         ┌────────┐ ┌────────┐
         │ build  │ │ build  │             ← Parallel builds
         │ pkg-A  │ │ pkg-B  │
         │   ✅   │ │   ✅   │
         └────────┘ └────────┘
              │         │
         ┌────────┐ ┌────────┐
         │analyze │ │analyze │             ← AI semantic analysis
         │ pkg-A  │ │ pkg-B  │
         │   ✅   │ │   ✅   │
         └────────┘ └────────┘
              │         │
         ┌────────┐ ┌────────┐
         │preview │ │preview │             ← Generate release notes
         │ pkg-A  │ │ pkg-B  │
         │   ✅   │ │   ✅   │
         └────────┘ └────────┘
              │         │
              └────┬────┘
                   │
            ┌─────────────┐
            │   comment   │               ← Post to PR
            │     ✅      │
            └─────────────┘
```

#### **What Happens:**

1. **🔍 Detection**: NX finds affected packages with publish targets
2. **⚡ Parallel Validation**: Each package gets dedicated runners for:
   - Linting
   - Testing  
   - Building
3. **🧠 AI Analysis**: Analyzes git diff to determine version bump (patch/minor/major)
4. **📝 Release Preview**: Generates release notes and posts PR comment

#### **Example PR Comment:**
```markdown
# 🚀 Release Preview

**Affected Packages:** 2

### 📋 What happens on merge:
1. ✅ Version bumps applied automatically
2. 📦 Packages published to npm with `next` tag
3. 🏷️ GitHub releases created  
4. 🔄 Version commits pushed back to repository

---

## 📦 `@deepbrainspace/nx-surrealdb` 0.1.3 → 0.1.4 (patch)

**Why patch?** Detected from commit analysis

### Changes:
- fix: resolve migration rollback issue
- docs: update API documentation

### Files Modified:
- `packages/nx-surrealdb/src/lib/migration-service.ts`
- `packages/nx-surrealdb/README.md`

---

*🤖 Generated by AI Release Assistant - Enhanced Parallel Pipeline*
```

### 3. Release Workflow (Main Branch)

When the PR is **merged to main**, the **Release workflow** automatically:

#### **Simplified Release Flow:**
```
┌─────────────┐
│   detect    │ ← Find affected packages
│     ✅      │
└─────────────┘
       │
   ┌───┴───┐
   │       │
┌──────┐ ┌──────┐
│publish│ │publish│  ← Parallel publishing
│pkg-A │ │pkg-B │    (uses CI build cache)
│  ✅  │ │  ✅  │
└──────┘ └──────┘
   │       │
┌──────┐ ┌──────┐
│release│ │release│  ← Parallel GitHub releases
│pkg-A │ │pkg-B │
│  ✅  │ │  ✅  │
└──────┘ └──────┘
   │       │
   └───┬───┘
       │
┌─────────────┐
│  finalize   │      ← Commit versions back
│     ✅      │
└─────────────┘
```

#### **What Happens:**

1. **📦 Publishing** (parallel per package):
   - Uses **cached builds** from CI (no rebuilding!)
   - Applies **semantic versions** from AI analysis: `1.2.0`, `0.3.0`
   - Publishes to **npm** with `next` tag
   - Creates **tarballs** for GitHub releases

2. **🏷️ GitHub Releases** (parallel per package):
   - Creates GitHub releases with tarballs
   - Uses semantic versions from AI analysis
   - Proper release types (Major/Minor/Patch Release)

3. **🔄 Finalization**:
   - Updates `package.json` files with semantic versions
   - Commits changes back to main branch
   - Pushes version commit with AI analysis attribution

## 📋 Version Strategy

### Development Releases (Main Branch)
- **Format**: `1.2.3` (semantic versioning)
- **AI Analysis**: Automatically determines patch/minor/major
- **npm tag**: `latest` (major), `next` (minor/patch)
- **GitHub**: Proper release type
- **Purpose**: Production-ready semantic versions

```bash
# AI determines versions automatically:
# fix: → patch (1.0.0 → 1.0.1)
# feat: → minor (1.0.0 → 1.1.0) 
# BREAKING: → major (1.0.0 → 2.0.0)

# Install latest semantic version
npm install @deepbrainspace/nx-surrealdb@latest
# or specific version
npm install @deepbrainspace/nx-surrealdb@1.2.0
```

### Development Branches
- **Format**: `1.2.3-dev.sha123`
- **npm tag**: `dev`
- **GitHub**: Development preview
- **Purpose**: Feature branch testing

```bash
# Install development version
npm install @deepbrainspace/nx-surrealdb@dev
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

## 🛠️ Manual Release Process

For emergency releases or production versions:

### Option 1: Standard pnpm Commands
```bash
# Navigate to package
cd packages/nx-surrealdb

# Version bump  
pnpm version patch  # 0.1.3 → 0.1.4
pnpm version minor  # 0.1.3 → 0.2.0  
pnpm version major  # 0.1.3 → 1.0.0

# Publish
pnpm publish

# Push changes
git push --follow-tags
```

### Option 2: NX-Powered Multi-Package Releases
```bash
# From repository root

# Version affected packages
pnpm version:patch    # Patch bump for affected
pnpm version:minor    # Minor bump for affected
pnpm version:major    # Major bump for affected

# Publish affected packages
pnpm publish:affected

# Or combine both
pnpm release:patch    # Version + publish in one command
```

### Option 3: AI-Driven Automatic Release
```bash
# Simply merge to main - AI handles everything:
# 1. Analyzes git diff for semantic changes
# 2. Determines appropriate version bump
# 3. Updates package.json automatically
# 4. Publishes to npm with correct tags
# 5. Creates GitHub release
# 6. Commits version changes back

# No manual tagging needed!
git checkout main
git merge feature-branch
# AI automatically handles the rest
```

## 🔍 Monitoring Releases

### GitHub Actions UI
- **CI Tab**: See parallel matrix execution
- **Individual Job Logs**: Click specific package jobs
- **Real-time Progress**: Watch parallel execution

### npm Registry
```bash
# Check published versions
npm view @deepbrainspace/nx-surrealdb versions --json

# Check specific tags
npm view @deepbrainspace/nx-surrealdb dist-tags
```

### GitHub Releases
- **Semantic Releases**: Tagged as `nx-surrealdb-v1.2.0`
- **AI-Generated Release Notes**: Automatically generated from commit analysis
- **Tarballs**: Available for direct download

## 🚨 Troubleshooting

### CI Pipeline Issues
```bash
# Check NX affected detection
pnpm nx show projects --affected --with-target=publish

# Manually trigger affected operations
pnpm nx affected --target=lint
pnpm nx affected --target=test  
pnpm nx affected --target=build
```

### Release Pipeline Issues
```bash
# Check npm authentication
npm whoami

# Verify package.json publish config
cat packages/nx-surrealdb/package.json | jq .publishConfig

# Test local publishing
cd packages/nx-surrealdb  
npm pack  # Creates tarball locally
```

### Version Conflicts
```bash
# Check current npm versions
npm view @deepbrainspace/nx-surrealdb versions

# Check current git tags
git tag --sort=-version:refname | grep nx-surrealdb
```

## 🎨 Pipeline Benefits

### Developer Experience
- ✅ **Zero manual release work** - AI handles everything
- ✅ **Intelligent version detection** - semantic analysis of changes
- ✅ **Clear release previews** - see exactly what versions will ship
- ✅ **Parallel execution** - faster than sequential builds
- ✅ **Individual job visibility** - debug specific package issues

### Scalability  
- ✅ **Infinite packages** - each gets dedicated runner
- ✅ **Smart caching** - CI builds reused in release
- ✅ **Affected-only** - only changed packages processed
- ✅ **Matrix strategy** - linear scaling with package count

### Reliability
- ✅ **Granular failure isolation** - one package failure doesn't block others
- ✅ **Retry capabilities** - individual jobs can be retried
- ✅ **Comprehensive logging** - detailed per-package logs
- ✅ **Automated rollback** - version commits can be reverted

## 🔗 Related Documentation

- [NX Affected Documentation](https://nx.dev/ci/features/affected)
- [GitHub Actions Matrix Strategy](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs)
- [Semantic Versioning](https://semver.org/)
- [npm Tags](https://docs.npmjs.com/adding-dist-tags-to-packages)