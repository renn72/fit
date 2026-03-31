# Web Route Summary

This document summarizes the TanStack Router setups across FIT browser apps:
- `apps/web` for the admin/product-management surface
- `apps/nutrition-web` for the client-facing nutrition surface
- `apps/training-web` for the client-facing training surface

The admin app breakdown comes first, followed by the two client-only Vite apps.

## Router Bootstrap

- File: `apps/web/src/router.tsx`
- Creates the TanStack router with:
  - `routeTree` from `apps/web/src/routeTree.gen.ts`
  - Router context: `{ orpc, queryClient }`
  - `scrollRestoration: true`
  - Global pending UI: `<Loader />`
  - Global not-found UI: `Not Found`
  - Global React Query provider wrapper (`QueryClientProvider`)

## Root Route

### `__root` (layout root)
- File: `apps/web/src/routes/__root.tsx`
- Purpose:
  - Global HTML shell, theme provider, tooltip/toast/devtools, and `Outlet`
  - Injects CSS + favicon/meta tags
- Data/guards:
  - `beforeLoad` ensures `getUserQuery` is present in React Query cache and puts `session` in route context

## Top-Level Public/Auth/App Routes

### `/`
- File: `apps/web/src/routes/index.tsx`
- Purpose:
  - Home/status page
  - Shows API health check status and `UserMenu`
- Data:
  - Uses `orpc.healthCheck` query in component

### `/login`
- File: `apps/web/src/routes/login.tsx`
- Purpose:
  - Auth screen (defaults to sign-up view with toggle to sign-in)
- Data/guards:
  - `beforeLoad` gets session via `getUserForce`
  - `loader` redirects authenticated users:
    - to `/$orgSlug` when they already belong to an organisation
    - to `/dictator` when they are dictator users without an organisation
    - to `/onboard` for other authenticated users without an organisation

### `/signin`
- File: `apps/web/src/routes/signin.tsx`
- Purpose:
  - Auth screen (defaults to sign-in view with toggle to sign-up)
- Data/guards:
  - `beforeLoad` gets session via `getUserForce`
  - `loader` redirects authenticated users:
    - to `/$orgSlug` when they already belong to an organisation
    - to `/dictator` when they are dictator users without an organisation
    - to `/onboard` for other authenticated users without an organisation

### `/onboard`
- File: `apps/web/src/routes/onboard.tsx`
- Purpose:
  - Onboarding form for users/org setup
- Data/guards:
  - `beforeLoad` gets session via `getUserForce`
  - Redirects to `/$orgSlug` if user already belongs to an org
  - Redirects to `/login` if no session
  - Keeps authenticated users without an organisation on the route

### `/dashboard`
- File: `apps/web/src/routes/dashboard.tsx`
- Purpose:
  - Simple authenticated dashboard/test page
- Data/guards:
  - `beforeLoad` calls `getUser`
  - Redirects to `/login` if not authenticated
  - Component calls `orpc.privateData`

### `/admin`
- File: `apps/web/src/routes/admin.tsx`
- Purpose:
  - Redirect helper route
- Data/guards:
  - Redirects to `/login` when unauthenticated
  - Redirects to `/$orgSlug` when the user has an organisation
  - Redirects to `/dictator` for dictator users without an organisation
  - Redirects to `/onboard` for other authenticated users without an organisation

## Dictator Area Routes

### `/dictator` (layout route)
- File: `apps/web/src/routes/dictator.tsx`
- Purpose:
  - Dictator-mode shell layout with dedicated sidebar/header and `Outlet`
- Data/guards:
  - Requires authenticated session
  - Requires `dictator` metatag in `session.user.metaTags`
  - Redirects non-authorized users

### `/dictator/users`
- File: `apps/web/src/routes/dictator/users.tsx`
- Purpose:
  - Global users management table
- Data:
  - Prefetches `orpc.user.getAll`
- Rendering:
  - `ssr: false`

### `/dictator/plans`
- File: `apps/web/src/routes/dictator/plans.tsx`
- Purpose:
  - Global plans management table
- Data:
  - Prefetches `orpc.organisation.getAllPlansAdmin`
- Rendering:
  - `ssr: false`

