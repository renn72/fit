# web

## Purpose

- Owns the primary admin/product-management browser app.
- Hosts dictator tools, organisation admin flows, and the main CRUD interfaces for coaching data.

## Key Paths

- `apps/web/src/routes`
- `apps/web/src/components`
- `apps/web/src/utils`
- `apps/web/src/lib`
- `apps/web/src/router.tsx`
- `apps/web/public`

## Current Shape

- React 19 + TanStack Start + TanStack Router + TanStack Query admin app.
- Uses the shared oRPC contract to manage organisations, plans, features, movements, ingredients, workouts, menus, and related tooling.
- `WEBROUTES.md` is the current route map and should stay in sync with this surface.

## Style

- Optimize for fast operator throughput: explicit controls, dense-but-readable tables, and dependable navigation state.
- Keep the visual system aligned with `@fit/components` instead of ad hoc route-level styling.
- Dictator/admin surfaces should feel operational and trustworthy, not ornamental.

## Change Rules

- Update `WEBROUTES.md` whenever route structure, guards, or redirects change.
- If a web change introduces or changes RPC contracts, update `API.md` in the same task.
- Prefer route-local loader/query patterns over custom fetching or duplicated state machinery.

