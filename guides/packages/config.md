# config

## Purpose

- Holds shared TypeScript configuration for the monorepo.
- Keeps compiler defaults consistent across apps and packages.

## Key Paths

- `packages/config`

## Current Shape

- Minimal support package with no business logic.
- Consumed by multiple workspaces to avoid duplicated TS config drift.

## Change Rules

- Treat edits here as cross-cutting and validate every affected workspace.
- Keep this package focused on shared configuration, not runtime helpers.
- Document any breaking compiler-behavior change in the task/report because it affects the full repo.

