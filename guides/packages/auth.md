# auth

## Purpose

- Configures Better Auth for the FIT stack.
- Enriches session data with organisation and metatag context consumed across the repo.

## Key Paths

- `packages/auth/src/index.ts`
- `packages/auth/src`

## Current Shape

- Wires Better Auth to Drizzle-backed storage in `@fit/db`.
- Adds custom session fields such as `organisationId`, `organisationSlug`, `organisationCreatorId`, and `metaTags`.
- Supplies the auth runtime used by browser and native clients plus `apps/server`.

## Change Rules

- Keep session-shape decisions centralized here so clients do not invent their own auth envelopes.
- Coordinate schema or session-field changes with `packages/api`, `apps/server`, and any client auth helpers.
- Treat auth changes as contract changes; validate both runtime behavior and downstream assumptions.

