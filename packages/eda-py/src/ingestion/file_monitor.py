"""
EDA File Monitor - Watches Claude Code conversation files
Handles duplicate detection and triggers ingestion pipeline
"""

import os
import json
import asyncio
import hashlib
from pathlib import Path
from typing import Dict, Set, Optional
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from dataclasses import dataclass
from datetime import datetime

@dataclass
class FileMetadata:
    path: str
    size: int
    mtime: float
    hash: str
    
    @classmethod
    def from_path(cls, file_path: str):
        stat = os.stat(file_path)
        with open(file_path, 'rb') as f:
            content_hash = hashlib.md5(f.read()).hexdigest()
        
        return cls(
            path=file_path,
            size=stat.st_size,
            mtime=stat.st_mtime,
            hash=content_hash
        )

class ConversationFileHandler(FileSystemEventHandler):
    def __init__(self, eda_monitor):
        self.eda_monitor = eda_monitor
        
    def on_modified(self, event):
        if event.is_directory:
            return
            
        if event.src_path.endswith('.jsonl'):
            print(f"📝 Detected change: {event.src_path}")
            asyncio.create_task(self.eda_monitor.process_file(event.src_path))
            
    def on_created(self, event):
        if event.is_directory:
            return
            
        if event.src_path.endswith('.jsonl'):
            print(f"🆕 New file detected: {event.src_path}")
            asyncio.create_task(self.eda_monitor.process_file(event.src_path))

