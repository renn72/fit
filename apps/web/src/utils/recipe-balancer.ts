import { inv, matrix, multiply } from 'mathjs'
import { roundToIngredientPrecision } from '@/utils/ingredient-precision'

/**
 * Solves for ingredient quantities to meet calorie and protein targets best with 2 ingredients.
 *
 * @param proteinPerGram - Array of protein contribution per gram for each ingredient.
 * @param caloriesPerGram - Array of calorie contribution per gram for each ingredient.
 * @param targetProtein - Target protein in grams.
 * @param targetCalories - Target calories.
 * @returns Ingredient quantities in grams or an error message.
 */
export function balanceRecipe(
	proteinPerGram: number[],
	caloriesPerGram: number[],
	targetProtein: number,
	targetCalories: number,
	precisions: number[],
): number[] {
	// Validate input lengths
	if (
		proteinPerGram.length !== caloriesPerGram.length ||
		proteinPerGram.length !== precisions.length
	) {
		throw new Error('Protein and calorie arrays must have the same length.')
	}

	// Create the coefficient matrix
	const coefficients = matrix([proteinPerGram, caloriesPerGram])

	// Create the constants vector
	const constants = matrix([targetProtein, targetCalories])

	// Solve using the inverse of the coefficients matrix
	try {
		const exactSolution = multiply(
			inv(coefficients),
			constants,
		).toArray() as number[]
		const [exactA = 0, exactB = 0] = exactSolution
		const [precisionA, precisionB] = precisions
		const candidateAValues = new Set<number>()
		const candidateBValues = new Set<number>()

		const addCandidates = (
			values: Set<number>,
			center: number,
			precision: number,
		) => {
			const roundedCenter = roundToIngredientPrecision(center, precision)
			for (let offset = -10; offset <= 10; offset++) {
				values.add(
					roundToIngredientPrecision(
						roundedCenter + offset * precision,
						precision,
					),
				)
			}
		}

		addCandidates(candidateAValues, exactA, precisionA)
		addCandidates(candidateBValues, exactB, precisionB)

		let bestSolution: number[] | null = null
		let bestError = Number.POSITIVE_INFINITY

		for (const amountA of candidateAValues) {
			for (const amountB of candidateBValues) {
				if (amountA < 0 || amountB < 0) continue

				const protein =
					proteinPerGram[0] * amountA + proteinPerGram[1] * amountB
				const calories =
					caloriesPerGram[0] * amountA + caloriesPerGram[1] * amountB
				const proteinError = protein - targetProtein
				const calorieError = calories - targetCalories
				const normalizedError =
					(proteinError / Math.max(targetProtein, 1)) ** 2 +
					(calorieError / Math.max(targetCalories, 1)) ** 2

				if (normalizedError < bestError) {
					bestError = normalizedError
					bestSolution = [amountA, amountB]
				}
			}
		}

		return bestSolution ?? exactSolution
	} catch (error) {
		throw new Error('Unable to solve the system. Ensure the inputs are valid.')
	}
}

/**
 * Identifies the best 2 ingredients to use for balancing based on protein and calorie density.
 * - Selects ingredient with highest protein per gram
 * - Selects ingredient with highest calories per gram (if same as protein, uses next highest)
 *
 * @param ingredients - Array of ingredients with their nutritional values
 * @returns Indices of the 2 selected ingredients [proteinIngredientIndex, calorieIngredientIndex]
 */
export function selectIngredientsForBalancing(
	ingredients: Array<{ protein: number; calories: number; serveSize: number }>,
): [number, number] {
	if (ingredients.length < 2) {
		throw new Error('Need at least 2 ingredients to balance')
	}

	// Calculate protein per gram and calories per gram for each ingredient
	const densities = ingredients.map((ing) => ({
		proteinPerGram: ing.serveSize > 0 ? ing.protein / ing.serveSize : 0,
		caloriesPerGram: ing.serveSize > 0 ? ing.calories / ing.serveSize : 0,
	}))

	// Find ingredient with highest protein per gram
	let highestProteinIndex = 0
	let highestProteinValue = densities[0].proteinPerGram

	for (let i = 1; i < densities.length; i++) {
		if (densities[i].proteinPerGram > highestProteinValue) {
			highestProteinValue = densities[i].proteinPerGram
			highestProteinIndex = i
		}
	}

	// Find ingredient with highest calories per gram (different from protein ingredient)
	let highestCalorieIndex = -1
	let highestCalorieValue = -1

	for (let i = 0; i < densities.length; i++) {
		if (i === highestProteinIndex) continue // Skip the protein ingredient
		if (densities[i].caloriesPerGram > highestCalorieValue) {
			highestCalorieValue = densities[i].caloriesPerGram
			highestCalorieIndex = i
		}
	}

	// If we only had 2 ingredients and both had same index, return indices 0 and 1
	if (highestCalorieIndex === -1) {
		highestCalorieIndex = highestProteinIndex === 0 ? 1 : 0
	}

	return [highestProteinIndex, highestCalorieIndex]
}

/**
 * Checks if solution values are valid (non-negative and finite).
 */
export function isValidSolution(values: number[]): boolean {
	return values.every((val) => Number.isFinite(val) && val >= 0)
}
