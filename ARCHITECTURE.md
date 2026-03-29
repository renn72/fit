# FIT Architecture Document

| Field | Value |
|-------|-------|
| Author | Codex architecture pass |
| Last Updated | 2026-03-30 |
| Status | Current |

FIT is a `pnpm` + Turborepo monorepo for a multi-tenant coaching platform. The operational center of the system is `apps/server`: both clients talk to it, it owns auth and DB access, and the shared packages under `packages/` define the contract, persistence, and environment boundaries.

Read this with:

- `SOUL.md` for repo intent and operating rules
- `API.md` for router and endpoint detail
- `WEBROUTES.md` for the web route map

## High-Level Architecture

```text
                        Static / separate surfaces
                 +----------------+  +-------------------+
                 | apps/docs      |  | apps/marketing    |
                 | Astro/Starlight|  | Astro site        |
                 +----------------+  +-------------------+

 Browser admin users                         Mobile users
        |                                         |
        v                                         v
 +-------------------+                   +-------------------+
 | apps/web          |                   | apps/native       |
 | React + TanStack  |                   | Expo Router       |
 | Router + Query    |                   | + Query           |
 +---------+---------+                   +---------+---------+
           \                                       /
            \                                     /
             v                                   v
              +---------------------------------+
              | apps/server                     |
              | Fastify host + oRPC + OpenAPI   |
              | /rpc /api/auth/* /api-reference |
              +----------------+----------------+
                               |
                               v
              +---------------------------------+
              | packages/api                    |
              | Router modules + Zod contracts  |
              | Business logic in handlers      |
              +-----------+-----------+---------+
                          |           |
                          |           +-----------------------------+
                          v                                         v
              +-------------------+                     +----------------------+
              | packages/auth     |                     | External providers   |
              | Better Auth       |                     | Resend, Zen AI       |
              | session enrichment|                     +----------------------+
              +---------+---------+
                        |
                        v
              +-------------------+
              | packages/db       |
              | Drizzle + libsql  |
              | schema + relations|
              +---------+---------+
                        |
                        v
                 Turso / libsql DB
```

## Monorepo Shape

```text
fit-mono/
  apps/
    web/          Main browser admin/product app
    server/       Runtime boundary for auth, RPC, OpenAPI, DB access
    native/       Expo mobile client shell
    docs/         Starlight docs site
    marketing/    Astro marketing site
  packages/
    api/          Shared oRPC router tree and Zod contracts
    auth/         Better Auth configuration and email hooks
    db/           Drizzle client, schema modules, relations, migrations
    env/          Typed env validation per runtime
    config/       Shared TS config base
    data/         Import/seed datasets, especially exercise data
    docs/         Loose technical reference notes
  db/             Local DB artifacts, not architecture source of truth
  SOUL.md         Stable operating guide
  API.md          Router and contract summary
  WEBROUTES.md    Web route summary
  ARCHITECTURE.md This file
```

## What Each Workspace Owns

### Deployable apps

- `apps/web`
  - The primary product UI.
  - Stack: React 19, Vite, TanStack Router, TanStack Query, TanStack Start, Tailwind, oRPC client.
  - Main source: `apps/web/src/routes`, `apps/web/src/components`, `apps/web/src/utils`.
  - It is the most complete client in the repo.

- `apps/server`
  - The trust boundary.
  - Stack: Fastify, `@orpc/server`, `@orpc/openapi`, Better Auth.
  - Main source: `apps/server/src/index.ts`.
  - Mounts:
    - `/rpc` for typed RPC
    - `/api/auth/*` for Better Auth
    - `/api-reference` for OpenAPI/reference output

- `apps/native`
  - Expo client using the same auth and API contracts as web.
  - Main source: `apps/native/app`, `apps/native/lib`, `apps/native/utils`.
  - Current state is a small authenticated shell, not feature-parity with `apps/web`.

- `apps/docs`
  - Astro + Starlight docs site.
  - Current content is focused on user-menu workflows.
  - Web forms deep-link into this site via `apps/web/src/utils/docs.ts`.

- `apps/marketing`
  - Standalone Astro marketing site.
  - Not part of the authenticated product runtime.