class EdaFileMonitor:
    def __init__(self, db_client, claude_projects_path: str = "~/.claude/projects"):
        self.db = db_client
        self.projects_path = Path(claude_projects_path).expanduser()
        self.processed_cache: Dict[str, FileMetadata] = {}
        self.observer = None
        
    async def start(self):
        """Start monitoring Claude Code projects directory"""
        print(f"🔍 Starting EDA file monitor on {self.projects_path}")
        
        # Load processed files from database
        await self._load_processed_cache()
        
        # Process any existing files we haven't seen
        await self._process_existing_files()
        
        # Start file system watcher
        self._start_watcher()
        
    async def _load_processed_cache(self):
        """Load already processed files from database"""
        result = self.db.query("SELECT * FROM processed_files")
        processed_files = result[0] if result else []
        
        for file_record in processed_files:
            metadata = FileMetadata(
                path=file_record['file_path'],
                size=file_record['file_size'], 
                mtime=file_record['file_mtime'],
                hash=file_record.get('file_hash', '')
            )
            self.processed_cache[file_record['file_path']] = metadata
            
        print(f"📚 Loaded {len(self.processed_cache)} processed files from cache")
        
    async def _process_existing_files(self):
        """Process any existing .jsonl files we haven't seen"""
        for project_dir in self.projects_path.iterdir():
            if project_dir.is_dir():
                for jsonl_file in project_dir.glob("*.jsonl"):
                    await self.process_file(str(jsonl_file))
                    
    def _start_watcher(self):
        """Start filesystem watcher"""
        self.observer = Observer()
        handler = ConversationFileHandler(self)
        self.observer.schedule(handler, str(self.projects_path), recursive=True)
        self.observer.start()
        print(f"👁️ File watcher started on {self.projects_path}")
        
    async def process_file(self, file_path: str):
        """Process a conversation file if it's new or changed"""
        try:
            if not os.path.exists(file_path):
                return
                
            # Get current file metadata
            current_metadata = FileMetadata.from_path(file_path)
            
            # Check if we should process this file
            if not self._should_process_file(current_metadata):
                return
                
            print(f"🔄 Processing: {file_path}")
            
            # Parse conversation file
            conversations = await self._parse_conversation_file(file_path)
            
            if not conversations:
                print(f"⚠️ No conversations found in {file_path}")
                return
                
            # Store conversations and update processed cache
            await self._store_conversations(conversations, file_path)
            await self._mark_file_processed(current_metadata, len(conversations))
            
            print(f"✅ Processed {len(conversations)} conversations from {os.path.basename(file_path)}")
            
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
            
    def _should_process_file(self, metadata: FileMetadata) -> bool:
        """Check if file should be processed (new or changed)"""
        cached = self.processed_cache.get(metadata.path)
        
        if not cached:
            return True  # New file
            
        # Check if file changed (size, mtime, or content hash)
        return (
            cached.size != metadata.size or
            cached.mtime != metadata.mtime or
            cached.hash != metadata.hash
        )
        
    async def _parse_conversation_file(self, file_path: str) -> list:
        """Parse Claude Code conversation JSONL file"""
        conversations = []
        project_path = str(Path(file_path).parent.name)
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    try:
                        data = json.loads(line.strip())
                        
                        # Skip summary entries
                        if data.get('type') == 'summary':
                            continue
                            
                        # Process message entries
                        if 'message' in data:
                            message = data['message']
                            role = message.get('role')
                            
                            if role in ['user', 'assistant']:
                                # Extract text content from message
                                content_text = ""
                                if 'content' in message:
                                    if isinstance(message['content'], list):
                                        for content_item in message['content']:
                                            if content_item.get('type') == 'text':
                                                content_text += content_item.get('text', '') + " "
                                    elif isinstance(message['content'], str):
                                        content_text = message['content']
                                
                                if content_text.strip():  # Only add non-empty content
                                    conversation = {
                                        'role': role,
                                        'content': content_text.strip(),
                                        'timestamp': data.get('timestamp'),
                                        'project_path': project_path,
                                        'session_id': Path(file_path).stem,
                                        'line_number': line_num,
                                        'uuid': data.get('uuid'),
                                        'parent_uuid': data.get('parentUuid')
                                    }
                                    conversations.append(conversation)
                                    
                    except json.JSONDecodeError as e:
                        print(f"⚠️ JSON decode error on line {line_num}: {e}")
                        continue
                        
        except Exception as e:
            print(f"❌ Error reading file {file_path}: {e}")
            
        return conversations
        
    async def _store_conversations(self, conversations: list, file_path: str):
        """Store parsed conversations in database"""
        for conv in conversations:
            # Store each message turn individually with full context
            self.db.create('conversations', {
                'role': conv['role'],
                'content': conv['content'],
                'user_message': conv['content'] if conv['role'] == 'user' else '',
                'assistant_message': conv['content'] if conv['role'] == 'assistant' else '',
                'timestamp': datetime.fromisoformat(conv['timestamp'].replace('Z', '+00:00')) if conv['timestamp'] else datetime.now(),
                'project_path': conv['project_path'],
                'session_id': conv['session_id'],
                'uuid': conv.get('uuid', ''),
                'parent_uuid': conv.get('parent_uuid', ''),
                'context': {
                    'file_path': file_path,
                    'line_number': conv['line_number'],
                    'role': conv['role']
                }
            })
            
    async def _mark_file_processed(self, metadata: FileMetadata, conversation_count: int):
        """Mark file as processed in database and cache"""
        # Store in database
        self.db.query("""
            UPSERT processed_files:⟨$file_path⟩ SET
                file_path = $file_path,
                file_size = $file_size,
                file_mtime = $file_mtime, 
                file_hash = $file_hash,
                processed_at = time::now(),
                conversation_count = $conversation_count
        """, {
            'file_path': metadata.path,
            'file_size': metadata.size,
            'file_mtime': metadata.mtime,
            'file_hash': metadata.hash,
            'conversation_count': conversation_count
        })
        
        # Update cache
        self.processed_cache[metadata.path] = metadata
        
    def stop(self):
        """Stop file monitoring"""
        if self.observer:
            self.observer.stop()
            self.observer.join()
            print("🛑 File monitor stopped")

# Usage example:
# monitor = EdaFileMonitor(db_client)
# await monitor.start()