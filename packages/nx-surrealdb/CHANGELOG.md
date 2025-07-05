## 0.4.0 (2025-07-05)

### 🚀 Features

- **nx-surrealdb:** add destroy generator with interactive confirmation
  ([99b0045](https://github.com/deepbrainspace/goodiebag/commit/99b0045))
- **nx-surrealdb:** add config system for status command detailed mode
  ([70562bc](https://github.com/deepbrainspace/goodiebag/commit/70562bc))
- **nx-surrealdb:** implement component-based project naming
  ([9836795](https://github.com/deepbrainspace/goodiebag/commit/9836795))
- **nx-surrealdb:** implement clean init generator with path separation
  ([0e941dd](https://github.com/deepbrainspace/goodiebag/commit/0e941dd))
- moved unused or half done packages to archive repo
  ([6ba0cfb](https://github.com/deepbrainspace/goodiebag/commit/6ba0cfb))

### 🩹 Fixes

- **nx-surrealdb:** simplify export/import generators to use direct tar archives
  ([fa7656f](https://github.com/deepbrainspace/goodiebag/commit/fa7656f))
- **nx-surrealdb:** standardize migration generator with schema.d.ts and fix
  directory structure
  ([ac9d017](https://github.com/deepbrainspace/goodiebag/commit/ac9d017))
- rename template files to prevent NX auto-discovery
  ([d826906](https://github.com/deepbrainspace/goodiebag/commit/d826906))
- **nx-surrealdb:** correct surrealdb dependency version
  ([c5f4fe0](https://github.com/deepbrainspace/goodiebag/commit/c5f4fe0))
- **nx-surrealdb:** add lint and test targets for CI compatibility
  ([9299cf1](https://github.com/deepbrainspace/goodiebag/commit/9299cf1))
- **nx-surrealdb:** correct file paths in generators and executors JSON
  ([00a12c8](https://github.com/deepbrainspace/goodiebag/commit/00a12c8))

### ❤️ Thank You

- DeepBrain

## 0.3.4 (2025-06-24)

### 🩹 Fixes

- pr fixes
  ([e39ea52](https://github.com/deepbrainspace/goodiebag/commit/e39ea52))
- pr fixes
  ([f968574](https://github.com/deepbrainspace/goodiebag/commit/f968574))
- updated changelog in nx-surrealdb
  ([8adb4d2](https://github.com/deepbrainspace/goodiebag/commit/8adb4d2))
- tidy up nx.json
  ([4906c3a](https://github.com/deepbrainspace/goodiebag/commit/4906c3a))
- surrealdb release version
  ([443a4a3](https://github.com/deepbrainspace/goodiebag/commit/443a4a3))
- exclude build artifacts from prettier formatting
  ([c5758d8](https://github.com/deepbrainspace/goodiebag/commit/c5758d8))
- use workspace-level dist for nx plugins to resolve package structure issues
  ([#29](https://github.com/deepbrainspace/goodiebag/pull/29))

### ❤️ Thank You

- nayeem.ai @wizardsupreme
- wizard supreme @wizardsupreme

# Changelog

## [0.3.0]

### Added

- **NX Plugin**: Complete NX plugin for SurrealDB migrations with repository
  pattern architecture
- **Migration Management**: Create, apply, rollback, and track migrations with
  dependency resolution
- **Module System**: Organize migrations by feature modules with dependency
  management
- **Smart Generators**: Initialize projects, create migrations, and manage
  module imports/exports
- **Configuration System**: YAML/JSON configuration with auto-discovery and
  validation
- **Development Tools**: Built-in status reporting, reset functionality, and
  comprehensive error handling
- **Repository Pattern**: Clean separation of concerns with domain-driven design
- **Dependency Resolution**: Topological sorting for safe migration execution
- **Build System**: Optimized for NX workspace integration
- **Package Structure**: Resolved dist/ artifacts and workspace-level
  distribution issues
- **Schema Files**: Ensure .surql files are properly copied during build process
- **Release Integration**: Proper integration with NX release system and
  workflows

---

## ❤️ Thank You

- nayeem.ai
- wizard supreme

All development and contributions to this package.