### Shared packages

- `packages/api`
  - Shared business layer and transport contract.
  - `src/routers/` contains the domain handlers.
  - `src/schemas/` contains Zod input/output contracts.
  - There is no separate service layer below the routers; handlers talk to `@fit/db` directly.

- `packages/auth`
  - Better Auth setup, Drizzle adapter wiring, email verification hooks, and custom session enrichment.
  - Adds org and metatag context to the session user object.

- `packages/db`
  - Drizzle client creation, schema modules, relation graph, and generated migrations.
  - The schema files are the clearest map of the product domain.

- `packages/env`
  - Typed env validation for server, web, and native.
  - Prevents ad hoc env access from spreading through the repo.

- `packages/config`
  - Shared TS config base package.
  - No business logic.

### Support folders under `packages/`

- `packages/data`
  - Data assets, especially `free-exercise-db`.
  - Used by admin setup/import flows, not as a runtime library.

- `packages/docs`
  - Ad hoc technical notes such as `drizzle.md` and `tanstack-form.md`.
  - Helpful reference material, not a runtime dependency boundary.

## Runtime Flow

### 1. Auth and session flow

1. `packages/auth/src/index.ts` configures Better Auth with:
   - a Drizzle adapter over the auth tables in `@fit/db/schema/auth`
   - email/password auth
   - email verification via Resend
   - `expo()` and `admin()` plugins
   - `customSession(...)` to add:
     - `metaTags`
     - `organisationId`
     - `organisationSlug`
     - `organisationCreatorId`
2. `apps/server/src/index.ts` forwards `/api/auth/*` to `auth.handler(...)`.
3. `packages/api/src/context.ts` resolves the current session with `auth.api.getSession(...)`.
4. `packages/api/src/index.ts` exposes:
   - `publicProcedure`
   - `protectedProcedure` with auth enforcement and timing logging
5. Clients consume auth differently:
   - `apps/web/src/lib/auth-client.ts` uses `better-auth/react`
   - `apps/native/lib/auth-client.ts` uses `@better-auth/expo/client`

### 2. Typed RPC flow

1. `packages/api/src/routers/index.ts` builds `appRouter`.
2. `apps/server/src/index.ts` mounts `RPCHandler(appRouter)` under `/rpc`.
3. `apps/web/src/utils/orpc.ts` and `apps/native/utils/orpc.ts` build typed oRPC clients.
4. Both clients wrap the oRPC client with TanStack Query helpers.
5. Route loaders and components call `orpc.<domain>.<procedure>.queryOptions()` or mutation helpers directly.

### 3. OpenAPI flow

1. The same `appRouter` is also mounted through `OpenAPIHandler`.
2. `apps/server` exposes that under `/api-reference`.
3. There is one shared source of truth for both RPC and reference generation.

### 4. Persistence flow

1. `packages/db/src/schema/*.ts` defines tables by domain.
2. `packages/db/src/relations.ts` defines the cross-table relation graph.
3. `packages/db/src/index.ts` creates the libsql client and Drizzle instance.
4. Router handlers in `packages/api` query tables directly and use transactions for multi-entity writes.

## Core Product Domains

The domain model is split cleanly in the database and mirrored in the API routers.

| Domain | DB modules | API routers | Notes |
|--------|------------|-------------|-------|
| Auth and tenant access | `auth.ts`, `org.ts` | `organisation`, `user`, `subscription`, `feature` | Covers users, organisations, plans, subscriptions, plan codes, app feature flags |
| Movement library | `movement.ts` | `movement` | Supports base records plus org overrides through `baseId` |
| Ingredient library | `ingredient.ts` | `ingredient` | Same base/override pattern, plus precision handling |
| Recipes | `recipe.ts` | `recipe` | Recipes are composed from `recipe_to_ingredient` links |
| Exercises and supersets | `exercise.ts` | `exercise` | Supersets are stored as exercises plus `super_set_to_exercise` ordered links |
| Warmups | `warmup.ts` | `warmup` | Warmups belong to warmup groups |
| Workouts | `workout.ts` | `workout` | Workouts reference warmup groups and ordered exercise/superset links |
| Dedicated block-template tables | `block-template.ts` | `blockTemplate` | Still present in DB/API, but not the current web template CRUD path |
| Dedicated menu-template tables | `menu-template.ts` | `menuTemplate` | Legacy template storage kept for backward compatibility |
| User training plans | `user-block.ts` | `userBlock` | User-specific copies of workouts, warmups, and exercises; `isTemplate` currently powers the web block-template UI |
| User nutrition plans | `user-menu.ts` | `userMenu` | User-specific meals, recipes, ingredients; `isTemplate` currently powers the web menu-template UI |
| Admin setup / generators | uses many tables | `adminSetup` | Imports datasets and generates sample org data |
| AI-assisted authoring | uses recipe/menu/library tables | `ai` | AI updates form state for recipes and user menus |
| Daily tracking | `daily-log.ts` | none yet | Schema exists; no current router or web route surface |

