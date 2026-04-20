# Exec Plan: Monorepo Dependency Refresh April 2026

## Purpose / Big Picture

Refresh the FIT monorepo dependencies across the deployable apps and shared packages without changing product behavior or crossing into unsupported major-version migrations.

After this change, each workspace in the monorepo should be on the newest practical dependency versions that fit the current codebase, the lockfile should reflect a clean install, and the repo should retain explicit protection for the Drizzle v1 beta line rather than accidentally moving to the mainline release channel.

## Progress

- [ ] Create the planning scaffold, capture the current dependency baseline, and commit the plan.
- [ ] Audit outdated dependencies across the root workspace, each app, and each shared package.
- [ ] Apply safe dependency updates, keeping Drizzle on the v1 beta release line.
- [ ] Validate the affected workspaces, fix any breakages caused by dependency bumps, and update docs if needed.
- [ ] Commit the finished dependency refresh and move this plan to completed if the whole update lands in this session.

## Surprises & Discoveries

- `docs/PLANS.md` is missing in this repo, so this plan follows the required exec-plan sections directly.
- `pnpm-workspace.yaml` uses a shared `catalog:` block, which means many upgrades will be made centrally rather than one package at a time.
- `drizzle-kit` and `drizzle-orm` are intentionally pinned to `1.0.0-beta.15-859cf75`, and that constraint must remain on the beta line.

## Decision Log

- Keep dependency work split into two buckets: shared catalog upgrades first, then workspace-local upgrades that are not centralized in the catalog.
- Treat TanStack and other routing/build tool upgrades as higher risk than patch-level utility updates, so validation must be per-app rather than assuming root success means every app is safe.
- Preserve the existing Drizzle beta strategy unless a newer beta build is available and compatible; do not migrate to the non-beta mainline release.

## Outcomes & Retrospective

(fill when complete)

## Context and Orientation

- Repo root: `/home/renn/apps/fit-workspace/fit-mono`
- Root manifest: `/home/renn/apps/fit-workspace/fit-mono/package.json`
- Shared workspace catalog: `/home/renn/apps/fit-workspace/fit-mono/pnpm-workspace.yaml`
- Lockfile: `/home/renn/apps/fit-workspace/fit-mono/pnpm-lock.yaml`
- Turborepo task graph: `/home/renn/apps/fit-workspace/fit-mono/turbo.json`

Deployable app manifests:

- `/home/renn/apps/fit-workspace/fit-mono/apps/web/package.json`
- `/home/renn/apps/fit-workspace/fit-mono/apps/nutrition-web/package.json`
- `/home/renn/apps/fit-workspace/fit-mono/apps/training-web/package.json`
- `/home/renn/apps/fit-workspace/fit-mono/apps/server/package.json`
- `/home/renn/apps/fit-workspace/fit-mono/apps/native/package.json`
- `/home/renn/apps/fit-workspace/fit-mono/apps/docs/package.json`
- `/home/renn/apps/fit-workspace/fit-mono/apps/marketing/package.json`

Shared package manifests:

- `/home/renn/apps/fit-workspace/fit-mono/packages/api/package.json`
- `/home/renn/apps/fit-workspace/fit-mono/packages/auth/package.json`
- `/home/renn/apps/fit-workspace/fit-mono/packages/components/package.json`
- `/home/renn/apps/fit-workspace/fit-mono/packages/config/package.json`
- `/home/renn/apps/fit-workspace/fit-mono/packages/db/package.json`
- `/home/renn/apps/fit-workspace/fit-mono/packages/env/package.json`

Terms:

- "catalog dependency" means a dependency version controlled by the `catalog:` entries in `pnpm-workspace.yaml`, so changing the catalog changes every workspace that references it.
- "workspace-local dependency" means a version declared directly inside a single workspace `package.json`.
- "safe update" means a version bump that does not require an intentional product-level migration, major architecture shift, or replacement of a library currently in active use.
- "Drizzle beta line" means package versions that remain on the `1.0.0-beta.*` release channel for `drizzle-orm` and `drizzle-kit`.

## Plan of Work

### Milestone 1

Goal:
- Establish the dependency baseline and the operational boundaries for the upgrade.

