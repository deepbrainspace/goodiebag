# MCP Server Reference

Comprehensive reference for all tested and working Model Context Protocol (MCP) servers.

## 📊 Server Overview

| Server | Package | Status | API Key | Free Tier | Category |
|--------|---------|--------|---------|-----------|----------|
| firecrawl | `firecrawl-mcp` | ✅ Working | Required | Yes | Web Scraping |
| search-serper | `@deepbrainspace/serper-search-mcp` | ✅ Working | Required | 2,500/month | Search |
| brave-search | `brave-search-mcp` | ✅ Working | Required | 1,000/month | Search |
| gmail | `@gongrzhe/server-gmail-autoauth-mcp` | ✅ Working | OAuth | Yes | Email |
| brightdata | `@brightdata/mcp` | ✅ Working | No | Limited | Web Data |
| context7 | `@upstash/context7-mcp` | ✅ Working | No | Yes | Vector Search |
| yt-dlp | `@kevinwatt/yt-dlp-mcp` | ✅ Working | No | Unlimited | Media |
| airtable | `airtable-mcp-server` | ✅ Working | OAuth | Yes | Database |
| reddit | `mcp-server-reddit` | ✅ Working | No | Rate Limited | Social |

## 🔍 Search & Web Scraping

### firecrawl
**Purpose:** Web scraping and crawling with AI-friendly output

**Command:**
```bash
claude mcp add firecrawl "npx firecrawl-mcp"
```

