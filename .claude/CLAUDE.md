# CLAUDE.md

# conversations

- dont be biased towards user's messages, the user can be wrong, you need to do
  thorough research and provide the best answer.
- back up your answers with research, facts, and data.
- DO NOT make assumptions.

## Environment

- we are running on WSL, so avoid trying to open GUI browsers. Use headless
  browsers for any browsing needs.

## Package Manager Preference

**IMPORTANT**: Always use NX commands first, then pnpm. NEVER use npm.

- ✅ `nx build`, `nx test`, `nx lint`, `nx release`
- ✅ `pnpm install`
- ❌ `npm install`, `npm publish` (NEVER use)

## NX Command Preference

**PREFER AFFECTED OPERATIONS**: Use `nx affected` for efficiency in CI/CD and
development.

- ✅ `nx affected --target=build` (only builds changed packages)
- ✅ `nx affected --target=test` (only tests affected packages)
- ✅ `nx affected --target=lint` (only lints changed code)
- ⚠️ `nx run-many --target=build --all` (builds everything, slower)
- ❌ Individual package commands (defeats monorepo benefits)

## Critical Rule: NEVER Skip Tests or Lints

**MANDATORY**: All tests and lints MUST pass before any publish or release.

- ❌ NEVER skip tests or lints
- ❌ NEVER publish with failing tests
- ✅ Always fix the root cause of test/lint failures

## Task Lists:

- Wheen user asks to release a code use the tasklist outlined in
  `.claude/tasklist/release.md`
- When user asks to implement a code use the tasklist outlined in
  `.claude/tasklist/user_approval.md` after each step of the implementation.
- When asked to do something, create a plan in `.claude/plans/` with the current
  date and time, and outline the steps to be taken. Use the plan as a reference
  for the tasklist in `.claude/tasklist/user_approval.md`.

## Architecture Rules

**Repository Pattern**: MigrationService → MigrationRepository → Database

- NEVER bypass repository layer
- Keep business logic in Service, data operations in Repository
- Always rebuild after changes: eg `nx build nx-surrealdb`

## Rules:

- Rust: If the code involves Rust packages, follow the rules outlined in
  `.claude/rules/rust.md`.
- Git: If the code involves git operations, follow the rules outlined in
  `.claude/rules/git.md`.
- TypeScript: If the code involves TypeScript, follow the rules outlined in
  `.claude/rules/typescript.md`.
