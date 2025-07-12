# MCP Server Commands Reference

Copy-paste ready commands for setting up all working MCP servers.

## 🚀 Quick Setup (All Servers)

```bash
# Add all 9 working MCP servers at once
claude mcp add firecrawl "npx firecrawl-mcp"
claude mcp add search-serper "npx -y @deepbrainspace/serper-search-mcp@0.2.1"
claude mcp add brave-search "npx -y brave-search-mcp"
claude mcp add gmail "npx @gongrzhe/server-gmail-autoauth-mcp"
claude mcp add brightdata "npx @brightdata/mcp"
claude mcp add context7 "npx -y @upstash/context7-mcp"
claude mcp add yt-dlp "npx -y @kevinwatt/yt-dlp-mcp"
claude mcp add airtable "npx -y airtable-mcp-server"
claude mcp add reddit "npx -y mcp-server-reddit"
```

## 📝 Individual Server Commands

### Search & Web Scraping
```bash
# Firecrawl - Web scraping and crawling
claude mcp add firecrawl "npx firecrawl-mcp"

# Serper - Google search integration
claude mcp add search-serper "npx -y @deepbrainspace/serper-search-mcp@0.2.1"

# Brave Search - Privacy-focused search
claude mcp add brave-search "npx -y brave-search-mcp"
```

### Productivity
```bash
# Gmail - Email access and management
claude mcp add gmail "npx @gongrzhe/server-gmail-autoauth-mcp"

# Airtable - Database and spreadsheet integration
claude mcp add airtable "npx -y airtable-mcp-server"
```

### Social & Media
```bash
# Reddit - Social media content access
claude mcp add reddit "npx -y mcp-server-reddit"

# YouTube DLP - Video downloads and metadata
claude mcp add yt-dlp "npx -y @kevinwatt/yt-dlp-mcp"
```

### Infrastructure
```bash
# Brightdata - Web data collection and proxy services
claude mcp add brightdata "npx @brightdata/mcp"

# Context7 - Vector search and embeddings
claude mcp add context7 "npx -y @upstash/context7-mcp"
```

## 🔧 Management Commands

### List and Check Status
```bash
# List all configured MCP servers
claude mcp list

# Debug server connections and show errors
claude --debug mcp list

# Show only failed servers
claude --debug mcp list 2>&1 | grep -i "error\|failed"
```

### Remove Servers
```bash
# Remove individual servers
claude mcp remove firecrawl
claude mcp remove search-serper
claude mcp remove brave-search
claude mcp remove gmail
claude mcp remove brightdata
claude mcp remove context7
claude mcp remove yt-dlp
claude mcp remove airtable
claude mcp remove reddit

# Remove all servers (nuclear option)
claude mcp remove firecrawl
claude mcp remove search-serper
claude mcp remove brave-search
claude mcp remove gmail
claude mcp remove brightdata
claude mcp remove context7
claude mcp remove yt-dlp
claude mcp remove airtable
claude mcp remove reddit
```

## 🔑 Environment Variables Setup

### Export Variables (Temporary)
```bash
# Set API keys for current session
export SERPER_API_KEY="your_serper_key_here"
export BRAVE_API_KEY="your_brave_key_here"
export FIRECRAWL_API_KEY="fc-your_firecrawl_key_here"
```

### Add to Shell Profile (Permanent)
```bash
# Add to ~/.bashrc or ~/.zshrc
echo 'export SERPER_API_KEY="your_serper_key_here"' >> ~/.bashrc
echo 'export BRAVE_API_KEY="your_brave_key_here"' >> ~/.bashrc
echo 'export FIRECRAWL_API_KEY="fc-your_firecrawl_key_here"' >> ~/.bashrc

# Reload shell
source ~/.bashrc
```

### Add to Project .env File
```bash
# Create or append to .env file
cat >> .env << 'EOF'
SERPER_API_KEY=your_serper_key_here
BRAVE_API_KEY=your_brave_key_here
FIRECRAWL_API_KEY=fc-your_firecrawl_key_here
EOF
```

## 🧪 Testing Commands

### Test Individual Servers
```bash
# Test firecrawl
timeout 5s npx firecrawl-mcp

# Test search-serper (requires API key)
timeout 5s npx -y @deepbrainspace/serper-search-mcp@0.2.1

# Test brave-search (requires API key)
timeout 5s npx -y brave-search-mcp

# Test gmail (OAuth flow)
timeout 10s npx @gongrzhe/server-gmail-autoauth-mcp

# Test reddit
timeout 5s npx -y mcp-server-reddit
```

### Verify Environment Variables
```bash
# Check if API keys are set
echo "SERPER_API_KEY: ${SERPER_API_KEY:0:10}..."
echo "BRAVE_API_KEY: ${BRAVE_API_KEY:0:10}..."
echo "FIRECRAWL_API_KEY: ${FIRECRAWL_API_KEY:0:10}..."
```

## 🛠 Troubleshooting Commands

### Fix Common Issues
```bash
# Update npm and packages
npm update -g

# Clear npm cache
npm cache clean --force

# Reinstall Claude Code
npm uninstall -g @anthropic-ai/claude-code
npm install -g @anthropic-ai/claude-code

# Check Node.js version (should be 18+)
node --version

# Check npx is working
npx --version
```

### Reset MCP Configuration
```bash
# Remove all servers and start fresh
claude mcp remove firecrawl || true
claude mcp remove search-serper || true
claude mcp remove brave-search || true
claude mcp remove gmail || true
claude mcp remove brightdata || true
claude mcp remove context7 || true
claude mcp remove yt-dlp || true
claude mcp remove airtable || true
claude mcp remove reddit || true

# Re-add working servers
# [Use quick setup commands above]
```

## 📋 Server Status Checklist

After running setup commands, verify each server:

- [ ] **firecrawl** - Web scraping (requires FIRECRAWL_API_KEY)
- [ ] **search-serper** - Google search (requires SERPER_API_KEY)
- [ ] **brave-search** - Brave search (requires BRAVE_API_KEY)
- [ ] **gmail** - Email access (OAuth authentication)
- [ ] **brightdata** - Web data (account-based)
- [ ] **context7** - Vector search (no API key needed)
- [ ] **yt-dlp** - YouTube downloads (no API key needed)
- [ ] **airtable** - Database access (OAuth/token)
- [ ] **reddit** - Social media (no API key needed)

## 🎯 Usage Examples

After setup, you can use MCP servers in Claude:

```
# Web search
"Search for the latest Node.js release notes"

# Web scraping
"Scrape the content from https://example.com and summarize it"

# Email
"Check my recent emails and summarize any important ones"

# Social media
"Find trending posts in the JavaScript subreddit"

# Video information
"Get metadata for this YouTube video: [URL]"
```

---

**Last Updated:** December 2024  
**Compatibility:** Claude Code latest version, Node.js 18+