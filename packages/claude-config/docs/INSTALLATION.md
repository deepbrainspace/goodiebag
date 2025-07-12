# Claude Config Installation Guide

Complete installation guide for setting up Claude Code with enhanced MCP server configurations across different environments.

## 🎯 Installation Options

### Option 1: Quick Install (Recommended)
```bash
# Clone this repository and install everything
git clone https://github.com/your-org/goodiebag.git
cd goodiebag/packages/claude-config
./install.sh
```

### Option 2: Package-based Install (Future)
```bash
# Install via npm (when published)
npm install -g @goodiebag/claude-config
npx @goodiebag/claude-config setup
```

### Option 3: Manual Install
```bash
# Copy configuration files manually
cp -r packages/claude-config/src/global/* ~/.claude/
```

## 🔧 Prerequisites

### System Requirements
- **Operating System:** Windows (WSL2), macOS, or Linux
- **Node.js:** Version 18+ with npm/npx
- **Claude Code:** Latest version installed
- **Git:** For cloning repository (if using Option 1)

### Check Prerequisites
```bash
# Check Node.js version
node --version  # Should be 18+

# Check if npx is available
npx --version

# Check if Claude Code is installed
claude --version

# Check if git is available (for Option 1)
git --version
```

### Install Prerequisites

**Node.js (if not installed):**
```bash
# Ubuntu/WSL2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node

# Windows
# Download from nodejs.org
```

**Claude Code (if not installed):**
```bash
# Install globally via npm
npm install -g @anthropic-ai/claude-code

# Or use installer script
curl -fsSL https://claude.ai/install.sh | sh
```

## 🚀 Fresh Installation (New Setup)

For users setting up Claude Code from scratch:

### Step 1: Install Claude Code
```bash
# Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# Verify installation
claude --version
```

### Step 2: Get this Configuration Package
```bash
# Clone the repository
git clone https://github.com/your-org/goodiebag.git
cd goodiebag/packages/claude-config
```

### Step 3: Install Global Configuration
```bash
# Run the installer
./install.sh

# This copies:
# - Global CLAUDE.md settings
# - Character files (jarvis.md, eda.md)
# - Command documentation
# - MCP configuration templates
```

### Step 4: Set up MCP Servers
```bash
# Get API keys first (see MCP_SETUP.md)
# Then follow the MCP setup guide
cd docs
cat MCP_SETUP.md
```

### Step 5: Verify Installation
```bash
# Check Claude Code configuration
claude --help

# Test character switching
echo "/character jarvis" | claude

# List MCP servers (after setup)
claude mcp list
```

## 🔄 Existing Installation (Add to Current Setup)

For users who already have Claude Code installed:

### Step 1: Backup Current Configuration
```bash
# Backup existing Claude configuration
cp -r ~/.claude ~/.claude.backup.$(date +%Y%m%d_%H%M%S)
```

### Step 2: Get Configuration Package
```bash
# Clone or download this repository
git clone https://github.com/your-org/goodiebag.git
cd goodiebag/packages/claude-config
```

### Step 3: Merge Configurations
```bash
# Option A: Replace entirely (if you want our full config)
./install.sh

# Option B: Merge manually (if you have custom configs)
# Copy specific files you want:
cp src/global/characters/* ~/.claude/characters/
cp src/global/commands/* ~/.claude/commands/
# Manually merge CLAUDE.md files
```

### Step 4: Add MCP Servers
```bash
# Follow MCP setup guide to add servers
# Your existing Claude setup will remain, just adding MCP functionality
```

## 🖥 Platform-Specific Instructions

### Windows (WSL2)

**Setup WSL2 first:**
```bash
# Enable WSL2 and install Ubuntu
wsl --install -d Ubuntu

# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Continue with normal installation
```

**Environment Variables:**
```bash
# Add to ~/.bashrc
echo 'export PATH="$PATH:/home/nsm/.local/bin"' >> ~/.bashrc
source ~/.bashrc
```

### macOS

**Prerequisites:**
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Continue with normal installation
```

**Environment Variables:**
```bash
# Add to ~/.zshrc (default shell on newer macOS)
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc
source ~/.zshrc
```

### Linux (Native)

**Ubuntu/Debian:**
```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Continue with normal installation
```

**CentOS/RHEL/Fedora:**
```bash
# Install Node.js
sudo dnf install nodejs npm

