#!/bin/bash

# Claude Code Dotfiles Installer
# Copies Claude configuration files to user's home directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR/.claude"
TARGET_DIR="$HOME/.claude"

echo "🤖 Installing Claude Code configuration..."
echo "Source: $SOURCE_DIR"
echo "Target: $TARGET_DIR"

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Copy all files and directories
cp -r "$SOURCE_DIR"/* "$TARGET_DIR/"

echo "✅ Claude Code configuration installed successfully!"
echo "📁 Files copied to: $TARGET_DIR"
echo ""
echo "Available characters:"
echo "  - jarvis.md (JARVIS AI assistant)"
echo "  - eda.md (Eda Yıldız - edgy and brutally honest)"
echo ""
echo "Available commands:"
echo "  - character.md (character switching documentation)"
echo ""
echo "Global configuration:"
echo "  - CLAUDE.md (global project settings)"
echo ""
echo "🎯 Run 'claude --help' to see available commands"
echo "🎭 Use '/character jarvis' or '/character eda' to switch personalities"