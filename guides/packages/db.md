# db

## Purpose

- Owns the Drizzle client, schema modules, relations, and generated migrations.
- Defines the clearest low-level map of the FIT domain model.

## Key Paths

- `packages/db/src/schema`
- `packages/db/src/migrations`
- `packages/db/src`
- `db`

## Current Shape

- Schema covers auth, organisations, subscriptions, exercise/nutrition content, workouts, templates, menus, and daily logs.
- Repo scripts route DB generation, push, migrate, studio, and local workflows through this package.

## Change Rules

- Keep schema, relations, and migrations synchronized; do not hand-wave one of the three.
- Any DB contract change usually requires coordinated updates in `packages/api` and sometimes `API.md`.
- Prefer additive, reviewable migrations over surprise rewrites of generated artifacts.