## Design Patterns That Matter

### Multi-tenant override pattern

Base libraries are not overwritten in place. The important examples are:

- `movement.isBase` + `movement.baseId`
- `ingredient.isBase` + `ingredient.baseId`

Org-scoped reads merge:

- org-owned records
- base records not yet overridden by that org

This is one of the main architecture rules in FIT. New shared-library domains should follow this pattern instead of mutating shared rows directly.

### Ordered composition via link tables

The repo consistently models ordered many-to-many content with explicit link tables, not arrays embedded in parent rows:

- `super_set_to_exercise`
- `workout_to_exercise`
- `workout_to_superset`
- `block_template_to_workout`
- `menu_template_to_recipe`

User-assignment tables also store ordering metadata directly:

- `dayIndex`
- `workoutIndex`
- `warmupIndex`
- `exerciseIndex`
- `mealIndex`
- `recipeIndex`

### Snapshot copies for user plans

User-assigned plans are not thin references back to templates. The system copies data into user-owned tables:

- `user_block` -> `user_workout` -> `user_warmup` / `user_exercise`
- `user_menu` -> `user_meal` / `user_recipe` / `user_ingredient`

That means user plans can diverge from their source templates without mutating the library objects.

### Server-owned integration boundary

External side effects live on the server side:

- Resend email in `packages/auth`
- AI provider calls in `packages/api/src/routers/ai.ts`

Clients never call those providers directly.

### Authorization model

The permission model is mostly metatag-driven:

- `dictator` for global admin powers
- `itemUpdater` for content mutation powers

Many org-scoped handlers also compare `organisationId` from the request with `organisationId` on the session user.

### AI gating model

AI access is not a single boolean.

Effective AI access is the intersection of:

- app-level feature toggles from `features`
- organisation `metaTags`
- current plan `metaTags`

The `feature` router computes the final effective result, and the `ai` router enforces it.

## Web App Architecture

`apps/web` is the main client and the best place to understand the active product surface.

### Bootstrap and routing

- `apps/web/src/router.tsx` creates the TanStack Router instance.
- `apps/web/src/routes/__root.tsx`:
  - ensures session data is in the query cache
  - mounts theme, tooltip, toast, and devtools providers
  - wraps the app with `NuqsAdapter`
- Route areas are split into:
  - public/auth routes like `/`, `/login`, `/signin`, `/onboard`
  - `/dictator/*` for global admin
  - `/$orgSlug/*` for organisation-scoped admin

### Layout shells

- `apps/web/src/routes/dictator.tsx`
  - dictator-only shell and sidebar
- `apps/web/src/routes/$orgSlug.tsx`
  - org shell
  - carries the selected `user` search param across child routes
  - sidebar user selection is a cross-route concern

### Feature placement

Route files are mostly thin wrappers. The real feature code lives under:

```text
apps/web/src/components/admin/
  movement/
  exercise/
  ingredient/
  recipe/
  warmup/
  workout/
  block-template/
  menu-template/
  user-block-form/
  user-blocks/
  user-menu-form/
  user-menu-create/
  user-menus/
```

That mirror between route domain and component domain is intentional and important.

One naming trap matters here:

- the `/block-templates*` web routes are backed by `orpc.userBlock.*` template APIs
- the `/menu-templates*` web routes are backed by `orpc.userMenu.*` template APIs
- the dedicated `blockTemplate` and `menuTemplate` routers exist in `packages/api`, but they are not the current web CRUD path

