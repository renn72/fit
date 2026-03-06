# API Summary (`packages/api/src`)

This file summarizes the current oRPC API implementation by reading:
- `packages/api/src/index.ts`
- `packages/api/src/context.ts`
- every file in `packages/api/src/routers/`

## Core Runtime

### `packages/api/src/context.ts`
- `createContext(req)` resolves the session via `auth.api.getSession({ headers: fromNodeHeaders(req) })`.
- `Context` is `{ session }` where `session` may be null.

### `packages/api/src/index.ts`
- `o = os.$context<Context>()`
- `publicProcedure = o`
- `protectedProcedure = publicProcedure.use(timingMiddleware).use(requireAuth)`
- `timingMiddleware` logs execution time for protected procedures.
- `requireAuth` throws `ORPCError('UNAUTHORIZED')` if no `context.session.user`.

## Router Registry

`packages/api/src/routers/index.ts` exports `appRouter` with:
- Base procedures:
- `healthCheck` (`GET /health-check`) returns `'OK'`.
- `privateData` (`GET /private-data`) returns `{ message, user }` for authenticated users.
- Mounted routers:
- `organisation`, `user`, `userMenu`, `adminSetup`, `movement`, `exercise`, `ingredient`, `recipe`, `workout`, `warmup`, `blockTemplate`, `menuTemplate`, `subscription`, `ai`.

Total procedures in router files: **122**.

## Cross-Cutting Patterns

- Most endpoints are `protectedProcedure` (authenticated only).
- Authorization is mostly metatag-based:
- `dictator`: global admin access.
- `itemUpdater`: content mutation permissions.
- Many org-scoped endpoints validate `organisationId` against `context.session.user.organisationId` unless `dictator`.
- Multiple domains use transactional writes (`db.transaction`) for batch or multi-entity operations.
- Ingredient nutrition values are often rounded to 1 decimal in API writes.

## Router Details

## `organisationRouter` (`packages/api/src/routers/organisation.ts`)

### Endpoints
| Procedure | Method | Path | Summary |
|---|---|---|---|
| `create` | `POST` | `/organisation` | Create organisation |
| `getAllSlugs` | `GET` | `/organisation/slugs` | Get all slugs |
| `getAllPlans` | `GET` | `/organisation/plans` | Get all visible plans |
| `getPlanByCode` | `GET` | `/organisation/plan-by-code/{code}` | Resolve plan by access code |
| `getAll` | `GET` | `/organisation/all` | Dictator-only org list |
| `createPlan` | `POST` | `/plan` | Dictator-only plan create |
| `updatePlan` | `PATCH` | `/plan` | Dictator-only plan update |
| `deletePlan` | `DELETE` | `/plan/{id}` | Dictator-only plan delete |
| `getAllPlansAdmin` | `GET` | `/plan/all` | Dictator-only all plans (includes hidden) |

### Behavior Notes
- `create` enforces unique org slug.
- Hidden plans require a valid unused `planCode`.
- `create` runs a transaction that:
- marks access code as used (if provided),
- creates organisation,
- updates creator user org fields,
- creates initial subscription (`currentPeriodEnd` one year ahead).
- `getAll` enriches orgs with:
- creator info,
- member count,
- subscription/plan info,
- effective member/trainer limits,
- discounted monthly/yearly prices,
- active-discount and active-bonus flags.

## `userRouter` (`packages/api/src/routers/user.ts`)

### Endpoints
| Procedure | Method | Path | Summary |
|---|---|---|---|
| `getWithOrg` | `GET` | `/user/{id}` | Get user with organization relation |
| `getAll` | `GET` | `/user/all` | Dictator-only all users |
| `getAllByOrg` | `GET` | `/user/by-org` | Users for current organization |

### Behavior Notes
- `getAll` requires `dictator` metatag and returns derived `organisationName`/`organisationSlug`.
- `getAllByOrg` requires session user to have an org and returns compact user fields sorted by name.

## `subscriptionRouter` (`packages/api/src/routers/subscription.ts`)

### Endpoints
| Procedure | Method | Path | Summary |
|---|---|---|---|
| `get` | `GET` | `/subscription/{id}` | Get subscription with plan/org |
| `getByOrganisation` | `GET` | `/subscription/org/{organisationId}` | Get org subscription |
| `update` | `PATCH` | `/subscription` | Dictator-only subscription update |
| `getAll` | `GET` | `/subscription/all` | Dictator-only subscription list |

