# Changelog

## [3.1.0]

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
