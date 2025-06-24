# Goodie-Bag 🎒

[![Build Status](https://github.com/deepbrainspace/goodiebag/actions/workflows/build.yml/badge.svg)](https://github.com/deepbrainspace/goodiebag/actions/workflows/build.yml)
[![npm version](https://img.shields.io/npm/v/@deepbrainspace/goodiebag)](https://www.npmjs.com/package/@deepbrainspace/goodiebag)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A streamlined monorepo of developer utilities, NX plugins, MCP servers, and
tools - featuring intelligent CI/CD, comprehensive testing, and production-ready
automation.

## Repository Philosophy

**Why "Goodie-Bag"?** Every developer has that collection of small, useful tools
they've built over time. Instead of maintaining dozens of separate repositories,
this monorepo consolidates everything into one optimized, scalable workspace.

## Smart Monorepo Architecture

This repository demonstrates next-generation monorepo management with:

- **🧠 Intelligent CI/CD**: Only builds, tests, and publishes packages that
  actually changed
- **⚡ Parallel Execution**: ~50% faster builds through strategic
  parallelization
- **📦 Independent Versioning**: Each package maintains its own version and
  release cycle
- **🎯 Affected-Only Operations**: NX automatically detects what needs attention
- **🔄 Dual Distribution**: npm registry + GitHub releases with tarball
  artifacts
- **✅ Zero-Tolerance Quality**: ESLint warnings block CI, comprehensive test
  coverage required

## The Goodie-Bag Collection

| Package/App                                               | Type      | Version                                                           | Description                                               |
| --------------------------------------------------------- | --------- | ----------------------------------------------------------------- | --------------------------------------------------------- |
| [`@deepbrainspace/nx-surrealdb`](./packages/nx-surrealdb) | NX Plugin | ![npm](https://img.shields.io/npm/v/@deepbrainspace/nx-surrealdb) | SurrealDB migrations with modular architecture            |
| [`@goodiebag/nx-rust`](./packages/nx-rust)                | NX Plugin | ![npm](https://img.shields.io/npm/v/@goodiebag/nx-rust)           | NX plugin for Rust projects with comprehensive tooling    |
| [`claude-code-toolkit`](./packages/claude-code-toolkit)   | CLI Tool  | ![crates.io](https://img.shields.io/crates/v/claude-code-toolkit) | Claude Code management for credential sync and monitoring |

### @deepbrainspace/goodiebag

A comprehensive SurrealDB toolkit for NX monorepos featuring migration
management, dependency resolution, and extensible architecture.

**Key Features:**

- 🚀 Migration management with dependency resolution
- 🔄 Modular schema organization with topological sorting
- 🛡️ Safe rollbacks with dependency conflict detection
- 📊 Rich visualization with ASCII dependency trees
- 🎯 Smart targeting (index, name, number patterns)

**Quick Install:**

```bash
npm install @deepbrainspace/nx-surrealdb --save-dev
```

[**📖 Full Documentation →**](./packages/nx-surrealdb/README.md)

## Development

### Prerequisites

- **Node.js**: 18+ or 20+
- **pnpm**: 9.0.0+
- **NX CLI**: `npm install -g nx`
- **Rust**: 1.85+ (for claude-code package)

### Global Dependencies

- **Prettier**: Added for consistent code formatting across all project types
  (JSON, Rust, TypeScript)

### Repository Setup

```bash
# Clone and install
git clone https://github.com/deepbrainspace/goodiebag.git
cd goodiebag
pnpm install

# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Lint all packages
pnpm lint
```

### Automated Development Workflow (Husky)

This repository uses **Husky Git hooks** to automate code quality, security, and
workflow management:

#### Pre-commit Automation 🛡️

- **🚫 Main Branch Protection**: Blocks direct commits to main branch
- **🔍 Secret Detection**: Scans for potential API keys, tokens, and secrets
- **🔐 Git-crypt Validation**: Ensures encrypted files aren't committed
  unencrypted
- **✨ Auto-formatting**: Runs `nx format:write --uncommitted` on staged files

#### Commit Message Validation 📝

- **📋 Conventional Commits**: Enforces `type: description` or
  `type(scope): description` format
- **🎯 Valid Types**: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`
- **⚡ Auto-versioning**: Enables semantic versioning in CI/CD pipeline

#### Push-time Automation 🚀

- **📦 Lockfile Sync**: Automatically updates and commits `pnpm-lock.yaml` if
  out of sync
- **🔄 Zero Manual Intervention**: Lockfile changes are committed automatically
  with `--amend`

#### Branch Management 🌿

- **📥 Auto-install**: Runs `pnpm install` when switching branches with
  dependency changes
- **⚡ Smart Detection**: Only installs when `package.json` or workspace files
  change

#### What This Means for Developers

**Just code normally!** The automation handles:

- ✅ Code formatting and consistency
- ✅ Commit message validation
- ✅ Security scanning
- ✅ Dependency synchronization
- ✅ Workflow protection

**No manual steps needed** for formatting, linting setup, or lockfile
management.

### Intelligent Monorepo Design

**🎯 The Problem We Solved:** Traditional monorepos suffer from "build
everything" inefficiency. When you change one package, why rebuild 50 others?

**⚡ Our Solution - Affected-Only Operations:**

```bash
# Traditional approach (inefficient)
npm run build    # Builds ALL packages
npm run test     # Tests ALL packages
npm run publish  # Publishes ALL packages

# Goodie-Bag approach (intelligent)
nx affected --target=build   # Only builds what changed
nx affected --target=test    # Only tests affected packages
# CI publishes only affected packages automatically
```

**🔄 Change Detection Magic:**

- **Git-based Analysis**: NX analyzes file changes between commits
- **Dependency Graph**: Understands package relationships and downstream impacts
- **Selective Execution**: Only runs operations on packages that need them

**🏗️ Complete Ecosystem Architecture:**

```
goodiebag/
goodiebag/
├── packages/              # 📦 Publishable to npm
│   ├── nx-surrealdb/     # NX plugin for SurrealDB migrations
│   ├── mcp-server-*/     # Model Context Protocol servers
│   ├── cli-*/            # Command-line utilities
│   └── shared-*/         # Reusable libraries
├── apps/                 # 🚀 Deployable applications
│   ├── goodiebag-dev/    # Main showcase website
│   ├── membership/       # Developer community portal
│   ├── docs/             # Documentation site
│   └── admin-dashboard/  # Management interface
└── libs/                 # 🔧 Internal shared code
    ├── ui-components/    # React/Vue components
    ├── brand-assets/     # Design system & assets
    ├── shared-utils/     # Common utilities
    └── shared-types/     # TypeScript definitions
```

**🏗️ Quality Standards:**

- **Zero ESLint Warnings**: Blocks CI pipeline
- **Repository Pattern**: Clean data access layers
- **Independent Testing**: 278+ tests and growing
- **Self-Contained Packages**: No cross-package dependencies unless explicit

## CI/CD Pipeline

Our GitHub Actions pipeline provides simple, focused validation:

```
PR opened → lint, test, build (affected packages only)
```

**🧠 Intelligent Build Validation:**

- **Affected Analysis**: Only lints, tests, and builds packages that changed
- **PR Validation**: Ensures code quality before merge
- **Parallel Processing**: Multiple packages validated simultaneously

### Simple Release Process

We've simplified the release process to focus on what matters: **build
validation via CI** and **manual publishing via NX commands**.

#### Publishing Packages

```bash
# Single command does everything: version, changelog, tag, publish
nx release --projects=package-name

# Always preview first with dry-run
nx release --projects=package-name --dry-run
```

**Example: Publishing nx-surrealdb**

```bash
# Preview first (recommended)
nx release --projects=nx-surrealdb --dry-run

# Release with interactive version selection
nx release --projects=nx-surrealdb

# Or with specific version bump
nx release minor --projects=nx-surrealdb
```

**Example: Publishing multiple packages**

```bash
# Preview affected packages
nx release --dry-run

# Release all affected packages
nx release
```

### What NX Release Does

**`nx release` (complete release):**

- Analyzes conventional commits to determine version bump
- Updates package.json version
- Generates/updates CHANGELOG.md
- Creates git tag and commits changes
- Builds the package (if needed)
- Publishes to npm registry
- All in one command!

### Performance Benefits

- **~50% faster CI** through affected-only validation
- **Simple Developer Experience**: Two commands to release
- **Independent Lifecycles**: Each package maintains its own version
- **Smart Failure Isolation**: One package failure doesn't block others
- **Local Control**: Test and validate before publishing

### Environment Variables

Required for CI/CD and manual publishing. Copy `.env.example` to `.env` and fill
in your values:

```bash
# Copy template and edit
cp .env.example .env
# Edit .env with your actual tokens

# Required tokens:
NPM_TOKEN=npm_xxxxxxxxxxxx        # npm publishing
GITHUB_TOKEN=ghp_xxxxxxxxxxxx    # GitHub releases
NX_CLOUD_ACCESS_TOKEN=xxxxxxx    # Optional: distributed caching
```

**🔐 Security Note**: The `.env` file is encrypted with
[git-crypt](https://github.com/AGWA/git-crypt) when committed to the repository.
Use `.env.example` as a template for local development.

Both npm packages and GitHub release artifacts are created, providing multiple
distribution channels and backup options.

## Contributing

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Follow** patterns in existing packages
4. **Add** comprehensive tests
5. **Ensure** zero ESLint warnings: `pnpm lint`
6. **Run** full test suite: `pnpm test`
7. **Submit** pull request with clear description

### Merge Policy: Regular Merges Only

**⚠️ Important**: This repository uses **regular merges** instead of squash
merges to preserve granular conventional commit history for proper semantic
versioning.

**Why Regular Merges?**

- **Preserves individual commits** with proper conventional commit prefixes
  (`feat:`, `fix:`, `perf:`)
- **Enables accurate semantic versioning** - NX can detect version-worthy
  changes per package
- **Maintains audit trail** - each logical change has its own commit with proper
  scope
- **Prevents version detection issues** - squash merges collapse multiple
  semantic changes into single commits

**Conventional Commit Examples:**

```bash
feat(claude-code-toolkit): add new sync functionality
fix(nx-surrealdb): resolve connection timeout issue
perf(claude-code-toolkit): optimize binary size by 62%
docs(README): update contribution guidelines
```

**Branch Strategy:**

```bash
# ✅ Good - individual commits preserved
git checkout -b feat/add-sync-feature
git commit -m "feat(claude-code-toolkit): add sync service"
git commit -m "test(claude-code-toolkit): add sync service tests"
git commit -m "docs(claude-code-toolkit): document sync functionality"
# PR merged with regular merge → NX detects feat: for minor version bump

# ❌ Problematic - squash merge loses granular history
# Multiple semantic changes → single "docs:" commit → no version bump detected
```

When reviewing PRs, maintainers will use **"Create a merge commit"** option to
preserve the individual commit history essential for automated versioning.

### Goodie-Bag Standards

- ✅ **Zero ESLint warnings** policy (blocks CI)
- ✅ **Repository Pattern** for data access layers
- ✅ **Comprehensive testing** (aim for >90% coverage per package)
- ✅ **TypeScript strict mode** for all packages
- ✅ **Self-contained packages** with independent configurations
- ✅ **Affected-only operations** (never waste CI cycles)
- ✅ **Independent versioning** (semantic versioning per package)
- ✅ **Production-ready quality** (every package is release-ready)

### Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **Major** (v1.0.0): Breaking changes
- **Minor** (v0.1.0): New features, backwards compatible
- **Patch** (v0.0.1): Bug fixes, backwards compatible

## Architecture & Package Documentation

### Repository Architecture

- **Monorepo Strategy**: Flat package structure for simplicity
- **NX Workspace**: Intelligent build orchestration and dependency management
- **Affected Operations**: Git-based change detection with dependency graph
  analysis
- **Independent Lifecycles**: Each package maintains its own version, tests, and
  releases

### Individual Package Docs

- [nx-surrealdb Architecture](./packages/nx-surrealdb/ARCHITECTURE.md) - NX
  plugin technical design
- [nx-surrealdb CLAUDE.md](./packages/nx-surrealdb/CLAUDE.md) - Development
  patterns and guide
- [Security Guide](./docs/SECURITY.md) - Environment variables and git-crypt
  setup

### Adding New Packages

Ready to add your next utility to the goodie-bag? The monorepo automatically
handles:

1. **Create** `packages/your-package/` or `apps/your-app/` directory
2. **Add** appropriate targets to `project.json` (`publish` for packages,
   `deploy` for apps)
3. **Commit** changes
4. **Done!** CI/CD automatically detects and manages the new package/app

### Future: AI-Driven Intelligent Releases 🤖

**The Vision:** Eliminate manual version management entirely through AI-powered
semantic analysis!

#### **Phase 1: Claude Code Release MCP**

Interactive release management through Claude Code:

```bash
# Conversational release interface
> @release list affected packages
> @release analyze changes for nx-surrealdb
> @release preview nx-surrealdb --auto-version
> @release create nx-surrealdb-v1.2.0
```

#### **Phase 2: Autonomous AI Release Agent** 🧠

Zero-human-intervention releases with AI-powered diff analysis:

```bash
# After PR merge to main → AI agent automatically:
1. 🔍 Analyzes git diff for each affected package
2. 🧠 Determines semantic version type:
   - BREAKING CHANGE → Major (v2.0.0)
   - feat: new feature → Minor (v1.1.0)
   - fix: bug fix → Patch (v1.0.1)
3. 🏷️ Creates package-specific tags: nx-surrealdb-v1.2.0
4. 🚀 Triggers automated CI/CD release
5. 📝 Generates intelligent release notes from commits
```

**AI Analysis Capabilities:**

- **API Breaking Changes**: Detect method signature changes, removed exports
- **Feature Detection**: Identify new public APIs, added functionality
- **Bug Fix Recognition**: Parse fix commits and issue references
- **Dependency Impact**: Analyze package.json changes for version bumps
- **Documentation Changes**: Distinguish docs-only changes (no version bump)

**Smart Patterns:**

```bash
# AI detects patterns like:
export function newFeature() → Minor bump
export function existingApi(newParam: string) → Major bump
// fix: resolve memory leak → Patch bump
docs: update README → No version bump
```

**Workflow:**

1. **PR Merges** → AI agent activates
2. **Diff Analysis** → Determines affected packages + version types
3. **Auto-Tagging** → Creates `package-name-vX.Y.Z` tags
4. **Zero Human Input** → Releases happen automatically
5. **Human Override** → Optional manual review for edge cases

This would transform goodie-bag into a **self-managing release ecosystem** where
developers focus on code, and AI handles all version management!

## License

MIT License - see [LICENSE](LICENSE) file for details.