### Behavior Notes
- `update` converts `discountExpiresAt` and `bonusExpiresAt` to `Date` when provided.
- `getAll` computes derived values per subscription:
- effective limits (`plan + bonus`),
- discounted prices (`percentage` or fixed discount),
- active discount/bonus flags based on expiry.

## `movementRouter` (`packages/api/src/routers/movement.ts`)

### Endpoints
| Procedure | Method | Path | Summary |
|---|---|---|---|
| `getAll` | `GET` | `/movement/all` | Dictator-only movement list |
| `create` | `POST` | `/movement` | Create movement |
| `getAllOrg` | `GET` | `/movement/org` | Org movement library |
| `get` | `GET` | `/movement/:id` | Get movement by id |
| `getAllBase` | `GET` | `/movement/base` | Dictator-only base movement list |
| `update` | `PATCH` | `/movement` | Update movement |
| `delete` | `DELETE` | `/movement/:id` | Delete movement |

### Behavior Notes
- `create`/`update`/`delete` require `itemUpdater` or `dictator`.
- `create` requires the caller to belong to an organization.
- `getAllOrg` merges:
- org movements,
- base movements not overridden by org (`baseId` filtering),
- plus computed flags `isBase` and `isOverwriteBase`.
- `update` uses override behavior:
- updates existing org movement directly,
- if target is base movement, creates org-specific override row with `baseId`.
- `delete` blocks base movement deletion and enforces same-org ownership for non-dictators.

## `ingredientRouter` (`packages/api/src/routers/ingredient.ts`)

### Endpoints
| Procedure | Method | Path | Summary |
|---|---|---|---|
| `getAll` | `GET` | `/ingredient/all` | Dictator-only ingredient list |
| `create` | `POST` | `/ingredient` | Create ingredient |
| `getAllOrg` | `GET` | `/ingredient/org` | Org ingredient library |
| `get` | `GET` | `/ingredient/:id` | Get ingredient by id |
| `getAllBase` | `GET` | `/ingredient/base` | Dictator-only base ingredient list |
| `update` | `PATCH` | `/ingredient` | Update ingredient |
| `delete` | `DELETE` | `/ingredient` | Delete ingredient |

### Behavior Notes
- `create`/`update`/`delete` require `itemUpdater` or `dictator`.
- `create` and `update` round macros to 1 decimal (`calories`, `protein`, `fat`, `carbohydrate`).
- `getAllOrg` merges:
- org ingredients where `isUserCreated = false`,
- base ingredients where `isBase = true` and `isUserCreated = false` not overridden by org,
- adds `creatorName`, `isBase`, `isOverwriteBase`.
- `update` applies same override strategy as movements (update org row else clone base as org override).
- `delete`:
- dictators can delete any existing ingredient,
- non-dictators can delete only non-base ingredients from their org.

## `recipeRouter` (`packages/api/src/routers/recipe.ts`)

### Endpoints
| Procedure | Method | Path | Summary |
|---|---|---|---|
| `get` | `GET` | `/recipe/:id` | Get recipe with ingredient links |
| `getOrg` | `GET` | `/recipe/org` | Get recipes for one org |
| `getAllAdmin` | `GET` | `/recipe/all` | Dictator-only all recipes |
| `create` | `POST` | `/recipe` | Create recipe |
| `update` | `PATCH` | `/recipe` | Update recipe |
| `delete` | `DELETE` | `/recipe` | Delete recipe |

### Behavior Notes
- `get` and `getOrg` enforce org access unless `dictator`.
- `getAllAdmin` returns organisation and creator metadata.
- `create` requires `itemUpdater` or `dictator`; uses UUID recipe id and optional `recipeToIngredient` links.
- `update` replaces all existing `recipeToIngredient` rows when `ingredients` are provided.
- `delete` permits dictator globally; non-dictator delete is restricted to own org recipe.

## `exerciseRouter` (`packages/api/src/routers/exercise.ts`)

