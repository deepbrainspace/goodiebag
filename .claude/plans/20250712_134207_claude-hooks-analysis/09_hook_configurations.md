# Proposed Hook Configurations

## Complete Configuration Files

### Project-Level Configuration

**File**: `.claude/settings.json` **Purpose**: Team-shared hook configurations
for the goodiebag repository

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "description": "Enhance PR descriptions with automated analysis",
        "matcher": {
          "tool_name": "Bash",
          "command_pattern": "gh pr create.*"
        },
        "hooks": [
          {
            "type": "command",
            "command": ".claude/scripts/enhance-pr-description.sh",
            "continue_on_error": true,
            "timeout": 10000
          }
        ]
      },
      {
        "description": "Start background CI monitoring for new PRs",
        "matcher": {
          "tool_name": "Bash",
          "command_pattern": "gh pr create.*"
        },
        "hooks": [
          {
            "type": "command",
            "command": ".claude/scripts/monitor-ci.sh &",
            "continue_on_error": true,
            "timeout": 5000
          }
        ]
      },
      {
        "description": "Log workflow commands for analysis",
        "matcher": {
          "tool_name": "Bash"
        },
        "hooks": [
          {
            "type": "command",
            "command": ".claude/scripts/log-workflow.sh",
            "continue_on_error": true,
            "timeout": 2000
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "description": "Validate and assist with commit messages",
        "matcher": {
          "tool_name": "Bash",
          "command_pattern": "git commit.*"
        },
        "hooks": [
          {
            "type": "command",
            "command": ".claude/scripts/commit-assistant.sh",
            "continue_on_error": true,
            "timeout": 5000
          }
        ]
      },
      {
        "description": "Optimize NX command usage",
        "matcher": {
          "tool_name": "Bash",
          "command_pattern": "nx (affected|run-many).*"
        },
        "hooks": [
          {
            "type": "command",
            "command": ".claude/scripts/nx-optimizer.sh",
            "continue_on_error": true,
            "timeout": 3000
          }
        ]
      }
    ],
    "Stop": [
      {
        "description": "Provide workflow status and suggestions",
        "matcher": {},
        "hooks": [
          {
            "type": "command",
            "command": ".claude/scripts/workflow-status.sh",
            "continue_on_error": true,
            "timeout": 5000
          }
        ]
      }
    ]
  },
  "environment": {
    "GOODIEBAG_REPO": "true",
    "NX_WORKSPACE": "true"
  }
}
```

## Hook Script Implementations

### 1. Enhanced PR Description Script

**File**: `.claude/scripts/enhance-pr-description.sh`

```bash
#!/bin/bash
# Enhanced PR description generator for goodiebag monorepo

set -euo pipefail

# Read hook input
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Extract PR number from gh pr create output
PR_NUMBER=$(echo "$COMMAND" | grep -o 'https://github.com/[^/]*/[^/]*/pull/[0-9]*' | sed 's/.*pull\///' || echo "")

if [ -z "$PR_NUMBER" ]; then
  echo "ℹ️  Could not extract PR number, skipping enhancement"
  exit 0
fi

echo "🔄 Enhancing PR #$PR_NUMBER with automated analysis..."

# Analyze affected packages
AFFECTED_LIBS=$(nx affected:libs --base=main --plain 2>/dev/null || echo "none")
AFFECTED_APPS=$(nx affected:apps --base=main --plain 2>/dev/null || echo "none")

# Analyze file changes
CHANGED_FILES=$(git diff --name-only main...HEAD 2>/dev/null || echo "")
TOTAL_FILES=$(echo "$CHANGED_FILES" | grep -v '^$' | wc -l)
TEST_FILES=$(echo "$CHANGED_FILES" | grep -E '\.(test|spec)\.' | wc -l || echo "0")
DOC_FILES=$(echo "$CHANGED_FILES" | grep -E '\.(md|rst)$' | wc -l || echo "0")

# Analyze change types
BREAKING_CHANGES=$(echo "$CHANGED_FILES" | grep -E 'api/|interface/|public/' | wc -l || echo "0")
CONFIG_CHANGES=$(echo "$CHANGED_FILES" | grep -E '\.(json|yml|yaml|toml)$' | wc -l || echo "0")

# Generate testing suggestions based on affected packages
TESTING_SUGGESTIONS=""
if [ "$AFFECTED_LIBS" != "none" ]; then
  TESTING_SUGGESTIONS="- [ ] Run \`nx test $AFFECTED_LIBS\` (affected libraries)"$'\n'
