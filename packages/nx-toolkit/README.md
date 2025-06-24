# @goodiebag/nx-toolkit

NX toolkit plugin providing useful commands and executors for development workflow in monorepos.

## Features

### 🌍 Global Commands
- **`nx versions`** - Display current versions of all packages in the workspace

### 🔧 Project Executors  
- **`release-please`** - Enhanced release workflow with branch creation and PR automation

## Installation

```bash
# Add to your workspace
pnpm add -D @goodiebag/nx-toolkit
```

## Usage

### Global Commands

Once installed, these commands are available globally in your workspace:

```bash
# Show package versions across the workspace
nx versions

# Show detailed version information
nx versions --verbose
```

### Project Executors

Add to your `project.json`:

```json
{
  "targets": {
    "release-please": {
      "executor": "@goodiebag/nx-toolkit:release-please",
      "options": {
        "createReleaseBranch": true,
        "specifier": "minor",
        "ensureCleanBase": false
      }
    }
  }
}
```

Then run:

```bash
# Enhanced release with branch creation
nx run my-project:release-please

# Dry run to preview changes
nx run my-project:release-please --dry-run

# CI/CD friendly
nx run my-project:release-please --yes --ensure-clean-base=false
```

## Commands

### `nx versions`

Displays current versions of all packages in the workspace by parsing NX release information.

**Options:**
- `--verbose` - Show additional information and help text

**Example output:**
```
📦 Current Package Versions:
==========================
nx-surrealdb          0.3.4
nx-toolkit            0.1.0
nx-rust               3.1.0
goodiebag             0.2.0
claude-code-toolkit   0.3.1
```

## Executors

### `release-please`

Enhanced release workflow that wraps the standard `nx release` command with automated branch creation and PR management.

**Parameters:**

| Parameter               | Type     | Default | Description                           |
| ----------------------- | -------- | ------- | ------------------------------------- |
| `specifier`             | string   | `minor` | Version bump type (major/minor/patch) |
| `dryRun`                | boolean  | `false` | Preview changes without applying      |
| `verbose`               | boolean  | `false` | Show detailed command output          |
| `skipPr`                | boolean  | `false` | Skip PR creation                      |
| `createReleaseBranch`   | boolean  | `true`  | Create release branch                 |
| `ensureCleanBase`       | boolean  | `true`  | Switch to clean base branch           |
| `yes`                   | boolean  | `false` | Non-interactive mode                  |
| `projects`              | string[] | -       | Target specific projects              |
| `groups`                | string[] | -       | Target release groups                 |

Plus all standard `nx release` parameters.

**Workflow:**

1. **Clean Base**: Switch to main branch and pull latest (if enabled)
2. **Branch Creation**: Create `release/project-name` branch  
3. **Release**: Run `nx release` with specified parameters
4. **PR Creation**: Create GitHub PR for the release

## Why This Plugin?

### Global Commands vs Project Executors

- **Commands** (`nx versions`) - Available globally once plugin is installed, great for information display
- **Executors** (`nx run project:release-please`) - Project-scoped, perfect for complex workflows that need configuration

### No Conflicts with Built-in NX

- `nx versions` - New command, doesn't override anything
- `nx release-please` - Project-scoped, doesn't interfere with built-in `nx release`
- `nx release` - Built-in NX release command remains unchanged

## Examples

```bash
# Check current versions before release
nx versions

# Release a specific package
nx run my-package:release-please --specifier=patch

# Preview release changes
nx run my-package:release-please --dry-run --verbose

# CI/CD release
nx run my-package:release-please --yes --skip-pr
```

## Development

```bash
# Build the plugin
nx build nx-toolkit

# Test (executors only - commands need to be installed)
nx run goodiebag:versions
```