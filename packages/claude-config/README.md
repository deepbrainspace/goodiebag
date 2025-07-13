# Claude Code Configuration Package

Complete Claude Code configuration package with global settings, character
personalities, and MCP server automation for enhanced development workflows.

## 🚀 Features

- **🎭 Character Personalities** - Switch between AI assistant personas
- **⚙️ Global Configuration** - Consistent settings across all projects
- **🔌 MCP Server Setup** - Complete automation for 9 working MCP servers
- **📚 Comprehensive Documentation** - Step-by-step guides and references
- **🛠 Configuration Templates** - Ready-to-use environment and command templates

## 📁 Contents

### 🎭 Characters

- **jarvis.md** - JARVIS AI assistant personality (polished, witty, British)
- **eda.md** - Eda Yıldız personality (edgy, brutally honest, naughty)

### 📖 Commands & Documentation

- **character.md** - Character switching documentation
- **commitpr.md** - Commit and PR helpers
- **issue.md** - Issue management commands
- **merge.md** - Merge workflow helpers

### ⚙️ Configuration Files

- **Global CLAUDE.md** - Global Claude Code settings and preferences
- **Local CLAUDE.md** - Repository-specific settings and workflows

### 🔌 MCP Server Documentation

- **[MCP_SETUP.md](./docs/MCP_SETUP.md)** - Complete MCP server setup guide
- **[MCP_SERVERS.md](./docs/MCP_SERVERS.md)** - Detailed server reference
- **[INSTALLATION.md](./docs/INSTALLATION.md)** - Full installation guide

### 📝 Configuration Templates

- **[mcp-env.template](./templates/mcp-env.template)** - Environment variables
  template
- **[mcp-commands.md](./templates/mcp-commands.md)** - Copy-paste command
  reference
- **[api-keys-checklist.md](./templates/api-keys-checklist.md)** - API key
  acquisition guide

### 🏠 Local Configuration

- **[Local README](./src/local/README.md)** - Repository-specific configuration
  guide
- **Local CLAUDE.md** - Project-specific settings and workflows
- **Project Commands** - Build, test, and release workflows
- **Project Templates** - NX monorepo and TypeScript project templates
- **Development Workflows** - Feature development and release processes

## 📦 Installation

### Quick Start (Recommended)

```bash
# Clone repository and install
git clone https://github.com/your-org/goodiebag.git
cd goodiebag/packages/claude-config
./install.sh
```

### Alternative Installation Methods

**Option 1: Using pnpm (if in monorepo)**

```bash
pnpm run install:dotfiles
```

**Option 2: Manual copy**

```bash
cp -r src/global/* ~/.claude/
```

**Complete Installation Guide:** See [INSTALLATION.md](./docs/INSTALLATION.md)
for detailed platform-specific instructions.

### Local Configuration Setup

```bash
# Install project-specific configurations
cp -r packages/claude-config/src/local/* .claude/

# Or install from template
cp packages/claude-config/src/local/templates/nx-monorepo/CLAUDE.md .claude/
```

## 🔌 MCP Server Setup

### Quick Setup

1. **Copy configuration:**

   ```bash
   cp packages/claude-config/src/global/.claude.json.example ~/.claude.json
   ```

