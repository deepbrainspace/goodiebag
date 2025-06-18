# Claude Code Setup Guide

## Quick Start

### 1. Prerequisites
Ensure you have these installed and configured:

```bash
# Install GitHub CLI
# See: https://cli.github.com/

# Authenticate with GitHub
gh auth login

# Verify Claude Code is installed and you're logged in
# Should have ~/.claude/.credentials.json file
ls -la ~/.claude/.credentials.json
```

### 2. Configuration

#### Option A: Use Interactive Setup (Recommended)
```bash
# Run the configuration wizard
./target/release/claude-code configure

# Follow the prompts to:
# - Verify prerequisites
# - Add organizations/repositories
# - Configure secret mappings
# - Set up daemon (optional)
```

#### Option B: Manual Configuration
```bash
# Create config directory
mkdir -p ~/.goodiebag/claude-code

# Copy example config
cp config.example.yml ~/.goodiebag/claude-code/config.yml

# Edit the config file
nano ~/.goodiebag/claude-code/config.yml
```

### 3. Configuration File Customization

Edit `~/.goodiebag/claude-code/config.yml`:

#### GitHub Targets
```yaml
github:
  organizations:
    - "your-org-name"           # Replace with your GitHub org
  repositories:
    - "owner/repo-name"         # Replace with your repositories
```

#### Secret Mappings
The most important section - maps credential fields to GitHub secret names:

```yaml
secrets:
  mappings:
    accessToken: "CLAUDE_ACCESS_TOKEN"      # Required for API access
    refreshToken: "CLAUDE_REFRESH_TOKEN"    # Required for token refresh
    expiresAt: "CLAUDE_EXPIRES_AT"          # Required for timing sync
    subscriptionType: "CLAUDE_SUBSCRIPTION" # Optional metadata
    scopes: "CLAUDE_SCOPES"                 # Optional metadata
```

**Important:** These secret names will be created in your GitHub organizations/repositories. Make sure they match what your Claude Code GitHub Action expects.

### 4. Testing Your Configuration

```bash
# Check status
./target/release/claude-code status

# Test manual sync
./target/release/claude-code sync now

# Monitor token expiry in real-time
./target/release/claude-code timer
```

### 5. Daemon Setup (24/7 Operation)

```bash
# Install systemd service
./target/release/claude-code service install

# Start the service
./target/release/claude-code service start

# Check service status
./target/release/claude-code service status
```

## Configuration Reference

### Available Credential Fields
Based on your `~/.claude/.credentials.json` structure:
- `accessToken` - Main API access token
- `refreshToken` - Token for refreshing access
- `expiresAt` - Token expiration timestamp (milliseconds)
- `subscriptionType` - Subscription level (max, pro, etc.)
- `scopes` - Array of granted API scopes

### GitHub Secret Names
You can map these to any GitHub secret names you prefer. Common patterns:
- `CLAUDE_ACCESS_TOKEN`
- `CLAUDE_REFRESH_TOKEN` 
- `CLAUDE_EXPIRES_AT`
- `CLAUDE_SUBSCRIPTION`
- `CLAUDE_SCOPES`

### Sync Timing
- Daemon checks for token changes every minute
- Sync occurs 60 seconds AFTER token expiry (configurable)
- Startup reconciliation catches any missed syncs

## Troubleshooting

### Common Issues

**GitHub CLI not authenticated:**
```bash
gh auth status
gh auth login
```

**Missing Claude credentials:**
```bash
# Ensure Claude Code is installed and you're logged in
ls -la ~/.claude/.credentials.json
```

**Permission denied for organization:**
```bash
# Ensure you have admin access to the organization
gh api orgs/YOUR_ORG/memberships/YOUR_USERNAME
```

**Config file not found:**
```bash
# Check config location
ls -la ~/.goodiebag/claude-code/config.yml

# Copy example if needed
cp config.example.yml ~/.goodiebag/claude-code/config.yml
```

### Debug Mode
```bash
# Run with debug logging
RUST_LOG=debug ./target/release/claude-code sync now
```

## Next Steps

1. **Test the configuration** with `claude-code sync now`
2. **Set up GitHub Actions** to use the synced secrets
3. **Install daemon** for automatic 24/7 operation
4. **Monitor logs** to ensure proper operation