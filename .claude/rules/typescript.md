# TypeScript Code Quality Rules

**MANDATORY**: Always use proper TypeScript typing to avoid runtime errors.

- ❌ NEVER use `any` type (causes type system bypass and runtime errors)
- ✅ Use specific types: `string`, `number`, `object`, `unknown`, etc.
- ✅ Use `Parameters<typeof func>[0]` pattern for library parameter types
- ✅ Use `as const` for literal types instead of `as any`
- ✅ Use proper type assertions: `value as SpecificType` not `value as any`
