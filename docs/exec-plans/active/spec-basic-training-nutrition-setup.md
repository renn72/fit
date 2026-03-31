# Exec Plan: Basic Training Nutrition Setup

## Purpose / Big Picture

Deliver a mobile-first login and client-shell pass for the two client apps:

- `apps/training-web`
- `apps/nutrition-web`

After this change, an unauthenticated user lands directly in a login-only flow, account creation is removed from the client surface, branding reads `Forma | Training` or `Forma | Nutrition`, and authenticated users see a simple current-program/current-menu view inside a classic mobile shell with a sticky top header, sticky bottom dock, and a centered account menu for profile, theme, email, and password actions.

## Progress

- [x] (2026-03-31 09:58Z) Create the task scaffolding and confirm baseline validations.
- [ ] Add test-first coverage for the auth flow and mobile shell expectations.
- [ ] Implement the training client updates.
- [ ] Implement the nutrition client updates.
- [ ] Validate, review, document, merge, and archive the spec.

## Surprises & Discoveries

- `docs/PLANS.md` is missing, so this plan is using the required exec-plan sections directly.
- `report/` does not exist yet in this repo.
- `scripts/task-start.sh`, `scripts/task-finish.sh`, and `scripts/task-verify.sh` do not exist in this repo.
- Both client apps already have separate route trees and shells, which means the work can stay app-local without changing shared admin routes.
- Adding app-local Vitest harnesses required a `pnpm install` refresh before the runner could resolve the new test dependencies from each client app.

## Decision Log

- Use app-local Vitest harnesses so the first task-branch commit can be a real `test:` commit that proves client-specific behavior.
- Keep the first red test set focused on three observable gaps per app: root entry redirect, login-only auth panel, and account-first mobile shell controls.

## Outcomes & Retrospective

(fill when complete)

## Context and Orientation

- Repo root: `/home/renn/apps/fit-workspace/fit-mono`
- Training client app: `/home/renn/apps/fit-workspace/fit-mono/apps/training-web`
- Nutrition client app: `/home/renn/apps/fit-workspace/fit-mono/apps/nutrition-web`
- API routers for real user data:
  - `/home/renn/apps/fit-workspace/fit-mono/packages/api/src/routers/user-block.ts`
  - `/home/renn/apps/fit-workspace/fit-mono/packages/api/src/routers/user-menu.ts`
- Current route entrypoints:
  - `/home/renn/apps/fit-workspace/fit-mono/apps/training-web/src/routes/index.tsx`
  - `/home/renn/apps/fit-workspace/fit-mono/apps/training-web/src/routes/auth.tsx`
  - `/home/renn/apps/fit-workspace/fit-mono/apps/nutrition-web/src/routes/index.tsx`
  - `/home/renn/apps/fit-workspace/fit-mono/apps/nutrition-web/src/routes/auth.tsx`
- Current shells:
  - `/home/renn/apps/fit-workspace/fit-mono/apps/training-web/src/components/app-shell.tsx`
  - `/home/renn/apps/fit-workspace/fit-mono/apps/nutrition-web/src/components/app-shell.tsx`
- Current auth panels still expose sign-up tabs:
  - `/home/renn/apps/fit-workspace/fit-mono/apps/training-web/src/components/auth-panel.tsx`
  - `/home/renn/apps/fit-workspace/fit-mono/apps/nutrition-web/src/components/auth-panel.tsx`

Terms:

- "mobile shell" means the app viewport is arranged as a sticky top header, a scrollable center content region, and a sticky bottom dock.
- "current program" means the newest assigned non-template user block returned by `userBlock.getByUser`.
- "current menu" means the newest assigned user menu returned by `userMenu.getByUser`, preferring active non-template rows when present.

## Plan of Work

### Milestone 1

Goal:
- Create the task scaffolding and lock in test-first coverage.

Work:
- Create report and exec-plan files.
- Add a minimal Vitest + Testing Library setup to the two client apps.
- Write tests that fail against the current behavior:
  - root experience prefers the login flow for signed-out users,
  - sign-up UI is absent,
  - the app shell exposes the mobile header/dock account menu affordances.

Result:
- A first `test:` commit with failing or newly meaningful tests and the task plan/report scaffolding.

Proof:
- App-local test commands run and fail for the expected missing behavior before implementation.

### Milestone 2

Goal:
- Implement the training-web mobile-first login and shell.

Work:
- Update routes, auth panel, shell, and overview components.
- Replace FIT branding with `Forma | Training`.
- Fetch and show a simple current training program when available.

Result:
- Training app matches the spec for auth entry, shell layout, and current-program display.

Proof:
- Training-web tests, typecheck, and build all pass.

### Milestone 3

Goal:
- Implement the nutrition-web mobile-first login and shell.

Work:
- Update routes, auth panel, shell, and overview components.
- Replace FIT branding with `Forma | Nutrition`.
- Fetch and show a simple current menu when available.

Result:
- Nutrition app matches the spec for auth entry, shell layout, and current-menu display.

Proof:
- Nutrition-web tests, typecheck, and build all pass.

### Milestone 4

Goal:
- Finish the loop cleanly.

Work:
- Run strict validation.
- Review the diff with the six personas.
- Update route docs if behavior descriptions changed.
- Merge back to `main`, move the spec file to `finished_spec/`, and complete the report entry.

Result:
- The task is merged with preserved history and morning-review context is already written down.

Proof:
- `main` contains the merged commits, the report has finish metadata, and the spec file has moved to `finished_spec/`.

## Concrete Steps

1. `pnpm --filter training-web check-types`
   Expected: exits `0`.
2. `pnpm --filter nutrition-web check-types`
   Expected: exits `0`.
3. `pnpm --filter training-web build`
   Expected: exits `0`.
4. `pnpm --filter nutrition-web build`
   Expected: exits `0`.
5. Add app-local test harnesses and run the new test commands.
   Expected: initial failure that proves the tests catch the missing behavior.
6. Implement training-web and nutrition-web changes.
7. Re-run app-local tests, type checks, and builds.
   Expected: exits `0`.
8. Update `WEBROUTES.md` if route purposes or entry behavior changed materially.
9. Merge back to `main` with preserved history and move the spec file to `finished_spec/`.

## Validation and Acceptance

- Signed-out users open the client app and see login-first UX without any sign-up CTA.
- Signed-in users are redirected into `/app`.
- The training app shows a simple current program summary when data exists and a clear empty state when it does not.
- The nutrition app shows a simple current menu summary when data exists and a clear empty state when it does not.
- Both apps render a sticky header and sticky bottom dock in mobile layout with a centered account menu button.
- The account menu exposes profile, theme, change-email, change-password, and sign-out affordances.

## Idempotence and Recovery

- If test harness setup breaks an app, revert only the harness files in this branch and re-add them incrementally.
- If live API integration for block/menu reads proves unsafe, fall back to empty-state-safe UI with explicit notes in the report rather than fabricating data.
- If route generation becomes stale, rerun the app build to regenerate `routeTree.gen.ts` and confirm type safety before continuing.
