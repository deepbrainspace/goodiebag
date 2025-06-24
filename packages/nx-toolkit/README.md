# nx-release-please

Enhanced NX release plugin that wraps the standard `nx release` command with
automated branch creation and PR management.

## Features

- **Branch Creation**: Automatically creates and pushes release branches
- **PR Automation**: Creates GitHub PRs for releases
- **Clean Base Validation**: Ensures clean starting state from main branch
- **Full NX Compatibility**: Supports all standard `nx release` parameters
- **Non-interactive Mode**: `--yes` flag for CI/CD workflows
- **Dry Run Support**: Preview changes without making them

## Installation

```bash
# Add to your workspace
pnpm add -D @deepbrainspace/nx-release-please
```

## Usage

```bash
# Basic release
nx release-please

# Specific projects with PR skip
nx release-please --projects=my-app --skip-pr --dry-run

# CI/CD friendly
nx release-please --yes --ensure-clean-base=false
```

## Parameters

| Parameter               | Type     | Default | Description                           |
| ----------------------- | -------- | ------- | ------------------------------------- |
| `specifier`             | string   | `minor` | Version bump type (major/minor/patch) |
| `dry-run`               | boolean  | `false` | Preview changes without applying      |
| `verbose`               | boolean  | `false` | Show detailed command output          |
| `skip-pr`               | boolean  | `false` | Skip PR creation                      |
| `create-release-branch` | boolean  | `true`  | Create release branch                 |
| `ensure-clean-base`     | boolean  | `true`  | Switch to clean base branch           |
| `yes`                   | boolean  | `false` | Non-interactive mode                  |
| `projects`              | string[] | -       | Target specific projects              |
| `groups`                | string[] | -       | Target release groups                 |

Plus all standard `nx release` parameters.

## Workflow

1. **Clean Base**: Switch to main branch and pull latest (if enabled)
2. **Branch Creation**: Create `release/project-name` branch
3. **Release**: Run `nx release` with specified parameters
4. **PR Creation**: Create GitHub PR for the release

## Examples

See [examples documentation](./docs/release-please-examples.md) for detailed
usage scenarios.
