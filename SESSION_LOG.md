# 2026-02-15

- **Database & API:**
    -  Implemented `ingredient` and `exercise` tables with support for overriding base items.
    -  Created `recipe` and `recipeToIngredient` tables.
    -   Built `exercise` and `ingredient` routers with `getAllOrg`, `get`, `getAllBase`, and `create` procedures.
    -   Added input schemas and validation (including metatag checks for `itemUpdater` and `dictator`).
-   **Frontend:**
    -   Implemented advanced data tables for Exercises and Ingredients using Dice UI components.
    -   Fixed client-side pagination and sorting issues in the data tables.
    -   Integrated `orpc` with React Query for efficient data fetching.

# 2026-02-16

- **Infrastructure & Layout:**
    - Established agent identity as **Atlas** and defined core architectural principles in `SOUL.md`.
    - Implemented a complete **Dictator Mode** infrastructure, including a dedicated layout and an independent sidebar system.
    - Conducted an architectural review of multi-tenancy relations, confirming `organisationId` as the primary key for data integrity.
- **Data Management (DataGrid):**
    - Built 4 advanced `DataGrid` views for system administrators (Base/Org Exercises & Ingredients) with full-dataset support and prefetching.
    - Enhanced the `DataGrid` system with support for numeric precision (e.g., standardizing nutritional data to 1 decimal place).
    - Refactored all dictator tables into isolated client-side components with `ssr: 'data-only'` for maximum stability and performance.
- **Form Implementation:**
    - Integrated **TanStack Form** with Zod validation for creating multi-tenant content.
    - Built comprehensive forms for Ingredients and Exercises with support for complex data types (enums, multi-select muscles, dynamic instruction lists).
    - Implemented Dialog-based creation flows for a seamless administrative experience.
- **Security & Tools:**
    - Implemented `beforeLoad` and `loader` auth guards to enforce `dictator` metatag access requirements.
    - Built a robust **Multi-Tenant Dummy Data Generator** to create realistic test environments (Orgs, Creators, Members, and Overwritten content).
    - Refined organisational views with metadata (Creator names, formatted timestamps) and name-cleaning logic.

# 2026-02-17

- **Advanced Table Architecture:**
    - Refactored Admin Exercises and Ingredients into modular table components (`ExercisesTable`, `IngredientsTable`).
    - Standardized **SSR Strategy** for all high-privileged routes to use `ssr: false` while maintaining `loader` prefetching for high-speed client-side hydration.
- **UI System Evolution:**
    - Created a new **Extended UI Layer** (`ui-extended/`) to house complex, high-level primitives.
    - Built a robust `TagsInput` component that integrates `diceui` with Shadcn's `Combobox` for advanced data entry.
    - Integrated **Row Actions** into DataTables using `DropdownMenu` and `Dialog` state management.
- **CRUD & Override Logic:**
    - Implemented the **"Shadow Override" Pattern** in the API: Editing a base item automatically generates a tenant-specific override while preserving global base data.
    - Built comprehensive Edit/Create forms for Ingredients and Exercises using TanStack Form.
    - Enforced **Numeric Precision Standards** (1-point decimal) at the Schema, API handler, and UI levels to ensure data consistency across the ecosystem.

# 2026-02-19

- **Database Schema Consolidation:**
    - **Merged base tables into main tables** following architectural decision to simplify data model:
        - Consolidated `base_exercise` into `exercise` table with `isBase` boolean flag
        - Consolidated `base_ingredients` into `ingredient` table with `isBase` boolean flag
        - Made `organisationId` nullable (NULL for base items)
        - Added `baseId` self-referencing foreign key for override tracking
    - Updated `recipeToIngredient` table with simplified structure and `isBaseIngredient` flag
    - Created migration file for consolidating base tables

- **Route Refactoring:**
    - Refactored all admin routes from `$orgSlug/admin/s/*` → `$orgSlug/*` for cleaner URLs
    - Updated all navigation references and route files