### `/dictator/app-features`
- File: `apps/web/src/routes/dictator/app-features.tsx`
- Purpose:
  - Global app-level feature controls
  - Manages `aiEnabled` and `aiNutritionEnabled` toggles
- Data:
  - Prefetches `orpc.feature.getAppFeatures`
- Rendering:
  - `ssr: false`

### `/dictator/org-features`
- File: `apps/web/src/routes/dictator/org-features.tsx`
- Purpose:
  - Organisation-level feature/metatag management
  - Toggles `aiEnabled` and `aiNutritionEnabled` in organisation `metaTags`
  - Displays plan `metaTags` as read-only context
- Data:
  - Prefetches `orpc.organisation.getAll`
- Rendering:
  - `ssr: false`

### `/dictator/orgs`
- File: `apps/web/src/routes/dictator/orgs.tsx`
- Purpose:
  - Organisations management table
- Data:
  - Prefetches `orpc.organisation.getAll`
- Rendering:
  - `ssr: false`

### `/dictator/org-movements`
- File: `apps/web/src/routes/dictator/org-movements.tsx`
- Purpose:
  - Org-created movement records overview
- Data:
  - Prefetches `orpc.movement.getAll`
- Rendering:
  - `ssr: false`

### `/dictator/org-ingredients`
- File: `apps/web/src/routes/dictator/org-ingredients.tsx`
- Purpose:
  - Org-created ingredients overview
- Data:
  - Prefetches `orpc.ingredient.getAll`
- Rendering:
  - `ssr: false`

### `/dictator/exercises`
- File: `apps/web/src/routes/dictator/exercises.tsx`
- Purpose:
  - Cross-organisation exercises table
- Data:
  - Prefetches `orpc.exercise.getAll`
- Rendering:
  - `ssr: false`

### `/dictator/base-movements`
- File: `apps/web/src/routes/dictator/base-movements.tsx`
- Purpose:
  - Global/base movement library table
- Data:
  - Prefetches `orpc.movement.getAllBase`
- Rendering:
  - `ssr: false`

### `/dictator/base-ingredients`
- File: `apps/web/src/routes/dictator/base-ingredients.tsx`
- Purpose:
  - Global/base ingredients library table
- Data:
  - Prefetches `orpc.ingredient.getAllBase`
- Rendering:
  - `ssr: false`

### `/dictator/generation`
- File: `apps/web/src/routes/dictator/generation.tsx`
- Purpose:
  - Admin setup/import/generator control center
  - Supports:
    - Import exercises
    - Import base ingredients
    - Generate org dummy data
    - Generate plans
    - Per-organisation generators for recipes, exercises, warmups, workouts, block templates, users, and user menu templates
- Data/guards:
  - `beforeLoad` gets session (`getUser`)
  - Uses `orpc.organisation.getAll` to populate org selector
  - Runs multiple `orpc.adminSetup.*` mutations

## Organisation Area Routes

### `/$orgSlug` (layout route)
- File: `apps/web/src/routes/$orgSlug.tsx`
- Purpose:
  - Main org-admin shell with app sidebar, header, scroll container, and `Outlet`
- Data/guards/search:
  - Redirects to `/` if user has no `organisationId`
  - Validates search params: `{ user?: string }`
  - Retains `user` search param across child navigations
  - Uses `user` search param for selected user context in sidebar

### `/$orgSlug/dashboard`
- File: `apps/web/src/routes/$orgSlug/dashboard.tsx`
- Purpose:
  - Placeholder org dashboard page (`Hello` output)

### `/$orgSlug/exercises`
- File: `apps/web/src/routes/$orgSlug/exercises.tsx`
- Purpose:
  - Exercises list page (table/grid)
- Search params:
  - `view`, `q`, `page`, `perPage`, `sort`
- Data:
  - Prefetches `orpc.exercise.getAllOrg`
- Rendering:
  - `ssr: false`

### `/$orgSlug/exercises/create`
- File: `apps/web/src/routes/$orgSlug/exercises_.create.tsx`
- Purpose:
  - Create exercise form
- Data:
  - Prefetches `orpc.movement.getAllOrg` and `orpc.exercise.getAllOrg`
- Rendering:
  - `ssr: false`

