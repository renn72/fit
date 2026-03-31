# data

## Purpose

- Stores import and seed datasets used by the repo, especially exercise data.
- Supports generation and admin setup flows rather than acting as a runtime library.

## Key Paths

- `packages/data/free-exercise-db`
- `packages/data/free-exercise-db/exercises`
- `packages/data/free-exercise-db/dist`

## Current Shape

- Main known asset is the free exercise database used for import/generation workflows.
- Best treated as source material for admin tooling, not as a place for product logic.

## Change Rules

- Keep dataset provenance and shape obvious; avoid silent data rewrites.
- Coordinate format changes with any generator or import code that consumes these files.
- Treat large data additions as operational changes and keep them reviewable.

