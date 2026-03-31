# components

## Purpose

- Provides the shared web UI package for primitives, theme CSS, and common interaction patterns.
- Anchors the visual system reused by the browser apps.

## Key Paths

- `packages/components/src/components`
- `packages/components/src/hooks`
- `packages/components/src/lib`
- `packages/components/src/styles.css`

## Current Shape

- Contains shadcn/Base UI primitives plus shared FIT styling tokens and helpers.
- Acts as the main reuse layer for `apps/web`, `apps/nutrition-web`, and `apps/training-web`.

## Style

- Centralize tokens, typography, and shared primitives here before styling directly in product apps.
- Keep components flexible enough for admin and client surfaces without collapsing into lowest-common-denominator visuals.
- Favor accessible defaults, predictable states, and clear composition boundaries.

## Change Rules

- Make cross-app styling changes here when they are truly shared.
- Avoid packaging app-specific business behavior into shared UI primitives.
- When tokens or primitives change, verify the downstream browser apps that consume them.

