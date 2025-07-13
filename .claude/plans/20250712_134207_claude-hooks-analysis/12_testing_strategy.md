# Testing Strategy for Claude Code Hooks

## Testing Framework Overview

### Three-Tier Testing Approach

1. **Unit Testing**: Individual hook scripts in isolation
2. **Integration Testing**: Hooks working with real Claude Code operations
3. **Workflow Testing**: End-to-end development workflow validation

### Testing Environment Setup

```bash
# Create testing infrastructure
mkdir -p .claude/tests
mkdir -p .claude/tests/fixtures
mkdir -p .claude/tests/mocks

# Test utilities
touch .claude/tests/test-runner.sh
touch .claude/tests/mock-tools.sh
chmod +x .claude/tests/*.sh
```

## Unit Testing Framework

### Test Runner Script

**File**: `.claude/tests/test-runner.sh`

```bash
#!/bin/bash
# Claude hooks test runner

set -euo pipefail

TESTS_DIR="$(dirname "$0")"
SCRIPTS_DIR="$TESTS_DIR/../scripts"
FIXTURES_DIR="$TESTS_DIR/fixtures"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Test function
run_test() {
  local test_name="$1"
  local script_path="$2"
  local input_file="$3"
  local expected_pattern="$4"
  local timeout="${5:-10}"

  echo -n "Testing $test_name... "
  TESTS_RUN=$((TESTS_RUN + 1))

  # Create temporary output file
  local output_file=$(mktemp)
  trap "rm -f $output_file" RETURN

  # Run test with timeout
  if timeout "${timeout}s" "$script_path" < "$input_file" > "$output_file" 2>&1; then
    if grep -q "$expected_pattern" "$output_file"; then
      echo -e "${GREEN}PASS${NC}"
      TESTS_PASSED=$((TESTS_PASSED + 1))
    else
      echo -e "${RED}FAIL${NC} (unexpected output)"
      echo "Expected pattern: $expected_pattern"
      echo "Actual output:"
      cat "$output_file" | head -10
      TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
  else
    echo -e "${RED}FAIL${NC} (timeout or error)"
    echo "Output:"
    cat "$output_file" | head -10
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# Run test with error expectation
run_error_test() {
  local test_name="$1"
  local script_path="$2"
  local input_file="$3"
  local expected_exit_code="${4:-1}"

  echo -n "Testing $test_name (error expected)... "
  TESTS_RUN=$((TESTS_RUN + 1))

  local output_file=$(mktemp)
  trap "rm -f $output_file" RETURN

  # Run test expecting failure
  if "$script_path" < "$input_file" > "$output_file" 2>&1; then
    local actual_exit_code=$?
    if [ "$actual_exit_code" -eq "$expected_exit_code" ]; then
      echo -e "${GREEN}PASS${NC}"
      TESTS_PASSED=$((TESTS_PASSED + 1))
    else
      echo -e "${RED}FAIL${NC} (wrong exit code: $actual_exit_code, expected: $expected_exit_code)"
      TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
  else
    echo -e "${RED}FAIL${NC} (script error)"
    cat "$output_file" | head -5
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

echo "🧪 Running Claude Hooks Test Suite"
echo "=================================="

# Test PR Enhancement Script
if [ -f "$SCRIPTS_DIR/enhance-pr-description.sh" ]; then
  echo -e "\n${YELLOW}Testing PR Enhancement${NC}"

  run_test "PR creation with valid command" \
    "$SCRIPTS_DIR/enhance-pr-description.sh" \
    "$FIXTURES_DIR/pr-create-input.json" \
    "Could not extract PR number"

  run_test "PR creation with invalid input" \
    "$SCRIPTS_DIR/enhance-pr-description.sh" \
    "$FIXTURES_DIR/invalid-input.json" \
    "Could not extract PR number"
fi

# Test Commit Assistant Script
if [ -f "$SCRIPTS_DIR/commit-assistant.sh" ]; then
  echo -e "\n${YELLOW}Testing Commit Assistant${NC}"

  run_test "Commit with staged files" \
    "$SCRIPTS_DIR/commit-assistant.sh" \
    "$FIXTURES_DIR/commit-input.json" \
    "Commit Analysis"

  run_test "Multi-package commit warning" \
    "$SCRIPTS_DIR/commit-assistant.sh" \
    "$FIXTURES_DIR/multi-package-input.json" \
    "Multiple packages affected"
fi

# Test NX Optimizer Script
if [ -f "$SCRIPTS_DIR/nx-optimizer.sh" ]; then
  echo -e "\n${YELLOW}Testing NX Optimizer${NC}"

  run_test "NX affected command optimization" \
    "$SCRIPTS_DIR/nx-optimizer.sh" \
    "$FIXTURES_DIR/nx-command-input.json" \
    "NX Command Analysis"

  run_test "Non-NX command (should skip)" \
    "$SCRIPTS_DIR/nx-optimizer.sh" \
    "$FIXTURES_DIR/non-nx-input.json" \
    ""
fi

# Test Workflow Status Script
if [ -f "$SCRIPTS_DIR/workflow-status.sh" ]; then
  echo -e "\n${YELLOW}Testing Workflow Status${NC}"

  run_test "Workflow status report" \
    "$SCRIPTS_DIR/workflow-status.sh" \
    "$FIXTURES_DIR/empty-input.json" \
    "Workflow Status Report"
fi

# Summary
echo -e "\n=================================="
echo "Test Results:"
echo "  Total: $TESTS_RUN"
echo -e "  Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "  Failed: ${RED}$TESTS_FAILED${NC}"

if [ "$TESTS_FAILED" -eq 0 ]; then
  echo -e "\n${GREEN}✅ All tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}❌ Some tests failed!${NC}"
  exit 1
fi
```