### `/$orgSlug/exercises/edit/$exerciseId`
- File: `apps/web/src/routes/$orgSlug/exercises_.edit.$exerciseId.tsx`
- Purpose:
  - Edit exercise form (including superset mappings)
- Data:
  - Prefetches `orpc.exercise.get`, `orpc.exercise.getAllOrg`, `orpc.movement.getAllOrg`
  - Maps API exercise shape into `ExerciseForm` edit shape
- Rendering:
  - `ssr: false`

### `/$orgSlug/ingredients`
- File: `apps/web/src/routes/$orgSlug/ingredients.tsx`
- Purpose:
  - Ingredients list page (table/grid)
- Search params:
  - `view`, `q`, `page`, `perPage`, `sort`
- Data:
  - Prefetches `orpc.ingredient.getAllOrg`
- Rendering:
  - `ssr: false`

### `/$orgSlug/ingredients/create`
- File: `apps/web/src/routes/$orgSlug/ingredients_.create.tsx`
- Purpose:
  - Create ingredient form
- Rendering:
  - `ssr: false`

### `/$orgSlug/ingredients/edit/$ingredientId`
- File: `apps/web/src/routes/$orgSlug/ingredients_.edit.$ingredientId.tsx`
- Purpose:
  - Edit ingredient form
- Data:
  - Prefetches `orpc.ingredient.get`
  - Maps API ingredient data into `IngredientForm` edit shape
- Rendering:
  - `ssr: false`

### `/$orgSlug/movements`
- File: `apps/web/src/routes/$orgSlug/movements.tsx`
- Purpose:
  - Movements list page (table/grid)
- Search params:
  - `view`, `q`, `page`, `perPage`, `sort`
- Data:
  - Prefetches `orpc.movement.getAllOrg`
- Rendering:
  - `ssr: false`

### `/$orgSlug/movements/create`
- File: `apps/web/src/routes/$orgSlug/movements_.create.tsx`
- Purpose:
  - Create movement form
- Rendering:
  - `ssr: false`

### `/$orgSlug/movements/edit/$movementId`
- File: `apps/web/src/routes/$orgSlug/movements_.edit.$movementId.tsx`
- Purpose:
  - Edit movement form
- Data:
  - Prefetches `orpc.movement.get`
  - Maps API movement into `MovementForm` edit shape
- Rendering:
  - `ssr: false`

### `/$orgSlug/recipes`
- File: `apps/web/src/routes/$orgSlug/recipes.tsx`
- Purpose:
  - Recipes list page (table/grid)
- Search params:
  - `view`, `q`, `page`, `perPage`, `sort`
- Data:
  - Prefetches `orpc.recipe.getOrg`
- Rendering:
  - `ssr: false`

### `/$orgSlug/recipes/create`
- File: `apps/web/src/routes/$orgSlug/recipes_.create.tsx`
- Purpose:
  - Create recipe form
- Data:
  - Prefetches `orpc.ingredient.getAllOrg`
  - Form additionally queries `orpc.feature.getAiAccess` at component level to decide if AI controls are visible
- Rendering:
  - `ssr: false`

### `/$orgSlug/recipes/edit/$recipeId`
- File: `apps/web/src/routes/$orgSlug/recipes_.edit.$recipeId.tsx`
- Purpose:
  - Edit recipe form
- Data:
  - Prefetches `orpc.ingredient.getAllOrg` and `orpc.recipe.get`
  - Form additionally queries `orpc.feature.getAiAccess` at component level to decide if AI controls are visible
- Rendering:
  - `ssr: false`

### `/$orgSlug/warmups`
- File: `apps/web/src/routes/$orgSlug/warmups.tsx`
- Purpose:
  - Warmup groups list page (table/grid)
- Search params:
  - `view`, `q`, `page`, `perPage`, `sort`
- Data:
  - Prefetches `orpc.warmup.getAllGroups`
- Rendering:
  - `ssr: false`

### `/$orgSlug/warmups/create`
- File: `apps/web/src/routes/$orgSlug/warmups_.create.tsx`
- Purpose:
  - Create warmup group form
- Rendering:
  - `ssr: false`

