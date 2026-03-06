# TODO

- Fix API test suite DB setup in `packages/api`.
  - Repro: `pnpm -F @fit/api test`
  - Current failure: `tests/routers/exercise.test.ts`
  - Error: `SQLITE_ERROR: no such table: user`
  - Likely cause: test migrations/setup are not creating the auth `user` table before fixtures run.