### Test Fixtures

**File**: `.claude/tests/fixtures/pr-create-input.json`

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "gh pr create --title 'feat(nx-surrealdb): add migration rollback support'",
    "description": "Create pull request for migration rollback feature"
  },
  "working_directory": "/home/user/goodiebag",
  "timestamp": "2025-07-12T13:42:07Z"
}
```

**File**: `.claude/tests/fixtures/commit-input.json`

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "git commit -m 'feat(nx-surrealdb): add rollback support'",
    "description": "Commit staged changes"
  },
  "working_directory": "/home/user/goodiebag",
  "timestamp": "2025-07-12T13:42:07Z"
}
```

**File**: `.claude/tests/fixtures/multi-package-input.json`

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "git commit -m 'feat: update multiple packages'",
    "description": "Commit changes across packages"
  },
  "working_directory": "/home/user/goodiebag",
  "timestamp": "2025-07-12T13:42:07Z"
}
```

**File**: `.claude/tests/fixtures/nx-command-input.json`

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "nx run-many --target=build --all",
    "description": "Build all packages"
  },
  "working_directory": "/home/user/goodiebag",
  "timestamp": "2025-07-12T13:42:07Z"
}
```

**File**: `.claude/tests/fixtures/invalid-input.json`

```json
{
  "invalid": "json structure"
  "missing_comma": true
}
```

**File**: `.claude/tests/fixtures/empty-input.json`

```json
{
  "tool_name": "Unknown",
  "tool_input": {},
  "working_directory": "/home/user/goodiebag",
  "timestamp": "2025-07-12T13:42:07Z"
}
```

## Mock Tools for Testing

### Mock Tools Script

**File**: `.claude/tests/mock-tools.sh`

