# Atlassian Integration Guide for Claude Code

## Overview
This project has Atlassian (Jira/Confluence) integration set up for project management and documentation. This guide helps Claude Code understand how to use these tools effectively.

## Authentication Setup

### Environment Variables Required

```bash
ATLASSIAN_EMAIL=email
ATLASSIAN_API_TOKEN=token
ATLASSIAN_CLOUD_ID=cloud-id
```

### Atlassian Instance Details
- **Site URL**: https://idance.atlassian.net
- **Cloud ID**: 7361b855-be4d-4989-82f7-2d7df5400662
- **Email**: smm7818@gmail.com

## Available Jira Projects

### SCRUM Project (Key: SCRUM)
- **Project ID**: 10000
- **Main development project for iDance**
- **Issue Types Available**:
  - Task (ID: 10001)
  - Bug (ID: 10002) 
  - Story (ID: 10003)
  - Epic (ID: 10004)
  - Subtask (ID: 10005)

### LEARNJIRA Project (Key: LEARNJIRA)
- **Project ID**: 10001
- **Tutorial/learning project**
- **Issue Types Available**:
  - Task (ID: 10006)
  - Epic (ID: 10007)
  - Subtask (ID: 10008)

## Current Epic Structure (Created)

### Main Epics in SCRUM Project:
1. **SCRUM-1**: iDance Platform Development - Q1 2025 Roadmap (Main Epic)
2. **SCRUM-2**: Frontend Development - User Sites & Backoffice
3. **SCRUM-3**: Mobile App Development - iOS & Android  
4. **SCRUM-4**: Backend Services - CloudFlare Workers
5. **SCRUM-5**: Database & Infrastructure
6. **SCRUM-6**: Shared Packages & Libraries

## How to Use Atlassian Functions

### Essential Functions Available:
```javascript
// Get projects
getVisibleJiraProjects(cloudId)

// Create issues
createJiraIssue(cloudId, projectKey, issueTypeName, summary, description)

// View issues
getJiraIssue(cloudId, issueIdOrKey)
searchJiraIssuesUsingJql(cloudId, jql)

// Update issues
editJiraIssue(cloudId, issueIdOrKey, fields)
transitionJiraIssue(cloudId, issueIdOrKey, transition)
addCommentToJiraIssue(cloudId, issueIdOrKey, commentBody)

// Confluence (if available)
getConfluenceSpaces(cloudId)
createConfluencePage(cloudId, spaceId, title, body)
```

### Common JQL Queries:
```sql
-- All issues in SCRUM project
project = SCRUM

-- All epics
project = SCRUM AND issuetype = Epic

-- Issues assigned to current user
project = SCRUM AND assignee = currentUser()

-- Recent issues
project = SCRUM AND created >= -7d

-- Open issues
project = SCRUM AND status != Done
```

## Project Management Workflow

### Sprint Planning Process:
1. **Review Epics**: Check existing epics (SCRUM-1 through SCRUM-6)
2. **Create Stories**: Break down epics into manageable stories
3. **Estimate Work**: Add story points or time estimates
4. **Assign Priorities**: Set priority levels (High, Medium, Low)
5. **Create Tasks**: Break stories into specific development tasks

### Issue Creation Guidelines:
- **Epics**: High-level features or major components
- **Stories**: User-facing functionality (1-2 weeks of work)
- **Tasks**: Technical implementation work (1-3 days)
- **Bugs**: Issues found during development or testing
- **Subtasks**: Breakdown of larger tasks

### Linking Strategy:
- Link stories to their parent epic
- Link tasks to their parent story
- Reference GitHub commits/PRs in issue comments
- Use issue keys in commit messages (e.g., "SCRUM-123: Add user authentication")

## iDance Project Context

### Technical Architecture:
- **Monorepo**: NX workspace with TypeScript
- **Frontend**: Next.js (user-sites, backoffice), React Native (mobile)
- **Backend**: CloudFlare Workers (microservices)
- **Database**: SurrealDB with migrations
- **Infrastructure**: CloudFlare Pages/Workers, CircleCI, Nx Cloud

### Key Development Areas:
1. **Apps**: backoffice, mobile, user-sites, services
2. **Packages**: auth, types, utils, ui, jarvis-voice
3. **Database**: Schema design and migrations
4. **Infrastructure**: CI/CD, deployment, monitoring

### Current Priorities:
- Complete core platform functionality
- Implement authentication system
- Set up database schema
- Create basic UI components
- Establish CI/CD pipeline

## Troubleshooting

### Common Issues:
1. **401 Unauthorized**: Check environment variables are set correctly
2. **404 Not Found**: Verify cloud ID and project keys
3. **403 Forbidden**: Check API token permissions
4. **Rate Limiting**: Implement delays between API calls

### Testing Connection:
```javascript
// Test basic connection
getVisibleJiraProjects("7361b855-be4d-4989-82f7-2d7df5400662")

// Test issue creation
createJiraIssue(
  "7361b855-be4d-4989-82f7-2d7df5400662",
  "SCRUM", 
  "Task",
  "Test Issue",
  "Testing Atlassian integration"
)
```

## Best Practices

### For Claude Code:
1. **Always use the correct cloud ID**: 7361b855-be4d-4989-82f7-2d7df5400662
2. **Use SCRUM project** for main development work
3. **Create meaningful issue descriptions** with technical details
4. **Link related issues** using Jira issue keys
5. **Update issues** as work progresses
6. **Use JQL searches** to find relevant issues quickly

### Issue Naming Conventions:
- **Epics**: "[Component] - [High-level Goal]"
- **Stories**: "As a [user], I want [functionality] so that [benefit]"
- **Tasks**: "[Action] [Component/Feature]"
- **Bugs**: "[Component] - [Brief description of issue]"

## Integration with Development Workflow

### Commit Message Format:
```
SCRUM-123: Brief description of change

Longer description if needed.
- Specific changes made
- Any breaking changes
- Related issues or dependencies
```

### PR/MR Integration:
- Reference Jira issues in PR descriptions
- Update issue status when PRs are merged
- Link code changes to specific requirements

## Handoff Instructions for Claude Code

When switching to Claude Code for iDance project work:

1. **Read this file first** to understand the Atlassian setup
2. **Test connection** with `getVisibleJiraProjects("7361b855-be4d-4989-82f7-2d7df5400662")`
3. **Review existing epics** (SCRUM-1 through SCRUM-6)
4. **Continue project planning** from where previous sessions left off
5. **Create stories and tasks** under the appropriate epics
6. **Link all work** to Jira issues for tracking

This documentation should help Claude Code understand and effectively use the Atlassian integration for project management.