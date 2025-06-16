# DeepBrain NX Plugins

A monorepo of specialized NX plugins for ANY projects that wants to incorporate NX, featuring robust CI/CD, comprehensive testing, and production-ready tooling.

## Repository Overview

This repository demonstrates modern NX plugin development with:
- **Optimized CI/CD Pipeline**: Parallel execution with ~50% faster builds
- **Dual Distribution**: npm registry + GitHub releases with artifacts
- **Quality Gates**: Zero-warning ESLint, 278+ tests, TypeScript compilation
- **Repository Pattern**: Clean architecture with Domain-Driven Design

## The Goodie-Bag Collection

| Package | Type | Version | Description |
|---------|------|---------|-------------|
| [`@deepbrainspace/nx-surrealdb`](./packages/nx-surrealdb) | NX Plugin | ![npm](https://img.shields.io/npm/v/@deepbrainspace/nx-surrealdb) | SurrealDB migrations with modular architecture |

*Coming soon: MCP servers, CLI utilities, and more developer tools...*

### @deepbrainspace/nx-surrealdb

A comprehensive SurrealDB toolkit for NX monorepos featuring migration management, dependency resolution, and extensible architecture.

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

### Repository Setup
```bash
# Clone and install
git clone https://github.com/deepbrainspace/nx-plugins.git
cd nx-plugins
pnpm install

# Build all packages
pnpm build

# Run tests across all packages
pnpm test

# Lint all packages
pnpm lint
```

### Intelligent Monorepo Design

**🎯 The Problem We Solved:**
Traditional monorepos suffer from "build everything" inefficiency. When you change one package, why rebuild 50 others?

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

**📦 Package Architecture Patterns:**

```
packages/
├── nx-surrealdb/           # NX Plugin
│   ├── executors/          # Migration commands
│   ├── generators/         # Scaffolding tools
│   └── lib/               # Core business logic
├── mcp-server-*/          # MCP Servers (coming soon)
├── cli-*/                 # CLI utilities (coming soon)
└── shared-*/              # Shared libraries
```

**🏗️ Quality Standards:**
- **Zero ESLint Warnings**: Blocks CI pipeline
- **Repository Pattern**: Clean data access layers
- **Independent Testing**: 278+ tests and growing
- **Self-Contained Packages**: No cross-package dependencies unless explicit

## CI/CD Pipeline

Our CircleCI pipeline demonstrates production-grade monorepo CI/CD with intelligent package detection:

```
   dependencies
       ├── lint ──┐
       └── test ──┼── build ──┬── npm-publish
                  │           └── github-release
```

**🧠 Intelligent Package Detection:**
- **Affected Analysis**: Only processes packages that changed
- **Independent Publishing**: Each package gets its own version and release
- **Parallel Processing**: Multiple packages can publish simultaneously
- **Smart Tagging**: GitHub releases tagged per package: `nx-surrealdb-v1.0.0`, `mcp-claude-v2.1.0`

### Intelligent Pipeline Stages

1. **`dependencies`** - Install pnpm and workspace dependencies
2. **`lint` + `test`** - Run in parallel on affected packages only
   - **lint**: ESLint checks with zero-warning policy
   - **test**: Jest tests with coverage requirements
3. **`build`** - Compile only affected packages (requires both lint and test)
4. **`npm-publish` + `github-release`** - Publish affected packages in parallel
   - **npm-publish**: Independent versioning and publishing per package
   - **github-release**: Individual GitHub releases with package-specific tags

### Triggers

- **Production Release**: Push git tag (e.g., `v1.0.0`)
  - Publishes to npm with production tag
  - Creates GitHub release with version tag
- **Beta Release**: Merge to `main` branch
  - Auto-bumps patch version
  - Publishes to npm with `beta` tag
  - Creates GitHub prerelease

### Performance & Efficiency Benefits

- **~50% faster CI** through parallel execution and affected-only builds
- **Massive Resource Savings**: Only process what actually changed
- **Independent Package Lifecycles**: Update one tool without affecting others
- **Rapid Iteration**: Change MCP server without rebuilding NX plugins
- **Scalable Growth**: Add 100 packages without slowing down CI
- **Smart Failure Isolation**: One package failure doesn't block others
- **Artifact Redundancy**: Both npm registry and GitHub releases per package

### Manual Release Process

For testing artifacts before CI/CD or emergency releases:

```bash
# 1. Build the package
nx build nx-surrealdb

# 2. Navigate to package directory
cd packages/nx-surrealdb

# 3. Create and test tarball locally
npm pack
tar -tzf *.tgz  # Inspect contents

# 4. Test installation locally
cd /tmp && npm init -y
npm install /path/to/nx-plugins/packages/nx-surrealdb/*.tgz

# 5. Manual publish (if needed)
npm login
npm publish                    # Production
npm publish --tag beta        # Beta release

# 6. Create GitHub release with artifact
gh release create v1.0.0 *.tgz \
  --title "Release v1.0.0" \
  --notes "Manual release description"
```

### Environment Variables

Required for CI/CD and manual publishing. Copy `.env.example` to `.env` and fill in your values:

```bash
# Copy template and edit
cp .env.example .env
# Edit .env with your actual tokens

# Required tokens:
NPM_TOKEN=npm_xxxxxxxxxxxx        # npm publishing
GITHUB_TOKEN=ghp_xxxxxxxxxxxx    # GitHub releases
NX_CLOUD_ACCESS_TOKEN=xxxxxxx    # Optional: distributed caching
```

**🔐 Security Note**: The `.env` file is encrypted with [git-crypt](https://github.com/AGWA/git-crypt) when committed to the repository. Use `.env.example` as a template for local development.

Both npm packages and GitHub release artifacts are created, providing multiple distribution channels and backup options.

## Contributing

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Follow** patterns in existing packages
4. **Add** comprehensive tests
5. **Ensure** zero ESLint warnings: `pnpm lint`
6. **Run** full test suite: `pnpm test`
7. **Submit** pull request with clear description

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
- **Affected Operations**: Git-based change detection with dependency graph analysis
- **Independent Lifecycles**: Each package maintains its own version, tests, and releases

### Individual Package Docs
- [nx-surrealdb Architecture](./packages/nx-surrealdb/ARCHITECTURE.md) - NX plugin technical design
- [nx-surrealdb CLAUDE.md](./packages/nx-surrealdb/CLAUDE.md) - Development patterns and guide
- [Security Guide](./docs/SECURITY.md) - Environment variables and git-crypt setup

### Adding New Packages
Ready to add your next utility to the goodie-bag? The monorepo automatically handles:
1. **Create** `packages/your-package/` directory
2. **Add** `publish` target to `project.json`  
3. **Commit** changes
4. **Done!** CI/CD automatically detects and manages the new package

## License

MIT License - see [LICENSE](LICENSE) file for details.