### Endpoints
| Procedure | Method | Path | Summary |
|---|---|---|---|
| `getAll` | `GET` | `/exercise/all` | Dictator-only all exercises |
| `getAllOrg` | `GET` | `/exercise/org` | Org exercises |
| `get` | `GET` | `/exercise/:id` | Get exercise by id |
| `create` | `POST` | `/exercise` | Create exercise |
| `update` | `PATCH` | `/exercise` | Update exercise |
| `createSuperSet` | `POST` | `/exercise/superset` | Create superset + members |
| `updateSuperSet` | `PATCH` | `/exercise/superset` | Replace superset members |
| `delete` | `DELETE` | `/exercise/:id` | Delete exercise |
| `addToSuperSet` | `POST` | `/exercise/superset/add` | Add member to superset |
| `removeFromSuperSet` | `DELETE` | `/exercise/superset/remove` | Remove member from superset |
| `getSuperSetExercises` | `GET` | `/exercise/superset/:superSetId` | List superset members |

### Behavior Notes
- All mutation endpoints require `itemUpdater` or `dictator`.
- Normal list/get filters out `isSuperSetChild = true` root rows.
- Response mappers attach movement name and creator/org metadata.
- Superset operations are advanced:
- members cannot contain duplicates,
- supersets cannot include supersets,
- selected existing exercises are copied into child rows (`isSuperSetChild = true`) instead of direct linking,
- update/delete/remove flows clean up orphaned child rows.
- `update` removes superset links when `isSuperSet` is toggled off.

## `warmupRouter` (`packages/api/src/routers/warmup.ts`)

### Endpoints
| Procedure | Method | Path | Summary |
|---|---|---|---|
| `getAllGroups` | `GET` | `/warmup/group/all` | Group list for org |
| `getGroup` | `GET` | `/warmup/group/:id` | Group by id |
| `createGroup` | `POST` | `/warmup/group` | Create group |
| `createGroupWithWarmups` | `POST` | `/warmup/group/with-warmups` | Create group + warmups |
| `updateGroup` | `PATCH` | `/warmup/group` | Update group |
| `deleteGroup` | `DELETE` | `/warmup/group/:id` | Delete group |
| `getAll` | `GET` | `/warmup/all` | Warmups by group |
| `get` | `GET` | `/warmup/:id` | Warmup by id |
| `create` | `POST` | `/warmup` | Create warmup |
| `update` | `PATCH` | `/warmup` | Update warmup |
| `delete` | `DELETE` | `/warmup/:id` | Delete warmup |

### Behavior Notes
- Group create/update/delete requires `itemUpdater` or `dictator`.
- Group reads enforce org access unless `dictator`.
- `createGroupWithWarmups` creates parent group and child warmups in one API call.
- `create` verifies the referenced warmup group exists.

## `workoutRouter` (`packages/api/src/routers/workout.ts`)

### Endpoints
| Procedure | Method | Path | Summary |
|---|---|---|---|
| `getAll` | `GET` | `/workout/all` | Dictator-only all workouts |
| `getAllOrg` | `GET` | `/workout/org` | Org workouts with deep relations |
| `get` | `GET` | `/workout/:id` | Workout by id with deep relations |
| `create` | `POST` | `/workout` | Create workout |
| `update` | `PATCH` | `/workout` | Update workout |
| `delete` | `DELETE` | `/workout/:id` | Delete workout |
| `addExercise` | `POST` | `/workout/exercise/add` | Add workout exercise link |
| `removeExercise` | `DELETE` | `/workout/exercise/remove` | Remove workout exercise link |
| `addSuperSet` | `POST` | `/workout/superset/add` | Add superset link |
| `removeSuperSet` | `DELETE` | `/workout/superset/remove` | Remove superset link |

### Behavior Notes
- `getAllOrg` and `get` load nested exercise movement data, supersets with member exercises, and warmup groups.
- `getAll`/`getAllOrg` map creator and organization derived fields.
- Mutation endpoints require `itemUpdater` or `dictator`.
- Link endpoints validate parent/child existence; superset add enforces `exercise.isSuperSet = true`.

## `blockTemplateRouter` (`packages/api/src/routers/block-template.ts`)

### Endpoints
| Procedure | Method | Path | Summary |
|---|---|---|---|
| `getAll` | `GET` | `/block-template/all` | Dictator-only all block templates |
| `getAllOrg` | `GET` | `/block-template/org` | Org block templates |
| `get` | `GET` | `/block-template/:id` | Block template by id |
| `create` | `POST` | `/block-template` | Create block template |
| `update` | `PATCH` | `/block-template` | Update block template |
| `delete` | `DELETE` | `/block-template/:id` | Delete block template |
| `addWorkout` | `POST` | `/block-template/workout/add` | Add workout link |
| `removeWorkout` | `DELETE` | `/block-template/workout/remove` | Remove workout link |

