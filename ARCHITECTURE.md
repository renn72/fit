# FIT Monorepo Architecture

## Overview

This repository is a `pnpm` + Turborepo monorepo. The root workspace is named `fit`, and the workspace boundaries are defined in [package.json](/home/renn/projects/fit-mono/package.json) and [pnpm-workspace.yaml](/home/renn/projects/fit-mono/pnpm-workspace.yaml):

- `apps/*` contains deployable applications.
- `packages/*` contains shared libraries and support folders.
- shared dependency versions are centralized via the `catalog` in `pnpm-workspace.yaml`.
- root scripts use `turbo` to fan out tasks such as `dev`, `check-types`, and database commands.

## Source Of Truth

When navigating this repo, the main source directories are:

- `apps/*/src` for web/server/docs/marketing app code
- `apps/native/app` plus native support folders for Expo route-based screens
- `packages/*/src` for shared libraries
- `packages/db/src/schema` and `packages/db/src/migrations` for database structure

Generated or local-only directories exist throughout the repo and are not the architecture source of truth:

- `dist/`
- `node_modules/`
- `.turbo/`
- `.tanstack/`
- `.expo/`
- `.astro/`
- `db/main.db`

## High-Level Layout

```text
fit-mono/
  apps/
    docs/         Astro/Starlight docs site
    marketing/    Astro marketing site
    native/       Expo / React Native client
    server/       Fastify server hosting auth + RPC/OpenAPI
    web/          TanStack Router web app
  packages/
    api/          oRPC procedures, router registry, input/output schemas, tests
    auth/         Better Auth setup and auth-related helpers
    config/       shared config placeholder package
    data/         raw/support datasets (not a runtime package)
    db/           Drizzle client, schema, relations, migrations
    docs/         standalone reference docs/support notes
    env/          typed env contracts for server/web/native
  db/             local database artifacts
  *.md            repo-level operating docs and summaries
```

## Apps

### `apps/web`

Primary admin/product web application.

- Stack: React 19, Vite, TanStack Router, TanStack Query, oRPC client.
- Main source: `apps/web/src`
- Key folders:
  - `routes/`: route files for public, org, and `dictator` areas
  - `components/`: reusable UI and admin screens
  - `utils/`: app wiring such as oRPC client setup
- Role in the system:
  - renders the main org admin UI
  - consumes the shared API contract from `@fit/api`
  - talks to `apps/server` over RPC

### `apps/server`

Backend runtime for the product.

- Stack: Fastify, oRPC server, OpenAPI handler, Better Auth.
- Main source: `apps/server/src`
- Entry point: [apps/server/src/index.ts](/home/renn/projects/fit-mono/apps/server/src/index.ts)
- Responsibilities:
  - mounts RPC endpoints under `/rpc`
  - mounts OpenAPI/reference endpoints under `/api-reference`
  - mounts Better Auth handlers under `/api/auth/*`
  - wires together `@fit/api`, `@fit/auth`, `@fit/db`, and `@fit/env`

### `apps/native`

Expo / React Native client.

- Main route source: `apps/native/app`
- Supporting folders: `components/`, `contexts/`, `lib/`, `utils/`
- Role in the system:
  - mobile client sharing API contracts through `@fit/api`
  - uses Expo Router for navigation
  - uses shared env typing through `@fit/env`

### `apps/docs`

Astro + Starlight documentation site.

- Main source: `apps/docs/src`
- Structure includes `content/docs`, `pages`, and static assets.

### `apps/marketing`

Astro marketing site.

- Main source: `apps/marketing/src`
- Structure includes `pages`, `components`, `layouts`, `styles`, and `data`.

## Shared Packages

### `packages/api`

Shared API contract and business procedure layer.

- Main source: `packages/api/src`
- Important folders:
  - `routers/`: domain routers such as `organisation`, `userMenu`, `workout`, `ai`
  - `schemas/`: Zod-based request/response shapes by domain
