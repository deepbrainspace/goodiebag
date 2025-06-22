# claude-code-toolkit

*Part of the [GoodieBag](https://github.com/deepbrainspace/goodiebag) collection of tools and libraries*

[![Crates.io](https://img.shields.io/crates/v/claude-code-toolkit.svg)](https://crates.io/crates/claude-code-toolkit)
[![Rust](https://img.shields.io/badge/rust-2024-orange.svg)](https://www.rust-lang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Claude Code management tool for automatic credential synchronization to GitHub, session monitoring, and daemon service management.

## Features

- **🔄 Automatic Credential Sync**: Syncs Claude Code credentials to GitHub organization/repository secrets
- **⏰ Smart Scheduling**: Monitors token expiry and syncs 1 minute after new token generation
- **🎯 Multi-Target Support**: Sync to multiple GitHub organizations and repositories simultaneously
- **📊 Session Monitoring**: Real-time session timer and status tracking with desktop notifications
- **🔧 Systemd User Service Integration**: Runs as a background daemon with automatic startup
- **🚀 High Performance**: Written in Rust for minimal resource usage and maximum reliability

## Installation

### Option 1: Cargo Install (Recommended)

```bash
# Install from crates.io
cargo install claude-code-toolkit

# Ensure ~/.cargo/bin is in your PATH
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Option 2: From Source

```bash
# Clone the repository
git clone https://github.com/deepbrainspace/goodiebag
cd goodiebag/packages/claude-code-toolkit

# Build and install
cargo install --path .
```

**Important**: The binary must remain in a stable location for the daemon
service to work. If you move the binary after installing the service, run
`claude-code-toolkit service install` again.

## Prerequisites

- **Rust 2024 Edition** (rustc 1.80+)
- **GitHub CLI** (`gh`) installed and authenticated
- **GitHub Personal Access Token** with appropriate permissions (see setup below)
- **Claude Code** installed and authenticated
- **Linux/macOS** with systemd (for daemon functionality)

### GitHub Setup

#### 1. Install GitHub CLI

```bash
# Ubuntu/Debian
sudo apt install gh

# macOS
brew install gh

# Or download from https://cli.github.com/
```

#### 2. Create GitHub Personal Access Token

1. Go to [GitHub Settings > Developer Settings > Personal Access Tokens > Fine-grained tokens](https://github.com/settings/personal-access-tokens/new)
2. Create a new token with these permissions:
   - **Repository access**: Select specific repositories OR all repositories (depending on your needs)
   - **Repository permissions**:
     - `Secrets: Write` (required for updating repository secrets)
     - `Metadata: Read` (required for basic repository access)
   - **Organization permissions** (if syncing to organizations):
     - `Organization secrets: Write` (required for updating organization secrets)
     - `Members: Read` (required for organization access)

#### 3. Authenticate GitHub CLI

```bash
# Login using your PAT
gh auth login

# Or set token directly
export GITHUB_TOKEN="your_github_pat_here"
gh auth login --with-token <<< "$GITHUB_TOKEN"

# Verify authentication
gh auth status
```

## Quick Start

1. **Install and Configure**:

```bash
# Add GitHub organization
claude-code-toolkit org add your-org-name

# Add GitHub repository
claude-code-toolkit repo add owner/repository

# Install and start daemon
claude-code-toolkit service install
```

2. **Check Status**:

```bash
claude-code-toolkit status
```

3. **Real-time Session Timer**:

```bash
claude-code-toolkit timer
```

## Commands

### Session Management

- `claude-code-toolkit status` - Show comprehensive session and sync status
- `claude-code-toolkit timer` - Real-time session timer with progress bar

### Organization Management

- `claude-code-toolkit org add <name> [--secret-name NAME]` - Add GitHub organization
- `claude-code-toolkit org remove <name>` - Remove organization
- `claude-code-toolkit org list` - List configured organizations with availability

### Repository Management

- `claude-code-toolkit repo add <owner/repo> [--secret-name NAME]` - Add repository
- `claude-code-toolkit repo remove <owner/repo>` - Remove repository
- `claude-code-toolkit repo list` - List configured repositories

### Sync Operations

- `claude-code-toolkit sync now` - Force immediate credential sync
- `claude-code-toolkit sync status` - Show detailed sync status for all targets
- `claude-code-toolkit sync logs [--lines N]` - View daemon logs

### Service Management

- `claude-code-toolkit service install` - Install and start systemd user daemon
- `claude-code-toolkit service uninstall [--keep-config]` - Uninstall daemon
- `claude-code-toolkit service start/stop/restart` - Control daemon
- `claude-code-toolkit service enable/disable` - Control auto-start on login

### Configuration

- `claude-code-toolkit configure` - Interactive configuration wizard _(coming soon)_

## Configuration

### Command-Line Configuration

You can configure targets using the CLI commands:

```bash
# Add organizations
claude-code-toolkit org add my-org --secret-name CLAUDE_TOKEN
claude-code-toolkit org add another-org --secret-name CUSTOM_CLAUDE_TOKEN

# Add repositories  
claude-code-toolkit repo add owner/repo --secret-name CLAUDE_CODE_TOKEN
claude-code-toolkit repo add owner/special-repo --secret-name CUSTOM_TOKEN

# List current configuration
claude-code-toolkit org list
claude-code-toolkit repo list
```

### Direct YAML Configuration

**Alternative**: You can directly edit the configuration file at `~/.goodiebag/claude-code/config.yml`:

```yaml
daemon:
  log_level: info                    # debug, info, warn, error
  sync_delay_after_expiry: 60       # seconds to wait after token expiry

github:
  organizations:
    - name: deepbrainspace
      secret_name: CLAUDE_CODE_TOKEN  # Custom secret name (optional)
    - name: another-org
      secret_name: CLAUDE_ACCESS_TOKEN
    - name: simple-org                # Uses default secret name

  repositories:
    - repo: user/special-repo
      secret_name: CUSTOM_CLAUDE_TOKEN
    - repo: owner/another-repo        # Uses default secret name

notifications:
  session_warnings: [30, 15, 5]      # Warning times (minutes before expiry)
  sync_failures: true                # Notify on sync failures
```

**Configuration Notes**:
- If `secret_name` is omitted, defaults to `CLAUDE_CODE_TOKEN`
- Restart the daemon after editing YAML: `claude-code-toolkit service restart`
- Validate configuration: `claude-code-toolkit status`
- The CLI commands automatically update the YAML file

## Daemon Installation Details

The `claude-code-toolkit service install` command:

1. **Creates Systemd Service**: Installs
   `~/.config/systemd/user/claude-code-sync.service`
2. **References Current Binary**: Uses the exact path of the currently running
   binary (no copying)
3. **User Service**: Runs as a user service (no root privileges required)
4. **Auto-Start**: Enables automatic startup on user login
5. **Security Sandboxing**: Runs with restricted file system access

**Service Location**: `~/.config/systemd/user/claude-code-sync.service`
**Service Command**: `{binary_path} daemon` **Service Type**: User service
(systemctl --user)

### Manual Service Management

```bash
# View service status
systemctl --user status claude-code-sync

# Control service directly
systemctl --user start/stop/restart claude-code-sync

# View logs
journalctl --user -u claude-code-sync -f

# Remove service manually
systemctl --user stop claude-code-sync
systemctl --user disable claude-code-sync
rm ~/.config/systemd/user/claude-code-sync.service
systemctl --user daemon-reload
```

## How It Works

1. **Credential Monitoring**: Daemon monitors `~/.claude/.credentials.json` for
   changes
2. **Smart Timing**: When token expires, waits 60 seconds for Claude Code to
   refresh it
3. **Automatic Sync**: Detects new token and syncs to all configured GitHub
   targets
4. **Startup Recovery**: Performs reconciliation check on startup to catch
   missed syncs
5. **Status Tracking**: Maintains detailed sync status and error information per
   target

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Claude Code    │───▶│  claude-code     │───▶│  GitHub Secrets │
│  Credentials    │    │  Daemon          │    │  (Orgs & Repos) │
│  ~/.claude/     │    │  (Systemd)       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │
                               ▼
                       ┌──────────────────┐
                       │  Configuration   │
                       │  ~/.goodiebag/   │
                       │  claude-code/    │
                       └──────────────────┘
```

## Development

### Building

```bash
# Check code
cargo check

# Run tests
cargo test

# Build optimized binary
cargo build --release

# Run with NX
nx build claude-code-toolkit
nx test claude-code-toolkit
nx lint claude-code-toolkit
```

### Testing

The project includes comprehensive test coverage:

- **Unit Tests**: Core functionality testing
- **Integration Tests**: End-to-end workflow testing
- **Property Tests**: Edge case validation

```bash
# Run all tests
cargo test

# Run tests with coverage
cargo test --all-features

# Run specific test module
cargo test config::tests
```

### Code Quality

```bash
# Lint with clippy
cargo clippy -- -D warnings

# Format code
cargo fmt

# Check formatting
cargo fmt --check
```

## Troubleshooting

### Check Daemon Status

```bash
claude-code-toolkit status
systemctl --user status claude-code-sync
```

### View Detailed Logs

```bash
claude-code-toolkit sync logs --lines 100
journalctl --user -u claude-code-sync -f
```

### Manual Sync

```bash
claude-code-toolkit sync now
```

### Reset Configuration

```bash
claude-code-toolkit service uninstall
rm -rf ~/.goodiebag/claude-code
claude-code-toolkit service install
```

## Performance

- **Binary Size**: ~8MB (optimized)
- **Memory Usage**: ~5-10MB runtime
- **CPU Usage**: Near-zero when idle
- **Startup Time**: <100ms
- **Sync Time**: ~2-5 seconds per target

## Security

- **Credential Security**: Read-only access to local Claude credentials
- **GitHub Authentication**: Uses authenticated `gh` CLI for all operations
- **Audit Trail**: All operations logged with timestamps and outcomes
- **Systemd Sandboxing**: Runs with minimal file system permissions
- **No Network Storage**: All data stored locally in user directories

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Issues**:
  [GitHub Issues](https://github.com/deepbrainspace/goodiebag/issues)
- **Documentation**: This README and inline code documentation
- **Community**: Discussions in the repository
