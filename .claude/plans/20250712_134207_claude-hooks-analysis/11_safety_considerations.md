# Safety Considerations and Compatibility

## Preserving Existing Automation

### No Interference with Husky Hooks

**Critical Design Principle**: Claude Code hooks operate completely
independently from Husky git hooks.

#### Separation of Concerns

```
Git Operations (You)     →     Husky Hooks     →     Safety & Quality
Claude Operations (AI)   →     Claude Hooks    →     Intelligence & Enhancement
```

**Example Safe Coexistence**:

```bash
# Scenario: Claude commits code for you
1. You ask: "Commit these changes"
2. Claude PreToolUse hook runs: Analyzes staged files, suggests scope
3. Claude executes: git commit -m "feat(pkg): description"
4. Husky pre-commit hook runs: Secret scan, format check, validation
5. Husky commit-msg hook runs: Conventional commit validation
6. Claude PostToolUse hook runs: Logs command, analyzes impact
```

**No Conflicts**: Each system operates at its designated trigger point.

### Preserving Safety Mechanisms

All existing safety mechanisms remain 100% intact:

#### Husky Safety Hooks (Unchanged)

- ✅ **Branch protection**: Direct main commits still blocked
- ✅ **Secret detection**: All secret scanning preserved
- ✅ **Code formatting**: Automatic formatting continues
- ✅ **Lockfile validation**: Pre-push validation unchanged
- ✅ **Conventional commits**: Format validation preserved

#### GitHub Actions (Unchanged)

- ✅ **CI/CD pipeline**: All quality gates preserved
- ✅ **Affected package detection**: NX automation unchanged
- ✅ **Build validation**: All build checks continue
- ✅ **Release automation**: Semantic versioning preserved

### Manual Override Always Available

**Fail-Safe Design**: If any Claude hook fails or causes issues:

```bash
# Instant disable of all Claude hooks
mv .claude/settings.json .claude/settings.json.disabled

# Your existing workflow continues unchanged:
# - All Husky hooks still work
# - All GitHub Actions still work
# - All manual commands still work
```

## Hook Safety Design

### Error Isolation

**Principle**: Hook failures never block your workflow.

#### Configuration Safety

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "enhance-pr.sh",
            "continue_on_error": true, // Never block workflow
            "timeout": 10000 // Timeout protection
          }
        ]
      }
    ]
  }
}
```

#### Script Safety Template

```bash
#!/bin/bash
# Safe hook script template

set -euo pipefail  # Fail fast on errors

# Timeout protection
timeout 10s actual-work.sh || {
  echo "⚠️  Hook timed out, continuing workflow..."
  exit 0  # Always exit successfully to not block Claude
}

# Error handling
do-enhancement-work 2>&1 | tee -a ~/.claude/hook.log || {
  echo "⚠️  Hook failed, workflow continues normally"
  exit 0  # Never fail the workflow
}
```

### Input Validation

**Security**: All hook inputs must be validated.

```bash
#!/bin/bash
# Input validation example

INPUT=$(cat)

# Validate JSON input
if ! echo "$INPUT" | jq . >/dev/null 2>&1; then
  echo "❌ Invalid JSON input, skipping hook"
  exit 0
fi

# Sanitize command input
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""' | head -c 1000)

# Validate command safety
if echo "$COMMAND" | grep -qE '(rm -rf|sudo|su |dd |mkfs|format)'; then
  echo "⚠️  Potentially dangerous command detected, skipping enhancement"
  exit 0
fi
```

### File System Safety

**Principle**: Hooks operate with minimal file system access.

#### Safe File Operations

```bash
# ✅ Safe: Read-only operations
git status --porcelain
nx affected:libs --base=main
gh pr view $PR_NUMBER --json body

# ✅ Safe: Append-only logging
echo "Log entry" >> ~/.claude/hook.log

# ✅ Safe: Temporary files in controlled locations
TEMP_FILE=$(mktemp /tmp/claude-hook.XXXXXX)
trap "rm -f $TEMP_FILE" EXIT

# ❌ Unsafe: Avoid these operations
# rm -rf anything
# chmod 777 files
# sudo commands
# Operations outside project directory
```

### Resource Limits

**Protection**: Prevent hooks from consuming excessive resources.

```bash
#!/bin/bash
# Resource-limited hook

