# api

## Purpose

- Owns the shared oRPC router tree, schemas, and direct business logic handlers.
- Serves as the main contract layer between the server runtime and every client.

## Key Paths

- `packages/api/src/index.ts`
- `packages/api/src/context.ts`
- `packages/api/src/routers`
- `packages/api/src/schemas`
- `packages/api/tests`

## Current Shape

- Exposes `publicProcedure` and `protectedProcedure` with auth enforcement and timing middleware.
- Router coverage is summarized in `API.md`; current domains include organisation, user, feature, movement, exercise, ingredient, recipe, workout, warmup, templates, subscription, daily logs, and AI.
- Tests live beside the package and already cover important router regressions.

## Change Rules

- Keep business rules and transport contracts here instead of pushing them up into `apps/server`.
- Update `API.md` whenever router shape, paths, permissions, or behavior notes change.
- Prefer package-level tests for router behavior before changing downstream clients.

