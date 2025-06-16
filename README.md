# DeepBrain NX Plugins

A monorepo of specialized NX plugins for DeepBrain projects, featuring robust CI/CD, comprehensive testing, and production-ready tooling.

## Repository Overview

This repository demonstrates modern NX plugin development with:
- **Optimized CI/CD Pipeline**: Parallel execution with ~50% faster builds
- **Dual Distribution**: npm registry + GitHub releases with artifacts
- **Quality Gates**: Zero-warning ESLint, 278+ tests, TypeScript compilation
- **Repository Pattern**: Clean architecture with Domain-Driven Design

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@deepbrainspace/nx-surrealdb`](./packages/nx-surrealdb) | ![npm](https://img.shields.io/npm/v/@deepbrainspace/nx-surrealdb) | SurrealDB migrations with modular architecture |

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

### NX Plugin Development Patterns

Key learnings from building production NX plugins:

**🏗️ Architecture Patterns:**
- **Repository Pattern**: Separate data access from business logic
- **Domain-Driven Design**: Clear layer boundaries and responsibilities
- **Self-Contained Packages**: Independent configurations and dependencies

**🔧 Build Configuration:**
- **TypeScript Compilation**: Use `@nx/js:tsc` for clean builds
- **Asset Copying**: Include schemas, templates, and metadata files
- **Independent ESLint**: Flat config format with workspace path handling

**📦 Package Structure:**
```
packages/plugin-name/
├── src/
│   ├── executors/           # NX executors (migrate, status, etc.)
│   ├── generators/          # NX generators (init, migration, etc.)
│   └── lib/                # Core business logic
├── executors.json          # Executor definitions
├── generators.json         # Generator definitions
└── package.json           # Self-contained dependencies
```

**⚡ Testing Strategy:**
- **278+ test cases** across all components
- **Mock-based testing** for external dependencies
- **Integration tests** for executor/generator workflows
- **TypeScript strict mode** for compile-time safety

## CI/CD Pipeline

Our CircleCI pipeline is optimized for speed and reliability with parallel job execution:

```
   dependencies
       ├── lint ──┐
       └── test ──┼── build ──┬── npm-publish
                  │           └── github-release
```
       └── test ──┼── build ──┬── npm-publish
                  │           └── github-release
```

### Pipeline Stages

1. **`dependencies`** - Install pnpm and project dependencies
2. **`lint` + `test`** - Run in parallel after dependencies complete
   - **lint**: ESLint checks across all packages
   - **test**: Jest tests with coverage reporting
3. **`build`** - Compile TypeScript and prepare distribution files (requires both lint and test)
4. **`npm-publish` + `github-release`** - Run in parallel after successful build
   - **npm-publish**: Version bump and publish to npm registry
   - **github-release**: Create GitHub release with tarball artifacts

### Triggers

- **Production Release**: Push git tag (e.g., `v1.0.0`)
  - Publishes to npm with production tag
  - Creates GitHub release with version tag
- **Beta Release**: Merge to `main` branch
  - Auto-bumps patch version
  - Publishes to npm with `beta` tag
  - Creates GitHub prerelease

### Performance Benefits

- **~50% faster CI** through parallel execution
- **Independent failure modes** for publishing vs releases
- **Early failure detection** with lint-first approach
- **Artifact redundancy** via both npm registry and GitHub releases

Both npm packages and GitHub release artifacts are created, providing multiple distribution channels and backup options.

## Contributing

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Follow** patterns in existing packages
4. **Add** comprehensive tests
5. **Ensure** zero ESLint warnings: `pnpm lint`
6. **Run** full test suite: `pnpm test`
7. **Submit** pull request with clear description

### Repository Standards

- ✅ **Zero ESLint warnings** policy
- ✅ **Repository Pattern** for data access
- ✅ **Comprehensive testing** (aim for >90% coverage)
- ✅ **TypeScript strict mode** for all code
- ✅ **Self-contained packages** with independent configs

### Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **Major** (v1.0.0): Breaking changes
- **Minor** (v0.1.0): New features, backwards compatible
- **Patch** (v0.0.1): Bug fixes, backwards compatible

## Architecture

See individual package documentation:
- [nx-surrealdb Architecture](./packages/nx-surrealdb/ARCHITECTURE.md)
- [nx-surrealdb CLAUDE.md](./packages/nx-surrealdb/CLAUDE.md) - Development guide

## License

MIT License - see [LICENSE](LICENSE) file for details.