fi
if [ "$AFFECTED_APPS" != "none" ]; then
  TESTING_SUGGESTIONS="${TESTING_SUGGESTIONS}- [ ] Run \`nx test $AFFECTED_APPS\` (affected applications)"$'\n'
fi
if [ "$TEST_FILES" -gt 0 ]; then
  TESTING_SUGGESTIONS="${TESTING_SUGGESTIONS}- [ ] Verify test coverage for new/modified functionality"$'\n'
fi

# Generate enhancement
ENHANCEMENT="

## Automated Analysis
**Affected Libraries**: $AFFECTED_LIBS
**Affected Applications**: $AFFECTED_APPS
**Files Changed**: $TOTAL_FILES files ($TEST_FILES test files, $DOC_FILES docs)

## Change Analysis
$([ "$BREAKING_CHANGES" -gt 0 ] && echo "- ⚠️  $BREAKING_CHANGES potential API changes detected")
$([ "$CONFIG_CHANGES" -gt 0 ] && echo "- ⚙️  $CONFIG_CHANGES configuration files modified")
$([ "$TEST_FILES" -gt 0 ] && echo "- 🧪 $TEST_FILES test files updated")
$([ "$DOC_FILES" -gt 0 ] && echo "- 📚 $DOC_FILES documentation files updated")

## Automated Testing Suggestions
$TESTING_SUGGESTIONS

## NX Commands for Review
\`\`\`bash
# Test affected packages
nx affected --target=test --base=main

# Build affected packages
nx affected --target=build --base=main

# Lint affected code
nx affected --target=lint --base=main
\`\`\`

---
*Generated by Claude Code hooks 🤖*"

# Update PR description
gh pr edit $PR_NUMBER --body-file <(
  gh pr view $PR_NUMBER --json body --jq '.body'
  echo "$ENHANCEMENT"
) 2>/dev/null || echo "⚠️  Could not update PR description (may need GitHub CLI auth)"

echo "✅ Enhanced PR #$PR_NUMBER description with automated analysis"
```

### 2. CI Monitoring Script

**File**: `.claude/scripts/monitor-ci.sh`

```bash
#!/bin/bash
# Background CI monitoring with desktop notifications

set -euo pipefail

PR_NUMBER="$1"

if [ -z "$PR_NUMBER" ]; then
  echo "❌ PR number required"
  exit 1
fi

echo "🔄 Starting CI monitoring for PR #$PR_NUMBER"

# Monitor CI status
while true; do
  # Get status with error handling
  STATUS_JSON=$(gh pr view $PR_NUMBER --json statusCheckRollup 2>/dev/null) || {
    echo "❌ Failed to get PR status, stopping monitoring"
    exit 1
  }

  # Count pending jobs
  PENDING=$(echo "$STATUS_JSON" | jq -r '.statusCheckRollup[] | select(.status == "QUEUED" or .status == "IN_PROGRESS" or .status == "PENDING") | .name' | wc -l)

  # Check for failures
  FAILED_CHECKS=$(echo "$STATUS_JSON" | jq -r '.statusCheckRollup[] | select(.conclusion == "FAILURE") | .name')

  if [ "$PENDING" -eq 0 ]; then
    if [ -n "$FAILED_CHECKS" ]; then
      FAILED_COUNT=$(echo "$FAILED_CHECKS" | wc -l)
      if command -v notify-send &> /dev/null; then
        notify-send "CI Failed" "PR #$PR_NUMBER: $FAILED_COUNT check(s) failed" --urgency=critical
      fi
      echo "❌ CI failed for PR #$PR_NUMBER:"
      echo "$FAILED_CHECKS"
    else
      if command -v notify-send &> /dev/null; then
        notify-send "CI Complete" "PR #$PR_NUMBER: All checks passed ✅" --urgency=normal
      fi
      echo "✅ All CI checks passed for PR #$PR_NUMBER"
    fi
    break
  fi

  sleep 30
done
```

### 3. Commit Assistant Script

**File**: `.claude/scripts/commit-assistant.sh`