### `/$orgSlug/warmups/edit/$warmupGroupId`
- File: `apps/web/src/routes/$orgSlug/warmups_.edit.$warmupGroupId.tsx`
- Purpose:
  - Edit warmup group and nested warmups
- Data:
  - Prefetches `orpc.warmup.getGroup`
  - Maps API group into `WarmupGroupForm` edit shape
- Rendering:
  - `ssr: false`

### `/$orgSlug/workouts`
- File: `apps/web/src/routes/$orgSlug/workouts.tsx`
- Purpose:
  - Workouts list page (table/grid)
- Search params:
  - `view`, `q`, `page`, `perPage`, `sort`
- Data:
  - Prefetches `orpc.workout.getAllOrg`
- Rendering:
  - `ssr: false`

### `/$orgSlug/workouts/create`
- File: `apps/web/src/routes/$orgSlug/workouts_.create.tsx`
- Purpose:
  - Create workout builder form
- Data:
  - Prefetches `orpc.exercise.getAllOrg` and `orpc.warmup.getAllGroups`
- Rendering:
  - `ssr: false`

### `/$orgSlug/workouts/edit/$workoutId`
- File: `apps/web/src/routes/$orgSlug/workouts_.edit.$workoutId.tsx`
- Purpose:
  - Edit workout builder form (exercise/superset structure + ordering)
- Data:
  - Prefetches `orpc.workout.get`, `orpc.exercise.getAllOrg`, `orpc.warmup.getAllGroups`
  - Maps API workout data into `WorkoutCreateForm` edit shape
- Rendering:
  - `ssr: false`

### `/$orgSlug/block-templates`
- File: `apps/web/src/routes/$orgSlug/block-templates.tsx`
- Purpose:
  - Block templates list page (table/grid) backed by `userBlock` template storage
- Search params:
  - `view`, `page`, `perPage`, `sort`
- Data:
  - Prefetches `orpc.userBlock.getTemplatesOrg`
- Rendering:
  - `ssr: false`

### `/$orgSlug/block-templates/create`
- File: `apps/web/src/routes/$orgSlug/block-templates_.create.tsx`
- Purpose:
  - Create block template using shared `UserBlockForm` in `mode='template'`
- Data:
  - Prefetches `orpc.userBlock.getTemplatesOrg`
  - Prefetches `orpc.workout.getAllOrg`, `orpc.exercise.getAllOrg`, `orpc.warmup.getAllGroups`, and `orpc.movement.getAllOrg`
- Rendering:
  - `ssr: false`

### `/$orgSlug/block-templates/edit/$blockId`
- File: `apps/web/src/routes/$orgSlug/block-templates_.edit.$blockId.tsx`
- Purpose:
  - Edit block template using shared `UserBlockForm` in `mode='template'`
- Data:
  - Prefetches `orpc.userBlock.get`
  - Prefetches `orpc.userBlock.getTemplatesOrg`
  - Prefetches `orpc.workout.getAllOrg`, `orpc.exercise.getAllOrg`, `orpc.warmup.getAllGroups`, and `orpc.movement.getAllOrg`
- Rendering:
  - `ssr: false`

### `/$orgSlug/menu-templates`
- File: `apps/web/src/routes/$orgSlug/menu-templates.tsx`
- Purpose:
  - Menu templates list page (table/grid)
- Search params:
  - `view`, `page`, `perPage`, `sort`
- Data:
  - Prefetches `orpc.userMenu.getTemplatesOrg` (template storage in user-menu domain)
- Rendering:
  - `ssr: false`

### `/$orgSlug/menu-templates/create`
- File: `apps/web/src/routes/$orgSlug/menu-templates_.create.tsx`
- Purpose:
  - Create menu template using shared `UserMenuForm` in `mode='template'`
- Data:
  - Prefetches `orpc.recipe.getOrg` and `orpc.userMenu.getTemplatesOrg`
  - `UserMenuForm` also queries `orpc.feature.getAiAccess` to conditionally show AI controls
- Rendering:
  - `ssr: false`

### `/$orgSlug/menu-templates/edit/$menuId`
- File: `apps/web/src/routes/$orgSlug/menu-templates_.edit.$menuId.tsx`
- Purpose:
  - Edit menu template using shared `UserMenuForm` in `mode='template'`
