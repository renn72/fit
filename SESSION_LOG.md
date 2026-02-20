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

