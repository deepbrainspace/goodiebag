-- EDA Rust Database Schema (SurrealQL)
-- Simple, focused schema based on Python EDA learnings

-- Conversations: Core conversation storage with embeddings
DEFINE TABLE conversations SCHEMALESS;
DEFINE FIELD role ON conversations TYPE string ASSERT $value IN ["user", "assistant"];
DEFINE FIELD content ON conversations TYPE string;
DEFINE FIELD user_message ON conversations TYPE string;
DEFINE FIELD assistant_message ON conversations TYPE string;
DEFINE FIELD timestamp ON conversations TYPE datetime;
DEFINE FIELD project_path ON conversations TYPE string;
DEFINE FIELD session_id ON conversations TYPE string;
DEFINE FIELD uuid ON conversations TYPE option<string>;
DEFINE FIELD parent_uuid ON conversations TYPE option<string>;
DEFINE FIELD embedding ON conversations TYPE option<array<float>>;
DEFINE FIELD processed_content ON conversations TYPE option<string>;  -- LLM-processed version for embedding
DEFINE FIELD content_summary ON conversations TYPE option<string>;   -- LLM-generated summary for long content
DEFINE FIELD content_metadata ON conversations TYPE object DEFAULT {}; -- LLM analysis: importance, topics, etc.
DEFINE FIELD context ON conversations TYPE object DEFAULT {};

-- Indexes for common queries
DEFINE INDEX session_idx ON conversations FIELDS session_id;
DEFINE INDEX project_idx ON conversations FIELDS project_path;
DEFINE INDEX timestamp_idx ON conversations FIELDS timestamp;

-- Vector index for fast similarity search (SurrealDB native) 
-- Using 1024-dimension model for best quality (2025 Cloudflare Workers AI)
DEFINE INDEX embedding_idx ON conversations FIELDS embedding HNSW DIMENSION 1024 DIST COSINE;

-- Dynamic Relationships: Claude discovers ANY relationship type
DEFINE TABLE relationships SCHEMALESS;
DEFINE FIELD in ON relationships TYPE record;     -- Subject (can be any record)
DEFINE FIELD out ON relationships TYPE record;    -- Object (can be any record)  
DEFINE FIELD predicate ON relationships TYPE string; -- Canonical form: "cooks_for", "struggles_with", etc.
DEFINE FIELD confidence ON relationships TYPE float DEFAULT 1.0;
DEFINE FIELD frequency ON relationships TYPE number DEFAULT 1; -- How many times this relationship was mentioned
DEFINE FIELD discovered_at ON relationships TYPE datetime DEFAULT time::now();
DEFINE FIELD last_mentioned ON relationships TYPE datetime DEFAULT time::now();
DEFINE FIELD source_conversations ON relationships TYPE array<record<conversations>>;
DEFINE FIELD original_predicates ON relationships TYPE array<string>; -- ["cooked_for", "cooking_for", "cook_for"]
DEFINE FIELD context ON relationships TYPE string;

-- Raw relationships: Store originals before normalization
DEFINE TABLE raw_relationships SCHEMALESS;
DEFINE FIELD in ON raw_relationships TYPE record;
DEFINE FIELD out ON raw_relationships TYPE record;
DEFINE FIELD predicate ON raw_relationships TYPE string; -- Exact original: "cooked_for", "cooking_for"
DEFINE FIELD confidence ON raw_relationships TYPE float;
DEFINE FIELD discovered_at ON raw_relationships TYPE datetime DEFAULT time::now();
DEFINE FIELD source_conversation ON raw_relationships TYPE record<conversations>;
DEFINE FIELD normalized_to ON raw_relationships TYPE string; -- Points to canonical form

-- Indexes for graph traversal
DEFINE INDEX rel_in_idx ON relationships FIELDS in;
DEFINE INDEX rel_out_idx ON relationships FIELDS out;
DEFINE INDEX rel_predicate_idx ON relationships FIELDS predicate;

-- Processed Files: Duplicate detection and file tracking
DEFINE TABLE processed_files SCHEMAFULL;
DEFINE FIELD file_path ON processed_files TYPE string;
DEFINE FIELD file_size ON processed_files TYPE number;
DEFINE FIELD file_mtime ON processed_files TYPE number;
DEFINE FIELD file_hash ON processed_files TYPE string;
DEFINE FIELD processed_at ON processed_files TYPE datetime;
DEFINE FIELD conversation_count ON processed_files TYPE number;

-- Unique constraint for deduplication
DEFINE INDEX file_path_idx ON processed_files FIELDS file_path UNIQUE;
DEFINE INDEX file_hash_idx ON processed_files FIELDS file_hash;

-- Insights: Discovered patterns and learnings
DEFINE TABLE insights SCHEMALESS;
DEFINE FIELD insight_type ON insights TYPE string;
DEFINE FIELD description ON insights TYPE string;
DEFINE FIELD confidence ON insights TYPE float ASSERT $value >= 0.0 AND $value <= 1.0;
DEFINE FIELD supporting_conversations ON insights TYPE array<string>;
DEFINE FIELD discovered_at ON insights TYPE datetime;

-- Indexes for insight queries
DEFINE INDEX insight_type_idx ON insights FIELDS insight_type;
DEFINE INDEX confidence_idx ON insights FIELDS confidence;

-- No need for manual clustering - SurrealDB HNSW handles this natively!