Work:
- Inspect all workspace manifests and shared catalog versions.
- Record the current git state and confirm the repo is safe to modify.
- Create this exec plan and commit it separately before the version bumps start.

Result:
- A clean baseline with an auditable plan committed in git.

Proof:
- `git status --short` shows only the new plan before the first commit, and the plan commit exists in history.

### Milestone 2

Goal:
- Produce a full outdated inventory across the monorepo.

Work:
- Run `pnpm outdated` at the root and, where useful, filtered per workspace.
- Group upgrades into:
  - shared catalog updates,
  - app-local updates,
  - package-local updates,
  - intentionally deferred updates.
- Check Drizzle versions separately so the work stays on the beta release channel.

Result:
- A concrete list of what can be updated now versus what should be held back.

Proof:
- The commands report version deltas, and the chosen set of upgrades is reflected in the updated plan notes.

### Milestone 3

Goal:
- Apply the selected dependency updates safely.

Work:
- Edit `pnpm-workspace.yaml` for shared catalog bumps.
- Edit workspace `package.json` files for direct dependency bumps not controlled by the catalog.
- Refresh `pnpm-lock.yaml` with `pnpm install`.
- Avoid migrating Drizzle away from beta.

Result:
- Manifests and lockfile are updated consistently across the monorepo.

Proof:
- `git diff --stat` shows the expected manifest and lockfile changes, and `pnpm install` exits successfully.

### Milestone 4

Goal:
- Prove the upgraded dependency set still works for the current codebase.

Work:
- Run targeted validation for each affected workspace using existing scripts such as `build`, `check-types`, and `test`.
- Fix breakages introduced by version bumps when the fix is directly caused by the upgrade.
- Update repo docs only if package boundaries or runtime contracts changed materially as part of the work.

Result:
- The repo is upgraded and still builds or typechecks at the appropriate workspace boundaries.

Proof:
- Validation commands exit successfully, or any pre-existing unrelated failures are clearly separated from upgrade-caused failures.

## Concrete Steps

1. `git status --short`
   Expected: clean worktree before implementation, then only plan-file changes before the first commit.
2. `pnpm outdated -r`
   Expected: a workspace-wide dependency report for direct dependencies.
3. `pnpm view drizzle-orm versions --json | rg '1\\.0\\.0-beta'`
   Expected: beta-channel versions only, used to confirm whether a newer Drizzle beta exists.
4. Update `/home/renn/apps/fit-workspace/fit-mono/pnpm-workspace.yaml` and any affected workspace manifests.
   Expected: selected versions move forward while `drizzle-orm` and `drizzle-kit` remain beta.
5. `pnpm install`
   Expected: lockfile refresh completes successfully.
6. Run validation for affected workspaces.
   Expected: relevant `build`, `check-types`, or `test` commands exit `0`, or unrelated pre-existing failures are documented explicitly.
7. Update this plan with completed timestamps, discoveries, and decisions after each milestone.
8. Commit the dependency refresh with a focused message.

## Validation and Acceptance

- Shared catalog versions are refreshed where compatible with the current codebase.
- Each app in `apps/` is reviewed for direct dependency updates, not just the root catalog.
- `drizzle-orm` and `drizzle-kit` remain on a v1 beta release and do not move to a stable mainline tag.
- The lockfile is regenerated successfully.
- Validation covers the affected web apps, native app shell, server workspace, and shared packages to the extent scripts exist in the repo.
- No API or route-contract docs need changes unless the dependency work forces a structural/runtime change, which is not expected for this task.

## Idempotence and Recovery

- If a version bump breaks a workspace unexpectedly, revert only that dependency change and keep the rest of the upgrade moving.
- If `pnpm install` rewrites more of the lockfile than expected, compare the manifest changes first and regenerate from a clean manifest set before proceeding.
- If an update attempts to pull Drizzle onto the non-beta channel, restore the beta version pins in `/home/renn/apps/fit-workspace/fit-mono/pnpm-workspace.yaml` and rerun `pnpm install`.
- If validation exposes unrelated pre-existing failures, record them in this plan and avoid mixing unrelated fixes into the dependency branch unless they are required to complete the upgrade.
