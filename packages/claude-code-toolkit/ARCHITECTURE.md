# Claude Code Architecture

## Design Principles

**Always think architecture and plan first before diving into implementation.**

- Make things modular and reusable
- Design for extensibility and maintainability
- Plan the system before coding
- Follow industry-standard patterns
- Enforce quality through automated pipelines

## Project Structure

```
packages/claude-code-toolkit/
├── Cargo.toml                  # Project metadata and dependencies
├── project.json               # NX build configuration
├── README.md                  # User documentation
├── ARCHITECTURE.md            # This file - architectural documentation
├── src/
│   ├── lib.rs                 # Library entry point
│   ├── main.rs                # CLI entry point
│   ├── traits/                # Core traits and interfaces
│   │   ├── mod.rs             # Trait exports
│   │   ├── config.rs          # Configuration provider traits
│   │   ├── secrets.rs         # Secret management traits
│   │   ├── setup.rs           # Setup wizard traits
│   │   └── validation.rs      # Validation service traits
│   ├── providers/             # Secret provider implementations
│   │   ├── mod.rs             # Provider factory and base
│   │   ├── github.rs          # GitHub provider implementation
│   │   └── registry.rs        # Provider registry (Service Locator)
│   ├── config/                # Configuration management
│   │   ├── mod.rs             # Module exports
│   │   ├── manager.rs         # Configuration manager (Repository Pattern)
│   │   └── credentials.rs     # Claude credentials reader
│   ├── sync/                  # Synchronization service
│   │   └── mod.rs             # High-level sync orchestration
│   ├── cli/                   # Command-line interface
│   │   ├── mod.rs             # CLI definition
│   │   └── commands/          # Command implementations
│   ├── types.rs               # Data structures and models
│   ├── error.rs               # Error types and handling
│   ├── daemon/                # Background daemon
│   └── utils/                 # Utility functions
└── tests/                     # Integration tests
```

## Architectural Components

### 1. Configuration Traits & Interfaces

```rust
trait ConfigProvider {
    async fn load_config(&self) -> Result<Config>;
    async fn save_config(&self, config: &Config) -> Result<()>;
    async fn validate_config(&self, config: &Config) -> Result<()>;
}

trait SecretManager {
    async fn sync_secrets(&self, credentials: &Credentials, mapping: &SecretMapping) -> Result<()>;
    async fn validate_access(&self, targets: &[Target]) -> Result<HashMap<String, bool>>;
}

trait ValidationService {
    fn validate_config(&self, config: &Config) -> Result<Vec<ValidationError>>;
    fn validate_credentials(&self, credentials: &Credentials) -> Result<()>;
}

trait SetupWizard {
    async fn run_setup(&self) -> Result<Config>;
    fn get_setup_steps(&self) -> Vec<Box<dyn SetupStep>>;
}
```

### 2. Modular Components

- **ConfigurationManager** - orchestrates config operations

  - Handles loading, saving, validation
  - Manages config migrations
  - Provides unified config interface

- **SecretsRegistry** - extensible secret name mappings

  - Supports multiple secret schemas
  - Allows custom naming conventions
  - Template-based secret generation

- **ProviderRegistry** - pluggable sync providers

  - GitHub provider (current)
  - Future: GitLab, BitBucket, Azure DevOps
  - Custom provider interface

- **SetupFlow** - reusable wizard framework
  - Step-based configuration
  - Conditional flows
  - Progress tracking

### 3. Extensibility Points

- **Plugin System for Secret Providers**

  ```rust
  trait SecretProvider {
      fn provider_name(&self) -> &str;
      async fn sync_secrets(&self, secrets: &[Secret]) -> Result<()>;
      async fn validate_access(&self) -> Result<bool>;
  }
  ```

- **Configurable Secret Mappings**

  ```yaml
  secret_schemas:
    claude:
      access_token: CLAUDE_ACCESS_TOKEN
      refresh_token: CLAUDE_REFRESH_TOKEN
      expires_at: CLAUDE_EXPIRES_AT
    custom_schema:
      access_token: CUSTOM_AUTH_TOKEN
      refresh_token: CUSTOM_REFRESH_TOKEN
      expires_at: CUSTOM_EXPIRY
  ```

- **Template-based Config Generation**

  ```yaml
  templates:
    github_org:
      provider: github
      type: organization
      secrets: claude
    gitlab_project:
      provider: gitlab
      type: project
      secrets: claude
  ```

- **Validation Rules Engine**
  ```rust
  trait ValidationRule {
      fn validate(&self, config: &Config) -> Result<()>;
  }
  ```

### 4. Reusable Patterns

- **Command Pattern** for setup steps

  ```rust
  trait SetupStep {
      async fn execute(&self, context: &mut SetupContext) -> Result<()>;
      fn can_skip(&self, context: &SetupContext) -> bool;
      fn get_description(&self) -> &str;
  }
  ```

- **Factory Pattern** for provider creation

  ```rust
  trait ProviderFactory {
      fn create_provider(&self, config: &ProviderConfig) -> Result<Box<dyn SecretProvider>>;
      fn supported_providers(&self) -> Vec<&str>;
  }
  ```

