"""
Local SurrealDB instance for EDA testing
Uses file-based storage to avoid network overhead
"""

import os
import tempfile
import subprocess
import time
import asyncio
from surrealdb import Surreal
from pathlib import Path

class LocalSurrealDB:
    def __init__(self, db_name: str = "eda_test"):
        self.db_name = db_name
        self.temp_dir = tempfile.mkdtemp(prefix="eda_surrealdb_")
        self.db_path = os.path.join(self.temp_dir, f"{db_name}.db")
        self.process = None
        self.client = None
        
    def start(self):
        """Start local SurrealDB instance"""
        print(f"🚀 Starting local SurrealDB at {self.db_path}")
        
        # Start SurrealDB in file mode (v2.3+ syntax)
        cmd = [
            "surreal", "start", 
            "--bind", "127.0.0.1:8000",
            "--user", "root", "--pass", "root",
            "file:" + self.db_path
        ]
        
        self.process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        
        # Wait for startup
        time.sleep(3)
        
        # Connect client using context manager
        self.client = Surreal("ws://localhost:8000/rpc")
        self.client.__enter__()
        self.client.signin({"username": "root", "password": "root"})
        self.client.use("eda", "memory")
        
        # Initialize schema
        self._init_schema()
        
        print("✅ Local SurrealDB ready")
        return self.client
        
    def _init_schema(self):
        """Initialize EDA schema"""
        schema_queries = [
            # Conversations table
            """
            DEFINE TABLE conversations SCHEMAFULL;
            DEFINE FIELD role ON conversations TYPE string;
            DEFINE FIELD content ON conversations TYPE string;
            DEFINE FIELD user_message ON conversations TYPE string;
            DEFINE FIELD assistant_message ON conversations TYPE string;
            DEFINE FIELD timestamp ON conversations TYPE datetime;
            DEFINE FIELD project_path ON conversations TYPE string;
            DEFINE FIELD session_id ON conversations TYPE string;
            DEFINE FIELD uuid ON conversations TYPE option<string>;
            DEFINE FIELD parent_uuid ON conversations TYPE option<string>;
            DEFINE FIELD embedding ON conversations TYPE option<array>;
            DEFINE FIELD context ON conversations TYPE object;
            """,
            
            # Relationships table (dynamic)
            """
            DEFINE TABLE relationships SCHEMAFULL;
            DEFINE FIELD subject ON relationships TYPE string;
            DEFINE FIELD predicate ON relationships TYPE string;
            DEFINE FIELD object ON relationships TYPE string;
            DEFINE FIELD confidence ON relationships TYPE number;
            DEFINE FIELD context ON relationships TYPE string;
            DEFINE FIELD discovered_at ON relationships TYPE datetime;
            DEFINE FIELD source_conversation ON relationships TYPE string;
            """,
            
            # Processed files tracking
            """
            DEFINE TABLE processed_files SCHEMAFULL;
            DEFINE FIELD file_path ON processed_files TYPE string;
            DEFINE FIELD file_size ON processed_files TYPE number;
            DEFINE FIELD file_mtime ON processed_files TYPE number;
            DEFINE FIELD processed_at ON processed_files TYPE datetime;
            DEFINE FIELD conversation_count ON processed_files TYPE number;
            DEFINE INDEX file_path_idx ON processed_files FIELDS file_path UNIQUE;
            """,
            
            # Insights/patterns discovered
            """
            DEFINE TABLE insights SCHEMAFULL;
            DEFINE FIELD type ON insights TYPE string;
            DEFINE FIELD description ON insights TYPE string;
            DEFINE FIELD confidence ON insights TYPE number;
            DEFINE FIELD supporting_conversations ON insights TYPE array;
            DEFINE FIELD discovered_at ON insights TYPE datetime;
            """
        ]
        
        for query in schema_queries:
            self.client.query(query)
            
    def cleanup(self):
        """Clean up temp files and process"""
        if self.process:
            self.process.terminate()
            self.process.wait()
        
        # Remove temp directory
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
        print(f"🧹 Cleaned up {self.temp_dir}")

# Context manager for easy testing
class EdaTestDB:
    def __init__(self, db_name: str = "eda_test"):
        self.local_db = LocalSurrealDB(db_name)
        self.client = None
        
    def __enter__(self):
        self.client = self.local_db.start()
        return self.client
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.local_db.cleanup()

# Usage example:
# async with EdaTestDB() as db:
#     result = await db.query("SELECT * FROM conversations")