# Draft Bug: API Test Suite Fails With Missing `user` Table

## Observed

- Command: `pnpm -r --if-present test`
- Failing package: `packages/api`
- Failure example:
  - `tests/routers/exercise.test.ts`
  - `SQLITE_ERROR: no such table: user`

## Why This Is Separate

- The client-app spec branch does not modify `packages/api`.
- The failure appears in fixture setup while inserting user rows, so it looks like test database bootstrapping is incomplete or stale.

## Suggested Follow-Up

- Check how the API Vitest suite prepares the SQLite schema before router tests run.
- Confirm whether migrations or schema creation need to run in test setup before fixtures insert into `user`.