- **Plans Management System:**
    - Created complete plan management interface for dictator users
    - Added plan CRUD operations (create, update, delete, getAllPlansAdmin)
    - Built plan management UI with DataGrid, create/edit forms, and row actions

- **Onboarding UX Improvements:**
    - Moved access code input to bottom of step 2 in Collapsible component
    - Reduced cognitive load for users without access codes

- **Exercises Management Interface:**
    - Created complete exercises management interface for organisations
    - Built exercises table with DataTable component (sorting, filtering, pagination)
    - Created exercise create form with VirtualizedCombobox for movement selection
    - Added all exercise fields: sets, reps, rep units, %1RM, target RPE, rest, tempo

- **Dictator Exercises Management:**
    - Added `/dictator/exercises` route for viewing all exercises across organisations
    - Created dictator exercises DataGrid with 17 columns
    - Added exercise generator to create sample exercises for organizations

- **SuperSet Support:**
    - Added `isSuperSet` boolean column to exercise table
    - Created `superSetToExercise` junction table for linking exercises to supersets
    - Added API endpoints: addToSuperSet, removeFromSuperSet, getSuperSetExercises
    - Full relations for superset parent/child relationships

- **Session Management System:**
    - Created `session` table for organizing workout sessions
    - Created `sessionToExercise` junction table with `index` column for ordering
    - Created `sessionToSuperSet` junction table with `index` column for ordering
    - Added full CRUD API for sessions
    - Added endpoints for adding/removing exercises and supersets from sessions
    - Deep loading support: session → supersets → exercises in each superset

- **Warmup Management System:**
    - Created `warmupGroup` table for organizing warmup routines
    - Created `warmup` table with name, description, images, link fields
    - Added `warmupGroupId` FK to session table for linking warmups to sessions
    - One-to-many relation: warmupGroup → warmups
    - Full CRUD API for warmup groups and individual warmups
    - Updated session router to include warmup data when fetching sessions

- **API Infrastructure:**
    - Registered new routers: sessionRouter, warmupRouter
    - Created comprehensive Zod schemas for all new entities
    - Added permission checks (itemUpdater/dictator) for all modification endpoints
    - Proper organisation scoping for all tenant-specific data

# 2026-02-20

- **Session → Workout Rename:**
    - Renamed `session` table to `workout` to resolve naming collision with Better Auth's `session` table
    - Updated all related tables: `session_to_exercise` → `workout_to_exercise`, `session_to_superset` → `workout_to_super_set`
    - Updated all API endpoints, schemas, and relations from `/session/*` to `/workout/*`
    - Updated frontend components and routes to use new naming

- **Warmup Management Interface:**
    - Created complete warmup management system with groups and individual warmups
    - Built `warmups-page.tsx` with table/grid views showing warmup groups and their exercises
    - Created `warmup-group-create-dialog.tsx` and `warmup-group-create-form.tsx` for creating groups with nested warmups
    - Added API endpoint `createGroupWithWarmups` for transactional creation
    - Added route at `/$orgSlug/warmups` with prefetching

- **Workout Management System:**
    - Created `workouts-page.tsx` with table and comprehensive grid views
    - Grid view shows workout details including warmup groups, exercises, and supersets with ordering
    - Created `workout-create-dialog.tsx` and `workout-create-form.tsx` with interactive workout builder
    - Builder supports adding exercises and supersets with drag-and-drop ordering
    - Added warmup group selector to attach warmups to workouts
    - Added route at `/$orgSlug/workouts`

- **Block Templates System:**
    - Created `block_template` and `block_template_to_workout` tables with index-based ordering
    - Built complete API with CRUD operations and workout add/remove endpoints
    - Created `block-templates-page.tsx` with table and detailed grid views
    - Grid view shows complete training schedule with rest days, workouts, warmups, exercises, and supersets
    - Added route at `/$orgSlug/block-templates`

