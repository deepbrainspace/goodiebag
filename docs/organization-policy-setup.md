# GitHub Organization Policy Setup Guide

> **Purpose**: Configure GitHub organization policies for secure NX monorepo workflows  
> **Target**: Multiple organization management with consistent security standards  
> **Last Updated**: June 22, 2025

## Prerequisites

### Required Permissions
- **Organization Owner** access to target organizations
- **Admin** access to repositories within organizations
- GitHub account with 2FA enabled (recommended)

### Verification Checklist
Before starting, verify you have:
- [ ] Organization owner permissions
- [ ] Access to organization settings
- [ ] List of repositories requiring these policies
- [ ] Understanding of team structure and access needs

## Organization-Level Policies

### 1. Repository Creation and Management

**Navigation**: Organization Settings → Member privileges

**Recommended Settings**:
```
✅ Repository creation: Restrict to owners/admins only
✅ Repository forking: Allow forking of private repositories (if needed)
✅ Repository visibility: Allow members to change visibility to private
❌ Repository deletion: Disable for members
```

**Security Rationale**: Prevents unauthorized repository creation that could bypass security policies.

### 2. Branch Protection and Merge Policies

**Navigation**: Organization Settings → Repository defaults

**Critical Settings for NX Monorepos**:
```
✅ Require pull request reviews before merging
✅ Dismiss stale PR approvals when new commits are pushed
✅ Require review from code owners (if CODEOWNERS file exists)
❌ Allow squash merging (CRITICAL: Must be disabled for NX)
✅ Allow merge commits (Required for NX conventional commits)
✅ Allow rebase merging (Optional, but safe)
✅ Automatically delete head branches
```

