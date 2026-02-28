import type { MacroTotals, Meal } from './types'

export function calculateMealTotals(meal: Meal): MacroTotals {
	return meal.recipes.reduce(
		(totals, recipe) => ({
			calories: totals.calories + recipe.calories,
			protein: totals.protein + recipe.protein,
			fat: totals.fat + recipe.fat,
			carbohydrate: totals.carbohydrate + recipe.carbohydrate,
		}),
		{ calories: 0, protein: 0, fat: 0, carbohydrate: 0 },
	)
}

export function getSourceRecipeTotals(recipe: any): MacroTotals {
	if (!recipe) {
		return { calories: 0, protein: 0, fat: 0, carbohydrate: 0 }
	}

	const totals = (recipe.ingredients || []).reduce(
		(acc: MacroTotals, ing: any) => {
			const ingredient = ing.ingredient
			if (!ingredient || !ingredient.serveSize || ingredient.serveSize <= 0) {
				return acc
			}

			const ratio = ing.amount / ingredient.serveSize
			return {
				calories: acc.calories + ingredient.calories * ratio,
				protein: acc.protein + ingredient.protein * ratio,
				fat: acc.fat + ingredient.fat * ratio,
				carbohydrate: acc.carbohydrate + ingredient.carbohydrate * ratio,
			}
		},
		{ calories: 0, protein: 0, fat: 0, carbohydrate: 0 },
	)

	return totals
}
