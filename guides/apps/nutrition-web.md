# nutrition-web

## Purpose

- Owns the client-facing nutrition browser app.
- Delivers member-facing nutrition views on top of shared auth and oRPC contracts.

## Key Paths

- `apps/nutrition-web/src/routes`
- `apps/nutrition-web/src/components`
- `apps/nutrition-web/src/lib`
- `apps/nutrition-web/src/test`
- `apps/nutrition-web/public`

## Current Shape

- React 19 + Vite + TanStack Router + TanStack Query client-only app.
- Uses browser auth client helpers and shared UI primitives from `@fit/components`.
- Recent work tightened login/session handling and upgraded visual styling to match the FIT brand direction.

## Style

- Keep the surface calm, legible, and mobile-biased; nutrition views should feel guided rather than administrative.
- Reuse shared FIT tokens and components first, then add local styling only where the nutrition experience genuinely needs it.
- Make progress, summaries, and meal structure obvious at a glance.

## Change Rules

- Keep session/auth helpers in `src/lib` and route concerns in `src/routes`.
- When this app’s shell, routes, or auth behavior change, mirror the update in tests and any shared docs that describe client apps.
- Avoid drifting from shared UI tokens unless the change is clearly nutrition-specific and intentional.

