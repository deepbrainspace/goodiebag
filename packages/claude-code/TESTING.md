# Claude Code Testing Guide

## Overview
This document provides comprehensive testing procedures for the `claude-code` package, covering all functionality from configuration to GitHub secrets synchronization.

## Prerequisites

### Required Tools
- **Rust 1.85+**: For building the binary
- **GitHub CLI (gh)**: For GitHub API access
- **Claude Code API access**: Active Max Pro plan with credentials

### Installation
```bash
# Build and install from source
nx install claude-code

# Verify installation
claude-code --version  # Should show: claude-code 0.1.0
claude-code --help     # Shows all available commands
```

## Testing Procedures

### 1. Configuration Testing

#### 1.1 Initial Configuration Setup
```bash
# Test interactive configuration wizard
claude-code configure

# Expected: Should prompt for initial setup with YAML config creation
```

#### 1.2 Status Check (Before Configuration)
```bash
claude-code status

# Expected: Show configuration status, credential status, and sync state
```

### 2. Organization Management Testing

#### 2.1 GitHub Authentication Verification
```bash
# Check if GitHub CLI is authenticated
gh auth status

# If not authenticated, login:
gh auth login
```

#### 2.2 Organization Management
```bash
# List available organizations
claude-code org list

# Add organization for secret sync
claude-code org add deepbrainspace CLAUDE_ACCESS_TOKEN

# Verify organization was added
claude-code org list

# Test removing organization (optional)
# claude-code org remove deepbrainspace
```

### 3. Repository Management Testing

#### 3.1 Repository Operations
```bash
# Add repository for secret sync
claude-code repo add goodiebag CLAUDE_ACCESS_TOKEN

# List configured repositories
claude-code repo list

# Test removing repository (optional)
# claude-code repo remove goodiebag
```

### 4. Credential Synchronization Testing

#### 4.1 Manual Sync Testing
```bash
# Test immediate sync
claude-code sync now

# Expected: Should read ~/.claude/.credentials.json and sync to GitHub secrets
```

#### 4.2 Sync Status and History
```bash
# Check sync status
claude-code sync status

# Expected: Show last sync time, next scheduled sync, and sync history
```

### 5. Session Monitoring Testing

#### 5.1 Session Status
```bash
claude-code status

# Expected: Show session info including time remaining, token expiry
```

#### 5.2 Real-time Timer
```bash
claude-code timer

# Expected: Show real-time countdown of session time remaining
# Press Ctrl+C to exit
```

### 6. Service/Daemon Testing

#### 6.1 Service Installation
```bash
# Install systemd service
claude-code service install

# Expected: Creates systemd user service for automatic sync
```

#### 6.2 Service Management
```bash
# Start the service
claude-code service start

# Check service status
claude-code service status

# View service logs
claude-code service logs

# Stop the service
claude-code service stop

# Uninstall service (cleanup)
claude-code service uninstall
```

### 7. GitHub Integration Testing

#### 7.1 Secret Verification
```bash
# Check GitHub organization secrets
gh api orgs/deepbrainspace/actions/secrets

# Check repository secrets
gh api repos/deepbrainspace/goodiebag/actions/secrets

# Expected: Should see CLAUDE_ACCESS_TOKEN, CLAUDE_REFRESH_TOKEN, CLAUDE_EXPIRES_AT
```

#### 7.2 Claude Agent Testing via PR
1. **Create test commit**:
   ```bash
   # Make a small change
   echo "# Test Claude Integration" >> TEST_CLAUDE.md
   git add TEST_CLAUDE.md
   git commit -m "test: verify Claude agent integration"
   git push origin test/claude-bash-permissions
   ```

2. **Test Claude agent response**:
   - Go to PR #12: https://github.com/deepbrainspace/goodiebag/pull/12
   - Add comment: `@claude Please verify that the secrets are working and you can access the repository`
   - Check GitHub Actions tab for workflow execution
   - Verify Claude responds with confirmation

#### 7.3 Action Logs Analysis
```bash
# Check workflow runs
gh run list --workflow=claude.yml

# View latest run details
gh run view --log
```

## Expected Test Outcomes

### ✅ Successful Configuration
- Config file created at `~/.goodiebag/claude-code/config.yml`
- GitHub CLI authentication verified
- Organizations and repositories properly configured

### ✅ Successful Synchronization
- Secrets successfully created/updated in GitHub
- Sync timing respects token expiry (syncs 1 minute after expiry)
- Sync history properly maintained

### ✅ Successful Service Operation
- Systemd service installs and runs without errors
- Automatic synchronization occurs on schedule
- Service logs show successful operations

### ✅ Successful GitHub Integration
- Claude agent responds to @claude mentions in PR comments
- Workflow uses synchronized secrets successfully
- No authentication or permission errors

## Troubleshooting Common Issues

### Issue: GitHub CLI Not Authenticated
**Solution**: Run `gh auth login` and follow prompts

### Issue: Permission Denied for GitHub Secrets
**Solution**: Ensure GitHub token has `admin:org` and `repo` permissions

### Issue: Claude Credentials Not Found
**Solution**: Verify `~/.claude/.credentials.json` exists and contains valid tokens

### Issue: Systemd Service Fails
**Solution**: Check logs with `claude-code service logs` and verify file permissions

## Test Results Log

| Test Category | Status | Notes |
|--------------|--------|-------|
| Installation | ✅ | Binary installed successfully |
| Configuration | ⏳ | Testing in progress |
| Organization Mgmt | ⏳ | Testing in progress |
| Repository Mgmt | ⏳ | Testing in progress |
| Manual Sync | ⏳ | Testing in progress |
| Session Monitor | ⏳ | Testing in progress |
| Service/Daemon | ⏳ | Testing in progress |
| GitHub Integration | ⏳ | Testing in progress |

## Security Considerations

1. **Credential Storage**: Local credentials are read-only, never modified
2. **GitHub Secrets**: Encrypted at rest, only accessible to authorized workflows
3. **Network Security**: All API calls use HTTPS with proper authentication
4. **Service Security**: Systemd service runs with user permissions, not root

## Performance Metrics

- **Sync Time**: Typical sync completes in < 5 seconds
- **Memory Usage**: Service typically uses < 10MB RAM
- **CPU Usage**: Minimal CPU usage during normal operation
- **Network Usage**: < 1KB per sync operation

---

*Last Updated: 2025-06-18*
*Version: 0.1.0*