```bash
#!/bin/bash
# Commit message assistant and package validation

set -euo pipefail

# Analyze staged changes
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null || echo "")

if [ -z "$STAGED_FILES" ]; then
  echo "ℹ️  No staged changes detected"
  exit 0
fi

# Analyze affected packages
AFFECTED_PACKAGES=$(echo "$STAGED_FILES" | grep '^packages/' | cut -d'/' -f2 | sort -u | grep -v '^$' || echo "")
PACKAGE_COUNT=$(echo "$AFFECTED_PACKAGES" | grep -v '^$' | wc -l || echo "0")

echo "📊 Commit Analysis:"
echo "   Staged files: $(echo "$STAGED_FILES" | wc -l)"
echo "   Affected packages: $PACKAGE_COUNT"

# Multi-package warning
if [ "$PACKAGE_COUNT" -gt 1 ]; then
  echo ""
  echo "⚠️  WARNING: Multiple packages affected in single commit"
  echo "   Packages: $(echo "$AFFECTED_PACKAGES" | tr '\n' ', ' | sed 's/,$//')"
  echo ""
  echo "🔧 Recommendation: Separate commits per package for proper semantic versioning"
  echo "   Example:"
  for pkg in $AFFECTED_PACKAGES; do
    echo "   git add packages/$pkg/ && git commit -m \"feat($pkg): description\""
  done
  echo ""
fi

# Single package suggestions
if [ "$PACKAGE_COUNT" -eq 1 ]; then
  PACKAGE=$(echo "$AFFECTED_PACKAGES" | head -1)
  echo ""
  echo "💡 Suggested commit scope: ($PACKAGE)"

  # Analyze change types for commit type suggestions
  if echo "$STAGED_FILES" | grep -q '\.test\.\|\.spec\.'; then
    echo "   💡 Test changes detected - consider 'test($PACKAGE):' if only tests"
  fi
  if echo "$STAGED_FILES" | grep -q '\.md$' && ! echo "$STAGED_FILES" | grep -qv '\.md$'; then
    echo "   💡 Only documentation changes - consider 'docs($PACKAGE):'"
  fi
  if echo "$STAGED_FILES" | grep -q 'config\|\.json$\|\.yml$\|\.yaml$'; then
    echo "   💡 Configuration changes detected - consider 'chore($PACKAGE):'"
  fi
fi

# Infrastructure changes
INFRA_FILES=$(echo "$STAGED_FILES" | grep -E '^(\.github/|nx\.json|\.prettierrc|\.eslintrc|\.husky/|package\.json$)')
if [ -n "$INFRA_FILES" ]; then
  echo ""
  echo "🏗️  Infrastructure changes detected:"
  echo "$INFRA_FILES" | sed 's/^/   /'
  if [ "$PACKAGE_COUNT" -eq 0 ]; then
    echo "   💡 Consider 'chore:' scope for infrastructure-only changes"
  fi
fi

echo ""
# Always allow commit to proceed
exit 0
```

### 4. NX Optimizer Script

**File**: `.claude/scripts/nx-optimizer.sh`

```bash
#!/bin/bash
# NX command optimization suggestions

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# Only proceed if this is an NX command
if ! echo "$COMMAND" | grep -q "^nx "; then
  exit 0
fi

echo "🎯 NX Command Analysis:"

# Analyze affected packages
AFFECTED_LIBS=$(nx affected:libs --base=main --plain 2>/dev/null | wc -w || echo "0")
AFFECTED_APPS=$(nx affected:apps --base=main --plain 2>/dev/null | wc -w || echo "0")
TOTAL_AFFECTED=$((AFFECTED_LIBS + AFFECTED_APPS))

TOTAL_LIBS=$(nx show projects --type=lib 2>/dev/null | wc -l || echo "1")
TOTAL_APPS=$(nx show projects --type=app 2>/dev/null | wc -l || echo "1")
TOTAL_PROJECTS=$((TOTAL_LIBS + TOTAL_APPS))

if [ "$TOTAL_PROJECTS" -gt 0 ]; then
  AFFECTED_PERCENTAGE=$((TOTAL_AFFECTED * 100 / TOTAL_PROJECTS))
else
  AFFECTED_PERCENTAGE=0
fi

echo "   Affected packages: $TOTAL_AFFECTED/$TOTAL_PROJECTS ($AFFECTED_PERCENTAGE%)"

# Optimization suggestions
if echo "$COMMAND" | grep -q "run-many.*--all"; then
  if [ "$AFFECTED_PERCENTAGE" -lt 30 ]; then
    echo ""
    echo "💡 Optimization Opportunity:"
    echo "   Only $AFFECTED_PERCENTAGE% of packages affected"
    echo "   Consider: nx affected --target=... (significantly faster)"
    echo ""
    echo "   Current: $COMMAND"
    OPTIMIZED=$(echo "$COMMAND" | sed 's/run-many/affected/' | sed 's/ --all//')
    echo "   Optimized: $OPTIMIZED"
  fi
elif echo "$COMMAND" | grep -q "affected"; then
  echo "   ✅ Using affected commands - optimal for current changes"
fi

# Target-specific suggestions
if echo "$COMMAND" | grep -q "target=build"; then
  echo "   🏗️  Build target detected - ensure dependencies are built first"
fi

if echo "$COMMAND" | grep -q "target=test"; then
  echo "   🧪 Test target detected - consider coverage report with --coverage"
fi

echo ""
exit 0
```