```bash
#!/bin/bash
# Mock external tools for testing

MOCKS_DIR="$(dirname "$0")/mocks"
mkdir -p "$MOCKS_DIR"

# Mock git command
cat > "$MOCKS_DIR/git" << 'EOF'
#!/bin/bash
case "$1" in
  "diff")
    if [[ "$*" == *"--cached --name-only"* ]]; then
      echo "packages/nx-surrealdb/src/lib/migration.ts"
      echo "packages/nx-surrealdb/src/lib/migration.spec.ts"
    elif [[ "$*" == *"--name-only main...HEAD"* ]]; then
      echo "packages/nx-surrealdb/src/lib/migration.ts"
      echo "packages/nx-surrealdb/README.md"
    fi
    ;;
  "rev-parse")
    echo "feat/migration-rollback"
    ;;
  "status")
    echo "nothing to commit, working tree clean"
    ;;
  *)
    echo "Mock git: $*"
    ;;
esac
EOF

# Mock nx command
cat > "$MOCKS_DIR/nx" << 'EOF'
#!/bin/bash
case "$1" in
  "affected:libs")
    echo "nx-surrealdb"
    ;;
  "affected:apps")
    echo ""
    ;;
  "show")
    echo "nx-surrealdb nx-rust claude-config"
    ;;
  *)
    echo "Mock nx: $*"
    ;;
esac
EOF

# Mock gh command
cat > "$MOCKS_DIR/gh" << 'EOF'
#!/bin/bash
case "$1" in
  "pr")
    case "$2" in
      "create")
        echo "https://github.com/deepbrainspace/goodiebag/pull/123"
        ;;
      "view")
        echo '{"body": "Existing PR description"}'
        ;;
      "edit")
        echo "✓ Pull request #123 edited"
        ;;
    esac
    ;;
  *)
    echo "Mock gh: $*"
    ;;
esac
EOF

# Make mocks executable
chmod +x "$MOCKS_DIR"/*

# Export mock PATH
export PATH="$MOCKS_DIR:$PATH"

echo "Mock tools installed in $MOCKS_DIR"
echo "To use mocks: export PATH=\"$MOCKS_DIR:\$PATH\""
```

## Integration Testing

### Integration Test Runner

**File**: `.claude/tests/integration-test.sh`

```bash
#!/bin/bash
# Integration tests with real Claude Code operations

set -euo pipefail

echo "🔄 Running Integration Tests"

# Setup test repository
TEST_REPO=$(mktemp -d)
cd "$TEST_REPO"

git init
git config user.name "Test User"
git config user.email "test@example.com"

# Create test structure
mkdir -p packages/test-package/src
echo "export const test = 'value';" > packages/test-package/src/index.ts
echo "console.log('test');" > packages/test-package/src/index.spec.ts

# Test hook with real operations
echo "Testing commit assistant with real git operations..."

# Stage files
git add .

# Test commit assistant
if echo '{"tool_name": "Bash", "tool_input": {"command": "git commit -m test"}}' | \
   "$CLAUDE_SCRIPTS_DIR/commit-assistant.sh" | grep -q "Commit Analysis"; then
  echo "✅ Commit assistant integration test passed"
else
  echo "❌ Commit assistant integration test failed"
fi

# Cleanup
cd /
rm -rf "$TEST_REPO"
```

## Performance Testing

### Performance Test Suite

**File**: `.claude/tests/performance-test.sh`

```bash
#!/bin/bash
# Performance testing for hooks

echo "⚡ Running Performance Tests"

SCRIPTS_DIR=".claude/scripts"
TEST_INPUT='{"tool_name": "Bash", "tool_input": {"command": "git status"}}'

# Test each script performance
for script in "$SCRIPTS_DIR"/*.sh; do
  if [ -x "$script" ]; then
    script_name=$(basename "$script")
    echo -n "Testing $script_name performance... "

    # Measure execution time
    start_time=$(date +%s.%N)
    echo "$TEST_INPUT" | "$script" >/dev/null 2>&1 || true
    end_time=$(date +%s.%N)

    duration=$(echo "$end_time - $start_time" | bc -l)

    # Performance thresholds
    if (( $(echo "$duration < 1.0" | bc -l) )); then
      echo "✅ ${duration}s (excellent)"
    elif (( $(echo "$duration < 3.0" | bc -l) )); then
      echo "⚠️  ${duration}s (acceptable)"
    else
      echo "❌ ${duration}s (too slow)"
    fi
  fi
done
```

## Workflow Testing

### End-to-End Workflow Test

**File**: `.claude/tests/e2e-workflow-test.sh`

```bash
#!/bin/bash
# End-to-end workflow testing

echo "🚀 Running End-to-End Workflow Tests"

# Test complete development workflow with hooks
TEST_BRANCH="test/e2e-$(date +%s)"

echo "1. Creating test branch..."
git checkout -b "$TEST_BRANCH"

echo "2. Making test changes..."
echo "// Test change" >> packages/claude-config/README.md

echo "3. Testing commit workflow..."
git add packages/claude-config/README.md

# Test commit assistant
if echo '{"tool_name": "Bash", "tool_input": {"command": "git commit -m \"docs(claude-config): test change\""}}' | \
   .claude/scripts/commit-assistant.sh | grep -q "claude-config"; then
  echo "✅ Commit assistant correctly identified package"
else
  echo "❌ Commit assistant failed"
fi

echo "4. Cleaning up..."
git reset --hard HEAD
git checkout main
git branch -D "$TEST_BRANCH"

echo "✅ E2E workflow test completed"
```