2. **Get API keys (all have free tiers):**

   - **Serper:** [serper.dev](https://serper.dev/) → API Keys (2,500
     searches/month)
   - **Brave:** [api.search.brave.com](https://api.search.brave.com/) (1,000
     searches/month)
   - **Firecrawl:** [firecrawl.dev](https://firecrawl.dev/) → Dashboard → API
     Keys

3. **Edit configuration:**

   ```bash
   editor ~/.claude.json
   # Replace: "your-serper-api-key", "your-brave-api-key", "fc-your-firecrawl-api-key"
   ```

4. **Test:** `claude mcp list` should show 7 configured servers

### Included Servers

| Server            | Purpose          | API Key Required  |
| ----------------- | ---------------- | ----------------- |
| **search-serper** | Google search    | SERPER_API_KEY    |
| **brave-search**  | Privacy search   | BRAVE_API_KEY     |
| **firecrawl**     | Web scraping     | FIRECRAWL_API_KEY |
| **gmail**         | Email management | OAuth (automatic) |
| **context7**      | Vector search    | None              |
| **Bright Data**   | Web data         | Account-based     |
| **reddit**        | Social content   | None              |

### Usage

```bash
# In Claude Code:
"Search for latest Node.js release"     # → search-serper
"Scrape content from example.com"       # → firecrawl
"Check my recent emails"               # → gmail
```

## 🎯 Usage

After installation, you can:

### Character Switching

```bash
# Switch to JARVIS personality
/character jarvis

# Switch to Eda personality
/character eda
```

### MCP Server Functions

```bash
# Web search
"Search for the latest Node.js release notes"

# Web scraping
"Scrape content from https://example.com and summarize"

# Email management
"Check my recent emails for important updates"

# Social media
"Find trending posts in the JavaScript subreddit"
```

### Configuration Types

**Global Configuration (`~/.claude/`):**

- Consistent settings across all Claude Code sessions
- Character personalities and global preferences
- Cross-project commands and workflows

**Local Configuration (`.claude/`):**

- Repository-specific settings and workflows
- Project-specific build, test, and release commands
- Team collaboration guidelines and conventions

## ✨ Key Features

- ✅ **Version Controlled** - All configurations tracked in git
- ✅ **Cross-Platform** - Works on WSL2, macOS, Linux
- ✅ **MCP Integration** - 9 pre-configured working servers
- ✅ **Comprehensive Docs** - Step-by-step guides and troubleshooting
- ✅ **Template-Based** - Ready-to-use configuration templates
- ✅ **Global & Local** - Support for both global and project-specific settings
- ✅ **Project Workflows** - Build, test, release, and development workflows
- ✅ **Team Collaboration** - Shared project conventions and guidelines

## 🎭 Character Personalities

### JARVIS

- **Style:** Polished, sophisticated British AI assistant
- **Tone:** Witty and subtly sarcastic, professional yet approachable
- **Best for:** Technical guidance with style, professional development work
- **Activate:** `/character jarvis`

### Eda (Eda Yıldız)

- **Style:** Bold, edgy, and brutally honest
- **Tone:** Naughty and rebellious attitude, zero tolerance for mediocrity
- **Best for:** Tough love coding sessions, breaking through blocks
- **Activate:** `/character eda`

## 🔌 MCP Server Capabilities

### 🔍 Search & Web

- **firecrawl** - Advanced web scraping and content extraction
- **search-serper** - Google search integration with API
- **brave-search** - Privacy-focused search alternative

### 📧 Productivity

- **gmail** - Email management and automation
- **airtable** - Database operations and data management

### 🎭 Social & Media

- **reddit** - Browse posts, comments, and trending content
- **yt-dlp** - YouTube video downloads and metadata extraction

### 🛠 Infrastructure

- **brightdata** - Professional web data collection
- **context7** - Vector search and semantic analysis

## 📚 Documentation Quick Links

| Document                                                   | Purpose                          | Audience         |
| ---------------------------------------------------------- | -------------------------------- | ---------------- |
| [MCP_SETUP.md](./docs/MCP_SETUP.md)                        | Complete MCP server setup        | All users        |
| [MCP_SERVERS.md](./docs/MCP_SERVERS.md)                    | Detailed server reference        | Power users      |
| [INSTALLATION.md](./docs/INSTALLATION.md)                  | Platform-specific install guides | New users        |
| [mcp-commands.md](./templates/mcp-commands.md)             | Copy-paste command reference     | Quick setup      |
| [api-keys-checklist.md](./templates/api-keys-checklist.md) | API key acquisition guide        | First-time setup |

## 🔄 Updating & Maintenance

### Update Configuration

```bash
# Pull latest changes
git pull origin main

# Reinstall configuration
./install.sh

# Update MCP servers
claude mcp list  # Check current servers
# Follow MCP_SETUP.md for any new servers
```

### Backup & Restore

```bash
# Backup current configuration
cp -r ~/.claude ~/.claude.backup.$(date +%Y%m%d)

# Restore from backup
cp -r ~/.claude.backup.20241212 ~/.claude
```

## 🚀 Getting Started

1. **Install base configuration:** `./install.sh`
2. **Set up MCP servers:** Follow [MCP_SETUP.md](./docs/MCP_SETUP.md)
3. **Test character switching:** Try `/character jarvis`
4. **Test MCP functionality:** Try web search or email queries
5. **Customize as needed:** Edit files in `~/.claude/`

## 🤝 Contributing

- **Issues:** Report bugs or request features
- **Documentation:** Improve guides and references
- **MCP Servers:** Test and add new working servers
- **Characters:** Create new personality files
- **Templates:** Add useful configuration templates

## 📄 License

This configuration package is part of the Goodiebag monorepo. See repository
license for details.

---

**Latest Update:** December 2024  
**Compatibility:** Claude Code latest version, Node.js 18+  
**Platforms:** WSL2, macOS, Linux
