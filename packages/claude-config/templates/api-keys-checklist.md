# API Keys Acquisition Checklist

Step-by-step checklist for obtaining all API keys needed for MCP servers.

## 📋 Required API Keys

### ✅ SERPER_API_KEY (Google Search)
**Service:** Serper.dev - Google Search API  
**Free Tier:** 2,500 searches/month  
**Required for:** search-serper MCP server

**Steps to obtain:**
- [ ] Go to [serper.dev](https://serper.dev/)
- [ ] Click "Sign Up" or "Get Started"
- [ ] Sign up with Google, GitHub, or email
- [ ] Verify your email address (if required)
- [ ] Navigate to "Dashboard" or "API Keys"
- [ ] Click "Create API Key" or "Generate Key"
- [ ] Copy the API key (format: random alphanumeric string)
- [ ] Test the key with a sample request (optional)

**Variable name:** `SERPER_API_KEY`  
**Format:** Alphanumeric string (e.g., `abc123def456...`)

---

### ✅ BRAVE_API_KEY (Brave Search)
**Service:** Brave Search API  
**Free Tier:** 1,000 searches/month  
**Required for:** brave-search MCP server

**Steps to obtain:**
- [ ] Go to [api.search.brave.com](https://api.search.brave.com/)
- [ ] Click "Get Started" or "Sign Up"
- [ ] Create account with email
- [ ] Verify email address
- [ ] Complete profile setup
- [ ] Navigate to "API Keys" or "Developer Console"
- [ ] Create new application/project
- [ ] Generate API key
- [ ] Copy the API key

**Variable name:** `BRAVE_API_KEY`  
**Format:** Alphanumeric string

---

### ✅ FIRECRAWL_API_KEY (Web Scraping)
**Service:** Firecrawl.dev - Web scraping API  
**Free Tier:** Yes, with usage limits  
**Required for:** firecrawl MCP server

**Steps to obtain:**
- [ ] Go to [firecrawl.dev](https://firecrawl.dev/)
- [ ] Click "Sign Up" or "Get Started"
- [ ] Create account (email or OAuth)
- [ ] Verify email if required
- [ ] Go to Dashboard
- [ ] Navigate to "API Keys" section
- [ ] Click "Generate New API Key"
- [ ] Copy the API key (starts with `fc-`)

**Variable name:** `FIRECRAWL_API_KEY`  
**Format:** `fc-` followed by alphanumeric string

---

## 🔄 Optional API Keys

### 🟡 SERPER_LLM_API_KEY (Enhanced Serper Features)
**Service:** Google AI/Cloud Console  
**Free Tier:** Limited  
**Required for:** Enhanced Serper LLM features (optional)

**Steps to obtain:**
- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create or select a project
- [ ] Enable the Gemini API or relevant AI service
- [ ] Navigate to "APIs & Services" → "Credentials"
- [ ] Create credentials → API Key
- [ ] Copy the API key (starts with `AIza`)

**Variable name:** `SERPER_LLM_API_KEY`  
**Format:** `AIza` followed by alphanumeric string

---

### 🟡 OPENAI_API_KEY (AI Integration)
**Service:** OpenAI Platform  
**Free Tier:** $5 credit for new users  
**Required for:** Enhanced AI features (optional)

**Steps to obtain:**
- [ ] Go to [platform.openai.com](https://platform.openai.com/)
- [ ] Sign up or log in
- [ ] Navigate to "API Keys"
- [ ] Click "Create new secret key"
- [ ] Name your key and copy it (starts with `sk-`)

**Variable name:** `OPENAI_API_KEY`  
**Format:** `sk-` followed by alphanumeric string

---

### 🟡 ANTHROPIC_API_KEY (Claude AI)
**Service:** Anthropic Console  
**Free Tier:** Limited credits  
**Required for:** Claude AI integration (optional)

**Steps to obtain:**
- [ ] Go to [console.anthropic.com](https://console.anthropic.com/)
- [ ] Sign up or log in
- [ ] Navigate to "API Keys"
- [ ] Create new API key
- [ ] Copy the key (starts with `sk-ant-`)

**Variable name:** `ANTHROPIC_API_KEY`  
**Format:** `sk-ant-` followed by alphanumeric string

---

## 🔐 OAuth-Based Services (No API Keys Needed)

### 📧 Gmail Integration
**Service:** Gmail MCP server  
**Authentication:** OAuth flow  
**Setup:** Automatic during first use

**Process:**
- [ ] Use `claude mcp add gmail` command
- [ ] OAuth flow will trigger on first use
- [ ] Grant permissions in browser
- [ ] No manual API key needed

### 📊 Airtable Integration
**Service:** Airtable MCP server  
**Authentication:** OAuth or Personal Access Token  
**Setup:** Through Airtable developer settings

**Process:**
- [ ] Use `claude mcp add airtable` command
- [ ] Configure through Airtable settings
- [ ] Grant necessary permissions
- [ ] Follow OAuth flow or use PAT

---

## 🆓 No Keys Required

These servers work without API keys:

- [ ] **reddit** - Uses public Reddit API
- [ ] **yt-dlp** - Direct YouTube access
- [ ] **context7** - Basic features included
- [ ] **brightdata** - Account-based (limited free tier)

---

## 📝 Environment Setup Checklist

After obtaining API keys:

### 1. Choose Setup Method
- [ ] **Option A:** Add to shell profile (persistent)
- [ ] **Option B:** Add to project .env file (project-specific)
- [ ] **Option C:** Export temporarily (session-only)

### 2. Shell Profile Setup (Recommended)
```bash
# Add to ~/.bashrc, ~/.zshrc, or ~/.profile
- [ ] echo 'export SERPER_API_KEY="your_key"' >> ~/.bashrc
- [ ] echo 'export BRAVE_API_KEY="your_key"' >> ~/.bashrc
- [ ] echo 'export FIRECRAWL_API_KEY="your_key"' >> ~/.bashrc
- [ ] source ~/.bashrc
```

### 3. Project .env Setup
```bash
# Create .env file in project root
- [ ] SERPER_API_KEY=your_key
- [ ] BRAVE_API_KEY=your_key
- [ ] FIRECRAWL_API_KEY=your_key
- [ ] Add .env to .gitignore
```

### 4. Verification
```bash
# Test environment variables are set
- [ ] echo $SERPER_API_KEY
- [ ] echo $BRAVE_API_KEY
- [ ] echo $FIRECRAWL_API_KEY
```

---

## 🔒 Security Best Practices

### API Key Security
- [ ] **Never commit API keys to git**
- [ ] **Add .env to .gitignore**
- [ ] **Use environment variables, not hardcoded strings**
- [ ] **Rotate keys periodically**
- [ ] **Monitor usage to detect unauthorized access**

### Access Control
- [ ] **Use minimal permissions** for OAuth services
- [ ] **Review and revoke unused tokens** regularly
- [ ] **Set usage limits** where possible
- [ ] **Monitor API usage** through provider dashboards

### Backup & Recovery
- [ ] **Save keys in secure password manager**
- [ ] **Document which services use which keys**
- [ ] **Keep track of key creation dates**
- [ ] **Note expiration dates** (if applicable)

---

## 📊 Quick Reference Table

| Service | API Key Variable | Required | Free Tier | Format |
|---------|------------------|----------|-----------|--------|
| Serper | `SERPER_API_KEY` | ✅ Yes | 2,500/month | `abc123...` |
| Brave | `BRAVE_API_KEY` | ✅ Yes | 1,000/month | `abc123...` |
| Firecrawl | `FIRECRAWL_API_KEY` | ✅ Yes | Limited | `fc-abc123...` |
| Google AI | `SERPER_LLM_API_KEY` | 🟡 Optional | Limited | `AIza...` |
| OpenAI | `OPENAI_API_KEY` | 🟡 Optional | $5 credit | `sk-...` |
| Anthropic | `ANTHROPIC_API_KEY` | 🟡 Optional | Limited | `sk-ant-...` |
| Gmail | - | OAuth | Free | OAuth flow |
| Airtable | - | OAuth/PAT | Free | OAuth/PAT |
| Reddit | - | ❌ No | Rate limited | Public API |
| YouTube | - | ❌ No | Free | Public |

---

## ✅ Final Verification

After completing all steps:

- [ ] All required API keys obtained
- [ ] Environment variables configured
- [ ] Keys tested and working
- [ ] MCP servers added successfully
- [ ] `claude mcp list` shows all servers
- [ ] `claude --debug mcp list` shows no errors
- [ ] Security measures implemented
- [ ] Backup of keys created

**Completion time estimate:** 30-60 minutes  
**Cost:** Free for all required services (with usage limits)