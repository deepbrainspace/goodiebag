# MCP Server Setup Guide

Complete guide for setting up Model Context Protocol (MCP) servers with Claude Code for enhanced functionality.

## 🚀 Quick Start

If you're experienced with Claude Code and just need the commands:

```bash
# Add all working MCP servers
claude mcp add firecrawl "npx firecrawl-mcp"
claude mcp add search-serper "npx -y @deepbrainspace/serper-search-mcp@0.2.1"
claude mcp add brave-search "npx -y brave-search-mcp"
claude mcp add gmail "npx @gongrzhe/server-gmail-autoauth-mcp"
claude mcp add brightdata "npx @brightdata/mcp"
claude mcp add context7 "npx -y @upstash/context7-mcp"
claude mcp add yt-dlp "npx -y @kevinwatt/yt-dlp-mcp"
claude mcp add airtable "npx -y airtable-mcp-server"
claude mcp add reddit "npx -y mcp-server-reddit"

# Set required environment variables (get keys from sections below)
export SERPER_API_KEY="your_serper_key"
export BRAVE_API_KEY="your_brave_key"  
export FIRECRAWL_API_KEY="your_firecrawl_key"
```

## 📋 Working MCP Servers (9 Total)

| Server | Description | API Key Required | Free Tier |
|--------|-------------|------------------|-----------|
| **firecrawl** | Web scraping and crawling | ✅ | Yes |
| **search-serper** | Google search via Serper API | ✅ | 2,500/month |
| **brave-search** | Brave search engine | ✅ | 1,000/month |
| **gmail** | Email access and management | ❌ | OAuth |
| **brightdata** | Web data and proxy services | ❌ | Limited |
| **context7** | Vector search and embeddings | ❌ | Yes |
| **yt-dlp** | YouTube video downloads | ❌ | Unlimited |
| **airtable** | Database and spreadsheet access | ❌ | OAuth |
| **reddit** | Reddit post and comment access | ❌ | Rate limited |

## 🔑 API Keys Setup

### SERPER (Google Search API)

