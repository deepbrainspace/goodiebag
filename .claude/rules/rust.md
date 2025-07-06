# Rust Rules

- ⚠️ **NEVER run cargo commands from repository root** (creates root target/
  folder)
- ✅ Always use NX commands: `nx build claude-code`, `nx test claude-code`
- ✅ If using cargo directly, always `cd packages/claude-code-toolkit` first
- Keep build artifacts in package directories only
