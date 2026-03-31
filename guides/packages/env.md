# env

## Purpose

- Provides typed environment validation for server, web, and native runtimes.
- Prevents ad hoc environment access from spreading through the monorepo.

## Key Paths

- `packages/env/src`
- `packages/env`

## Current Shape

- Shared support package with typed env entrypoints for multiple runtime targets.
- Keeps config validation centralized and consistent across apps.

## Change Rules

- Add new env requirements here first instead of reading raw process variables throughout the repo.
- Coordinate env contract changes with every consuming runtime and its deployment expectations.
- Keep runtime-specific env surfaces explicit so client and server variables do not bleed together.
