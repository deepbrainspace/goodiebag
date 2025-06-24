## 3.1.0 (2025-06-24)

### 🚀 Features

- ⚠️  simplify release system to use direct NX commands ([e0e7d86](https://github.com/deepbrainspace/goodiebag/commit/e0e7d86))
- implement PR-based release pipeline with cross-workflow artifacts ([04eae2c](https://github.com/deepbrainspace/goodiebag/commit/04eae2c))

### 🩹 Fixes

- removed extra changelog ([bd12dd3](https://github.com/deepbrainspace/goodiebag/commit/bd12dd3))
- fix the nx-rust to the correct version ([1885a16](https://github.com/deepbrainspace/goodiebag/commit/1885a16))
- **nx-rust:** reset version to 3.0.2 to match latest git tag ([5ab05e9](https://github.com/deepbrainspace/goodiebag/commit/5ab05e9))
- pr fixes ([f968574](https://github.com/deepbrainspace/goodiebag/commit/f968574))
- resolve release workflow dist/ artifact sharing issues ([#35](https://github.com/deepbrainspace/goodiebag/pull/35))
- remove circular self-dependency from nx-rust package ([6707c1b](https://github.com/deepbrainspace/goodiebag/commit/6707c1b))
- exclude build artifacts from prettier formatting ([c5758d8](https://github.com/deepbrainspace/goodiebag/commit/c5758d8))

### ⚠️  Breaking Changes

- Automated release workflows removed, now requires manual nx release commands

### ❤️ Thank You

- DeepBrain
- nayeem.ai @wizardsupreme
- wizard supreme @wizardsupreme

## [3.0.2]

### Added

- **Essential executors**: `fmt`, `clean` executors for complete Rust workflow
- **Enhanced debugging**: Verbose logging support across all executors
- **Smart workspace detection**: Automatically adapts to workspace vs
  independent project setups
- **Modern NX integration**: Built with NX v21+ APIs for future compatibility
- **Pure Cargo.toml versioning**: Release workflows without requiring
  package.json files
- **Streamlined architecture**: Focused on core Rust development workflows
- **Improved TypeScript implementation**: Type-safe TOML parsing and modern
  tooling
- **Enhanced error handling**: More descriptive error messages with actionable
  guidance
- **Workspace flexibility**: No longer requires root Cargo.toml for independent
  projects
- **Release integration**: Proper integration with modern NX release system
- **Project detection**: Intelligent `-p` flag usage based on actual workspace
  structure
- **Package structure**: Resolved workspace-level dist and build artifact issues

### Removed

- **BREAKING**: Temporarily removed NAPI generators, WASM generators, and preset
  generators

### Migration Guide

This version focuses on core Rust development workflows.

---

## Historical Foundation

This package is based on the excellent work from the
[Monodon](https://github.com/Cammisuli/monodon) project by Jonathan Cammisuli
and contributors. We're grateful for their foundational Rust tooling for NX
workspaces that made this project possible.

For the complete historical changelog of the original Monodon project, please
visit:
[https://github.com/Cammisuli/monodon/blob/main/packages/rust/CHANGELOG.md](https://github.com/Cammisuli/monodon/blob/main/packages/rust/CHANGELOG.md)

---

## ❤️ Thank You

- nayeem.ai
- wizard supreme

All development and contributions to this package.
