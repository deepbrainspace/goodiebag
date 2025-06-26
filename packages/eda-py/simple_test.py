#!/usr/bin/env python3
"""
Simple test to verify EDA components work
"""

import os
import json
from pathlib import Path

def test_conversation_parsing():
    """Test parsing Claude Code conversation files"""
    print("🧪 Testing conversation file parsing...")
    
    # Find sample conversation files
    projects_path = Path.home() / ".claude" / "projects"
    
    if not projects_path.exists():
        print("❌ No Claude Code projects directory found")
        return
        
    # Find first .jsonl file
    jsonl_files = list(projects_path.rglob("*.jsonl"))
    
    if not jsonl_files:
        print("❌ No conversation files found")
        return
        
    sample_file = jsonl_files[0]
    print(f"📁 Testing with: {sample_file.name}")
    print(f"📊 File size: {sample_file.stat().st_size / 1024:.1f} KB")
    
    # Parse first few lines
    conversation_count = 0
    user_messages = 0
    assistant_messages = 0
    
    try:
        with open(sample_file, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f):
                if i >= 10:  # Only process first 10 lines
                    break
                    
                try:
                    data = json.loads(line.strip())
                    conversation_count += 1
                    
                    role = data.get('role', 'unknown')
                    if role == 'user':
                        user_messages += 1
                    elif role == 'assistant':
                        assistant_messages += 1
                        
                    # Show sample content
                    if i < 3:
                        content = ""
                        if 'content' in data and isinstance(data['content'], list):
                            for content_item in data['content']:
                                if content_item.get('type') == 'text':
                                    content = content_item.get('text', '')[:100]
                                    break
                        
                        print(f"   {i+1}. {role}: {content}...")
                        
                except json.JSONDecodeError:
                    print(f"   ⚠️ JSON decode error on line {i+1}")
                    continue
                    
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return
        
    print(f"\n✅ Parsing successful!")
    print(f"   • Conversations processed: {conversation_count}")
    print(f"   • User messages: {user_messages}")
    print(f"   • Assistant messages: {assistant_messages}")
    print(f"   • Total files available: {len(jsonl_files)}")

def test_file_monitoring():
    """Test file monitoring components"""
    print("\n🔍 Testing file monitoring...")
    
    projects_path = Path.home() / ".claude" / "projects"
    project_dirs = [d for d in projects_path.iterdir() if d.is_dir()]
    
    print(f"📂 Found {len(project_dirs)} project directories:")
    for i, project_dir in enumerate(project_dirs[:5], 1):
        jsonl_files = list(project_dir.glob("*.jsonl"))
        total_size = sum(f.stat().st_size for f in jsonl_files)
        
        print(f"   {i}. {project_dir.name}")
        print(f"      • Files: {len(jsonl_files)}")
        print(f"      • Total size: {total_size / 1024:.1f} KB")
        
        if jsonl_files:
            latest_file = max(jsonl_files, key=lambda f: f.stat().st_mtime)
            import time
            mtime = time.ctime(latest_file.stat().st_mtime)
            print(f"      • Latest: {latest_file.name} ({mtime})")

if __name__ == "__main__":
    print("🧠 EDA Simple Component Test")
    print("=" * 50)
    
    test_conversation_parsing()
    test_file_monitoring()
    
    print("\n✅ Simple tests completed!")