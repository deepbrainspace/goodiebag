# EDA Rust Development Plan & Progress Tracker

## 🎯 Project Overview
Rewrite EDA from Python to Rust for 10-100x performance improvements. Build commercial-grade AI memory system with GraphQL MCP server for Claude Code conversations.

## 📋 Development Phases

### ✅ Phase 1: Foundation (COMPLETED)
- [x] **Project Structure**: Cargo.toml with optimized dependencies
- [x] **Testing Framework**: Modern testing stack (rstest, mockall, criterion)
- [x] **Database Schema**: SurrealDB schema with dynamic relationships
- [x] **Configuration**: Flexible config system with .env discovery
- [x] **Error Handling**: Comprehensive error types

### 🔄 Phase 2: Core Ingestion Pipeline (IN PROGRESS)
#### File Monitoring & Parsing
- [ ] **File Watcher**: `notify` crate for real-time file watching
- [ ] **Conversation Parser**: High-performance JSONL deserialization  
- [ ] **Duplicate Detection**: Blake3 hashing for content deduplication
- [ ] **Batch Processing**: Concurrent file processing with tokio
- [ ] **Database Integration**: SurrealDB async client with connection pooling

#### Success Criteria
- [ ] Parse 95%+ of existing conversation files
- [ ] Zero duplicate conversations in database
- [ ] Process 1000+ conversations per minute
- [ ] File monitoring detects changes within 1 second

### 📅 Phase 3: Intelligence Layer (PLANNED)
#### Vector Embeddings & Relationships
- [ ] **Cloudflare Workers AI**: 1024-dimensional embeddings integration
- [ ] **Vector Storage**: HNSW vector indexing in SurrealDB
- [ ] **Claude API**: Dynamic relationship extraction
- [ ] **Semantic Normalization**: LLM-based predicate grouping

### 📅 Phase 4: Natural Language Query Processing (PLANNED)
#### GraphQL Schema-Aware Query Translation
- [ ] **Schema Definition**: Comprehensive GraphQL schema
- [ ] **LLM Integration**: Natural language to GraphQL translation (T5/LangChain pattern)
- [ ] **Query Resolvers**: Context retrieval, relationship traversal
- [ ] **Hybrid Search**: Vector similarity + graph relationships

#### Query Flow Architecture
```
User: "Best database for this project?"
   ↓
Schema + NL Query → LLM → GraphQL Query
   ↓
query {
  contextForQuery(input: "Best database for this project?") {
    conversations { content timestamp }
    relationships { predicate object confidence }
    synthesizedContext
  }
}
```

### 📅 Phase 5: MCP GraphQL Server (PLANNED)
- [ ] **Axum Web Server**: High-performance async web framework
- [ ] **MCP Protocol**: Full MCP server implementation
- [ ] **Real-time Subscriptions**: WebSocket-based live updates
- [ ] **Authentication**: Secure API access

### 📅 Phase 6: Production Optimization (PLANNED)
- [ ] **Performance Benchmarks**: Criterion-based testing
- [ ] **Docker Containerization**: Single binary deployment
- [ ] **Memory Optimization**: <1GB for 500k conversations
- [ ] **Security Audit**: Dependency and code review

## 🗄️ Database Schema (SurrealDB)

### Core Tables
```sql
-- Conversations with vector embeddings
DEFINE TABLE conversations SCHEMALESS;
DEFINE FIELD embedding ON conversations TYPE option<array<float>>;
DEFINE INDEX embedding_idx ON conversations FIELDS embedding HNSW DIMENSION 1024 DIST COSINE;

-- Dynamic relationships (no hardcoded types)
DEFINE TABLE relationships SCHEMALESS;
DEFINE FIELD in ON relationships TYPE record;
DEFINE FIELD out ON relationships TYPE record;
DEFINE FIELD predicate ON relationships TYPE string;
DEFINE FIELD original_predicates ON relationships TYPE array<string>;

-- Raw relationships for semantic normalization
DEFINE TABLE raw_relationships SCHEMALESS;
DEFINE FIELD normalized_to ON raw_relationships TYPE string;
```

## 🧪 Testing Strategy

### Modern Testing Stack
```toml
[dev-dependencies]
rstest = "0.21"              # Fixture-based testing
mockall = "0.13"             # Mock object generation
wiremock = "0.6"             # HTTP API mocking
criterion = "0.5"            # Performance benchmarks
proptest = "1.5"             # Property-based testing
testcontainers = "0.20"      # Database testing
```

### Test Organization
```
tests/
├── integration/    # End-to-end pipeline tests
├── unit/          # Component-specific tests  
├── performance/   # Criterion benchmarks
└── common/        # Shared fixtures and utilities
```

## 🎯 Performance Targets

| Metric | Python | Rust Target | Improvement |
|--------|--------|-------------|-------------|
| File parsing (1000 convs) | 2.5s | 0.3s | **8.3x faster** |
| Vector similarity (10k docs) | 850ms | 45ms | **18.9x faster** |
| Memory (100k convs) | 2.1GB | 420MB | **5x less** |
| Query latency | N/A | <10ms | **New capability** |

## 🚨 Current Risks & Mitigation

### Technical Risks
1. **Claude API Rate Limits**: Intelligent batching, retry logic
2. **Vector Memory Usage**: Streaming embeddings, disk-backed storage
3. **Schema Evolution**: Versioned parsers, graceful fallbacks

### Timeline Risks
1. **8-hour estimate**: MVP-first approach, parallel development
2. **Complexity**: Leverage established patterns (LangChain/T5)

## 📝 Session Notes

### 2025-06-26 - Foundation & Research ✅
- ✅ Created Rust project structure with NX integration
- ✅ Implemented comprehensive testing framework
- ✅ Designed SurrealDB schema with dynamic relationships
- ✅ **RESEARCH**: Studied natural language to GraphQL translation systems
- ✅ **DISCOVERY**: SPEGQL (T5-based), LangChain GraphQL patterns
- ✅ **ARCHITECTURE**: Schema-aware query translation approach
- 🔄 **CURRENT**: Building core ingestion pipeline

### Key Decisions Made
1. **Dynamic Relationships**: No hardcoded relationship types - full Claude discovery
2. **Semantic Normalization**: Two-stage processing (raw → normalized)
3. **Query Architecture**: LLM + schema → GraphQL (established pattern)
4. **Testing First**: Comprehensive test framework before implementation

## 🎯 Immediate Next Steps

1. **Implement File Monitoring**
   ```bash
   nx test eda  # Run tests as we build
   nx build eda # Ensure compilation
   ```

2. **Build JSONL Parser**
   - Handle Claude Code conversation format
   - Concurrent processing with tokio
   - Property-based testing for edge cases

3. **Database Integration**
   - SurrealDB async client
   - Schema migrations
   - Connection pooling

4. **Test with Real Data**
   - Process existing conversation files
   - Validate parsing accuracy
   - Benchmark performance

---

*This plan follows proven architectural patterns and focuses on implementation over speculation.*