# Limit execution time
timeout 10s hook-work.sh

# Limit memory usage (if available)
ulimit -v 100000  # 100MB virtual memory limit

# Limit CPU usage
nice -n 10 cpu-intensive-work.sh

# Limit file operations
exec 3>&1 4>&2
exec 1> >(head -c 10000)  # Limit stdout to 10KB
exec 2> >(head -c 10000)  # Limit stderr to 10KB
```

## Compatibility Assurance

### Version Compatibility

**Strategy**: Ensure hooks work across Claude Code versions.

```bash
#!/bin/bash
# Version-aware hook

# Check for required tools
if ! command -v jq &> /dev/null; then
  echo "⚠️  jq not available, skipping hook"
  exit 0
fi

if ! command -v gh &> /dev/null; then
  echo "⚠️  GitHub CLI not available, skipping hook"
  exit 0
fi

# Feature detection instead of version checking
if gh pr view --help 2>&1 | grep -q '\-\-json'; then
  # Use JSON output
  gh pr view $PR_NUMBER --json body
else
  # Fallback to text output
  gh pr view $PR_NUMBER
fi
```

### Environment Compatibility

**Support**: Work across different development environments.

```bash
#!/bin/bash
# Environment-aware hook

# Detect WSL vs native Linux vs macOS
if grep -qi microsoft /proc/version 2>/dev/null; then
  # WSL environment
  NOTIFY_CMD="powershell.exe -Command 'New-BurntToastNotification'"
elif [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  NOTIFY_CMD="osascript -e 'display notification'"
elif command -v notify-send &> /dev/null; then
  # Linux with desktop notifications
  NOTIFY_CMD="notify-send"
else
  # Fallback: terminal only
  NOTIFY_CMD="echo"
fi
```

### Team Configuration

**Coordination**: Ensure team members can opt-in/out individually.

#### Repository Configuration (Team Shared)

```json
{
  "hooks": {
    "// Comment": "Team-shared hooks - safe defaults only",
    "PostToolUse": [
      {
        "description": "Log workflow commands (observational only)",
        "matcher": { "tool_name": "Bash" },
        "hooks": [
          {
            "type": "command",
            "command": ".claude/scripts/log-workflow.sh",
            "continue_on_error": true
          }
        ]
      }
    ]
  }
}
```

#### Personal Override (`~/.claude/settings.json`)

```json
{
  "hooks": {
    "// Comment": "Personal preferences override team settings",
    "disable": ["pr-enhancement", "ci-monitoring"],
    "PostToolUse": [
      {
        "description": "Personal PR enhancement with custom settings",
        "matcher": { "tool_name": "Bash", "command_pattern": "gh pr create.*" },
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/personal-scripts/my-pr-enhancer.sh"
          }
        ]
      }
    ]
  }
}
```

## Security Considerations

### Access Control

**Principle**: Hooks run with user permissions only.

```bash
#!/bin/bash
# Security-conscious hook

# Never escalate privileges
if [ "$EUID" -eq 0 ]; then
  echo "❌ Hook should not run as root"
  exit 0
fi

# Validate working directory
if [[ "$PWD" != */goodiebag* ]]; then
  echo "⚠️  Hook only runs in goodiebag repository"
  exit 0
fi

# Sandbox file operations
cd "$PWD" || exit 0  # Ensure we're in the right directory
```

### Secret Protection

**Critical**: Never expose or log sensitive information.

```bash
#!/bin/bash
# Secret-safe hook

INPUT=$(cat)

# Redact potential secrets from logs
SAFE_COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command' | sed -E 's/(token|key|password)=[^ ]*/\1=***REDACTED***/g')

# Log safely
echo "[$TIMESTAMP] $SAFE_COMMAND" >> ~/.claude/hook.log

# Never log full environment or sensitive variables
# Never echo or print user input directly
```

### Audit Trail

**Accountability**: Maintain comprehensive logging for debugging.

```bash
#!/bin/bash
# Auditable hook

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
HOOK_NAME="$(basename "$0")"
LOG_FILE="~/.claude/hook-audit.log"

