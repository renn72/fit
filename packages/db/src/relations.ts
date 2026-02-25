import * as auth from './schema/auth'
import * as blockTemplate from './schema/block-template'
import * as exercise from './schema/exercise'
import * as ingredient from './schema/ingredient'
import * as menuTemplate from './schema/menu-template'
import * as movement from './schema/movement'
import * as org from './schema/org'
import * as recipe from './schema/recipe'
import * as userMenu from './schema/user-menu'
import * as warmup from './schema/warmup'
import * as workout from './schema/workout'

import { defineRelations } from 'drizzle-orm'

const schema = {
	...org,
	...auth,
	...movement,
	...ingredient,
	...recipe,
	...exercise,
	...workout,
	...warmup,
	...blockTemplate,
	...menuTemplate,
	...userMenu,
}

export const relations = defineRelations(schema, (r) => ({
	// ***************** User *******************
	user: {
		sessions: r.many.session(),
		accounts: r.many.account(),
		settings: r.one.userSettings({
			from: r.user.id,
			to: r.userSettings.userId,
		}),
		toggles: r.one.userToggles({
			from: r.user.id,
			to: r.userToggles.userId,
		}),
		organisationCreator: r.one.organisation({
			from: r.user.organisationCreatorId,
			to: r.organisation.id,
			alias: 'creator',
		}),
		organisationMember: r.one.organisation({
			from: r.user.organisationId,
			to: r.organisation.id,
			alias: 'member',
		}),
		ingredients: r.many.ingredient({
			from: r.user.id,
			to: r.ingredient.creatorId,
		}),
		recipes: r.many.recipe({
			from: r.user.id,
			to: r.recipe.creatorId,
		}),
		movements: r.many.movement({
			from: r.user.id,
			to: r.movement.creatorId,
		}),
		exercises: r.many.exercise({
			from: r.user.id,
			to: r.exercise.creatorId,
		}),
		workouts: r.many.workout({
			from: r.user.id,
			to: r.workout.creatorId,
		}),
		userMenus: r.many.userMenu({
			from: r.user.id,
			to: r.userMenu.userId,
		}),
	},

	// ***************** User Settings *******************
	userSettings: {
		user: r.one.user({
			from: r.userSettings.userId,
			to: r.user.id,
		}),
	},

	// ***************** User Toggles *******************
	userToggles: {
		user: r.one.user({
			from: r.userToggles.userId,
			to: r.user.id,
		}),
	},

	// ***************** Account *******************
	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id,
		}),
	},

	session: {
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id,
		}),
	},

	// ***************** Organisation *******************
	organisation: {
		creator: r.one.user({
			from: r.organisation.creatorId,
			to: r.user.id,
			alias: 'creator',
		}),
		members: r.many.user({
			from: r.organisation.id,
			to: r.user.organisationId,
			alias: 'member',
		}),
		subscriptions: r.many.subscription({
			from: r.organisation.id,
			to: r.subscription.organisationId,
		}),
		ingredients: r.many.ingredient({
			from: r.organisation.id,
			to: r.ingredient.organisationId,
		}),
		recipes: r.many.recipe({
			from: r.organisation.id,
			to: r.recipe.organisationId,
		}),
		movements: r.many.movement({
			from: r.organisation.id,
			to: r.movement.organisationId,
		}),
		exercises: r.many.exercise({
			from: r.organisation.id,
			to: r.exercise.organisationId,
		}),
		workouts: r.many.workout({
			from: r.organisation.id,
			to: r.workout.organisationId,
		}),
	},

	// ***************** Movement *******************
	movement: {
		creator: r.one.user({
			from: r.movement.creatorId,
			to: r.user.id,
		}),
		organisation: r.one.organisation({
			from: r.movement.organisationId,
			to: r.organisation.id,
		}),
		baseMovement: r.one.movement({
			from: r.movement.baseId,
			to: r.movement.id,
		}),
		overrides: r.many.movement({
			from: r.movement.id,
			to: r.movement.baseId,
		}),
		exercises: r.many.exercise({
			from: r.movement.id,
			to: r.exercise.movementId,
		}),
	},

	// ***************** Exercise *******************
	exercise: {
		creator: r.one.user({
			from: r.exercise.creatorId,
			to: r.user.id,
		}),
		organisation: r.one.organisation({
			from: r.exercise.organisationId,
			to: r.organisation.id,
		}),
		movement: r.one.movement({
			from: r.exercise.movementId,
			to: r.movement.id,
		}),
		superSetExercises: r.many.superSetToExercise({
			from: r.exercise.id,
			to: r.superSetToExercise.superSetId,
			alias: 'superSetParent',
		}),
		parentSuperSets: r.many.superSetToExercise({
			from: r.exercise.id,
			to: r.superSetToExercise.exerciseId,
			alias: 'superSetChild',
		}),
	},

	// ***************** Ingredient *******************
	ingredient: {
		creator: r.one.user({
			from: r.ingredient.creatorId,
			to: r.user.id,
		}),
		organisation: r.one.organisation({
			from: r.ingredient.organisationId,
			to: r.organisation.id,
		}),
		baseIngredient: r.one.ingredient({
			from: r.ingredient.baseId,
			to: r.ingredient.id,
		}),
		overrides: r.many.ingredient({
			from: r.ingredient.id,
			to: r.ingredient.baseId,
		}),
		recipes: r.many.recipeToIngredient({
			from: r.ingredient.id,
			to: r.recipeToIngredient.ingredientId,
		}),
		userIngredients: r.many.userIngredient({
			from: r.ingredient.id,
			to: r.userIngredient.ingredientId,
		}),
		altUserIngredients: r.many.userIngredient({
			from: r.ingredient.id,
			to: r.userIngredient.altIngredientId,
		}),
	},

	// ***************** Recipe *******************
	recipe: {
		creator: r.one.user({
			from: r.recipe.creatorId,
			to: r.user.id,
		}),
		organisation: r.one.organisation({
			from: r.recipe.organisationId,
			to: r.organisation.id,
		}),
		ingredients: r.many.recipeToIngredient({
			from: r.recipe.id,
			to: r.recipeToIngredient.recipeId,
		}),
		menuTemplates: r.many.menuTemplateToRecipe({
			from: r.recipe.id,
			to: r.menuTemplateToRecipe.recipeId,
		}),
	},

	// ***************** Recipe To Ingredient *******************
	recipeToIngredient: {
		recipe: r.one.recipe({
			from: r.recipeToIngredient.recipeId,
			to: r.recipe.id,
		}),
		ingredient: r.one.ingredient({
			from: r.recipeToIngredient.ingredientId,
			to: r.ingredient.id,
		}),
		altIngredient: r.one.ingredient({
			from: r.recipeToIngredient.altIngredientId,
			to: r.ingredient.id,
		}),
	},

	// ***************** Super Set To Exercise *******************
	superSetToExercise: {
		superSet: r.one.exercise({
			from: r.superSetToExercise.superSetId,
			to: r.exercise.id,
			alias: 'superSetParent',
		}),
		exercise: r.one.exercise({
			from: r.superSetToExercise.exerciseId,
			to: r.exercise.id,
			alias: 'superSetChild',
		}),
	},

	// ***************** Workout *******************
	workout: {
		creator: r.one.user({
			from: r.workout.creatorId,
			to: r.user.id,
		}),
		organisation: r.one.organisation({
			from: r.workout.organisationId,
			to: r.organisation.id,
		}),
		warmupGroup: r.one.warmupGroup({
			from: r.workout.warmupGroupId,
			to: r.warmupGroup.id,
		}),
		exercises: r.many.workoutToExercise({
			from: r.workout.id,
			to: r.workoutToExercise.workoutId,
		}),
		superSets: r.many.workoutToSuperSet({
			from: r.workout.id,
			to: r.workoutToSuperSet.workoutId,
		}),
		blockTemplates: r.many.blockTemplateToWorkout({
			from: r.workout.id,
			to: r.blockTemplateToWorkout.workoutId,
		}),
	},

	// ***************** Workout To Exercise *******************
	workoutToExercise: {
		workout: r.one.workout({
			from: r.workoutToExercise.workoutId,
			to: r.workout.id,
		}),
		exercise: r.one.exercise({
			from: r.workoutToExercise.exerciseId,
			to: r.exercise.id,
		}),
	},

	// ***************** Workout To SuperSet *******************
	workoutToSuperSet: {
		workout: r.one.workout({
			from: r.workoutToSuperSet.workoutId,
			to: r.workout.id,
		}),
		superSet: r.one.exercise({
			from: r.workoutToSuperSet.superSetId,
			to: r.exercise.id,
		}),
	},

	// ***************** Warmup Group *******************
	warmupGroup: {
		creator: r.one.user({
			from: r.warmupGroup.creatorId,
			to: r.user.id,
		}),
		organisation: r.one.organisation({
			from: r.warmupGroup.organisationId,
			to: r.organisation.id,
		}),
		warmups: r.many.warmup({
			from: r.warmupGroup.id,
			to: r.warmup.warmupGroupId,
		}),
		workouts: r.many.workout({
			from: r.warmupGroup.id,
			to: r.workout.warmupGroupId,
		}),
	},

	// ***************** Warmup *******************
	warmup: {
		warmupGroup: r.one.warmupGroup({
			from: r.warmup.warmupGroupId,
			to: r.warmupGroup.id,
		}),
	},

	// ***************** Subscription *******************
	subscription: {
		organisation: r.one.organisation({
			from: r.subscription.organisationId,
			to: r.organisation.id,
		}),
		plan: r.one.plan({
			from: r.subscription.planId,
			to: r.plan.id,
		}),
	},

	// ***************** Plan *******************
	plan: {
		subscriptions: r.many.subscription({
			from: r.plan.id,
			to: r.subscription.planId,
		}),
		codes: r.many.planCode({
			from: r.plan.id,
			to: r.planCode.planId,
		}),
	},

	// ***************** Plan Code *******************
	planCode: {
		plan: r.one.plan({
			from: r.planCode.planId,
			to: r.plan.id,
		}),
	},

	// ***************** Block Template *******************
	blockTemplate: {
		creator: r.one.user({
			from: r.blockTemplate.creatorId,
			to: r.user.id,
		}),
		organisation: r.one.organisation({
			from: r.blockTemplate.organisationId,
			to: r.organisation.id,
		}),
		workouts: r.many.blockTemplateToWorkout({
			from: r.blockTemplate.id,
			to: r.blockTemplateToWorkout.blockTemplateId,
		}),
	},

	// ***************** Block Template To Workout *******************
	blockTemplateToWorkout: {
		blockTemplate: r.one.blockTemplate({
			from: r.blockTemplateToWorkout.blockTemplateId,
			to: r.blockTemplate.id,
		}),
		workout: r.one.workout({
			from: r.blockTemplateToWorkout.workoutId,
			to: r.workout.id,
		}),
	},

	// ***************** Menu Template *******************
	menuTemplate: {
		creator: r.one.user({
			from: r.menuTemplate.creatorId,
			to: r.user.id,
		}),
		organisation: r.one.organisation({
			from: r.menuTemplate.organisationId,
			to: r.organisation.id,
		}),
		recipes: r.many.menuTemplateToRecipe({
			from: r.menuTemplate.id,
			to: r.menuTemplateToRecipe.menuTemplateId,
		}),
	},

	// ***************** Menu Template To Recipe *******************
	menuTemplateToRecipe: {
		menuTemplate: r.one.menuTemplate({
			from: r.menuTemplateToRecipe.menuTemplateId,
			to: r.menuTemplate.id,
		}),
		recipe: r.one.recipe({
			from: r.menuTemplateToRecipe.recipeId,
			to: r.recipe.id,
		}),
	},

	// ***************** User Menu *******************
	userMenu: {
		user: r.one.user({
			from: r.userMenu.userId,
			to: r.user.id,
		}),
		meals: r.many.userMeal({
			from: r.userMenu.id,
			to: r.userMeal.userMenuId,
		}),
		recipes: r.many.userRecipe({
			from: r.userMenu.id,
			to: r.userRecipe.userMenuId,
		}),
		ingredients: r.many.userIngredient({
			from: r.userMenu.id,
			to: r.userIngredient.userMenuId,
		}),
	},

	// ***************** User Meal *******************
	userMeal: {
		userMenu: r.one.userMenu({
			from: r.userMeal.userMenuId,
			to: r.userMenu.id,
		}),
	},

	// ***************** User Recipe *******************
	userRecipe: {
		userMenu: r.one.userMenu({
			from: r.userRecipe.userMenuId,
			to: r.userMenu.id,
		}),
	},

	// ***************** User Ingredient *******************
	userIngredient: {
		userMenu: r.one.userMenu({
			from: r.userIngredient.userMenuId,
			to: r.userMenu.id,
		}),
		ingredient: r.one.ingredient({
			from: r.userIngredient.ingredientId,
			to: r.ingredient.id,
		}),
		altIngredient: r.one.ingredient({
			from: r.userIngredient.altIngredientId,
			to: r.ingredient.id,
		}),
	},
}))