### Behavior Notes
- `getAllOrg` deeply loads workouts, exercises, supersets, movements, and warmups ordered by index.
- Org reads enforce org access unless `dictator`.
- Mutations require `itemUpdater` or `dictator`.
- `addWorkout` verifies both block template and workout exist before linking.

## `menuTemplateRouter` (`packages/api/src/routers/menu-template.ts`)

### Endpoints
| Procedure | Method | Path | Summary |
|---|---|---|---|
| `getAll` | `GET` | `/menu-template/all` | Dictator-only all menu templates |
| `getAllOrg` | `GET` | `/menu-template/org` | Org menu templates |
| `get` | `GET` | `/menu-template/:id` | Menu template by id |
| `create` | `POST` | `/menu-template` | Create menu template |
| `update` | `PATCH` | `/menu-template` | Update menu template |
| `delete` | `DELETE` | `/menu-template/:id` | Delete menu template |
| `createMeal` | `POST` | `/menu-template/meal` | Create template meal |
| `updateMeal` | `PATCH` | `/menu-template/meal` | Rename template meal |
| `deleteMeal` | `DELETE` | `/menu-template/meal/:id` | Delete template meal |
| `addRecipe` | `POST` | `/menu-template/recipe/add` | Link recipe into template |
| `removeRecipe` | `DELETE` | `/menu-template/recipe/remove` | Remove recipe link |

### Behavior Notes
- Supports dual-index template scheduling (`mealIndex`, `recipeIndex`).
- Org reads enforce org access unless `dictator`.
- Mutations require `itemUpdater` or `dictator`.
- `addRecipe` validates both menu template and recipe existence.

## `userMenuRouter` (`packages/api/src/routers/user-menu.ts`)

### Endpoints
| Procedure | Method | Path | Summary |
|---|---|---|---|
| `getByUser` | `GET` | `/user-menu/by-user` | Menus for one user |
| `getTemplatesOrg` | `GET` | `/user-menu/templates/org` | Template menus for one org |
| `get` | `GET` | `/user-menu/:id` | One menu with nested data |
| `create` | `POST` | `/user-menu` | Create menu assignment |
| `createTemplate` | `POST` | `/user-menu/template` | Create template in user-menu storage |
| `batchCreate` | `POST` | `/user-menu/batch` | Create menu/template + all nested children |
| `batchUpdate` | `POST` | `/user-menu/batch-update` | Replace all nested children + menu update |
| `update` | `POST` | `/user-menu/update` | Update menu fields |
| `delete` | `POST` | `/user-menu/delete` | Delete menu |
| `createMeal` | `POST` | `/user-menu/meal` | Create meal |
| `updateMeal` | `POST` | `/user-menu/meal/update` | Update meal |
| `deleteMeal` | `POST` | `/user-menu/meal/delete` | Delete meal |
| `createRecipe` | `POST` | `/user-menu/recipe` | Create recipe row |
| `updateRecipe` | `POST` | `/user-menu/recipe/update` | Update recipe row |
| `deleteRecipe` | `POST` | `/user-menu/recipe/delete` | Delete recipe row |
| `createIngredient` | `POST` | `/user-menu/ingredient` | Create ingredient row |
| `updateIngredient` | `POST` | `/user-menu/ingredient/update` | Update ingredient row |
| `swapIngredient` | `POST` | `/user-menu/ingredient/swap` | Set alternative ingredient fields |
| `deleteIngredient` | `POST` | `/user-menu/ingredient/delete` | Delete ingredient row |

### Behavior Notes
- Access model:
- user can mutate own menus,
- `dictator` can mutate any,
- some read paths allow same-org visibility checks.
- `getTemplatesOrg` uses org-user ids + `isTemplate` filtering.
- `createTemplate` copies source recipes and their ingredients into template rows under `user_menu` domain.
- `batchCreate` supports template mode:
- `isTemplate = true` -> null dates and inactive,
- non-template -> assignment with dates and active state.
- `batchUpdate` strategy is delete children then recreate meals/recipes/ingredients in one transaction.
- `createMeal` defaults missing macros to `0`.

### Exported Utility
- `generateRandomUserMenuTemplatesForOrg({ organisationId, total })`:
- requires org users and at least 3 org recipes,
- generates random template menus with meals/recipes/ingredient copies,
- computes recipe and average meal macros from ingredient ratios.
- used by `adminSetup.generateUserMenuTemplates`.