### Current template CRUD paths

For the active browser UI, template CRUD currently means:

- block templates
  - list: `userBlock.getTemplatesOrg`
  - read/edit bootstrap: `userBlock.get`
  - create: `userBlock.batchCreate`
  - update: `userBlock.batchUpdate`
  - delete: `userBlock.delete`
  - persisted graph: `user_block` -> `user_workout` -> `user_warmup` / `user_exercise`
- menu templates
  - list: `userMenu.getTemplatesOrg`
  - read/edit bootstrap: `userMenu.get`
  - create: `userMenu.batchCreate`
  - update: `userMenu.batchUpdate`
  - delete: `userMenu.delete`
  - persisted graph: `user_menu` -> `user_meal` / `user_recipe` / `user_ingredient`

These template records still live in user-owned tables. Organisation-wide visibility comes from the router filtering template owners to users in the same organisation.

### Shared UI layers

- `components/ui/`
  - base primitives
- `components/ui-extended/`
  - FIT-specific composed controls
- `components/data-grid/` and `components/data-table/`
  - shared heavy table/grid infrastructure
- `components/admin-sidebar/` and `components/dictator-sidebar/`
  - the two app shells

### Rendering style

Most admin routes:

- prefetch data in route `loader`s
- set `ssr: false`
- render interactive client-heavy forms and builders

That is why route files often look small while the domain form/page components are large.

### Docs integration

Several admin forms link to the docs site through:

- `apps/web/src/components/docs-link.tsx`
- `apps/web/src/utils/docs.ts`

If docs URLs or slugs change, update both the docs app and the web helper.

## Native App Architecture

`apps/native` is structurally aligned with the shared backend contracts but is much thinner than the web app.

- Root layout: `apps/native/app/_layout.tsx`
  - `QueryClientProvider`
  - gesture handler
  - keyboard provider
  - HeroUI Native provider
  - app theme provider
- Navigation:
  - root stack
  - drawer layout
  - nested tabs
- Shared backend usage:
  - `apps/native/lib/auth-client.ts`
  - `apps/native/utils/orpc.ts`
- Auth storage:
  - `SecureStore` on native platforms
  - `AsyncStorage` on web

Current reality:

- the mobile app is mostly a starter shell with auth and health/private-data checks
- it is not where the main admin feature work currently lives

## API Layer Architecture

`packages/api` is a large shared package with two main responsibilities:

1. define transport contracts in `src/schemas/*.ts`
2. implement domain behavior in `src/routers/*.ts`

Current router modules:

- `organisation`
- `user`
- `subscription`
- `feature`
- `movement`
- `ingredient`
- `recipe`
- `exercise`
- `warmup`
- `workout`
- `blockTemplate`
- `menuTemplate`
- `userBlock`
- `userMenu`
- `adminSetup`
- `ai`
- plus app-level health/private procedures in `routers/index.ts`

Important architectural fact:

- the routers are not thin controller wrappers over a hidden services layer
- the routers themselves contain most of the business logic, authorization checks, deep reads, and transactional writes
- procedure-level authorization rules are also defined inline in those router files; there is no separate centralized ACL module

This matters when tracing behavior. If you want to know how something works, start in the router file, not in a nonexistent `services/` folder.

## Database Architecture

### Schema layout

Each domain lives in its own schema file under `packages/db/src/schema/`.

Important files:

- `auth.ts`
- `org.ts`
- `movement.ts`
- `ingredient.ts`
- `recipe.ts`
- `exercise.ts`
- `warmup.ts`
- `workout.ts`
- `block-template.ts`
- `menu-template.ts`
- `user-block.ts`
- `user-menu.ts`
- `daily-log.ts`

### Relation graph

`packages/db/src/relations.ts` is the central relation map across all domains. For first-pass understanding, it is one of the highest-value files in the repo.

### Client creation

`packages/db/src/index.ts`:

- loads server env
- creates the libsql client
- creates the Drizzle DB instance

### Migrations

