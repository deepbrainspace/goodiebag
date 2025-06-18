# CLAUDE.md - Claude Code Package Development Guide

## Critical Rule: Package-Level Cargo Commands Only

**⚠️ NEVER run cargo commands from the repository root!**

### ✅ Correct Approach - Always use NX commands:
```bash
# Build, test, lint from repository root using NX
nx build claude-code
nx test claude-code  
nx lint claude-code
nx run claude-code:fmt
```

### ❌ Wrong Approach - Direct cargo commands from root:
```bash
# DON'T DO THIS - Creates root-level target/ folder
cargo build           # Creates ./target/ (BAD!)
cargo test            # Creates ./target/ (BAD!)
cargo run             # Creates ./target/ (BAD!)
```

### ✅ If you must use cargo directly:
```bash
# Only run cargo from the package directory
cd packages/claude-code
cargo build           # Creates packages/claude-code/target/ (GOOD!)
cargo test
cargo run
```

## Why This Matters

Running cargo from the repository root creates a `target/` folder at the root level, which:
- Violates the monorepo structure (Rust artifacts should be in package folders)
- Causes repository bloat (build artifacts get accidentally committed)
- Conflicts with NX workspace management
- Creates confusion about which package owns the artifacts

The root `target/` folder can contain 10,000+ files and 1+ GB of build artifacts that should never be in git.

## Repository Architecture Rules

1. **Use NX commands**: Always prefer `nx build claude-code` over `cargo build`
2. **Package isolation**: Each Rust package should have its own `target/` directory
3. **Root level clean**: No build artifacts at repository root level
4. **Workspace management**: Let NX handle orchestration and caching

## NX Configuration

The claude-code package is configured with proper `cwd` settings in `project.json`:

```json
{
  "build": {
    "executor": "nx:run-commands",
    "options": {
      "command": "cargo build --release",
      "cwd": "packages/claude-code"  // Ensures cargo runs in package directory
    }
  }
}
```

This ensures all cargo commands execute in the correct package directory, creating `packages/claude-code/target/` instead of `./target/`.

## Emergency Cleanup

If you accidentally create a root `target/` folder:

1. Stop all cargo processes
2. Remove from git: `git rm -r target/`
3. Delete locally: `rm -rf target/`
4. Use NX commands going forward

Remember: **JARVIS prefers elegant solutions that maintain workspace integrity, Sir.**