- **Observer Pattern** for config changes

  ```rust
  trait ConfigObserver {
      async fn on_config_changed(&self, old: &Config, new: &Config) -> Result<()>;
  }
  ```

- **Strategy Pattern** for sync algorithms
  ```rust
  trait SyncStrategy {
      async fn sync(&self, credentials: &Credentials, targets: &[Target]) -> Result<SyncResult>;
  }
  ```

## Implementation Benefits

1. **Modularity**: Each component has a single responsibility
2. **Reusability**: Common patterns can be reused across different features
3. **Extensibility**: Easy to add new providers, secret schemas, or setup flows
4. **Testability**: Each component can be unit tested independently
5. **Maintainability**: Clear separation of concerns makes code easier to
   maintain

## Future Extensions

- Support for multiple CI/CD platforms (GitLab CI, Azure DevOps, etc.)
- Custom secret naming schemes per organization
- Integration with external secret managers (HashiCorp Vault, AWS Secrets
  Manager)
- Multi-tenant configuration support
- Configuration templates and inheritance
- Real-time config validation and suggestions

## NX Build Pipeline

The project enforces quality through a strict dependency chain:

```
fmt ──→ lint ──→ test ──→ build ──→ package ──→ publish
  ↓       ↓        ↓        ↓
  └──→ quality ───┴────→ ci
```

### Pipeline Stages

1. **Format Check** (`nx fmt`): Ensures code formatting consistency
2. **Lint** (`nx lint`): Static analysis with Clippy (depends on fmt)
3. **Test** (`nx test`): Runs all tests with coverage (depends on lint)
4. **Build** (`nx build`): Compiles optimized release binary (depends on test)
5. **Package** (`nx package`): Creates distributable package (depends on build)
6. **Publish** (`nx publish`): Publishes to crates.io (depends on package)

### Quality Gates

- **No code can be built without passing all tests**
- **No tests can run without passing lint checks**
- **No publishing without successful build and packaging**
- **All dependencies are explicitly declared and enforced**

### Available Commands

```bash
# Development
nx fmt-fix claude-code      # Auto-fix formatting
nx check claude-code        # Quick compilation check
nx build-dev claude-code    # Development build

# Quality Pipeline
nx quality claude-code      # Run all quality checks
nx ci claude-code          # Complete CI pipeline

# Release Pipeline
nx publish-dry-run claude-code  # Test publishing
nx publish claude-code         # Publish to crates.io
```

## Data Flow Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Claude Code    │───▶│  Credentials     │───▶│  Generic        │
│  ~/.claude/     │    │  Manager         │    │  Credentials    │
│  .credentials   │    │  (Repository)    │    │  (Model)        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │                         │
                               ▼                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  YAML Config    │───▶│  Configuration   │───▶│  Secret         │
│  ~/.goodiebag/  │    │  Manager         │    │  Mapping        │
│  config.yml     │    │  (Repository)    │    │  (Strategy)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │                         │
                               └──────────┬──────────────┘
                                          ▼
                               ┌──────────────────┐
                               │  Sync Service    │
                               │  (Orchestrator)  │
                               └──────────────────┘
                                          │
                                          ▼
                               ┌──────────────────┐
                               │  Provider        │
                               │  Registry        │
                               │  (Service Loc.)  │
                               └──────────────────┘
                                          │
                                          ▼
                    ┌─────────────────────┼─────────────────────┐
                    ▼                     ▼                     ▼
           ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
           │  GitHub         │   │  GitLab         │   │  Azure DevOps   │
           │  Provider       │   │  Provider       │   │  Provider       │
           │  (Strategy)     │   │  (Strategy)     │   │  (Strategy)     │
           └─────────────────┘   └─────────────────┘   └─────────────────┘
                    │                     │                     │
                    ▼                     ▼                     ▼
           ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
           │  GitHub Secrets │   │  GitLab Vars    │   │  Azure KeyVault │
           │  (External)     │   │  (External)     │   │  (External)     │
           └─────────────────┘   └─────────────────┘   └─────────────────┘
```

## Design Pattern Implementation

### Repository Pattern

- `ConfigProvider` trait with `YamlConfigProvider` implementation
- `CredentialsManager` encapsulates Claude credential access
- Clean separation between data access and business logic

### Factory Pattern

- `ProviderFactory` creates secret providers based on configuration
- `ProviderCreator` trait for extensible provider instantiation
- Type-safe provider creation with validation

### Service Locator Pattern

- `ProviderRegistry` manages and locates secret providers
- Centralized provider management and lifecycle
- Lazy initialization and caching

### Strategy Pattern

- `SecretProvider` trait with multiple implementations (GitHub, GitLab, etc.)
- `SecretMapping` for different secret naming strategies
- `SyncStrategy` for different synchronization approaches

### Dependency Injection

- All services accept dependencies through constructors
- Interfaces over implementations
- Testable and mockable components

## Key Takeaways

- **Always plan the architecture before coding**
- **Design for change and extensibility**
- **Use established patterns for common problems**
- **Keep components loosely coupled**
- **Make the system testable and maintainable**
- **Enforce quality through automated pipelines**
- **Document data flow and component interactions**