# Log hook execution
echo "[$TIMESTAMP] HOOK_START $HOOK_NAME" >> "$LOG_FILE"

# Perform hook work with error capture
if RESULT=$(do-hook-work 2>&1); then
  echo "[$TIMESTAMP] HOOK_SUCCESS $HOOK_NAME" >> "$LOG_FILE"
else
  echo "[$TIMESTAMP] HOOK_ERROR $HOOK_NAME: $RESULT" >> "$LOG_FILE"
fi

echo "[$TIMESTAMP] HOOK_END $HOOK_NAME" >> "$LOG_FILE"
```

## Testing and Validation

### Hook Testing Framework

**Quality**: Comprehensive testing before deployment.

```bash
#!/bin/bash
# Hook test suite

test_hook() {
  local hook_script="$1"
  local test_input="$2"
  local expected_result="$3"

  echo "Testing $hook_script..."

  # Test with timeout
  if timeout 15s echo "$test_input" | "$hook_script" > /tmp/hook-test.out 2>&1; then
    if grep -q "$expected_result" /tmp/hook-test.out; then
      echo "✅ Test passed: $hook_script"
    else
      echo "❌ Test failed: $hook_script (unexpected output)"
      cat /tmp/hook-test.out
    fi
  else
    echo "❌ Test failed: $hook_script (timeout or error)"
  fi
}

# Test cases
test_hook ".claude/scripts/commit-assistant.sh" \
  '{"tool_name": "Bash", "tool_input": {"command": "git commit -m test"}}' \
  "Commit Analysis"

test_hook ".claude/scripts/enhance-pr-description.sh" \
  '{"tool_name": "Bash", "tool_input": {"command": "gh pr create --title test"}}' \
  "Could not extract PR number"
```

### Rollback Procedures

**Recovery**: Quick recovery from problematic hooks.

```bash
#!/bin/bash
# Hook rollback script

echo "🔄 Rolling back Claude hooks..."

# Disable all hooks
if [ -f ".claude/settings.json" ]; then
  cp ".claude/settings.json" ".claude/settings.json.backup.$(date +%s)"
  echo '{"hooks": {}}' > ".claude/settings.json"
  echo "✅ Hooks disabled, backup created"
fi

# Stop any running background hooks
pkill -f "claude/scripts" || true

# Clean up temporary files
rm -f /tmp/claude-hook.* ~/.claude/hook-*.tmp

echo "✅ Rollback complete - workflow restored to manual operation"
```

## Monitoring and Maintenance

### Performance Monitoring

**Efficiency**: Ensure hooks don't slow down development.

```bash
#!/bin/bash
# Performance-monitored hook

START_TIME=$(date +%s.%N)

# Hook work here
do-actual-work

END_TIME=$(date +%s.%N)
DURATION=$(echo "$END_TIME - $START_TIME" | bc -l)

# Log performance
echo "[$TIMESTAMP] PERF $(basename "$0"): ${DURATION}s" >> ~/.claude/hook-perf.log

# Alert if too slow
if (( $(echo "$DURATION > 5.0" | bc -l) )); then
  echo "⚠️  Hook $(basename "$0") took ${DURATION}s (performance warning)"
fi
```

### Health Checks

**Reliability**: Regular validation of hook functionality.

```bash
#!/bin/bash
# Hook health check

echo "🏥 Claude Hooks Health Check"

# Check hook files exist and are executable
for script in .claude/scripts/*.sh; do
  if [ -x "$script" ]; then
    echo "✅ $script"
  else
    echo "❌ $script (not executable)"
  fi
done

# Check configuration validity
if jq . .claude/settings.json >/dev/null 2>&1; then
  echo "✅ .claude/settings.json (valid JSON)"
else
  echo "❌ .claude/settings.json (invalid JSON)"
fi

# Check required tools
for tool in jq gh git nx; do
  if command -v "$tool" &> /dev/null; then
    echo "✅ $tool available"
  else
    echo "⚠️  $tool not available (some hooks may not work)"
  fi
done
```

This comprehensive safety framework ensures that Claude Code hooks enhance your
workflow while maintaining the robust automation and safety mechanisms you've
already established.
