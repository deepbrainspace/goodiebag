# Claude Code Hooks Overview

## What Are Claude Code Hooks?

Claude Code hooks are user-defined shell commands that execute automatically at
specific points in Claude Code's lifecycle. They allow you to inject custom
logic, scripts, and automation directly into Claude's operations.

**Key Concept**: Hooks transform suggestions into reliable, executable code that
runs consistently, providing deterministic control over Claude Code's behavior.

## How Claude Hooks Differ from Git Hooks

### Fundamental Difference

- **Git Hooks (Husky)**: Trigger when YOU run git commands manually
- **Claude Hooks**: Trigger when CLAUDE uses tools during our sessions

### Example Comparison

```bash
# Git Hook Scenario
You: git commit -m "feat: add feature"
→ Husky pre-commit hook runs
→ Secret detection, formatting, validation
→ Your command completes

# Claude Hook Scenario
You: "Create a PR for this work"
Claude: gh pr create --title "feat: add feature"
→ Claude PostToolUse hook runs
→ PR description enhancement, CI monitoring
→ Claude's command completes with enhancements
```

## Available Hook Types

### 1. PreToolUse

**When**: Before Claude uses any tool **Purpose**: Validation, preparation,
permission checks **Use Cases**:

- Validate edit permissions before file modifications
- Check git status before commits
- Analyze context before command execution

**Example**:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": { "tool_name": "Bash", "command_pattern": "git commit.*" },
        "hooks": [
          { "type": "command", "command": "validate-commit-readiness.sh" }
        ]
      }
    ]
  }
}
```

### 2. PostToolUse

**When**: After Claude successfully completes tool usage **Purpose**:
Enhancement, automation, follow-up actions **Use Cases**:

- Enhance PR descriptions after creation
- Start CI monitoring after PR submission
- Format code after edits
- Update documentation after changes

**Example**:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": { "tool_name": "Bash", "command_pattern": "gh pr create.*" },
        "hooks": [{ "type": "command", "command": "enhance-pr-description.sh" }]
      }
    ]
  }
}
```

### 3. Notification

**When**: Claude needs user attention or input is idle **Purpose**: Alerts,
status updates, reminders **Use Cases**:

- Notify when long operations complete
- Alert about important status changes
- Remind about pending actions

### 4. Stop

**When**: Claude finishes responding to user **Purpose**: Cleanup, status
reporting, preparation for next task **Use Cases**:

- Suggest branch cleanup after work completion
- Report workflow status
- Prepare for next development cycle

**Example**:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": {},
        "hooks": [
          { "type": "command", "command": "workflow-cleanup-suggestions.sh" }
        ]
      }
    ]
  }
}
```

### 5. SubagentStop

**When**: A Claude subagent completes its task **Purpose**: Coordination between
different Claude agents **Use Cases**:

- Coordinate complex multi-step operations
- Aggregate results from parallel tasks

### 6. PreCompact

**When**: Before Claude compacts context due to length limits **Purpose**:
Preserve important information before compaction **Use Cases**:

- Save important context to external files
- Create summaries of work completed

## Hook Configuration Format

### Basic Structure

```json
{
  "hooks": {
    "EventType": [
      {
        "matcher": {
          "tool_name": "ToolName",
          "command_pattern": "regex_pattern"
        },
        "hooks": [
          {
            "type": "command",
            "command": "path/to/script.sh",
            "continue_on_error": true
          }
        ]
      }
    ]
  }
}
```

### Matcher Options

```json
{
  "matcher": {
    "tool_name": "Bash", // Specific tool
    "command_pattern": "git commit.*", // Regex for command
    "file_paths": ["*.py", "src/**"], // File patterns
    "working_directory": "/specific/path" // Directory constraint
  }
}
```

### Hook Options

```json
{
  "type": "command",
  "command": "script.sh",
  "continue_on_error": true, // Don't block workflow if hook fails
  "timeout": 10000, // Timeout in milliseconds
  "environment": {
    // Additional environment variables
    "HOOK_MODE": "production"
  }
}
```

## Hook Input and Output

### Input (via stdin)

Hooks receive JSON input with context about the tool usage:

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "gh pr create --title 'feat: add feature'",
    "description": "Create pull request"
  },
  "working_directory": "/path/to/repo",
  "timestamp": "2025-07-12T13:42:07Z"
}
```