- Data:
  - Prefetches `orpc.recipe.getOrg`, `orpc.userMenu.getTemplatesOrg`, and `orpc.userMenu.get`
  - `UserMenuForm` also queries `orpc.feature.getAiAccess` to conditionally show AI controls
- Rendering:
  - `ssr: false`

### `/$orgSlug/user-menus`
- File: `apps/web/src/routes/$orgSlug/user-menus.tsx`
- Purpose:
  - User menu list page wrapper (passes `orgSlug` into `UserMenusPage`)
  - Relies on selected user context retained from parent `/$orgSlug?user=...`
- Rendering:
  - `ssr: false`

### `/$orgSlug/user-menu-create`
- File: `apps/web/src/routes/$orgSlug/user-menu-create.tsx`
- Purpose:
  - User menu creation flow
- Data:
  - Prefetches `orpc.userMenu.getTemplatesOrg`
  - `UserMenuForm` also queries `orpc.feature.getAiAccess` to conditionally show AI controls
- Rendering:
  - `ssr: false`

### `/$orgSlug/user-menu/$menuId`
- File: `apps/web/src/routes/$orgSlug/user-menu.$menuId.tsx`
- Purpose:
  - User menu detail view
- Data:
  - Prefetches `orpc.userMenu.get`
- Rendering:
  - `ssr: false`

### `/$orgSlug/user-menu-edit/$menuId`
- File: `apps/web/src/routes/$orgSlug/user-menu-edit.$menuId.tsx`
- Purpose:
  - Edit existing user menu
- Data:
  - Prefetches `orpc.userMenu.get` and `orpc.userMenu.getTemplatesOrg`
  - `UserMenuForm` also queries `orpc.feature.getAiAccess` to conditionally show AI controls
- Rendering:
  - `ssr: false`

### `/$orgSlug/user-blocks`
- File: `apps/web/src/routes/$orgSlug/user-blocks.tsx`
- Purpose:
  - User block list page wrapper (passes `orgSlug` into `UserBlocksPage`)
  - Relies on selected user context retained from parent `/$orgSlug?user=...`
- Rendering:
  - `ssr: false`

### `/$orgSlug/user-block-create`
- File: `apps/web/src/routes/$orgSlug/user-block-create.tsx`
- Purpose:
  - User block creation and assignment flow
  - Starts from a blank block or imports a block template into the editable form
- Data:
  - Prefetches `orpc.userBlock.getTemplatesOrg`
  - Prefetches `orpc.workout.getAllOrg`, `orpc.exercise.getAllOrg`, `orpc.warmup.getAllGroups`, and `orpc.movement.getAllOrg`
- Rendering:
  - `ssr: false`

### `/$orgSlug/user-block/$blockId`
- File: `apps/web/src/routes/$orgSlug/user-block.$blockId.tsx`
- Purpose:
  - User block detail view with schedule, workout, warmup, and exercise breakdown
- Data:
  - Prefetches `orpc.userBlock.get`
- Rendering:
  - `ssr: false`

### `/$orgSlug/user-block-edit/$blockId`
- File: `apps/web/src/routes/$orgSlug/user-block-edit.$blockId.tsx`
- Purpose:
  - Edit existing user block using shared `UserBlockForm`
- Data:
  - Prefetches `orpc.userBlock.get`
  - Prefetches `orpc.userBlock.getTemplatesOrg`
  - Prefetches `orpc.workout.getAllOrg`, `orpc.exercise.getAllOrg`, `orpc.warmup.getAllGroups`, and `orpc.movement.getAllOrg`
- Rendering:
  - `ssr: false`

## Nutrition Web App (`apps/nutrition-web/src/routes`)

### Router Bootstrap

- File: `apps/nutrition-web/src/router.tsx`
- Creates a client-only TanStack Router with:
  - `routeTree` from `apps/nutrition-web/src/routeTree.gen.ts`
  - Router context: `{ orpc, queryClient }`
  - `scrollRestoration: true`
  - inline pending and not-found fallbacks
  - global React Query provider wrapper (`QueryClientProvider`)
- No TanStack Start or server entrypoints are used in this app.

### Root Route

#### `__root` (layout root)
- File: `apps/nutrition-web/src/routes/__root.tsx`
- Purpose:
  - Theme provider, tooltip/toast shell, and `Outlet`
