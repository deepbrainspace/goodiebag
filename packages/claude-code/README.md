# claude-code

[![Rust](https://img.shields.io/badge/rust-2024-orange.svg)](https://www.rust-lang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Claude Code management tool for automatic credential synchronization to GitHub, session monitoring, and more.

## Features

- **🔄 Automatic Credential Sync**: Syncs Claude Code credentials to GitHub organization/repository secrets
- **⏰ Smart Scheduling**: Monitors token expiry and syncs 1 minute after new token is generated
- **🎯 Multi-Target Support**: Sync to multiple GitHub organizations and repositories simultaneously
- **📊 Session Monitoring**: Real-time session timer and status tracking with desktop notifications
- **🔧 Systemd Integration**: Runs as a background daemon with automatic startup and monitoring
- **🚀 High Performance**: Written in Rust for minimal resource usage and maximum reliability

## Installation

### From Source (Development)

```bash
# Clone the repository
git clone https://github.com/deepbrainspace/goodiebag
cd goodiebag/packages/claude-code

# Build and install
cargo build --release
cargo install --path .
```

### Via NX (Recommended for Development)

```bash
# Build with NX
nx build claude-code

# Install locally
nx run claude-code:install
```

## Prerequisites

- **Rust 2024 Edition** (rustc 1.80+)
- **GitHub CLI** (`gh`) installed and authenticated
- **Claude Code** installed and authenticated
- **Linux/macOS** with systemd (for daemon functionality)

## Quick Start

1. **Install and Configure**:
```bash
# Add GitHub organization
claude-code org add your-org-name

# Add GitHub repository
claude-code repo add owner/repository

# Install and start daemon
claude-code service install
```

2. **Check Status**:
```bash
claude-code status
```

3. **Real-time Session Timer**:
```bash
claude-code timer
```

## Commands

### Session Management
- `claude-code status` - Show comprehensive session and sync status
- `claude-code timer` - Real-time session timer with progress bar

### Organization Management
- `claude-code org add <name> [--secret-name NAME]` - Add GitHub organization
- `claude-code org remove <name>` - Remove organization
- `claude-code org list` - List configured organizations with availability

### Repository Management
- `claude-code repo add <owner/repo> [--secret-name NAME]` - Add repository
- `claude-code repo remove <owner/repo>` - Remove repository
- `claude-code repo list` - List configured repositories

### Sync Operations
- `claude-code sync now` - Force immediate credential sync
- `claude-code sync status` - Show detailed sync status for all targets
- `claude-code sync logs [--lines N]` - View daemon logs

### Service Management
- `claude-code service install` - Install and start systemd daemon
- `claude-code service uninstall [--keep-config]` - Uninstall daemon
- `claude-code service start/stop/restart` - Control daemon
- `claude-code service enable/disable` - Control auto-start

### Configuration
- `claude-code configure` - Interactive configuration wizard *(coming soon)*

## Configuration

Configuration is stored in `~/.goodiebag/claude-code/config.yml`:

```yaml
daemon:
  log_level: info
  sync_delay_after_expiry: 60  # seconds after token expiry

github:
  organizations:
    - name: deepbrainspace
      secret_name: CLAUDE_CODE_TOKEN
    - name: another-org
      secret_name: CLAUDE_ACCESS_TOKEN
  
  repositories:
    - repo: user/special-repo
      secret_name: CUSTOM_CLAUDE_TOKEN

notifications:
  session_warnings: [30, 15, 5]  # minutes before expiry
  sync_failures: true
```

## How It Works

1. **Credential Monitoring**: Daemon monitors `~/.claude/.credentials.json` for changes
2. **Smart Timing**: When token expires, waits 60 seconds for Claude Code to refresh it
3. **Automatic Sync**: Detects new token and syncs to all configured GitHub targets
4. **Startup Recovery**: Performs reconciliation check on startup to catch missed syncs
5. **Status Tracking**: Maintains detailed sync status and error information per target

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
nx build claude-code
nx test claude-code
nx lint claude-code
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
claude-code status
systemctl --user status claude-code-sync
```

### View Detailed Logs
```bash
claude-code sync logs --lines 100
journalctl --user -u claude-code-sync -f
```

### Manual Sync
```bash
claude-code sync now
```

### Reset Configuration
```bash
claude-code service uninstall
rm -rf ~/.goodiebag/claude-code
claude-code service install
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

- **Issues**: [GitHub Issues](https://github.com/deepbrainspace/goodiebag/issues)
- **Documentation**: This README and inline code documentation
- **Community**: Discussions in the repository