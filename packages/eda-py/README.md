# EDA (Enhanced Dynamic Agent) Memory System

🧠 **Autonomous AI memory and learning system for Claude Code**

EDA learns from your coding conversations, discovers patterns, and provides intelligent context to enhance your development workflow. Think of it as an AI assistant that remembers everything and gets smarter over time.

## 🎯 What EDA Does

- **📚 Learns from History**: Ingests all your Claude Code conversations across projects
- **🔍 Discovers Patterns**: Uses vector embeddings + graph relationships to find connections
- **🧩 Extracts Knowledge**: Claude-powered relationship extraction ("I own a Tesla", "I prefer React")
- **💡 Provides Context**: Serves relevant historical context via MCP GraphQL interface
- **📊 Shows Insights**: Dashboard of learned patterns and memory clusters

## 🏗️ Architecture

```
EDA Service (Python)
├── File Monitor → Watches ~/.claude/projects/*.jsonl
├── Conversation Parser → Extracts user/assistant messages
├── Relationship Extractor → Claude-powered ("owns", "prefers", "struggles_with")
├── Vector Embeddings → Cloudflare Workers AI (semantic similarity)
├── SurrealDB Storage → Conversations + relationships + patterns
├── GraphQL MCP Server → Provides context to Claude Code
└── Insights Dashboard → Visual memory and learning analytics
```

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- SurrealDB installed (`curl -sSf https://install.surrealdb.com | sh`)
- Cloudflare Workers AI API token
- Anthropic Claude API key

### Installation
```bash
cd apps/eda
pip install -r requirements.txt
```

### Test Conversation Ingestion
```bash
python test_ingestion.py
```

This will:
1. Start local SurrealDB instance
2. Scan `~/.claude/projects/` for conversation files
3. Parse and ingest conversations
4. Show statistics and sample data

## 📁 Project Structure

```
apps/eda/
├── src/
│   ├── storage/
│   │   ├── local_db.py           # Local SurrealDB for testing
│   │   ├── production_db.py      # Production SurrealDB setup
│   │   └── schema.surql          # Database schema
│   ├── ingestion/
│   │   ├── file_monitor.py       # Watches conversation files
│   │   ├── conversation_parser.py # Parses Claude Code JSONL
│   │   ├── relationship_extractor.py # Claude-powered extraction
│   │   └── embedding_generator.py # Vector embeddings
│   ├── retrieval/
│   │   ├── vector_search.py      # Semantic similarity search
│   │   ├── graph_traversal.py    # Relationship graph queries
│   │   └── context_synthesizer.py # Combines results for Claude
│   ├── mcp/
│   │   ├── server.py            # GraphQL MCP server
│   │   ├── resolvers.py         # GraphQL query resolvers
│   │   └── schema.graphql       # GraphQL schema definition
│   ├── dashboard/
│   │   ├── insights_generator.py # Generates memory insights
│   │   ├── pattern_analyzer.py  # Discovers conversation patterns
│   │   └── visualizer.py        # Creates visual representations
│   └── config/
│       ├── settings.py          # Configuration management
│       └── logging.py           # Logging setup
├── tests/
│   ├── test_ingestion.py        # Integration tests
│   ├── test_relationships.py    # Relationship extraction tests
│   └── test_retrieval.py        # Context retrieval tests
├── scripts/
│   ├── setup_database.py       # Initialize production database
│   ├── migrate_data.py          # Data migration utilities
│   └── generate_insights.py    # Batch insight generation
├── docs/
│   ├── ARCHITECTURE.md          # Detailed system design
│   ├── API.md                   # MCP GraphQL API documentation
│   └── DEPLOYMENT.md            # Production deployment guide
├── DEVELOPMENT_PLAN.md          # Current development roadmap
├── requirements.txt             # Python dependencies
└── README.md                    # This file
```

## 🗄️ Data Model

### Conversations
Stores parsed conversation turns with embeddings for semantic search.

### Relationships (Dynamic)
Claude-extracted relationships like:
- `nayeem -> owns -> tesla_model_3`
- `nayeem -> prefers -> react_over_vue`
- `nayeem -> struggles_with -> docker_networking`

### Patterns
Discovered conversation clusters and behavioral patterns:
- "React performance questions → virtualization recommendations"
- "TypeScript errors → interface/type discussions"

### Insights
High-level learnings about user preferences, skills, and development patterns.

## 🔧 Configuration

### Environment Variables
```env
# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Cloudflare Workers AI
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_token

# SurrealDB
SURREALDB_URL=ws://localhost:8000
SURREALDB_USER=root
SURREALDB_PASS=root
SURREALDB_NS=eda
SURREALDB_DB=memory

# Claude Code Projects Path
CLAUDE_PROJECTS_PATH=~/.claude/projects

# Logging
LOG_LEVEL=INFO
```

## 🧪 Testing

### Unit Tests
```bash
pytest tests/ -v
```

### Integration Tests
```bash
python test_ingestion.py      # Test conversation parsing
python test_relationships.py  # Test Claude extraction
python test_retrieval.py      # Test context generation
```

## 📈 Monitoring

EDA provides several ways to monitor learning and performance:

1. **Ingestion Stats**: Files processed, conversations parsed, relationships extracted
2. **Memory Growth**: New insights discovered, pattern evolution
3. **Query Performance**: Context retrieval speed, relevance scores
4. **Learning Effectiveness**: User satisfaction, context helpfulness

## 🤝 Integration with Claude Code

EDA exposes a GraphQL MCP server that Claude Code can query for historical context:

```graphql
query GetContext($userInput: String!, $projectPath: String) {
  contextForQuery(input: $userInput, project: $projectPath) {
    conversations {
      userMessage
      assistantMessage
      similarity
      timestamp
    }
    relationships {
      subject
      predicate
      object
      confidence
    }
    insights {
      type
      description
      supportingEvidence
    }
  }
}
```

## 🎨 Dashboard & Visualizations

The EDA dashboard shows:
- **Memory Map**: Visual graph of learned relationships
- **Conversation Clusters**: Topics and patterns discovered
- **Learning Timeline**: Knowledge evolution over time
- **Context Effectiveness**: How well EDA helps with queries

## 🔮 Future Enhancements

- **Multi-user Support**: Learn from team conversations
- **Cross-project Insights**: Patterns across different codebases
- **Skill Tracking**: Automated skill development monitoring
- **Smart Notifications**: Proactive suggestions based on patterns
- **Export/Import**: Share learned insights between instances

## 📞 Support

For issues, questions, or contributions:
- GitHub Issues: [idance repository](https://github.com/idancelive/idance)
- Documentation: [EDA Wiki](./docs/)
- Architecture Questions: See [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

---

**Built with ❤️ for autonomous AI learning and enhanced coding workflows**