### Output Options

1. **Exit Code 0**: Success, continue normally
2. **Exit Code 1**: Block operation (for PreToolUse hooks)
3. **JSON Output**: Provide structured feedback to Claude

### Example Hook Script

```bash
#!/bin/bash
# Example hook script template

# Read JSON input
INPUT=$(cat)

# Extract relevant information
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name')
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Perform hook logic
case "$TOOL_NAME" in
  "Bash")
    if echo "$COMMAND" | grep -q "gh pr create"; then
      echo "Enhancing PR creation..."
      # Add enhancement logic here
    fi
    ;;
  "Edit")
    FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path')
    echo "Processing file edit: $FILE_PATH"
    # Add file processing logic here
    ;;
esac

# Return success (or error to block)
exit 0
```

## Security and Safety Considerations

### Security Best Practices

1. **Validate Inputs**: Always sanitize hook inputs
2. **Use Absolute Paths**: Avoid relative path vulnerabilities
3. **Limit Permissions**: Run hooks with minimal required permissions
4. **Review Scripts**: Carefully review all hook scripts before deployment

### Safety Mechanisms

1. **Timeout Protection**: All hooks timeout after configurable period
2. **Error Isolation**: Failed hooks don't crash Claude or block workflow
3. **Continue on Error**: Default behavior allows workflow to proceed
4. **Logging**: Comprehensive logging for debugging and auditing

### Example Safety Configuration

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": { "tool_name": "Bash" },
        "hooks": [
          {
            "type": "command",
            "command": "timeout 10s safe-script.sh || echo 'Hook timeout'",
            "continue_on_error": true
          }
        ]
      }
    ]
  }
}
```

## Common Use Cases

### 1. Automatic Code Formatting

```json
{
  "matcher": { "tool_name": "Edit", "file_paths": ["*.py"] },
  "hooks": [{ "type": "command", "command": "black $CLAUDE_FILE_PATHS" }]
}
```

### 2. Command Logging

```json
{
  "matcher": { "tool_name": "Bash" },
  "hooks": [{ "type": "command", "command": "log-command.sh" }]
}
```

### 3. Custom Notifications

```json
{
  "matcher": { "tool_name": "Bash", "command_pattern": "git push.*" },
  "hooks": [{ "type": "command", "command": "notify-push-complete.sh" }]
}
```

### 4. Workflow Validation

```json
{
  "matcher": { "tool_name": "Bash", "command_pattern": "rm.*" },
  "hooks": [{ "type": "command", "command": "validate-deletion.sh" }]
}
```

## Configuration Locations

### Global Configuration

**File**: `~/.claude/settings.json` **Scope**: All Claude Code usage
**Purpose**: Personal preferences and global automation

### Project Configuration

**File**: `project/.claude/settings.json` **Scope**: Specific project/repository
**Purpose**: Team-shared automation and project-specific rules

### Configuration Precedence

1. Project-specific settings override global settings
2. More specific matchers override general matchers
3. Later entries in arrays can override earlier ones

## Performance Considerations

### Hook Execution

- **Parallel Execution**: Multiple hooks can run simultaneously
- **Timeout Protection**: Default 10-second timeout prevents hanging
- **Resource Limits**: Hooks should be lightweight and efficient
- **Caching**: Use caching for expensive operations

### Best Practices

1. **Keep Scripts Fast**: Aim for <1 second execution time
2. **Use Background Jobs**: For long operations, fork to background
3. **Cache Results**: Avoid repeated expensive computations
4. **Optimize Patterns**: Use specific matchers to reduce unnecessary executions

## Integration with Development Workflow

### Complementary to Existing Tools

- **Git Hooks**: Handle git-level operations
- **Claude Hooks**: Handle Claude-level operations
- **CI/CD**: Handle repository-level automation
- **IDE Tools**: Handle editor-level automation

### Workflow Enhancement Pattern

1. **Preserve Existing Automation**: Keep all current safety mechanisms
2. **Add Intelligence Layer**: Enhance with AI-powered insights
3. **Maintain Manual Control**: Always allow manual override
4. **Gradual Adoption**: Implement incrementally with validation

This overview provides the foundation for understanding how Claude Code hooks
can enhance your development workflow while preserving the robust automation
you've already established.