**Get your key:**
1. Go to [serper.dev](https://serper.dev/)
2. Sign up with Google/GitHub
3. Navigate to API Keys section
4. Generate new API key
5. Copy the key (starts with a random string)

**Free tier:** 2,500 searches per month

**Environment variable:**
```bash
SERPER_API_KEY=your_serper_key_here
```

### BRAVE Search API

**Get your key:**
1. Go to [api.search.brave.com](https://api.search.brave.com/)
2. Sign up for API access
3. Create new application
4. Generate API key
5. Copy the key

**Free tier:** 1,000 searches per month

**Environment variable:**
```bash
BRAVE_API_KEY=your_brave_key_here
```

### FIRECRAWL API

**Get your key:**
1. Go to [firecrawl.dev](https://firecrawl.dev/)
2. Sign up for free account
3. Go to Dashboard → API Keys
4. Generate new API key
5. Copy the key (starts with `fc-`)

**Free tier:** Available with usage limits

**Environment variable:**
```bash
FIRECRAWL_API_KEY=fc-your_key_here
```

## 📝 Step-by-Step Setup

### 1. Install Claude Code

If you haven't already installed Claude Code:

```bash
# Install Claude Code globally
npm install -g @anthropic-ai/claude-code

# Or use the installer script
curl -fsSL https://claude.ai/install.sh | sh
```

### 2. Get API Keys

Follow the sections above to obtain:
- SERPER_API_KEY (for Google search)
- BRAVE_API_KEY (for Brave search)  
- FIRECRAWL_API_KEY (for web scraping)

### 3. Set Environment Variables

**Option A: Add to your shell profile (recommended)**

```bash
# Add to ~/.bashrc, ~/.zshrc, or ~/.profile
echo 'export SERPER_API_KEY="your_serper_key"' >> ~/.bashrc
echo 'export BRAVE_API_KEY="your_brave_key"' >> ~/.bashrc  
echo 'export FIRECRAWL_API_KEY="your_firecrawl_key"' >> ~/.bashrc

# Reload your shell
source ~/.bashrc
```

**Option B: Add to project .env file**

```bash
# In your project root
echo 'SERPER_API_KEY=your_serper_key' >> .env
echo 'BRAVE_API_KEY=your_brave_key' >> .env
echo 'FIRECRAWL_API_KEY=your_firecrawl_key' >> .env
```

### 4. Add MCP Servers

Add each server individually:

```bash
# Web scraping
claude mcp add firecrawl "npx firecrawl-mcp"

# Search engines  
claude mcp add search-serper "npx -y @deepbrainspace/serper-search-mcp@0.2.1"
claude mcp add brave-search "npx -y brave-search-mcp"

# Productivity
claude mcp add gmail "npx @gongrzhe/server-gmail-autoauth-mcp"
claude mcp add airtable "npx -y airtable-mcp-server"

# Social & Media
claude mcp add reddit "npx -y mcp-server-reddit"
claude mcp add yt-dlp "npx -y @kevinwatt/yt-dlp-mcp"

# Infrastructure
claude mcp add brightdata "npx @brightdata/mcp"
claude mcp add context7 "npx -y @upstash/context7-mcp"
```

### 5. Test Your Setup

Verify servers are working:

```bash
# List all MCP servers
claude mcp list

# Test with debug output (shows any errors)
claude --debug mcp list
```

## 🔧 Troubleshooting

### Common Issues and Solutions

**Error: `spawn npx ENOENT`**
- **Cause:** Node.js/npm not properly installed
- **Solution:** Install Node.js and ensure `npx` is in PATH

**Error: `API_KEY environment variable is required`**
- **Cause:** Missing or incorrect environment variable
- **Solution:** Check variable name and value, restart terminal

**Error: `ValueError: a coroutine was expected`**
- **Cause:** Broken MCP server implementation
- **Solution:** Use alternative server (we've tested working ones)

**Error: `Connection failed`**
- **Cause:** Network issues or server down
- **Solution:** Check internet connection, try again later

**Server starts but no response**
- **Cause:** Invalid API key or quota exceeded
- **Solution:** Verify API key, check usage limits

### Debug Steps

1. **Check MCP server list:**
   ```bash
   claude mcp list
   ```

2. **Test with debug output:**
   ```bash
   claude --debug mcp list 2>&1 | grep -i error
   ```

3. **Test individual server:**
   ```bash
   timeout 5s npx firecrawl-mcp
   ```

4. **Check environment variables:**
   ```bash
   echo $SERPER_API_KEY
   echo $BRAVE_API_KEY
   echo $FIRECRAWL_API_KEY
   ```

### Removing Problematic Servers

If a server isn't working:

```bash
# Remove broken server
claude mcp remove server-name

# Add working alternative
claude mcp add server-name "working-command"
```

## 📋 Complete Environment Template

Create a `.env` file with all variables:

```bash
# MCP Server API Keys
SERPER_API_KEY=your_serper_key_here
SERPER_LLM_API_KEY=your_google_api_key_here  # Optional: for LLM features
BRAVE_API_KEY=your_brave_key_here
FIRECRAWL_API_KEY=fc-your_firecrawl_key_here

# Optional: Other AI API keys for enhanced functionality
OPENAI_API_KEY=sk-your_openai_key_here
ANTHROPIC_API_KEY=sk-ant-your_anthropic_key_here
```

## 🎯 What Each Server Does

**Search & Web:**
- **firecrawl:** Scrape websites, convert to markdown, extract structured data
- **search-serper:** Perform Google searches, get search results and snippets  
- **brave-search:** Alternative search engine with privacy focus

**Productivity:**
- **gmail:** Read emails, send messages, manage inbox
- **airtable:** Access databases, read/write records, manage data

**Social & Media:**
- **reddit:** Browse posts, read comments, search subreddits
- **yt-dlp:** Download YouTube videos, extract metadata

**Infrastructure:**
- **brightdata:** Web data collection, proxy services
- **context7:** Vector search, embeddings, semantic search

## 🚀 Next Steps

After successful setup:

1. **Test functionality** - Try Claude with web search, email access, etc.
2. **Customize settings** - Adjust server configurations as needed
3. **Add more servers** - Explore additional MCP servers for your workflow
4. **Create shortcuts** - Set up aliases for common MCP operations

## 📚 Additional Resources

- [Claude Code Documentation](https://docs.anthropic.com/claude/docs/code)
- [MCP Server Registry](https://github.com/anthropics/mcp)
- [Troubleshooting Guide](./INSTALLATION.md)
- [Server Reference](./MCP_SERVERS.md)

---

**Need help?** Check the [troubleshooting section](#troubleshooting) or create an issue in this repository.