**Why Squash Merge Must Be Disabled**:
- NX Release parses git history for conventional commits
- Squash merges break conventional commit parsing (NX issue #26241)
- Prevents automatic changelog generation
- Causes "No changes detected" errors despite valid commits

### 3. GitHub Actions Permissions

**Navigation**: Organization Settings → Actions → General

**Workflow Permissions**:
```
✅ Read and write permissions (for NX release workflows)
✅ Allow GitHub Actions to create and approve pull requests
```

**Actions Usage**:
```
✅ Allow all actions and reusable workflows
⚠️ Or: Allow local actions plus select non-local actions (more secure)
```

**Artifact and Log Retention**:
```
📋 Artifact retention: 90 days (adjust based on needs)
📋 Log retention: 90 days
```

### 4. Security and Analysis

**Navigation**: Organization Settings → Code security and analysis

**Recommended Settings**:
```
✅ Dependency graph (for vulnerability scanning)
✅ Dependabot alerts (for security vulnerabilities)  
✅ Dependabot security updates (automated PR creation)
✅ Dependabot version updates (optional, can be noisy)
✅ Secret scanning (detect committed secrets)
✅ Push protection (prevent secret commits)
```

**For Private Repositories** (if applicable):
```
✅ Enable security features for private repos
```

## Repository-Level Configuration

### 1. Branch Protection Rules

**Navigation**: Repository Settings → Branches → Add rule

**Rule Configuration for `main` branch**:

**Branch name pattern**: `main`

**Protect matching branches**:
```
✅ Require a pull request before merging
  ✅ Require approvals: 1 (minimum)
  ✅ Dismiss stale PR approvals when new commits are pushed
  ✅ Require review from code owners (if CODEOWNERS exists)
  
✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  📋 Status checks: (Configure based on your CI workflows)
    - build
    - test  
    - lint
    - any other required checks
    
✅ Require conversation resolution before merging
✅ Require signed commits (optional, high security)
✅ Require linear history (optional, cleaner git history)
✅ Require deployments to succeed (if using deployments)

❌ Allow force pushes (Security: prevent history rewriting)
❌ Allow deletions (Security: prevent branch deletion)
✅ Restrict pushes that create files larger than 100MB
✅ Lock branch (for extra protection)
```

**Additional Protected Branches**:
Consider protecting:
- `develop` (if using GitFlow)
- `release/*` (protect release branches)
- `hotfix/*` (protect hotfix branches)

### 2. Merge Button Configuration

**Navigation**: Repository Settings → General → Pull Requests

**Critical for NX Monorepos**:
```
❌ Allow squash merging (DISABLE - breaks NX conventional commits)
✅ Allow merge commits (ENABLE - required for NX)
✅ Allow rebase merging (OPTIONAL - safe for NX)
✅ Always suggest updating pull request branches
✅ Allow auto-merge
✅ Automatically delete head branches
```

**Default Merge Message**:
```
🔘 Default to pull request title (recommended)
```

### 3. Repository Actions Settings

**Navigation**: Repository Settings → Actions → General

**Actions Permissions**:
```
✅ Allow all actions and reusable workflows
⚠️ Or: Allow local actions plus select non-local actions
```

**Workflow Permissions**:
```
✅ Read and write permissions
✅ Allow GitHub Actions to create and approve pull requests
```

## NX Monorepo Specific Requirements

### 1. Required Repository Structure

Ensure your repository has:
```
✅ nx.json (NX configuration)
✅ package.json (with NX dependencies)
✅ .github/workflows/ (CI/CD workflows)
✅ CODEOWNERS (optional, for review requirements)
✅ .gitignore (with NX-specific ignores)
```

### 2. Package Manager Lock Files

**For pnpm (Recommended)**:
```
✅ Commit pnpm-lock.yaml
✅ Add to .gitignore: node_modules/
✅ Ensure consistent pnpm version across team
```

**Lock File Validation**:
Consider adding pre-push hooks to validate lock file consistency:
```bash
# In .husky/pre-push or similar
pnpm install --frozen-lockfile
```

### 3. Conventional Commit Enforcement

**Option 1: Commit Message Template**
Create `.gitmessage` template:
```
# feat: add new feature
# fix: resolve bug
# docs: update documentation  
# chore: maintenance task
# 
# Type(scope): Short description
#
# Longer description if needed
#
# BREAKING CHANGE: describe breaking changes
```

**Option 2: Commit Linting**
Use commitlint with husky:
```json
// package.json
{
  "devDependencies": {
    "@commitlint/cli": "^17.0.0",
    "@commitlint/config-conventional": "^17.0.0",
    "husky": "^8.0.0"
  }
}
```

### 4. Required Status Checks

Configure these status checks in branch protection:
```
✅ build (ensure packages build successfully)
✅ test (run test suites)
✅ lint (code quality checks)
✅ format (code formatting validation)
✅ affected-check (NX affected analysis)
```

## Team Access and Permissions

### 1. Team Creation and Management

**Navigation**: Organization Settings → Teams

**Recommended Team Structure**:
```
📋 Owners (Organization owners only)
📋 Maintainers (Core maintainers, admin access)
📋 Contributors (Regular contributors, write access)
📋 Reviewers (Code reviewers, read + review access)
```

### 2. Repository Access Levels

**Access Level Mapping**:
```
🔴 Admin: Owners, lead maintainers only
🟡 Maintain: Senior developers, maintainers
🟢 Write: Regular contributors
🔵 Triage: Community maintainers, issue managers
⚪ Read: Everyone else, external contributors
```

**Repository-Specific Teams**:
Consider creating teams per repository or package:
```
📋 nx-rust-maintainers
📋 nx-surrealdb-maintainers  
📋 claude-code-toolkit-maintainers
```

## Security Best Practices

### 1. Secrets Management

**Organization Secrets** (for shared secrets):
```
📋 GH_PAT (Personal Access Token for workflows)
📋 NPM_TOKEN (for package publishing)
```

**Repository Secrets** (for specific repos):
```
📋 Repository-specific API keys
📋 Deployment credentials
```

**Secret Naming Convention**:
```
✅ Use UPPERCASE_WITH_UNDERSCORES
✅ Prefix with service: NPM_TOKEN, AWS_ACCESS_KEY
✅ Include environment: PROD_DATABASE_URL, DEV_API_KEY
```

### 2. Access Token Management

**Personal Access Tokens (PATs)**:
```
✅ Use fine-grained tokens when possible
✅ Set minimal required permissions
✅ Set expiration dates (90 days recommended)
✅ Regular token rotation
```

**Token Permissions for NX Workflows**:
```
✅ Contents: write (for pushing changes)
✅ Pull requests: write (for creating PRs)
✅ Metadata: read (basic repository access)
✅ Actions: read (for workflow status)
```

### 3. Audit and Monitoring

**Enable Audit Logging**:
```
✅ Organization audit log (Enterprise only)
✅ Repository activity monitoring
✅ Failed login attempt notifications
```

**Regular Security Reviews**:
```
📋 Monthly: Review team access and permissions
📋 Quarterly: Audit secrets and tokens
📋 Annually: Complete security assessment
```

## Verification and Testing

### 1. Policy Verification Checklist

After applying policies, verify:

**Branch Protection**:
- [ ] Cannot push directly to main
- [ ] Squash merge disabled
- [ ] PR reviews required
- [ ] Status checks enforced

**Actions Permissions**:
- [ ] Workflows can create PRs
- [ ] Artifacts properly stored
- [ ] Secrets accessible to workflows

**Repository Settings**:
- [ ] Merge commits enabled
- [ ] Auto-delete head branches working
- [ ] Security features active

### 2. Test Workflow

Create a test PR to verify:
```bash
# 1. Create test branch
git checkout -b test/policy-verification

# 2. Make a small change with conventional commit
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "feat: add policy verification test"

# 3. Push and create PR
git push origin test/policy-verification

# 4. Verify PR creation and protection rules
# 5. Test merge with conventional commit preserved
# 6. Verify NX release can detect changes
```

### 3. NX Release Testing

Test NX release workflow after policy setup:
```bash
# Dry run to verify conventional commit detection
nx release --dry-run

# Check changelog generation
nx release --skip-publish --dry-run
```

## Troubleshooting Common Issues

### Issue: "Squash merge not available"
**Solution**: This is expected and correct. Squash merge should be disabled.

### Issue: "Actions cannot create PR"
**Solution**: Verify organization Actions settings allow PR creation.

### Issue: "Status checks not enforcing"  
**Solution**: Ensure status check names match your workflow job names exactly.

### Issue: "NX release shows 'no changes'"
**Solution**: Verify no squash merges were used and conventional commits are properly formatted.

## Multi-Organization Management

### Manual Setup Process

**For each organization, repeat**:
1. Apply organization-level policies (Section 2)
2. Configure repository defaults (Section 2.2)
3. Set up team structure (Section 5)
4. Apply security settings (Section 6)

**Consistency Checklist**:
- [ ] Same branch protection rules across orgs
- [ ] Consistent team naming conventions
- [ ] Identical security policies
- [ ] Same Actions permissions

### Future Automation Options

**Terraform GitHub Provider** (Recommended for scale):
- Manage multiple organizations as Infrastructure as Code
- Version control for policy changes
- Consistent application across organizations
- Requires Terraform knowledge

**GitHub Safe Settings App**:
- Per-organization configuration
- YAML-based policy definition
- Good for individual organization management
- Limited cross-organization features

**Custom Scripts**:
- GitHub CLI or REST API
- Custom automation for specific needs
- Requires development and maintenance effort

## References and Resources

**GitHub Documentation**:
- [Repository permissions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features)
- [Branch protection rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository)
- [Actions permissions](https://docs.github.com/en/actions/security-guides/automatic-token-authentication)

**NX Resources**:
- [NX Release documentation](https://nx.dev/nx-api/nx/documents/release)
- [Conventional commits](https://www.conventionalcommits.org/)
- [NX squash merge issue #26241](https://github.com/nrwl/nx/issues/26241)

**Security Best Practices**:
- [GitHub security hardening](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)
- [Token security](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure)

**Automation Tools**:
- [Terraform GitHub Provider](https://registry.terraform.io/providers/integrations/github/latest)
- [GitHub Safe Settings](https://github.com/github/safe-settings)
- [GitHub CLI](https://cli.github.com/)