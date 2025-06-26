#!/usr/bin/env python3
"""
Test EDA conversation ingestion with local SurrealDB
"""

import asyncio
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from storage.local_db import EdaTestDB
from ingestion.file_monitor import EdaFileMonitor

def test_ingestion():
    """Test conversation file ingestion"""
    print("🧠 Testing EDA conversation ingestion...")
    
    with EdaTestDB("eda_ingestion_test") as db:
        # Create file monitor
        monitor = EdaFileMonitor(db)
        
        # Process existing files (one-time batch)
        asyncio.run(monitor._process_existing_files())
        
        # Check what we ingested
        try:
            conversations = db.query("SELECT COUNT() AS total FROM conversations")
            files = db.query("SELECT COUNT() AS total FROM processed_files")
            
            conv_count = conversations[0][0]['total'] if conversations and conversations[0] and len(conversations[0]) > 0 else 0
            file_count = files[0][0]['total'] if files and files[0] and len(files[0]) > 0 else 0
            
            print(f"📊 Ingestion Results:")
            print(f"   • Conversations: {conv_count}")
            print(f"   • Files processed: {file_count}")
            
            # Show sample conversations
            if conv_count > 0:
                samples = db.query("SELECT * FROM conversations LIMIT 3")
                if samples and samples[0]:
                    print(f"\n📝 Sample conversations:")
                    for i, conv in enumerate(samples[0][:3], 1):
                        project = conv.get('project_path', 'unknown')
                        role = conv.get('role', 'unknown')
                        content = conv.get('content', '')[:100]
                        print(f"   {i}. Project: {project}")
                        print(f"      {role.title()}: {content}...")
                        print()
            else:
                print("\n⚠️ No conversations found - check parsing logic")
                
        except Exception as e:
            print(f"❌ Error querying database: {e}")

if __name__ == "__main__":
    test_ingestion()