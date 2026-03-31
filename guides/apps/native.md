# native

## Purpose

- Hosts the Expo mobile client shell.
- Reuses the shared auth and API contracts while presenting mobile-specific navigation and session handling.

## Key Paths

- `apps/native/app`
- `apps/native/app/(drawer)`
- `apps/native/components`
- `apps/native/lib`
- `apps/native/utils`
- `apps/native/contexts`

## Current Shape

- Small authenticated shell rather than a feature-parity replacement for `apps/web`.
- Uses Expo Router and the same backend contracts as the browser clients.

## Style

- Favor native-feeling navigation, generous touch targets, and low-friction session recovery.
- Keep screens focused; mobile workflows should trim chrome rather than re-create desktop density.
- Preserve platform conventions before inventing custom gestures or layout systems.

## Change Rules

- Keep auth, API access, and route-shell concerns in native-specific boundaries under `lib`, `utils`, and `app`.
- Reuse shared domain contracts instead of forking data shapes in the mobile client.
- Treat parity work explicitly; do not assume every web feature belongs in native immediately.

