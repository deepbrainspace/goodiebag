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

| Package/App                                               | Type      | Version                                                           | Description                                    |
| --------------------------------------------------------- | --------- | ----------------------------------------------------------------- | ---------------------------------------------- |
| [`@deepbrainspace/nx-surrealdb`](./packages/nx-surrealdb) | NX Plugin | ![npm](https://img.shields.io/npm/v/@deepbrainspace/nx-surrealdb) | SurrealDB migrations with modular architecture |

### Coming Soon to the Goodie-Bag 🎒

**📦 Packages (Publishable to npm):**

- `@deepbrainspace/mcp-server-*` - Model Context Protocol servers
- `@deepbrainspace/cli-*` - Command-line utilities and tools
- `@deepbrainspace/nx-*` - Additional NX plugins for various databases/services
- `@deepbrainspace/shared-*` - Reusable utility libraries

**🚀 Apps (Deployable Applications):**

- `goodiebag-dev` - Main website showcasing all tools
- `membership` - Developer membership and community portal
- `docs` - Comprehensive documentation site
- `admin-dashboard` - Management interface for tools and users

**🔧 Libs (Internal Shared Libraries):**

- `ui-components` - Reusable React/Vue components
- `brand-assets` - Logos, icons, design system
- `shared-utils` - Common utilities across packages/apps
- `shared-types` - TypeScript definitions for the ecosystem

**🤖 Planned Innovation:**

- **AI Release Agent** - Autonomous version management through diff analysis
- **Inter-Package Intelligence** - Smart dependency updates across the monorepo
- **Usage Analytics** - Understanding how developers use the goodie-bag tools

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

Our GitHub Actions pipeline demonstrates production-grade monorepo CI/CD with
intelligent package detection:

> 📖
> **[View Complete Release Process Documentation →](./docs/RELEASE-PROCESS.md)**

```
   dependencies
       ├── lint ──┐
       └── test ──┼── build ──┬── npm-publish
                  │           └── github-release
```

**🧠 Intelligent Package Detection:**

- **Affected Analysis**: Only processes packages/apps that changed
- **Independent Lifecycles**: Each package gets its own version and release
  cycle
- **Parallel Processing**: Multiple packages can publish/deploy simultaneously
- **Smart Tagging**: Individual releases: `nx-surrealdb-v1.0.0`,
  `goodiebag-dev-v2.1.0`
- **Future AI**: Automated semantic version detection through diff analysis

### Intelligent Pipeline Stages

1. **`dependencies`** - Install pnpm and workspace dependencies
2. **`lint` + `test`** - Run in parallel on affected packages only
   - **lint**: ESLint checks with zero-warning policy
   - **test**: Jest tests with coverage requirements
3. **`build`** - Compile only affected packages (requires both lint and test)
4. **`npm-publish` + `github-release`** - Publish affected packages in parallel
   - **npm-publish**: Independent versioning and publishing per package
   - **github-release**: Individual GitHub releases with package-specific tags

### Release Triggers

- **Production Release**: Push package-specific tag

  ```bash
  git tag nx-surrealdb-v1.2.0 && git push origin nx-surrealdb-v1.2.0
  git tag mcp-server-claude-v2.1.0 && git push origin mcp-server-claude-v2.1.0
  git tag goodiebag-dev-v1.0.0 && git push origin goodiebag-dev-v1.0.0
  ```

  - Only publishes the specific package mentioned in the tag
  - Sets exact version from tag
  - Creates GitHub release with package-specific tag

- **Beta Release**: Merge to `main` branch
  - Auto-bumps patch version for affected packages only
  - Publishes affected packages to npm with `beta` tag
  - Creates GitHub prereleases for each affected package

### Performance & Efficiency Benefits

- **~50% faster CI** through parallel execution and affected-only builds
- **Massive Resource Savings**: Only process what actually changed (packages +
  apps)
- **Independent Lifecycles**: Update website without affecting NX plugins
- **Rapid Iteration**: Change MCP server without rebuilding documentation site
- **Infinite Scalability**: Add 100+ packages/apps without slowing down CI
- **Smart Failure Isolation**: One package/app failure doesn't block others
- **Multi-Channel Distribution**: npm packages + app deployments + GitHub
  releases
- **Future AI Efficiency**: Autonomous releases eliminate manual version
  management overhead

### Manual Release Process

For testing artifacts before CI/CD or emergency releases:

```bash
# 1. Build specific package
nx build package-name

# 2. Navigate to package directory
cd packages/package-name

# 3. Create and test tarball locally
npm pack
tar -tzf *.tgz  # Inspect contents

# 4. Test installation locally
cd /tmp && npm init -y
npm install /path/to/goodie-bag/packages/package-name/*.tgz

# 5. Manual publish (if needed)
npm login
npm publish                    # Production
npm publish --tag beta        # Beta release

# 6. Create package-specific tag for CI/CD
git tag package-name-v1.0.0
git push origin package-name-v1.0.0  # Triggers automated release

# 7. Or manual GitHub release
gh release create package-name-v1.0.0 *.tgz \
  --title "Release package-name v1.0.0" \
  --notes "Manual release description"
```

### Release Examples

```bash
# Release NX plugin
git tag nx-surrealdb-v1.2.0 && git push origin nx-surrealdb-v1.2.0

# Release MCP server
git tag mcp-server-claude-v2.1.0 && git push origin mcp-server-claude-v2.1.0

# Release website
git tag goodiebag-dev-v1.0.0 && git push origin goodiebag-dev-v1.0.0
```

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