**API Key Required:** FIRECRAWL_API_KEY
- Get from: [firecrawl.dev](https://firecrawl.dev/)
- Format: `fc-xxxxxxxxxx`

**Capabilities:**
- Scrape websites and convert to markdown
- Extract structured data from web pages
- Handle JavaScript-rendered content
- Batch crawling of multiple URLs
- Content summarization and extraction

**Free Tier:** Yes, with usage limits

---

### search-serper
**Purpose:** Google search integration via Serper API

**Command:**
```bash
claude mcp add search-serper "npx -y @deepbrainspace/serper-search-mcp@0.2.1"
```

**API Keys Required:**
- `SERPER_API_KEY` (required) - Get from [serper.dev](https://serper.dev/)
- `SERPER_LLM_API_KEY` (optional) - Google API key for enhanced features

**Capabilities:**
- Perform Google searches
- Get search results with snippets
- News search functionality
- Image search capabilities
- LLM-enhanced result processing (if LLM key provided)

**Free Tier:** 2,500 searches per month

---

### brave-search
**Purpose:** Privacy-focused search engine integration

**Command:**
```bash
claude mcp add brave-search "npx -y brave-search-mcp"
```

**API Key Required:** BRAVE_API_KEY
- Get from: [api.search.brave.com](https://api.search.brave.com/)

**Capabilities:**
- Web search with privacy focus
- No tracking or data collection
- Clean search results
- Alternative to Google search

**Free Tier:** 1,000 searches per month

## 📧 Productivity & Communication

### gmail
**Purpose:** Email access and management

**Command:**
```bash
claude mcp add gmail "npx @gongrzhe/server-gmail-autoauth-mcp"
```

**Authentication:** OAuth (no API key needed)
- Automatically handles Google OAuth flow
- Requires user consent for email access

**Capabilities:**
- Read emails from inbox
- Send new emails
- Reply to existing emails
- Search email content
- Access email metadata

**Free Tier:** Yes, standard Gmail API limits

---

### airtable
**Purpose:** Database and spreadsheet integration

**Command:**
```bash
claude mcp add airtable "npx -y airtable-mcp-server"
```

**Authentication:** OAuth/API Token
- Configure through Airtable developer settings

**Capabilities:**
- Read/write Airtable records
- Access multiple bases and tables
- Filter and sort data
- Create and update records
- Schema introspection

**Free Tier:** Yes, Airtable API limits apply

## 🎭 Social Media & Content

### reddit
**Purpose:** Reddit content access and interaction

**Command:**
```bash
claude mcp add reddit "npx -y mcp-server-reddit"
```

**Authentication:** None (read-only access)
- Uses Reddit's public API
- Rate limited but no API key required

**Capabilities:**
- Browse subreddit posts
- Read post comments
- Search Reddit content
- Access post metadata
- Get trending topics

**Free Tier:** Yes, rate limited

---

### yt-dlp
**Purpose:** YouTube video downloads and metadata

**Command:**
```bash
claude mcp add yt-dlp "npx -y @kevinwatt/yt-dlp-mcp"
```

**Authentication:** None
- Direct access to YouTube public data

**Capabilities:**
- Download YouTube videos
- Extract video metadata
- Get video transcripts
- Access video thumbnails
- Support for playlists

**Free Tier:** Unlimited (subject to YouTube's terms)

## 🛠 Infrastructure & Data

### brightdata
**Purpose:** Web data collection and proxy services

**Command:**
```bash
claude mcp add brightdata "npx @brightdata/mcp"
```

**Authentication:** Account-based
- Requires Brightdata account setup

**Capabilities:**
- Web data collection
- Proxy services
- CAPTCHA solving
- IP rotation
- Data extraction pipelines

**Free Tier:** Limited free usage

---

### context7
**Purpose:** Vector search and embeddings

**Command:**
```bash
claude mcp add context7 "npx -y @upstash/context7-mcp"
```

**Authentication:** None for basic usage
- Upstash account for advanced features

**Capabilities:**
- Vector similarity search
- Document embeddings
- Semantic search
- Context retrieval
- AI-powered document analysis

**Free Tier:** Yes, with usage limits

## 📋 Quick Command Reference

Copy-paste ready commands for all servers:

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
```

Remove servers:
```bash
claude mcp remove <server-name>
```

List all servers:
```bash
claude mcp list
```

Debug server issues:
```bash
claude --debug mcp list
```

## 🔑 Environment Variables Matrix

| Server | Required Variables | Optional Variables |
|--------|-------------------|--------------------|
| firecrawl | `FIRECRAWL_API_KEY` | - |
| search-serper | `SERPER_API_KEY` | `SERPER_LLM_API_KEY` |
| brave-search | `BRAVE_API_KEY` | - |
| gmail | None (OAuth) | - |
| brightdata | Account setup | - |
| context7 | None | Upstash credentials |
| yt-dlp | None | - |
| airtable | OAuth/Token | - |
| reddit | None | - |

## 🔧 Server Categories by Use Case

### For Web Research & Data Collection
- **firecrawl** - Scrape and extract web content
- **search-serper** - Google search integration
- **brave-search** - Privacy-focused web search
- **brightdata** - Professional web data collection

### For Productivity & Automation
- **gmail** - Email management and automation
- **airtable** - Database and spreadsheet operations
- **context7** - Document search and analysis

### For Content & Media
- **reddit** - Social media content access
- **yt-dlp** - Video downloads and metadata

### For Development & Integration
- All servers provide programmatic access to their respective services
- Most have rate limits and usage quotas
- OAuth servers provide secure authentication flows

## 🚨 Known Issues & Alternatives

### Broken/Deprecated Servers
❌ **reddit-mcp (uvx)** - Python async/coroutine error
- **Alternative:** Use `mcp-server-reddit` instead

❌ **reddit-mcp (@mckaywrigley/reddit-mcp)** - Package not found
- **Alternative:** Use `mcp-server-reddit` instead

### Common Problems
1. **npm/npx errors** - Ensure Node.js is properly installed
2. **API key errors** - Check environment variable names and values
3. **OAuth failures** - Clear browser cache and retry authentication
4. **Network timeouts** - Check internet connection and firewall settings

## 📈 Performance & Limits

### Rate Limits
- **search-serper:** 2,500 searches/month (free)
- **brave-search:** 1,000 searches/month (free)
- **reddit:** API rate limits apply
- **gmail:** Standard Gmail API quotas
- **Others:** Varies by service

### Response Times
- **Search servers:** 1-3 seconds
- **Email/Database:** 2-5 seconds  
- **Web scraping:** 5-15 seconds
- **Media downloads:** Varies by content size

## 🔄 Maintenance & Updates

### Keeping Servers Updated
```bash
# Update all npm packages
npm update -g

# Reinstall specific server
claude mcp remove server-name
claude mcp add server-name "updated-command"
```

### Monitoring Server Health
```bash
# Check server status
claude --debug mcp list

# Test specific server
timeout 10s npx package-name
```

---

**Last Updated:** December 2024  
**Tested With:** Claude Code latest version  
**Platform:** WSL2, Ubuntu 22.04