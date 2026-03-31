# training-web

## Purpose

- Owns the client-facing training browser app.
- Delivers member-facing workout, session, and recovery views using the shared backend contracts.

## Key Paths

- `apps/training-web/src/routes`
- `apps/training-web/src/components`
- `apps/training-web/src/lib`
- `apps/training-web/src/test`
- `apps/training-web/public`

## Current Shape

- React 19 + Vite + TanStack Router + TanStack Query client-only app.
- Shares auth/session patterns with `nutrition-web` while focusing on training plans and recovery flows.
- Recent work aligned login/session handling and visual styling with the current FIT client-app direction.

## Style

- Aim for clear momentum: today’s work, next session, and recovery context should surface quickly.
- Keep the UI lighter and more motivational than admin screens, but still structured enough for repeat daily use.
- Reuse shared FIT visual tokens and avoid one-off styling forks unless the training use case needs them.

## Change Rules

- Keep session access, auth helpers, and oRPC wrappers inside `src/lib`.
- When route behavior or session assumptions change, update the tests in `src/test` or adjacent specs at the same time.
- Preserve symmetry with `nutrition-web` where the two client apps intentionally share infrastructure.

