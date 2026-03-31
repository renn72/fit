# server

## Purpose

- Provides the Fastify runtime boundary for auth, typed RPC, and OpenAPI/reference output.
- Acts as the trust boundary between clients and the shared business layer in `@fit/api`.

## Key Paths

- `apps/server/src/index.ts`
- `apps/server/dist/src`

## Current Shape

- Mounts `/rpc` for oRPC, `/api/auth/*` for Better Auth, and `/api-reference` for OpenAPI output.
- Keeps runtime wiring light; most business logic belongs in `packages/api`, not here.

## Change Rules

- Keep transport/runtime wiring here and move domain behavior into shared packages.
- When mounts, auth forwarding, or API-reference behavior changes, update `API.md` and related docs in the same task.
- Avoid duplicating validation or domain rules already enforced in `packages/api` or `packages/auth`.