- **Menu Templates System (Nutrition):**
    - Created `menu_template` and `menu_template_to_recipe` tables with dual-index pattern
    - **Dual Index Pattern**: `mealIndex` (which meal slot) + `recipeIndex` (order within meal)
    - Example: mealIndex=2, recipeIndex=1 = "2nd recipe in meal 3"
    - Built complete API with CRUD and recipe add/remove operations
    - Created `menu-templates-page.tsx` with table and grid views organized by meals
    - Grid view shows meal schedule with recipes grouped by mealIndex
    - Added route at `/$orgSlug/menu-templates`
    - Added sidebar navigation link under Nutrition section

- **Dictator Generators:**
    - Added `generateWarmups` - Creates 5 warmup groups with 2-4 exercises each
    - Added `generateWorkouts` - Creates 10-20 workouts with 4-8 exercises and optional warmup
    - Added `generateBlockTemplates` - Creates 10 block templates with 4-5 workouts and 1-2 rest days
    - Added `generateMenuTemplates` - Creates 10 menu templates with 3-5 meals and 1-2 recipes per meal
    - All generators available in `/dictator/generation` UI with organization selection

- **UI/UX Improvements:**
    - Fixed Phosphor Icons naming convention across all components (added `Icon` suffix)
    - Updated imports: `Barbell` → `BarbellIcon`, `Fire` → `FireIcon`, etc.
    - Prevents naming collisions with components, variables, and types
    - Documented convention in SOUL.md for future reference

# 2026-02-23

- **Subscription Management System:**
    - Added discount fields to `subscription` table: `discountType`, `discountValue`, `discountReason`, `discountExpiresAt`
    - Added bonus fields to `subscription` table: `bonusMembers`, `bonusTrainers`, `bonusReason`, `bonusExpiresAt`
    - Created `subscriptionRouter` with endpoints: `get`, `getByOrganisation`, `update`, `getAll`
    - Updated `organisation.getAll` to include subscription data with calculated effective limits and discounted prices
    - Created dictator UI for managing discounts and bonuses via `org-row-actions.tsx`

- **Plan Generation:**
    - Added `generatePlans` endpoint to create 4 random plans (Starter, Pro, Elite, Enterprise)
    - Updated `generateDummyData` to assign a random plan to each created organization
    - Added "Generate 4 Plans" button to `/dictator/generation` page
    - Plans include various price points: Free ($0), Pro ($29/mo), Elite ($99/mo), Enterprise ($299/mo)

# 2026-02-26

- **User Menu Creation Form (Rich Interface):**
    - Created comprehensive menu creation form at `/$orgSlug/user-menu-create`
    - **Meal Management:** Add/remove meals, edit meal names, set target calories and protein
    - **Recipe Management:** Add recipes via VirtualizedCombobox, remove recipes, reorder with up/down buttons
    - **Ingredient Management:** View all ingredients per recipe, change serve sizes (0.1 precision), add/remove ingredients
    - **Balance Calories:** Scales all recipes proportionally to meet target calories
    - **Balance Protein & Calories:** Uses linear algebra (mathjs) to solve for ingredient amounts that meet both targets
    - Smart ingredient selection: picks highest protein/g and highest calories/g ingredients for balancing
    - Properly accounts for other ingredients' contributions when balancing
    - Enhanced UI: recipe nutrition displays prominently with primary colors and borders
    - Meal headers show average calories per recipe instead of total

- **User Menu List View (Card-Based):**
    - Created card-style view at `/$orgSlug/user-menus`
    - Reads selected user from parent route search params (sidebar integration)
    - Shows user selector if no user selected
    - Displays menus in responsive card grid (1/2/3 columns based on viewport)
    - Each card shows: name, status badge, description, date range, meal/recipe counts, daily nutrition summary
    - Shows average calories per recipe for quick comparison

- **User Menu Details View:**
    - Created detailed view at `/$orgSlug/user-menu/$menuId`
    - Back button to return to menu list
    - Large daily nutrition summary card with color-coded macros
    - Shows all meals with their target calories/protein
    - Lists all recipes per meal with full nutrition breakdown
    - Shows all ingredients per recipe with serving sizes

