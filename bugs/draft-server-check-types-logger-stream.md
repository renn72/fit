# Draft Bug: Repo Typecheck Fails in `logger-stream`

## Observed

- Command: `pnpm check-types`
- Failure location: `apps/server/src/utils/logger-stream.ts`
- Errors seen:
  - `TS6133: 'dbServerLog' is declared but its value is never read.`
  - `TS2307: Cannot find module '@fit/db-server-log' or its corresponding type declarations.`

## Why This Is Separate

- The `spec/basic-training-nutrition-setup` branch does not modify `apps/server/src/utils/logger-stream.ts`.
- The failure blocks repo-wide typecheck validation for unrelated client work.

## Suggested Follow-Up

- Verify whether `@fit/db-server-log` should exist as a workspace package, alias, or generated type target.
- Remove the unused import if the logging path is no longer active.
