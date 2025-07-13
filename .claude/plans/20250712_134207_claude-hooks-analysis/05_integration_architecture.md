# Claude Code Hooks Integration Architecture

## Critical Understanding: Two Separate Hook Systems

### How Claude Hooks Actually Work

**Important**: Claude Code hooks are NOT embedded inside Husky hooks. They are
completely separate systems that operate at different trigger points.

### Husky Hooks (Git-Level)

**Location**: `.husky/` directory in repository  
**Triggers**: When YOU manually run git operations (commit, push, checkout,
etc.)  
**Purpose**: Code quality, security, formatting  
**Scope**: Repository-wide, affects all developers **Example**: When you run
`git commit` in terminal → Husky pre-commit hook runs

**Current Husky Hooks**:

- `pre-commit`: Branch protection, secret detection, formatting
- `commit-msg`: Conventional commit validation
- `post-checkout`: Dependency management
- `pre-push`: Lockfile validation

### Claude Code Hooks (Claude-Level)

**Location**: `~/.claude/settings.json` or project-specific config  
**Triggers**: When CLAUDE uses tools during our sessions (Edit, Bash, etc.)  
**Purpose**: Workflow intelligence, automation enhancement  
**Scope**: Claude Code sessions only **Example**: When I run `gh pr create` →
Claude PostToolUse hook runs

**Available Claude Hook Types**:

- `PreToolUse`: Before Claude uses a tool
- `PostToolUse`: After Claude completes tool usage
- `Notification`: When Claude needs user input
- `Stop`: When Claude finishes responding
- `SubagentStop`: When subagent completes
- `PreCompact`: Before context compaction

## Integration Architecture Diagram

```
Git Operations          Claude Code Operations
      ↓                         ↓
┌─────────────────┐    ┌─────────────────┐
│   Husky Hooks   │    │ Claude Hooks    │
│                 │    │                 │
│ • pre-commit    │    │ • PreToolUse    │
│ • commit-msg    │    │ • PostToolUse   │
│ • post-checkout │    │ • Notification  │
│ • pre-push      │    │ • Stop          │
└─────────────────┘    └─────────────────┘
      ↓                         ↓
┌─────────────────┐    ┌─────────────────┐
│   Git Safety    │    │ Workflow Intel  │
│                 │    │                 │
│ • Branch protect│    │ • Smart PR desc │
│ • Secret scan   │    │ • CI monitoring │
│ • Code format   │    │ • Commit help   │
│ • Lockfile sync │    │ • Branch mgmt   │
└─────────────────┘    └─────────────────┘
```

## How They Work Together

### Parallel Operation (No Conflicts)

1. **Different Trigger Points**:

   - Husky: When git commands execute
   - Claude: When Claude tools execute

2. **Complementary Functions**:

   - Husky: Ensures code quality and security
   - Claude: Enhances workflow intelligence

3. **No Interference**:
   - Claude hooks run in Claude Code sessions
   - Husky hooks run for all git operations
   - Each can operate independently

### Example Integration Flow

```bash
# 1. Developer makes changes (no hooks triggered)

# 2. Claude Code edit operation
#    → Claude PreToolUse hook: Validate edit permissions
#    → Claude performs edit
#    → Claude PostToolUse hook: Format code, analyze impact

# 3. Developer commits via Claude
#    → Claude PreToolUse hook (before git commit): Suggest commit message
#    → Git commit starts
#    → Husky pre-commit hook: Security scan, format check
#    → Husky commit-msg hook: Validate conventional format
#    → Commit completes
#    → Claude PostToolUse hook: Analyze affected packages

# 4. Claude creates PR
#    → Claude PostToolUse hook: Generate smart PR description, start CI monitoring
```

## Configuration Strategy

### Project-Specific Claude Hooks

**Location**: `packages/claude-config/hooks/` **Format**: JSON configuration
files

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": { "tool_name": "Bash", "command_pattern": "gh pr create.*" },
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/enhance-pr-description.sh"
          }
        ]
      }
    ]
  }
}
```

### Global vs Project Configuration

- **Global** (`~/.claude/settings.json`): Personal workflow preferences
- **Project** (repository-specific): Team-shared enhancements
- **Priority**: Project settings override global settings

## Safety and Compatibility

### Preserving Existing Automation

1. **No Husky Replacement**: Claude hooks supplement, never replace
2. **Fallback Behavior**: If Claude hooks fail, manual workflow continues
3. **Gradual Adoption**: Enable hooks incrementally
4. **Disable Option**: Easy to turn off problematic hooks

### Error Handling

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": { "tool_name": "Bash", "command_pattern": "git commit.*" },
        "hooks": [
          {
            "type": "command",
            "command": "timeout 10s ./scripts/analyze-commit.sh || echo 'Hook timeout, continuing...'",
            "continue_on_error": true
          }
        ]
      }
    ]
  }
}
```

## Implementation Phases

### Phase 1: Observational Hooks

- **Purpose**: Log and analyze workflow patterns
- **Risk**: Very low (no workflow changes)
- **Example**: Log all git commands and file changes

### Phase 2: Enhancement Hooks

- **Purpose**: Add intelligence without changing core workflow
- **Risk**: Low (optional enhancements)
- **Example**: Smart PR descriptions, background CI monitoring

### Phase 3: Workflow Integration

- **Purpose**: Deeper integration with development process
- **Risk**: Medium (more workflow changes)
- **Example**: Automated branch management, commit assistance

## Key Benefits

### For Existing Workflow

- **Maintains all current safety mechanisms**
- **Preserves manual control and decision-making**
- **Enhances without disrupting proven patterns**
- **Adds intelligence layer without changing foundation**

### For Development Experience

- **Reduces repetitive manual tasks**
- **Provides contextual assistance**
- **Improves PR quality and CI feedback**
- **Maintains workflow consistency**

## Technical Implementation

### Hook Development Environment

```bash
# Test hooks in isolated environment
export CLAUDE_HOOKS_DEBUG=1
export CLAUDE_HOOKS_DRY_RUN=1

# Test specific hook
echo '{"tool_name": "Edit", "file_path": "test.ts"}' | ./scripts/test-hook.sh
```

### Hook Script Template

```bash
#!/bin/bash
# Claude hook script template

# Read JSON input from stdin
INPUT=$(cat)

# Extract relevant fields
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
FILE_PATH=$(echo "$INPUT" | jq -r '.file_path // ""')

# Perform hook logic
case "$TOOL_NAME" in
  "Edit")
    echo "Processing file edit: $FILE_PATH"
    # Add enhancement logic here
    ;;
  "Bash")
    COMMAND=$(echo "$INPUT" | jq -r '.command // ""')
    echo "Processing bash command: $COMMAND"
    # Add enhancement logic here
    ;;
esac

# Return success (hooks should not fail unless critical)
exit 0
```

This architecture ensures that Claude Code hooks enhance your existing robust
workflow without interfering with the proven Husky automation that maintains
code quality and security.
