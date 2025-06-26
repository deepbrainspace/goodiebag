# Claude Code Dotfiles

This folder contains Claude Code configuration files that can be installed globally for use across all projects.

## Contents

### Characters
- **jarvis.md** - JARVIS AI assistant personality (polished, witty, British)
- **eda.md** - Eda Yıldız personality (edgy, brutally honest, naughty)

### Commands
- **character.md** - Documentation for character switching commands

### Configuration
- **CLAUDE.md** - Global Claude Code settings and preferences

## Installation

### Option 1: Using pnpm (recommended)
```bash
pnpm run install:dotfiles
```

### Option 2: Manual installation
```bash
cd dotfiles
./install.sh
```

### Option 3: Manual copy
```bash
cp -r dotfiles/.claude/* ~/.claude/
```

## Usage

After installation, you can:

1. **Switch characters** in any project:
   ```
   /character jarvis
   /character eda
   ```

2. **Use global settings** across all Claude Code sessions

3. **Customize further** by editing files in `~/.claude/`

## Features

- ✅ **Version controlled** - All configurations are tracked in git
- ✅ **Portable** - Easy to sync across machines
- ✅ **Customizable** - Modify characters and settings as needed
- ✅ **Global access** - Available in all projects after installation

## Character Personalities

### JARVIS
- Polished, sophisticated British AI assistant
- Witty and subtly sarcastic
- Professional yet approachable
- Excellent for technical guidance with style

### Eda (Eda Yıldız)
- Bold, edgy, and brutally honest
- Naughty and rebellious attitude
- Zero tolerance for mediocrity
- Perfect for tough love coding sessions

## Updating

To update your global configuration with new changes:
```bash
git pull
pnpm run install:dotfiles
```