# Or use NodeSource repo for latest version
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install nodejs

# Continue with normal installation
```

## 🔍 Verification & Testing

### Verify Claude Code Installation
```bash
# Check version
claude --version

# Check available commands
claude --help

# Test basic functionality
echo "Hello, Claude!" | claude
```

### Verify Global Configuration
```bash
# Check if global files are installed
ls -la ~/.claude/

# Test character switching
echo "/character jarvis" | claude
echo "/character eda" | claude
```

### Verify MCP Servers (After Setup)
```bash
# List configured servers
claude mcp list

# Test with debug output
claude --debug mcp list

# Test specific functionality
echo "Search for latest Node.js version" | claude
```

## 🐛 Troubleshooting

### Common Installation Issues

**Issue: `claude: command not found`**
```bash
# Solution: Add to PATH or reinstall
npm install -g @anthropic-ai/claude-code

# Or add to PATH manually
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.bashrc
source ~/.bashrc
```

**Issue: Permission denied during installation**
```bash
# Solution: Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use node version manager
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install node
```

**Issue: Files not copied properly**
```bash
# Solution: Check permissions and run manually
ls -la ~/.claude/
mkdir -p ~/.claude
cp -r src/global/* ~/.claude/
chmod -R 755 ~/.claude/
```

**Issue: MCP servers not working**
```bash
# Solution: Check Node.js version and npx
node --version  # Should be 18+
npx --version

# Reinstall if needed
npm install -g npm@latest
```

### Environment-Specific Issues

**WSL2: Permission issues**
```bash
# Fix WSL2 file permissions
sudo chown -R $(whoami):$(whoami) ~/.claude
chmod -R 755 ~/.claude
```

**macOS: Rosetta issues (M1/M2 Macs)**
```bash
# Install Rosetta if needed
softwareupdate --install-rosetta

# Use native ARM Node.js
arch -arm64 brew install node
```

**Linux: Missing dependencies**
```bash
# Install missing build tools
sudo apt install build-essential python3

# Or on CentOS/RHEL
sudo dnf groupinstall "Development Tools"
```

## 📁 Directory Structure After Installation

```
~/.claude/
├── CLAUDE.md                 # Global Claude settings
├── characters/
│   ├── jarvis.md            # JARVIS personality
│   └── eda.md               # Eda personality
├── commands/
│   ├── character.md         # Character switching docs
│   ├── commitpr.md          # Commit/PR helpers
│   ├── issue.md             # Issue management
│   └── merge.md             # Merge helpers
└── projects/                # Project-specific configs (auto-created)
    └── your-project/        # Per-project settings
```

## 🔄 Updating Configuration

### Update from Repository
```bash
# Navigate to repository
cd goodiebag/packages/claude-config

# Pull latest changes
git pull origin main

# Reinstall (backs up existing config)
./install.sh
```

### Manual Updates
```bash
# Backup current config
cp -r ~/.claude ~/.claude.backup

# Copy new files
cp -r src/global/* ~/.claude/

# Merge any custom changes from backup
```

## 📋 Post-Installation Checklist

- [ ] Claude Code responds to commands
- [ ] Global CLAUDE.md settings are applied
- [ ] Character switching works (`/character jarvis`)
- [ ] MCP servers are configured (if needed)
- [ ] Environment variables are set
- [ ] All prerequisites are installed
- [ ] Backup of previous config exists (if applicable)

## 🎯 Next Steps

After successful installation:

1. **Read the documentation:**
   - [MCP Setup Guide](./MCP_SETUP.md)
   - [Server Reference](./MCP_SERVERS.md)

2. **Test functionality:**
   - Try different characters
   - Test MCP servers (if configured)
   - Explore command helpers

3. **Customize further:**
   - Edit global CLAUDE.md
   - Create custom characters
   - Add project-specific configs

## 📞 Getting Help

If you encounter issues:

1. **Check the troubleshooting section** above
2. **Review error messages** carefully
3. **Check prerequisites** are installed correctly
4. **Create an issue** in this repository with:
   - Your operating system
   - Node.js version
   - Error messages
   - Steps you tried

---

**Installation tested on:** WSL2 (Ubuntu 22.04), macOS 13+, Ubuntu 20.04+  
**Last updated:** December 2024