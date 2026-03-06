# Daedalus - Project Soul

This file is the stable operating context for future Codex sessions. It should stay short, durable, and focused on how FIT is built. Historical detail belongs in `SESSION_LOG.md`.

Read this alongside:

- `ARCHITECTURE.md` for the current repo map
- `API.md` for router and contract summaries
- `WEBROUTES.md` for the current route map
- `SESSION_LOG.md` for recent changes and milestones

## Mission

- Build FIT as a multi-tenant coaching platform with reusable systems, not one-off screens.
- Prefer patterns that scale across domains: overrides, ordered junctions, deep loading, shared forms, and server-owned integrations.
- Optimize for clarity, speed, and maintainability over cleverness.

## Non-Negotiables

- Use `pnpm`.
- Do not run `build` unless explicitly asked.
- If API contracts or routers change, update `API.md` in the same work session.
- If web routes change, update `WEBROUTES.md` in the same work session.
- Keep `SOUL.md` stable and condensed. Move history into `SESSION_LOG.md`, not here.

## System Shape

- `apps/*` contains deployable surfaces.
- `packages/*` contains shared system layers.
- `apps/web` and `apps/native` are clients.
- `apps/server` is the execution boundary for auth, DB access, and external provider calls.
- `packages/api` owns procedures and contracts.
- `packages/db` owns schema, relations, and migrations.
- `packages/auth` owns Better Auth setup and session enrichment.
- `packages/env` owns typed environment validation.

## Core Product Model

- The product is multi-tenant.
- Shared library data should remain clean and relationally modeled.
- Org-specific edits to shared records should use overrides via `baseId`, not string hacks or dirty naming.
- Base records are effectively templates. Tenant edits should create or update org-specific records.
- Optional context should stay optional. Attach it via nullable foreign keys instead of bloating core entities.

## Data Modeling Rules

- Ordered many-to-many relationships require junction tables with ordering metadata.
- When items live in slots or groups, use dual indexes rather than nested arrays in the database.
- Reordering flows are link-table problems: update parent metadata, remove old links, recreate links in final order.
- Full CRUD matters. If an entity exists in the domain, give it a complete lifecycle API.
- Avoid table-name collisions with Better Auth and other shared schema concerns.

## API And Authorization Rules

- Never trust client claims without server validation.
- Metatag permissions such as `dictator` and `itemUpdater` are the access model.
- Keep response shapes consistent across related endpoints. Normalize derived fields at the API layer, not ad hoc in screens.
- AI and model-provider calls belong on the server.
- Model selection, secrets, retries, and provider-specific behavior are server concerns.
- AI output is untrusted input. Validate with Zod, normalize, and enforce allowed IDs and shapes before touching UI state.

## Data Fetching And Rendering

- High-privilege UI must stay isolated from standard tenant UI.
- Heavy admin tables and grids should use route loaders, prefetching, and `useSuspenseQuery`.
- When browser APIs or virtualization are involved, prefer client rendering with `ssr: false`.
- Use grid views when hierarchy and narrative matter. Use table views when scanning and editing scalar fields.

## Forms And State

- Keep UI state rich for as long as possible. Transform to DB format only at submit boundaries.
- Shared mode-driven forms beat separate create, edit, and template implementations.
- Defaults and numeric precision are contract rules, not cosmetic details.
- Derived nutrition and summary values should be visible at planning surfaces, not buried in deep detail views.
- High-churn inputs should be isolated from heavy form state to avoid full-form rerenders.
- Diff highlighting is valuable in edit flows and should be preserved where it improves confidence.

## UI Conventions

- `ui/` is for base primitives.
- `ui-extended/` is for FIT-specific composed patterns.
- Shadcn and Base UI are the primitive layer.
- TanStack Router search params are the URL-state source of truth, not `nuqs`.
- Phosphor imports must use the `Icon` suffix.
- For drag-and-drop builders, separate the source library from the composed structure.
- Reuse strong visual language across related planners to reduce cognitive load.

## Data Integrity And Testing

- Round nutrition and decimal values consistently across UI defaults, submit handlers, and API writes.
- Prefer relational integrity over UI shortcuts.
- Generators are not demo fluff. They are onboarding tools, stress tests, and contract tests.
- Any new schema flag that affects visibility or behavior must be reflected in generators, queries, and UI filters.

## Documentation Memory

- `ARCHITECTURE.md` explains structure.
- `API.md` tracks router and contract shape.
- `WEBROUTES.md` tracks route structure.
- `SESSION_LOG.md` captures historical milestones and recent implementation detail.
- `SOUL.md` is the compact guide for how future sessions should think about the system.

## Working Style

- Build the next reusable pattern, not just the next screen.
- Prefer systems that can be reused across workouts, nutrition, templates, and future planners.
- Choose clarity over cleverness.
- Keep the database as a living model of the business, not a dumping ground for UI convenience.

I am Daedalus. I build patterns that future work can stand on.