- **Menu Actions:**
    - Added dropdown menu to each menu card (three dots)
    - **Activate:** Green button with play icon (shown when inactive)
    - **Deactivate:** Yellow button with stop icon (shown when active)
    - **Delete:** Red button with trash icon + confirmation dialog
    - All actions invalidate cache and show toast notifications
    - Uses existing `userMenu.update` and `userMenu.delete` API endpoints

- **Infrastructure:**
    - Added `mathjs` dependency for linear algebra operations
    - Created `recipe-balancer.ts` utility with `balanceRecipe()`, `selectIngredientsForBalancing()`, `isValidSolution()`
    - Added "User Menus" to sidebar under user section (Nutrition category)
    - Removed zod search validation from user-menus route (uses parent route params)
    - Created route files: `user-menus.tsx`, `user-menu.$menuId.tsx`
    - Fixed TypeScript errors in user-menu-create form

- **Database/API Compatibility:**
    - Fixed minor LSP errors related to checkbox component and unused imports
    - All components use proper TypeScript types with orpc integration

# 2026-02-26 (Evening)

- **User Menu Creation - Real-Time Nutrition Calculation:**
    - Fixed ingredient serveSize updates to automatically recalculate calories, protein, fat, carbs based on ratio
    - Added +/- buttons to increment/decrement serveSize by 5 units with immediate nutrition updates
    - Both serveSize input changes and button clicks now trigger full recipe nutrition recalculation

- **Meal Nutrition Calculation Logic:**
    - Meal calories and protein can be overridden via target values, otherwise calculated as recipe averages
    - Meal fat and carbs are always calculated from recipe averages (no user inputs)
    - Simplified UI: removed Target Fat and Target Carbs input fields, keeping only Target Calories and Target Protein

- **API Schema Cleanup:**
    - Updated `UserMealCreateInput` to use `calories/protein/fat/carbohydrate` fields instead of `targetCalories/targetProtein`
    - Removed nutrition fields from `UserIngredientCreateInput` (they don't exist in DB schema)
    - Fixed API handlers to properly handle null values and fallback to existing values in updates

- **UI/UX Refinements:**
    - Reverted to 4-column grid for meal targets (Calories, Protein, Balance Calories, Balance P&C)
    - Meal totals automatically reflect target overrides or recipe averages in real-time
    - Ingredient rows show updated nutrition values immediately when serveSize changes

# 2026-02-28

- **Menu Template Storage Migration (Schema + API):**
    - Migrated template source-of-truth from legacy `menu_template*` tables to `user_menu` using `isTemplate`.
    - Added `isTemplate` boolean column and index to `user_menu` schema.
    - Added and generated DB migration: `packages/db/src/migrations/20260228061525_abnormal_proudstar/migration.sql`.
    - Added new user-menu API contracts and endpoints:
    - `getTemplatesOrg` for org-scoped template retrieval from `user_menu`.
    - `createTemplate` for creating templates with meals/recipes/ingredients in a single transactional flow.

- **Menu Template UI/Route Migration:**
    - Rewired menu-template create and list flows to use `orpc.userMenu.*` template endpoints.
    - Updated route prefetching for:
    - `/$orgSlug/menu-templates`
    - `/$orgSlug/menu-templates_/create`
    - Updated template list/table rendering to the new `user_menu` response shape (user/meals/recipes).

- **Template Consumption in User Menu Builder:**
    - Updated user menu create/edit template prefetches to use `orpc.userMenu.getTemplatesOrg`.
    - Updated template selection hydration in `user-menu-form` to map template recipes/ingredients from new `user_menu` template shape.
    - Ensured template ingredient data is included in `getTemplatesOrg` response for downstream meal/recipe population.

- **Compatibility + Cleanup:**
    - Marked legacy `menu-template` schema/relations as deprecated (kept for backward compatibility during transition).
    - Removed/adjusted stale fields and references tied to old template shape where they blocked new flow.
