# Husky Git Hooks

This directory contains automated git hooks powered by
[Husky](https://typicode.github.io/husky/) that enforce code quality, security,
and consistency across the repository.

## Overview

Our git hooks provide automated checks at different stages of the git workflow
to catch issues early and maintain high code quality standards.

## Hook Files

### `pre-commit`

Runs before each commit to ensure code quality and security.

**Checks performed:**

- **Branch Protection**: Prevents direct commits to main branch
- **Working Tree**: Ensures all changes are staged before committing
- **Secret Detection**: Scans for potential API keys, tokens, and secrets
- **Git-crypt**: Validates encryption status of sensitive files
- **Code Formatting**: Auto-formats code using NX and reports any changes

### `commit-msg`

Validates commit message format after writing the commit message.

**Checks performed:**

- **Conventional Commits**: Enforces conventional commit message format
- **Valid Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`,
  `perf`, `ci`, `build`, `revert`, `wip`
- **Format**: `<type>[optional scope]: <description>`

### `post-checkout`

Runs after checking out branches to maintain dependency consistency.

**Actions performed:**

- **Dependency Sync**: Automatically runs `pnpm install` when package files
  change between branches
- **Workspace Updates**: Detects changes in `package.json`,
  `pnpm-workspace.yaml`, or package files

### `pre-push`

Runs before pushing to remote repository to ensure lockfile consistency.

**Checks performed:**

- **Lockfile Validation**: Ensures `pnpm-lock.yaml` is in sync with
  `package.json` files
- **Frozen Install**: Tests that dependencies can be installed from lockfile
  without changes

## Utility System

All hooks use a shared utility system defined in `utils.sh` for consistent,
accessible messaging and common functions.

### Available Functions

```bash
info "message"     # Cyan [i] - Informational messages
success "message"  # Green [✓] - Success confirmations
error "message"    # Red [✗] - Error messages
warning "message"  # Yellow [!] - Warning messages
tip "message"      # Cyan [?] - Helpful tips
fix "message"      # Yellow [🔧] - Fix suggestions
stop "message"     # Red [■] - Abort messages
debug_echo "msg"   # Debug output (only when HUSKY_DEBUG=1)
```

### Benefits

- **Accessibility**: No emoji dependency, works in all terminals
- **Consistency**: Standardized color coding across all hooks
- **Readability**: Clear semantic function names
- **Maintainability**: Centralized styling system

## Security Features

### Secret Detection

- Scans for API keys (patterns like `sk-`, `ghp_`)
- Detects JWT tokens (starting with `ey`)
- Finds base64-encoded secrets (32+ characters)
- Excludes git-crypt encrypted files from scanning
- Provides user override option for false positives

### Git-crypt Integration

- Validates that files marked for encryption are properly encrypted
- Checks `.gitattributes` filter settings
- Provides status information for encrypted files
- Prevents accidental commits of unencrypted sensitive data

## Debug Mode

Enable debug output for troubleshooting:

```bash
export HUSKY_DEBUG=1
git commit -m "test commit"
```

This will show detailed information about each check performed.

## Configuration

### Bypassing Hooks (Not Recommended)

While hooks can be bypassed with `--no-verify`, this is strongly discouraged as
it defeats the purpose of automated quality checks.

### Customization

- Modify individual hook files for project-specific requirements
- Update `colors.sh` to change output styling
- Adjust regex patterns in `commit-msg` for different commit conventions

## Dependencies

- **Node.js**: For NX commands and formatting
- **pnpm**: Package manager for dependency management
- **git-crypt** (optional): For file encryption features
- **grep/sed**: Standard Unix tools for pattern matching

## Troubleshooting

### Common Issues

**Hook not running:**

```bash
# Ensure hooks are executable
chmod +x .husky/*
```

**Color output not working:**

```bash
# Test utility functions
source .husky/utils.sh
info "Test message"
```

**NX commands failing:**

```bash
# Ensure NX is installed
pnpm install -g nx
```

**Lockfile out of sync:**

```bash
# Update lockfiles
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
```

## Best Practices

1. **Keep hooks fast**: Hooks should complete quickly to avoid disrupting
   workflow
2. **Provide clear messages**: Use descriptive error messages with actionable
   fixes
3. **Allow overrides carefully**: Only for false positives, not to skip
   important checks
4. **Test changes**: Always test hook modifications before deploying
5. **Document exceptions**: Clearly document any hook customizations

## Integration with CI/CD

These hooks complement CI/CD pipelines by catching issues locally before they
reach the remote repository, reducing build failures and improving developer
productivity.
