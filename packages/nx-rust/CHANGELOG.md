# Changelog

## 3.0.0-alpha.3 (2025-06-21)

### 🩹 Fixes

- use workspace-level dist for nx plugins to resolve package structure issues
  ([#29](https://github.com/deepbrainspace/goodiebag/pull/29))

### ❤️ Thank You

- nayeem.ai

## 3.0.0-alpha.2 (2025-06-21)

### 🚀 Features

- upgrade nx-rust for Nx 21 compatibility and enhance README
  ([27c2019](https://github.com/deepbrainspace/goodiebag/commit/27c2019))

### 🩹 Fixes

- correct package.json exports for published package structure
  ([a666fcc](https://github.com/deepbrainspace/goodiebag/commit/a666fcc))

### ❤️ Thank You

- wizard supreme

## 3.0.0-alpha.1 (2025-06-20)

### 🩹 Fixes

- resolve workspace path issue in nx-rust release-version tests
  ([c008093](https://github.com/deepbrainspace/goodiebag/commit/c008093))

### ❤️ Thank You

- wizard supreme

## 3.0.0-alpha.0 (2025-06-20)

### 🚀 Features

- enhance release workflow and prepare nx-rust v3.0.0
  ([#24](https://github.com/deepbrainspace/goodiebag/pull/24))

### 🩹 Fixes

- configure proper version resolvers for release groups
  ([34abfe3](https://github.com/deepbrainspace/goodiebag/commit/34abfe3))

### ❤️ Thank You

- nayeem.ai
- wizard supreme

## [3.0.0] - 2024-12-20

### Added

- **Essential executors**: `fmt`, `clean` executors for complete Rust workflow
- **Enhanced debugging**: Verbose logging support across all executors
- **Smart workspace detection**: Automatically adapts to workspace vs
  independent project setups
- **Modern NX integration**: Built with NX v21+ APIs for future compatibility
- **Pure Cargo.toml versioning**: Release workflows without requiring
  package.json files

### Changed

- **BREAKING**: Streamlined architecture focused on core Rust development
- **BREAKING**: Improved TypeScript implementation with type-safe TOML parsing
- **BREAKING**: Simplified dependencies, uses `picocolors` instead of `chalk`
- **Enhanced error handling**: More descriptive error messages with actionable
  guidance

### Removed

- **BREAKING**: Temporarily removed NAPI generators (planned for v3.1.0)
- **BREAKING**: Temporarily removed WASM generators (planned for v3.1.0)
- **BREAKING**: Temporarily removed preset generators (planned for v3.2.0)

### Fixed

- **Workspace flexibility**: No longer requires root Cargo.toml for independent
  projects
- **Release integration**: Proper integration with modern NX release system
- **Project detection**: Intelligent `-p` flag usage based on actual workspace
  structure

### Migration Guide

This version focuses on core Rust development workflows. NAPI and WASM
generators will be restored in upcoming releases with improved implementation.

---

## Historical Foundation

This package is based on the excellent work from the
[Monodon](https://github.com/Cammisuli/monodon) project by Jonathan Cammisuli
and contributors. We're grateful for their foundational Rust tooling for NX
workspaces that made this project possible.

**Major changes from Monodon v2.3.0:**

- Updated for NX 21+ compatibility
- Streamlined architecture focused on core Rust workflows
- Enhanced TypeScript implementation with modern tooling
- Improved workspace detection and flexibility
- Modern release system integration

For the complete historical changelog of the original Monodon project, please
visit:
[https://github.com/Cammisuli/monodon/blob/main/packages/rust/CHANGELOG.md](https://github.com/Cammisuli/monodon/blob/main/packages/rust/CHANGELOG.md)