- Data/guards:
  - `beforeLoad` ensures the shared session query is cached and exposes `session` in route context

### Top-Level Routes

#### `/`
- File: `apps/nutrition-web/src/routes/index.tsx`
- Purpose:
  - Session-aware redirect entrypoint for the nutrition client app
- Data/guards:
  - Redirects authenticated users to `/app`
  - Redirects signed-out users to `/auth`

#### `/auth`
- File: `apps/nutrition-web/src/routes/auth.tsx`
- Purpose:
  - Login-only entrypoint for nutrition clients
- Data/guards:
  - Redirects authenticated users to `/app`

#### `/app` (layout route)
- File: `apps/nutrition-web/src/routes/app.tsx`
- Purpose:
  - Protected mobile client shell with a sticky header, centered account dock action, and dashboard overview on the exact `/app` path
- Data/guards:
  - Redirects unauthenticated users to `/auth`
  - Reuses root `session` context for the shell, account actions, and the current-menu overview

#### `/app/menu`
- File: `apps/nutrition-web/src/routes/app/menu.tsx`
- Purpose:
  - Weekly menu view with per-day meal groupings

#### `/app/recipes`
- File: `apps/nutrition-web/src/routes/app/recipes.tsx`
- Purpose:
  - Client-facing recipe library and macro summary view

#### `/app/check-in`
- File: `apps/nutrition-web/src/routes/app/check-in.tsx`
- Purpose:
  - Weekly adherence and coach-feedback summary

## Training Web App (`apps/training-web/src/routes`)

### Router Bootstrap

- File: `apps/training-web/src/router.tsx`
- Creates a client-only TanStack Router with:
  - `routeTree` from `apps/training-web/src/routeTree.gen.ts`
  - Router context: `{ orpc, queryClient }`
  - `scrollRestoration: true`
  - inline pending and not-found fallbacks
  - global React Query provider wrapper (`QueryClientProvider`)
- No TanStack Start or server entrypoints are used in this app.

### Root Route

#### `__root` (layout root)
- File: `apps/training-web/src/routes/__root.tsx`
- Purpose:
  - Theme provider, tooltip/toast shell, and `Outlet`
- Data/guards:
  - `beforeLoad` ensures the shared session query is cached and exposes `session` in route context

### Top-Level Routes

#### `/`
- File: `apps/training-web/src/routes/index.tsx`
- Purpose:
  - Session-aware redirect entrypoint for the training client app
- Data/guards:
  - Redirects authenticated users to `/app`
  - Redirects signed-out users to `/auth`

#### `/auth`
- File: `apps/training-web/src/routes/auth.tsx`
- Purpose:
  - Login-only entrypoint for training clients
- Data/guards:
  - Redirects authenticated users to `/app`

#### `/app` (layout route)
- File: `apps/training-web/src/routes/app.tsx`
- Purpose:
  - Protected mobile client shell with a sticky header, centered account dock action, and dashboard overview on the exact `/app` path
- Data/guards:
  - Redirects unauthenticated users to `/auth`
  - Reuses root `session` context for the shell, account actions, and the current-program overview

#### `/app/plan`
- File: `apps/training-web/src/routes/app/plan.tsx`
- Purpose:
  - Current block overview with per-day training blocks

#### `/app/sessions`
- File: `apps/training-web/src/routes/app/sessions.tsx`
- Purpose:
  - Upcoming-session view with timing and coaching notes

#### `/app/recovery`
- File: `apps/training-web/src/routes/app/recovery.tsx`
- Purpose:
  - Recovery and readiness summary for training clients

## Route Inventory Sources

- Admin generated tree used for path verification: `apps/web/src/routeTree.gen.ts`
- Admin full path count in generated tree: 52 concrete file routes (plus `__root` layout)
- Nutrition generated tree used for path verification: `apps/nutrition-web/src/routeTree.gen.ts`
- Nutrition full path count in generated tree: 6 concrete file routes (plus `__root` layout)
- Training generated tree used for path verification: `apps/training-web/src/routeTree.gen.ts`
- Training full path count in generated tree: 6 concrete file routes (plus `__root` layout)