## `adminSetupRouter` (`packages/api/src/routers/admin-setup.ts`)

### Endpoints
| Procedure | Method | Path | Summary |
|---|---|---|---|
| `generateDummyData` | `POST` | `/admin-setup/generate-dummy-data` | Create sample org/user/content data |
| `importBaseIngredients` | `POST` | `/admin-setup/import-base-ingredients` | Import base ingredients from CSV |
| `importExercises` | `POST` | `/admin-setup/import-exercises` | Import base movements from JSON |
| `generateRecipes` | `POST` | `/admin-setup/generate-recipes` | Generate org recipes |
| `generateExercises` | `POST` | `/admin-setup/generate-exercises` | Generate org exercises |
| `generateWarmups` | `POST` | `/admin-setup/generate-warmups` | Generate org warmup groups |
| `generateWorkouts` | `POST` | `/admin-setup/generate-workouts` | Generate org workouts |
| `generateBlockTemplates` | `POST` | `/admin-setup/generate-block-templates` | Generate org block templates |
| `generateUserMenuTemplates` | `POST` | `/admin-setup/generate-user-menu-templates` | Generate org user-menu templates |
| `generateUsers` | `POST` | `/admin-setup/generate-users` | Generate users for org |
| `generatePlans` | `POST` | `/admin-setup/generate-plans` | Generate 4 plan records |

### Behavior Notes
- Most generators require `dictator` metatag.
- `importBaseIngredients`:
- parses two CSV files (`ingredient-solid.csv`, `ingredient-liquid.csv`),
- converts kJ -> calories,
- inserts as base ingredients with `isUserCreated = false`.
- `importExercises`:
- imports JSON movement library,
- upserts base movement rows via `onConflictDoUpdate`.
- `generateDummyData` creates 3 orgs with creators, members, subscriptions, and sample movements/ingredients.
- `generateRecipes` creates 10 recipes with random ingredient links.
- `generateExercises` creates 10 exercise rows with random training parameters.
- `generateWarmups` creates 5 warmup groups with 2-4 warmups each.
- `generateWorkouts` creates 10-20 workouts with 4-8 linked exercises and optional warmup group.
- `generateBlockTemplates` creates 10 templates with linked workouts and rest-day index.
- `generateUserMenuTemplates` delegates to `generateRandomUserMenuTemplatesForOrg`.
- `generatePlans` seeds Starter/Pro/Elite/Enterprise (Enterprise hidden).

## `aiRouter` (`packages/api/src/routers/ai.ts`)

### Endpoints
| Procedure | Method | Path | Summary |
|---|---|---|---|
| `test` | `POST` | `/ai/test` | Provider connectivity test |
| `updateRecipeForm` | `POST` | `/ai/update-recipe-form` | AI-assisted recipe form updates |
| `updateUserMenuForm` | `POST` | `/ai/update-user-menu-form` | AI-assisted user menu form updates |

### Behavior Notes
- Access requires `itemUpdater` or `dictator`.
- Uses external OpenAI-compatible endpoint:
- `POST https://opencode.ai/zen/v1/chat/completions`
- auth header from `env.ZEN_API_KEY`
- default model `kimi-k2.5`
- requests JSON object responses (`response_format: { type: 'json_object' }`).
- Includes robust model output parsing:
- direct JSON parse,
- fenced-code JSON extraction,
- best-effort brace extraction.
- Strong post-model normalization/validation:
- validates response with Zod schemas,
- enforces allowed ingredient/recipe ids,
- normalizes dates to `YYYY-MM-DD|null`,
- de-duplicates IDs and tags,
- recalculates nutrition macros from serve-size ratios,
- rounds numeric values to 1 decimal.
- `updateUserMenuForm` has two modes:
- `thinking`: can restructure meals/recipes/ingredients,
- `fast`: structure-preserving, ratio-only ingredient serve-size adjustments.

## Notes on API Shape and Evolution

- Both `menuTemplateRouter` and `userMenuRouter` are mounted.
- Current web flows primarily use `userMenu` for template workflows, while legacy `menuTemplate` endpoints still exist.
- Procedure path syntax is mixed (`:id` and `{id}` styles) depending on file.
- Input contracts are primarily sourced from `packages/api/src/schemas/*` and enforced per procedure.