- live in `packages/db/src/migrations/`
- are generated by Drizzle
- `packages/db/drizzle.config.ts` points at `./src/schema` and reads env from `../../apps/server/.env`

### Contributor rule

When adding a new persisted domain or table family, update all of these:

1. `packages/db/src/schema/...`
2. `packages/db/src/relations.ts`
3. `packages/db/src/index.ts` schema aggregation
4. generated migrations
5. any `packages/api` schemas and routers that expose the new data

Missing one of these is a common source of confusion.

## Tooling and Test Architecture

### Workspace tooling

- package manager: `pnpm`
- task runner: `turbo`
- shared TS config: `packages/config/tsconfig.base.json`

Common root scripts:

- `pnpm dev`
- `pnpm check-types`
- `pnpm db:push`
- `pnpm db:generate`
- `pnpm db:migrate`
- `pnpm db:studio`

### API tests

The explicit automated test harness currently lives in `packages/api/tests`.

Key traits:

- Vitest
- in-memory SQLite/libsql test DB
- migrations applied in tests
- `@fit/db` is aliased to a test mock

Current visible coverage is router-oriented and includes an exercise router suite plus reusable fixtures/helpers. There is not an equivalent broad test harness in the web or native app yet.

Current practical state:

- `apps/web` has Testing Library dependencies in `package.json`, but no committed broad component test suite surfaced in this scan
- `apps/native` does not currently show a parallel test harness

## How To Navigate This Repo

If you need to find something quickly:

- Web route ownership: `apps/web/src/routes`
- Web feature implementation: `apps/web/src/components/admin/<domain>`
- Web app shell and typed clients: `apps/web/src/router.tsx`, `apps/web/src/utils/orpc.ts`
- Mobile shell and API/auth wiring: `apps/native/app`, `apps/native/lib`, `apps/native/utils`
- Server entrypoint and transport wiring: `apps/server/src/index.ts`
- Auth/session enrichment: `packages/auth/src/index.ts`
- API contracts: `packages/api/src/schemas`
- API behavior: `packages/api/src/routers`
- DB schema and relations: `packages/db/src/schema`, `packages/db/src/relations.ts`
- DB migrations: `packages/db/src/migrations`
- Env definitions: `packages/env/src`
- User-facing docs content: `apps/docs/src/content/docs`
- Imported exercise dataset: `packages/data/free-exercise-db`

## Typical Change Path

For a normal product feature, the path is usually:

```text
DB schema
  -> DB relations + migration
  -> API Zod schema
  -> API router handler
  -> web route loader
  -> web domain component/form/page
  -> docs update if user-facing workflow changed
```

If the change touches auth or external providers, it also flows through `packages/auth` or a server-side router in `packages/api`.

## Files And Directories That Are Not Source Of Truth

These exist in the repo but should not be treated as architecture-defining sources:

- `dist/`
- `node_modules/`
- `.turbo/`
- `.tanstack/`
- `.expo/`
- `.astro/`
- `apps/web/src/routeTree.gen.ts`
- `packages/data/free-exercise-db/dist/`
- `db/main.db`

## Current Caveats

- `menu_template*` is marked deprecated in schema comments. For current web work, prefer the `user_menu.is_template` path unless you are intentionally maintaining the legacy tables or router.
- Block planning also has two concepts in circulation:
  - dedicated `block_template` tables/router
  - `user_block.is_template`
  The current web `/block-templates*` screens use the `userBlock` template path.
- `daily_log*` tables exist only in the DB layer as of this scan. No current API router, web route, or native surface references them.
- `apps/native` is structurally real but product-light compared with `apps/web`.
- `apps/docs` is focused on user-menu guidance, not full platform documentation.

## Bottom Line

FIT is organized around a server-centered, typed-contract architecture:

- clients are thin and typed
- the server is the trust boundary
- routers in `packages/api` contain most business logic
- the database schema is the real domain map
- multi-tenant overrides, ordered link tables, and user-specific snapshot copies are the core modeling patterns

If a future LLM needs to understand the repo fast, start with:

1. `packages/db/src/schema`
2. `packages/api/src/routers`
3. `apps/web/src/routes`
4. `apps/web/src/components/admin`

That is where most of the real product architecture lives.
