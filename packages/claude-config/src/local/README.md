# Local Claude Configuration

Repository-specific Claude Code configurations that can be installed at the
project level.

## Purpose

While the `global/` directory contains configurations that apply across all
projects, the `local/` directory contains configurations that are specific to
individual repositories or project types.

## Structure

```
src/local/
├── README.md                    # This file
├── CLAUDE.md                    # Repository-specific settings
├── commands/                    # Project-specific commands
│   ├── build.md                # Build and deployment commands
│   ├── test.md                 # Testing commands
│   └── release.md              # Release workflow commands
├── templates/                   # Project templates
│   ├── nx-monorepo/            # NX monorepo specific configs
│   └── typescript-project/     # TypeScript project configs
└── workflows/                   # Common development workflows
    ├── feature-development.md   # Feature development workflow
    ├── hotfix.md               # Hotfix workflow
    └── release-process.md      # Release management workflow
```

## Installation

### Project-Level Installation

```bash
# Copy local configs to project's .claude directory
cp -r packages/claude-config/src/local/* .claude/

# Or use the installer (when implemented)
nx run claude-config:install-local
```

### Per-Repository Customization

```bash
# Copy base template and customize
cp packages/claude-config/src/local/CLAUDE.md .claude/CLAUDE.md
# Edit .claude/CLAUDE.md for project-specific settings
```

## Usage

Local configurations complement global ones:

1. **Global configs** (`~/.claude/`) - Apply to all Claude Code sessions
2. **Local configs** (`.claude/`) - Apply only to the current project

Local configs take precedence over global ones for the same settings.

## Best Practices

### Repository-Specific Settings

- **Project conventions** - Coding standards, naming conventions
- **Build commands** - Project-specific build and test commands
- **Workflow helpers** - Repository-specific development workflows
- **Team guidelines** - Project team communication and review processes

### Keep Global vs Local Separation

- **Global**: Personal preferences, character personalities, general workflow
- **Local**: Project requirements, team standards, repository conventions

## Examples

### Monorepo Configuration

```markdown
# In .claude/CLAUDE.md

## Project Type: NX Monorepo

### Package Management

- Always use `nx` commands first, then `pnpm`
- Use `nx affected` for efficiency

### Release Strategy

- Separate commits per package
- Conventional commits for semantic versioning
```

### Team Collaboration

```markdown
# In .claude/commands/review.md

## Code Review Commands

### Create PR for Review

`/review` - Create pull request with team template

### Request Specific Reviewer

`/review @username` - Request review from team member
```

## Customization

Projects can extend or override any configuration:

1. **Start with template** - Copy from templates/
2. **Customize for project** - Edit for specific needs
3. **Version control** - Check into project repository
4. **Team sharing** - Share configurations with team

## Future Enhancements

- **Template generator** - CLI to create project-specific configs
- **Team synchronization** - Keep team configs in sync
- **Convention detection** - Auto-detect project type and suggest configs
- **Validation** - Ensure local configs follow project standards