## Automated Testing Pipeline

### Test Automation Script

**File**: `.claude/tests/run-all-tests.sh`

```bash
#!/bin/bash
# Complete test suite runner

set -euo pipefail

TESTS_DIR="$(dirname "$0")"
cd "$(dirname "$TESTS_DIR")"  # Go to .claude directory

echo "🧪 Running Complete Claude Hooks Test Suite"
echo "============================================"

# Check prerequisites
echo "Checking prerequisites..."
for tool in jq bc timeout; do
  if ! command -v "$tool" &> /dev/null; then
    echo "❌ Required tool '$tool' not found"
    exit 1
  fi
done
echo "✅ Prerequisites satisfied"

# Run unit tests
echo -e "\n📋 Running Unit Tests..."
if "$TESTS_DIR/test-runner.sh"; then
  echo "✅ Unit tests passed"
else
  echo "❌ Unit tests failed"
  exit 1
fi

# Run performance tests
echo -e "\n⚡ Running Performance Tests..."
"$TESTS_DIR/performance-test.sh"

# Run integration tests (if in git repository)
if git rev-parse --git-dir >/dev/null 2>&1; then
  echo -e "\n🔄 Running Integration Tests..."
  "$TESTS_DIR/integration-test.sh"

  echo -e "\n🚀 Running E2E Tests..."
  "$TESTS_DIR/e2e-workflow-test.sh"
else
  echo -e "\n⚠️  Skipping integration tests (not in git repository)"
fi

echo -e "\n✅ All tests completed successfully!"
```

### Continuous Testing

**File**: `.claude/tests/watch-tests.sh`

```bash
#!/bin/bash
# Watch for changes and run tests automatically

echo "👀 Watching for changes to run tests automatically..."

# Function to run tests
run_tests() {
  echo -e "\n🔄 Changes detected, running tests..."
  if .claude/tests/run-all-tests.sh; then
    echo "✅ Tests passed"
  else
    echo "❌ Tests failed"
  fi
  echo "Watching for more changes..."
}

# Initial test run
run_tests

# Watch for changes (requires inotify-tools)
if command -v inotifywait &> /dev/null; then
  while inotifywait -r -e modify .claude/scripts/ .claude/settings.json 2>/dev/null; do
    run_tests
  done
else
  echo "Install inotify-tools for file watching, or run tests manually"
fi
```

## Test Configuration

### Test Settings

**File**: `.claude/tests/test-settings.json`

```json
{
  "test_environment": {
    "timeout_seconds": 10,
    "max_output_lines": 100,
    "mock_external_tools": true
  },
  "performance_thresholds": {
    "excellent": 1.0,
    "acceptable": 3.0,
    "slow": 5.0
  },
  "test_data": {
    "sample_pr_number": "123",
    "sample_branch": "feat/test-feature",
    "sample_packages": ["nx-surrealdb", "claude-config"]
  }
}
```

## Usage Instructions

### Running Tests

```bash
# Run all tests
.claude/tests/run-all-tests.sh

# Run specific test type
.claude/tests/test-runner.sh          # Unit tests only
.claude/tests/performance-test.sh     # Performance tests only
.claude/tests/integration-test.sh     # Integration tests only

# Watch for changes
.claude/tests/watch-tests.sh
```

### Adding New Tests

1. **Create test fixture**: Add JSON input file to `fixtures/`
2. **Add test case**: Update `test-runner.sh` with new test
3. **Add performance test**: Include script in performance testing
4. **Update integration test**: Add workflow step if needed

### Test-Driven Hook Development

1. **Write test first**: Create failing test for new hook
2. **Implement hook**: Write hook script to pass test
3. **Validate performance**: Ensure hook meets performance thresholds
4. **Test integration**: Validate with real workflow operations

This comprehensive testing strategy ensures that Claude Code hooks are reliable,
performant, and maintain compatibility with your existing development workflow.
