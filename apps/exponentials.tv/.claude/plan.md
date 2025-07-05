# Exponentials.tv MVP Implementation Plan

## Overview
Building a trading platform with 2 sites sharing authentication:
- **Public Site**: `exponentials.tv` - Trading content + user authentication  
- **Admin Site**: `admin.exponentials.tv` - Admin interface for user/content management
- **Shared Database**: SurrealDB with authentication system

## Architecture Decision
```
apps/exponentials.tv/
├── .claude/              # Planning documents (this file)
├── db/                   # Shared SurrealDB migrations
│   ├── project.json     # name: "exponentials.tv/db"
│   ├── config.json      # Module configuration
│   └── 010_auth/        # Authentication module
├── frontend/             # Public website (Next.js)
│   ├── project.json     # name: "exponentials.tv/frontend"
│   ├── wrangler.toml    # Cloudflare Pages config
│   └── src/             # Next.js application
└── admin/                # Admin website (Next.js)
    ├── project.json     # name: "exponentials.tv/admin"
    ├── wrangler.toml    # Cloudflare Pages config
    └── src/             # Admin Next.js application
```

## Task Breakdown

### Phase 1: Foundation Setup
- [ ] **Task 1.1**: Create directory structure with project.json files
- [ ] **Task 1.2**: Initialize shared database (`nx g @deepbrainspace/nx-surrealdb:init apps/exponentials.tv/db --name="exponentials.tv/db"`)
- [ ] **Task 1.3**: Verify SurrealDB environment variables in root .env file

### Phase 2: Database Layer
- [ ] **Task 2.1**: Configure 010_auth module (customize users, roles, sessions tables)
- [ ] **Task 2.2**: Test database authentication operations (`nx run exponentials.tv/db:migrate`)

### Phase 3: Public Site (exponentials.tv)
- [ ] **Task 3.1**: Setup Next.js structure with NX integration
- [ ] **Task 3.2**: Create trading content pages (migrate from docs/trading/)
- [ ] **Task 3.3**: Implement login/signup flow with SurrealDB authentication

### Phase 4: Admin Site (admin.exponentials.tv)
- [ ] **Task 4.1**: Setup separate Next.js admin application
- [ ] **Task 4.2**: Configure admin authentication (same database, different UI)
- [ ] **Task 4.3**: Create basic admin interface (user management, content moderation)

### Phase 5: Deployment Infrastructure
- [ ] **Task 5.1**: Configure NX orchestration (`nx run-many --target=deploy --projects="exponentials.tv/*"`)
- [ ] **Task 5.2**: Setup Cloudflare Pages deployments for both sites
- [ ] **Task 5.3**: Test deployment pipeline end-to-end

### Phase 6: Documentation
- [ ] **Task 6.1**: Update apps/README.md with exponentials.tv structure
- [ ] **Task 6.2**: Document authentication flow and deployment process

**Total: 17 tasks** across 6 phases for MVP with shared authentication infrastructure.

## Key Commands
```bash
# Database operations
nx run exponentials.tv/db:migrate
nx run exponentials.tv/db:status

# Development
nx run exponentials.tv/frontend:dev
nx run exponentials.tv/admin:dev

# Deployment  
nx run exponentials.tv/frontend:deploy
nx run exponentials.tv/admin:deploy
nx run-many --target=deploy --projects="exponentials.tv/*"
```

## Dependencies & Prerequisites
1. **nx-surrealdb package** v0.3.4 (install globally: `nx add @deepbrainspace/nx-surrealdb --global`)
2. **SurrealDB instance** running locally or cloud
3. **Environment variables** in root .env file (shared across goodiebag apps)
4. **Cloudflare account** for Pages deployments

## Environment Strategy
- **Current**: Use shared `.env` file at repository root for all SurrealDB connections
- **Future**: When adding more apps, can optionally add app-specific `.env` files that override global settings
- **Benefits**: Single database instance, shared authentication, easier development

## Success Criteria
- [ ] Two independent websites deployed on Cloudflare Pages
- [ ] Shared authentication system working across both sites
- [ ] Public site displaying trading content with user registration
- [ ] Admin site providing user and content management capabilities
- [ ] NX orchestration allowing easy development and deployment

## Notes
- Database schema focuses on authentication only (no trading platform data yet)
- Backend API skipped for MVP (direct database connections from frontend)
- Both sites are static/SSG with client-side authentication
- Admin site requires additional role-based access controls