- Tests live in `packages/api/tests`
- Used by:
  - `apps/server` for execution
  - `apps/web` and `apps/native` for typed client integration

### `packages/db`

Database access and schema layer.

- Main source: `packages/db/src`
- Important folders:
  - `schema/`: table definitions split by domain
  - `migrations/`: generated Drizzle migrations
- Entry point: [packages/db/src/index.ts](/home/renn/projects/fit-mono/packages/db/src/index.ts)
- Role:
  - creates the Drizzle client
  - composes auth + domain schema into one DB package

### `packages/auth`

Authentication package.

- Main source: `packages/auth/src`
- Entry point: [packages/auth/src/index.ts](/home/renn/projects/fit-mono/packages/auth/src/index.ts)
- Role:
  - configures Better Auth
  - uses `@fit/db` for persistence
  - extends sessions with org/metatag context
  - provides auth handling to `apps/server`

### `packages/env`

Typed environment contracts.

- Main source: `packages/env/src`
- Exports:
  - `@fit/env/server`
  - `@fit/env/web`
  - `@fit/env/native`
- Role:
  - centralizes runtime env validation per platform
  - avoids ad hoc `process.env` usage across apps/packages

### `packages/config`

Minimal shared config package.

- Currently acts as a shared internal dependency anchor for workspace config.

## Support Directories Inside `packages/`

These live under `packages/*` but are not application libraries in the same sense as `api`, `db`, or `env`.

### `packages/data`

Repository data assets.

- Current notable content: `free-exercise-db` with a large exercise JSON dataset and generated `dist/exercises_data.json`
- Used as import/seed/reference material rather than a runtime app package

### `packages/docs`

Loose technical reference material.

- Current content includes `tanstack-form.md`

## Runtime Dependency Flow

The main runtime path is:

```text
apps/web or apps/native
  -> apps/server
  -> packages/api
  -> packages/auth / packages/db / packages/env
  -> database + external services
```

More specifically:

- `apps/web` and `apps/native` are clients.
- `apps/server` is the execution boundary for auth, DB access, and server-side integrations.
- `packages/api` defines the callable procedures and domain contracts.
- `packages/db` owns schema, relations, migrations, and DB client construction.
- `packages/auth` owns Better Auth setup and session enrichment.
- `packages/env` owns environment validation across platforms.

## Monorepo Tooling

### Workspace Management

- `pnpm` manages the workspace.
- `pnpm-workspace.yaml` defines the workspace globs and shared dependency catalog.

### Task Orchestration

- `turbo.json` defines shared task behavior.
- Root commands delegate to Turbo:
  - `pnpm dev`
  - `pnpm check-types`
  - `pnpm db:push`
  - `pnpm db:generate`
  - `pnpm db:migrate`
  - `pnpm db:studio`

### Package Boundaries

- Apps depend on internal packages via `workspace:*`.
- Shared libraries are intentionally split by responsibility:
  - transport/business logic in `@fit/api`
  - persistence in `@fit/db`
  - auth in `@fit/auth`
  - env contracts in `@fit/env`

## Practical Navigation Guide

If you are trying to find something quickly:

- UI route/page behavior: `apps/web/src/routes`
- Web UI components: `apps/web/src/components`
- Mobile screens: `apps/native/app`
- Server entrypoint and transport wiring: `apps/server/src/index.ts`
- API procedures: `packages/api/src/routers`
- API schemas/contracts: `packages/api/src/schemas`
- DB schema and migrations: `packages/db/src/schema`, `packages/db/src/migrations`
- Auth/session behavior: `packages/auth/src`
- Env validation: `packages/env/src`

## Summary

The repo is organized around a clear split:

- `apps/` contains deployable surfaces
- `packages/` contains reusable system layers
- the server is the central execution boundary
- the API, auth, DB, and env packages provide the shared backbone used by both web and native clients