### 5. Workflow Status Script

**File**: `.claude/scripts/workflow-status.sh`

```bash
#!/bin/bash
# Workflow status report and suggestions

set -euo pipefail

echo "📊 Workflow Status Report:"

# Check current branch status
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "unknown" ]; then
  # Check for uncommitted changes
  if ! git diff --quiet 2>/dev/null || ! git diff --cached --quiet 2>/dev/null; then
    echo "   📝 Uncommitted changes on branch: $CURRENT_BRANCH"
  else
    # Check commits ahead of main
    AHEAD=$(git rev-list --count main..$CURRENT_BRANCH 2>/dev/null || echo "0")

    if [ "$AHEAD" -gt 0 ]; then
      echo "   🔄 Branch '$CURRENT_BRANCH' has $AHEAD commits ready for PR"
    else
      echo "   ✅ Branch '$CURRENT_BRANCH' is in sync with main"
      echo "   💡 Consider: git checkout main && git branch -d $CURRENT_BRANCH"
    fi
  fi
else
  # On main branch - check if behind origin
  if [ "$CURRENT_BRANCH" = "main" ]; then
    git fetch origin main --quiet 2>/dev/null || true
    BEHIND=$(git rev-list --count main..origin/main 2>/dev/null || echo "0")

    if [ "$BEHIND" -gt 0 ]; then
      echo "   ⬇️  Main branch is $BEHIND commits behind origin"
      echo "   💡 Suggestion: git pull origin main"
    else
      echo "   ✅ Main branch is up to date"
    fi
  fi
fi

# Check for open PRs if gh is available
if command -v gh &> /dev/null; then
  OPEN_PRS=$(gh pr list --state=open --json number 2>/dev/null | jq '. | length' 2>/dev/null || echo "0")
  if [ "$OPEN_PRS" -gt 0 ]; then
    echo "   📝 $OPEN_PRS open PR(s) in repository"
  fi
fi

# Check for untracked files
UNTRACKED=$(git ls-files --others --exclude-standard 2>/dev/null | wc -l || echo "0")
if [ "$UNTRACKED" -gt 0 ]; then
  echo "   📄 $UNTRACKED untracked files detected"
fi

echo ""
```

### 6. Workflow Logging Script

**File**: `.claude/scripts/log-workflow.sh`

```bash
#!/bin/bash
# Log workflow commands for analysis

set -euo pipefail

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Create log directory if it doesn't exist
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

# Log entry
LOG_FILE="$LOG_DIR/workflow.log"
echo "[$TIMESTAMP] $COMMAND" >> "$LOG_FILE"

# Keep log file manageable (last 1000 entries)
if [ -f "$LOG_FILE" ]; then
  tail -1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi
```

## Installation Instructions

### 1. Create Hook Infrastructure

```bash
# Create directories
mkdir -p .claude/scripts
mkdir -p .claude/logs

# Make scripts executable
chmod +x .claude/scripts/*.sh
```

### 2. Install Hook Scripts

```bash
# Copy all the above scripts to .claude/scripts/
# Each script should be saved with its specified filename
```

### 3. Configure Claude Code

Create `.claude/settings.json` with the project-level configuration above.

### 4. Test Installation

```bash
# Test hook execution
echo '{"tool_name": "Bash", "tool_input": {"command": "git status"}}' | .claude/scripts/commit-assistant.sh
```

### 5. Enable Gradual Rollout

Start with just the workflow logging hook, then gradually enable others:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "description": "Log workflow commands (safe to enable first)",
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

This configuration provides a complete foundation for Claude Code hooks that
enhance your development workflow while maintaining compatibility with all
existing automation.
