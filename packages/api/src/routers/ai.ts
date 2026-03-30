import { db } from '@fit/db'
import { env } from '@fit/env/server'

import { getAiFeatureAccessForOrganisation } from './feature'

import { randomUUID } from 'node:crypto'
import { ORPCError } from '@orpc/server'
import { protectedProcedure } from '../index'
import {
	normalizeIngredientPrecision,
	roundToIngredientPrecision,
} from '../lib/ingredient-precision'
import {
	AiRecipeFormStateInput,
	AiRecipeUpdateInput,
	AiRecipeUpdateOutput,
	AiTestInput,
	AiUserMenuFormStateInput,
	AiUserMenuUpdateInput,
	AiUserMenuUpdateOutput,
} from '../schemas/ai'

type OpenAICompatibleChatCompletionResponse = {
	choices?: Array<{
		message?: {
			content?:
				| string
				| Array<{
						text?: string
				  }>
				| null
		}
	}>
}

type IngredientForAiContext = {
	id: string
	name: string
	category: string
	isBase: boolean
	serveSize: number
	serveUnit: string
	precision: number
	calories: number
	protein: number
	fat: number
	carbohydrate: number
}

type RecipeIngredientForAiContext = {
	ingredientId: string
	ingredientName: string
	amount: number
	unit: string
	isBaseIngredient: boolean
	altIngredientId: string | null
	altIngredientName: string | null
	calories: number
	protein: number
	fat: number
	carbohydrate: number
}

type RecipeForAiContext = {
	id: string
	name: string
	description: string | null
	category: string | null
	image: string | null
	metaTags: string
	ingredients: RecipeIngredientForAiContext[]
	totalCalories: number
	totalProtein: number
	totalFat: number
	totalCarbohydrate: number
}

type AiUserMenuFormState = (typeof AiUserMenuFormStateInput)['_output']

function roundOneDecimal(value: number): number {
	return Math.round(value * 10) / 10
}

function extractMessageText(
	content: OpenAICompatibleChatCompletionResponse['choices'],
) {
	const messageContent = content?.[0]?.message?.content

	if (typeof messageContent === 'string') {
		return messageContent.trim()
	}

	if (Array.isArray(messageContent)) {
		return messageContent
			.map((part) => part?.text ?? '')
			.join('\n')
			.trim()
	}

	return ''
}

function parseModelJsonResponse(content: string): unknown {
	const trimmed = content.trim()
	if (!trimmed) {
		throw new ORPCError('INTERNAL_SERVER_ERROR', {
			message: 'AI provider returned an empty response',
		})
	}

	try {
		return JSON.parse(trimmed)
	} catch {
		const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)
		if (codeBlockMatch?.[1]) {
			try {
				return JSON.parse(codeBlockMatch[1].trim())
			} catch {
				// fall through
			}
		}

		const firstBrace = trimmed.indexOf('{')
		const lastBrace = trimmed.lastIndexOf('}')
		if (firstBrace !== -1 && lastBrace > firstBrace) {
			try {
				return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1))
			} catch {
				// fall through
			}
		}
	}

	throw new ORPCError('INTERNAL_SERVER_ERROR', {
		message: 'AI provider did not return valid JSON',
	})
}

function normalizeTags(tags: string[]): string[] {
	return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))]
}

function normalizeNullableDateInput(value: string | null): string | null {
	const trimmed = value?.trim() ?? ''
	if (!trimmed) return null

	const parsed = new Date(trimmed)
	if (Number.isNaN(parsed.getTime())) {
		return null
	}

	return parsed.toISOString().slice(0, 10)
}

function toUniqueId(baseId: string, used: Set<string>) {
	const trimmed = baseId.trim()
	if (trimmed && !used.has(trimmed)) {
		used.add(trimmed)
		return trimmed
	}

	const generated = randomUUID()
	used.add(generated)
	return generated
}

async function getIngredientsForAiContext(
	organisationId: string,
): Promise<IngredientForAiContext[]> {
	const orgIngredientsRaw = await db.query.ingredient.findMany({
		where: {
			organisationId,
			isUserCreated: false,
		},
	})

	const overwrittenBaseIds = orgIngredientsRaw
		.map((item) => item.baseId)
		.filter((id): id is string => id !== null)

	const baseIngredientsRaw = await db.query.ingredient.findMany({
		where: {
			isBase: true,
			isUserCreated: false,
		},
	})

	const availableBaseIngredients = baseIngredientsRaw.filter(
		(item) => !overwrittenBaseIds.includes(item.id),
	)

	return [
		...orgIngredientsRaw.map((item) => ({
			id: item.id,
			name: item.name,
			category: item.category ?? '',
			isBase: false,
			serveSize: roundOneDecimal(item.serveSize),
			serveUnit: item.serveUnit,
			precision: normalizeIngredientPrecision(item.precision),
			calories: roundOneDecimal(item.calories),
			protein: roundOneDecimal(item.protein),
			fat: roundOneDecimal(item.fat),
			carbohydrate: roundOneDecimal(item.carbohydrate),
		})),
		...availableBaseIngredients.map((item) => ({
			id: item.id,
			name: item.name,
			category: item.category ?? '',
			isBase: true,
			serveSize: roundOneDecimal(item.serveSize),
			serveUnit: item.serveUnit,
			precision: normalizeIngredientPrecision(item.precision),
			calories: roundOneDecimal(item.calories),
			protein: roundOneDecimal(item.protein),
			fat: roundOneDecimal(item.fat),
			carbohydrate: roundOneDecimal(item.carbohydrate),
		})),
	]
}

async function getRecipesForAiContext(
	organisationId: string,
): Promise<RecipeForAiContext[]> {
	const recipesRaw = await db.query.recipe.findMany({
		where: { organisationId },
		with: {
			ingredients: {
				with: {
					ingredient: true,
					altIngredient: true,
				},
			},
		},
	})

	return recipesRaw.map((recipe) => {
		const ingredients = recipe.ingredients.map((item) => {
			const ingredient = item.ingredient
			const ratio =
				ingredient && ingredient.serveSize > 0
					? item.amount / ingredient.serveSize
					: 0

			return {
				ingredientId: item.ingredientId,
				ingredientName: ingredient?.name ?? 'Unknown',
				amount: roundOneDecimal(item.amount),
				unit: item.unit,
				isBaseIngredient: item.isBaseIngredient,
				altIngredientId: item.altIngredientId ?? null,
				altIngredientName: item.altIngredient?.name ?? null,
				calories: roundOneDecimal((ingredient?.calories ?? 0) * ratio),
				protein: roundOneDecimal((ingredient?.protein ?? 0) * ratio),
				fat: roundOneDecimal((ingredient?.fat ?? 0) * ratio),
				carbohydrate: roundOneDecimal((ingredient?.carbohydrate ?? 0) * ratio),
			}
		})

		const totals = ingredients.reduce(
			(acc, item) => ({
				calories: acc.calories + item.calories,
				protein: acc.protein + item.protein,
				fat: acc.fat + item.fat,
				carbohydrate: acc.carbohydrate + item.carbohydrate,
			}),
			{ calories: 0, protein: 0, fat: 0, carbohydrate: 0 },
		)

		return {
			id: recipe.id,
			name: recipe.name,
			description: recipe.description ?? null,
			category: recipe.category ?? null,
			image: recipe.image ?? null,
			metaTags: recipe.metaTags ?? '',
			ingredients,
			totalCalories: roundOneDecimal(totals.calories),
			totalProtein: roundOneDecimal(totals.protein),
			totalFat: roundOneDecimal(totals.fat),
			totalCarbohydrate: roundOneDecimal(totals.carbohydrate),
		}
	})
}

function calculateIngredientMacrosFromServeSize(
	ingredient: IngredientForAiContext,
	serveSize: number,
) {
	const normalizedServeSize = roundToIngredientPrecision(
		Math.max(0, serveSize),
		ingredient.precision,
	)
	const ratio =
		ingredient.serveSize > 0 ? normalizedServeSize / ingredient.serveSize : 0

	return {
		serveSize: normalizedServeSize,
		ratio,
		calories: roundOneDecimal(ingredient.calories * ratio),
		protein: roundOneDecimal(ingredient.protein * ratio),
		fat: roundOneDecimal(ingredient.fat * ratio),
		carbohydrate: roundOneDecimal(ingredient.carbohydrate * ratio),
	}
}

function calculateRecipeMacroTotals(
	ingredients: Array<{
		calories: number
		protein: number
		fat: number
		carbohydrate: number
	}>,
) {
	return ingredients.reduce(
		(acc, item) => ({
			calories: acc.calories + item.calories,
			protein: acc.protein + item.protein,
			fat: acc.fat + item.fat,
			carbohydrate: acc.carbohydrate + item.carbohydrate,
		}),
		{ calories: 0, protein: 0, fat: 0, carbohydrate: 0 },
	)
}

function buildUserMenuIngredientMacroContext(
	currentForm: AiUserMenuFormState,
	availableIngredients: IngredientForAiContext[],
) {
	const availableIngredientMap = new Map(
		availableIngredients.map((ingredient) => [ingredient.id, ingredient]),
	)

	return currentForm.meals.map((meal) => ({
		mealId: meal.id,
		mealName: meal.name,
		recipes: meal.recipes.map((recipe) => ({
			recipeId: recipe.id,
			recipeName: recipe.recipeName,
			ingredients: recipe.ingredients.map((ingredientRow) => {
				const referenceIngredient = availableIngredientMap.get(
					ingredientRow.ingredientId,
				)
				const ratioDerivedMacros = referenceIngredient
					? calculateIngredientMacrosFromServeSize(
							referenceIngredient,
							ingredientRow.serveSize,
						)
					: null

				return {
					ingredientRowId: ingredientRow.id,
					ingredientId: ingredientRow.ingredientId,
					ingredientName: ingredientRow.ingredientName,
					currentServeSize: ingredientRow.serveSize,
					currentServeUnit: ingredientRow.serveUnit,
					currentMacros: {
						calories: ingredientRow.calories,
						protein: ingredientRow.protein,
						fat: ingredientRow.fat,
						carbohydrate: ingredientRow.carbohydrate,
					},
					referenceIngredient: referenceIngredient
						? {
								id: referenceIngredient.id,
								name: referenceIngredient.name,
								serveSize: referenceIngredient.serveSize,
								serveUnit: referenceIngredient.serveUnit,
								precision: referenceIngredient.precision,
								calories: referenceIngredient.calories,
								protein: referenceIngredient.protein,
								fat: referenceIngredient.fat,
								carbohydrate: referenceIngredient.carbohydrate,
							}
						: null,
					ratioVsReferenceServeSize: ratioDerivedMacros?.ratio ?? null,
					ratioDerivedMacros: ratioDerivedMacros
						? {
								calories: ratioDerivedMacros.calories,
								protein: ratioDerivedMacros.protein,
								fat: ratioDerivedMacros.fat,
								carbohydrate: ratioDerivedMacros.carbohydrate,
							}
						: null,
				}
			}),
		})),
	}))
}

function buildUserMenuFormPromptContext(currentForm: AiUserMenuFormState) {
	return {
		name: currentForm.name,
		description: currentForm.description,
		startDate: currentForm.startDate,
		endDate: currentForm.endDate,
		meals: currentForm.meals.map((meal) => ({
			id: meal.id,
			mealIndex: meal.mealIndex,
			name: meal.name,
			recipes: meal.recipes,
		})),
	}
}

async function requestZenChatCompletion({
	messages,
	model,
}: {
	messages: Array<{ role: 'system' | 'user'; content: string }>
	model?: string
}) {
	const resolvedModel = model?.trim() || env.ZEN_MODEL?.trim()

	if (!resolvedModel) {
		throw new ORPCError('INTERNAL_SERVER_ERROR', {
			message: 'AI model is not configured on the server',
		})
	}

	const response = await fetch('https://opencode.ai/zen/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.ZEN_API_KEY}`,
		},
		body: JSON.stringify({
			model: resolvedModel,
			temperature: 0.2,
			response_format: { type: 'json_object' },
			messages,
		}),
	})

	if (!response.ok) {
		const responseText = await response.text()
		throw new ORPCError('INTERNAL_SERVER_ERROR', {
			message:
				responseText.trim() ||
				`AI provider request failed with status ${response.status}`,
		})
	}

	return (await response.json()) as OpenAICompatibleChatCompletionResponse
}

function normalizeAndValidateAiRecipeForm(
	form: unknown,
	availableIngredients: IngredientForAiContext[],
) {
	const parsed = AiRecipeFormStateInput.safeParse(form)
	if (!parsed.success) {
		throw new ORPCError('INTERNAL_SERVER_ERROR', {
			message: `AI response has invalid shape: ${parsed.error.issues[0]?.message ?? 'unknown error'}`,
		})
	}

	const availableIngredientMap = new Map(
		availableIngredients.map((ingredient) => [ingredient.id, ingredient]),
	)
	const usedIds = new Set<string>()

	const normalizedIngredients = parsed.data.ingredients.map((item, index) => {
		const ingredient = availableIngredientMap.get(item.ingredientId)
		if (!ingredient) {
			throw new ORPCError('INTERNAL_SERVER_ERROR', {
				message: `AI selected unknown ingredientId at row ${index + 1}`,
			})
		}

		const altIngredientId = item.altIngredientId.trim()
		if (altIngredientId && !availableIngredientMap.has(altIngredientId)) {
			throw new ORPCError('INTERNAL_SERVER_ERROR', {
				message: `AI selected unknown altIngredientId at row ${index + 1}`,
			})
		}

		const baseId = item.id.trim() || randomUUID()
		const uniqueId = usedIds.has(baseId) ? randomUUID() : baseId
		usedIds.add(uniqueId)

		const unit = item.unit.trim() || ingredient.serveUnit
		const amount = roundToIngredientPrecision(item.amount, ingredient.precision)

		if (amount <= 0) {
			throw new ORPCError('INTERNAL_SERVER_ERROR', {
				message: `AI returned a non-positive amount at row ${index + 1}`,
			})
		}

		return {
			id: uniqueId,
			ingredientId: item.ingredientId,
			amount,
			unit,
			altIngredientId,
		}
	})

	return {
		name: parsed.data.name.trim(),
		description: parsed.data.description.trim(),
		image: parsed.data.image.trim(),
		categoryTags: normalizeTags(parsed.data.categoryTags),
		metaTags: normalizeTags(parsed.data.metaTags),
		ingredients: normalizedIngredients,
	}
}

function normalizeAndValidateAiUserMenuForm(
	form: unknown,
	availableIngredients: IngredientForAiContext[],
	availableRecipes: RecipeForAiContext[],
) {
	const parsed = AiUserMenuFormStateInput.safeParse(form)
	if (!parsed.success) {
		throw new ORPCError('INTERNAL_SERVER_ERROR', {
			message: `AI response has invalid shape: ${parsed.error.issues[0]?.message ?? 'unknown error'}`,
		})
	}

	const availableIngredientMap = new Map(
		availableIngredients.map((ingredient) => [ingredient.id, ingredient]),
	)
	const availableRecipeMap = new Map(
		availableRecipes.map((recipe) => [recipe.id, recipe]),
	)
	const availableRecipeNameMap = new Map(
		availableRecipes.map((recipe) => [
			recipe.name.trim().toLowerCase(),
			recipe,
		]),
	)

	const usedMealIds = new Set<string>()
	const usedRecipeIds = new Set<string>()
	const usedIngredientIds = new Set<string>()

	const normalizedMeals = parsed.data.meals.map((meal, mealIndex) => {
		const normalizedMealId = toUniqueId(meal.id, usedMealIds)
		const targetCalories =
			meal.targetCalories === null
				? null
				: roundOneDecimal(Math.max(0, meal.targetCalories))
		const targetProtein =
			meal.targetProtein === null
				? null
				: roundOneDecimal(Math.max(0, meal.targetProtein))

		const normalizedRecipes = meal.recipes.map((recipe, recipeIndex) => {
			const normalizedRecipeId = toUniqueId(recipe.id, usedRecipeIds)
			const requestedRecipeId = recipe.recipeId.trim()

			let resolvedRecipe = requestedRecipeId
				? availableRecipeMap.get(requestedRecipeId)
				: undefined
			if (requestedRecipeId && !resolvedRecipe) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', {
					message: `AI selected unknown recipeId at meal ${mealIndex + 1}, recipe ${recipeIndex + 1}`,
				})
			}

			if (!resolvedRecipe) {
				const nameKey = recipe.recipeName.trim().toLowerCase()
				resolvedRecipe = availableRecipeNameMap.get(nameKey)
			}

			const sourceIngredients =
				recipe.ingredients.length > 0
					? recipe.ingredients
					: resolvedRecipe
						? resolvedRecipe.ingredients.map((item) => ({
								id: randomUUID(),
								recipeToIngredientId: '',
								ingredientId: item.ingredientId,
								ingredientName: item.ingredientName,
								serveSize: item.amount,
								serveUnit: item.unit,
								precision:
									availableIngredientMap.get(item.ingredientId)?.precision ??
									0.1,
								calories: item.calories,
								protein: item.protein,
								fat: item.fat,
								carbohydrate: item.carbohydrate,
							}))
						: []

			const normalizedIngredients = sourceIngredients.map(
				(ingredientItem, ingredientIndex) => {
					const ingredientId = ingredientItem.ingredientId.trim()
					const ingredient = availableIngredientMap.get(ingredientId)
					if (!ingredient) {
						throw new ORPCError('INTERNAL_SERVER_ERROR', {
							message: `AI selected unknown ingredientId at meal ${mealIndex + 1}, recipe ${recipeIndex + 1}, ingredient ${ingredientIndex + 1}`,
						})
					}

					const normalizedIngredientId = toUniqueId(
						ingredientItem.id,
						usedIngredientIds,
					)
					const calculatedMacros = calculateIngredientMacrosFromServeSize(
						ingredient,
						ingredientItem.serveSize > 0
							? ingredientItem.serveSize
							: Math.max(ingredient.serveSize, 1),
					)

					return {
						id: normalizedIngredientId,
						recipeToIngredientId: ingredientItem.recipeToIngredientId.trim(),
						ingredientId: ingredient.id,
						ingredientName: ingredient.name,
						serveSize: calculatedMacros.serveSize,
						serveUnit: ingredientItem.serveUnit.trim() || ingredient.serveUnit,
						precision: ingredient.precision,
						calories: calculatedMacros.calories,
						protein: calculatedMacros.protein,
						fat: calculatedMacros.fat,
						carbohydrate: calculatedMacros.carbohydrate,
					}
				},
			)

			const totals = calculateRecipeMacroTotals(normalizedIngredients)

			return {
				id: normalizedRecipeId,
				recipeId: resolvedRecipe?.id ?? requestedRecipeId,
				recipeName:
					resolvedRecipe?.name ||
					recipe.recipeName.trim() ||
					`Recipe ${recipeIndex + 1}`,
				recipeIndex,
				calories: roundOneDecimal(totals.calories),
				protein: roundOneDecimal(totals.protein),
				fat: roundOneDecimal(totals.fat),
				carbohydrate: roundOneDecimal(totals.carbohydrate),
				ingredients: normalizedIngredients,
			}
		})

		return {
			id: normalizedMealId,
			mealIndex,
			name: meal.name.trim() || `Meal ${mealIndex + 1}`,
			targetCalories,
			targetProtein,
			recipes: normalizedRecipes,
		}
	})

	return {
		name: parsed.data.name.trim() || 'Untitled Menu',
		description: parsed.data.description
			? parsed.data.description.trim()
			: null,
		startDate: normalizeNullableDateInput(parsed.data.startDate),
		endDate: normalizeNullableDateInput(parsed.data.endDate),
		meals: normalizedMeals,
	}
}

function normalizeAndValidateAiUserMenuFormFast(
	form: unknown,
	currentForm: AiUserMenuFormState,
	availableIngredients: IngredientForAiContext[],
) {
	const parsed = AiUserMenuFormStateInput.safeParse(form)
	if (!parsed.success) {
		throw new ORPCError('INTERNAL_SERVER_ERROR', {
			message: `AI response has invalid shape: ${parsed.error.issues[0]?.message ?? 'unknown error'}`,
		})
	}

	const availableIngredientMap = new Map(
		availableIngredients.map((ingredient) => [ingredient.id, ingredient]),
	)
	const aiMealsById = new Map(parsed.data.meals.map((meal) => [meal.id, meal]))

	if (parsed.data.meals.length !== currentForm.meals.length) {
		throw new ORPCError('INTERNAL_SERVER_ERROR', {
			message:
				'FAST mode can only tweak ingredient ratios; meal count must stay unchanged',
		})
	}

	const normalizedMeals = currentForm.meals.map((currentMeal, mealIndex) => {
		const aiMeal = aiMealsById.get(currentMeal.id)
		if (!aiMeal) {
			throw new ORPCError('INTERNAL_SERVER_ERROR', {
				message: `FAST mode cannot add/remove meals; missing meal id ${currentMeal.id}`,
			})
		}
		if (aiMeal.recipes.length !== currentMeal.recipes.length) {
			throw new ORPCError('INTERNAL_SERVER_ERROR', {
				message: `FAST mode cannot add/remove recipes in meal ${mealIndex + 1}`,
			})
		}

		const aiRecipesById = new Map(
			aiMeal.recipes.map((recipe) => [recipe.id, recipe]),
		)

		const normalizedRecipes = currentMeal.recipes.map(
			(currentRecipe, recipeIndex) => {
				const aiRecipe = aiRecipesById.get(currentRecipe.id)
				if (!aiRecipe) {
					throw new ORPCError('INTERNAL_SERVER_ERROR', {
						message: `FAST mode cannot add/remove recipes; missing recipe id ${currentRecipe.id} at meal ${mealIndex + 1}`,
					})
				}

				if (aiRecipe.recipeId.trim() !== currentRecipe.recipeId.trim()) {
					throw new ORPCError('INTERNAL_SERVER_ERROR', {
						message: `FAST mode cannot replace recipes; recipeId changed at meal ${mealIndex + 1}, recipe ${recipeIndex + 1}`,
					})
				}

				if (aiRecipe.ingredients.length !== currentRecipe.ingredients.length) {
					throw new ORPCError('INTERNAL_SERVER_ERROR', {
						message: `FAST mode cannot add/remove ingredients at meal ${mealIndex + 1}, recipe ${recipeIndex + 1}`,
					})
				}

				const aiIngredientsById = new Map(
					aiRecipe.ingredients.map((ingredient) => [ingredient.id, ingredient]),
				)

				const normalizedIngredients = currentRecipe.ingredients.map(
					(currentIngredient, ingredientIndex) => {
						const aiIngredient = aiIngredientsById.get(currentIngredient.id)
						if (!aiIngredient) {
							throw new ORPCError('INTERNAL_SERVER_ERROR', {
								message: `FAST mode cannot add/remove ingredients; missing ingredient row id ${currentIngredient.id} at meal ${mealIndex + 1}, recipe ${recipeIndex + 1}`,
							})
						}

						if (
							aiIngredient.ingredientId.trim() !==
							currentIngredient.ingredientId.trim()
						) {
							throw new ORPCError('INTERNAL_SERVER_ERROR', {
								message: `FAST mode cannot swap ingredients at meal ${mealIndex + 1}, recipe ${recipeIndex + 1}, ingredient ${ingredientIndex + 1}`,
							})
						}

						const ingredientReference = availableIngredientMap.get(
							currentIngredient.ingredientId,
						)
						if (!ingredientReference) {
							throw new ORPCError('INTERNAL_SERVER_ERROR', {
								message: `Unknown ingredientId in current form at meal ${mealIndex + 1}, recipe ${recipeIndex + 1}, ingredient ${ingredientIndex + 1}`,
							})
						}

						const calculatedMacros = calculateIngredientMacrosFromServeSize(
							ingredientReference,
							aiIngredient.serveSize,
						)

						return {
							id: currentIngredient.id,
							recipeToIngredientId:
								currentIngredient.recipeToIngredientId.trim(),
							ingredientId: currentIngredient.ingredientId,
							ingredientName: ingredientReference.name,
							serveSize: calculatedMacros.serveSize,
							serveUnit:
								currentIngredient.serveUnit.trim() ||
								ingredientReference.serveUnit,
							precision: ingredientReference.precision,
							calories: calculatedMacros.calories,
							protein: calculatedMacros.protein,
							fat: calculatedMacros.fat,
							carbohydrate: calculatedMacros.carbohydrate,
						}
					},
				)

				const totals = calculateRecipeMacroTotals(normalizedIngredients)

				return {
					id: currentRecipe.id,
					recipeId: currentRecipe.recipeId.trim(),
					recipeName:
						currentRecipe.recipeName.trim() || `Recipe ${recipeIndex + 1}`,
					recipeIndex,
					calories: roundOneDecimal(totals.calories),
					protein: roundOneDecimal(totals.protein),
					fat: roundOneDecimal(totals.fat),
					carbohydrate: roundOneDecimal(totals.carbohydrate),
					ingredients: normalizedIngredients,
				}
			},
		)

		const targetCalories =
			currentMeal.targetCalories === null
				? null
				: roundOneDecimal(Math.max(0, currentMeal.targetCalories))
		const targetProtein =
			currentMeal.targetProtein === null
				? null
				: roundOneDecimal(Math.max(0, currentMeal.targetProtein))

		return {
			id: currentMeal.id,
			mealIndex,
			name: currentMeal.name.trim() || `Meal ${mealIndex + 1}`,
			targetCalories,
			targetProtein,
			recipes: normalizedRecipes,
		}
	})

	return {
		name: currentForm.name.trim() || 'Untitled Menu',
		description: currentForm.description
			? currentForm.description.trim()
			: null,
		startDate: normalizeNullableDateInput(currentForm.startDate),
		endDate: normalizeNullableDateInput(currentForm.endDate),
		meals: normalizedMeals,
	}
}

function assertAiFeaturesEnabled(access: {
	effective: {
		aiEnabled: boolean
		aiNutritionEnabled: boolean
		allEnabled: boolean
	}
}) {
	if (access.effective.allEnabled) {
		return
	}

	throw new ORPCError('FORBIDDEN', {
		message:
			'AI features are not enabled for this organisation. Enable app-level AI toggles and aiEnabled/aiNutritionEnabled meta tags on organisation or plan.',
	})
}

export const aiRouter = {
	test: protectedProcedure
		.route({
			method: 'POST',
			path: '/ai/test',
			summary: 'Test AI provider connectivity',
			tags: ['AI'],
		})
		.input(AiTestInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('itemUpdater') && !metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to use AI tools',
				})
			}

			const userOrgId = context.session.user.organisationId
			if (!userOrgId) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'User is not associated with an organisation',
				})
			}

			const access = await getAiFeatureAccessForOrganisation(userOrgId)
			assertAiFeaturesEnabled(access)

			const payload = await requestZenChatCompletion({
				messages: [{ role: 'user', content: input.prompt }],
			})
			const text = extractMessageText(payload.choices)

			if (!text) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', {
					message: 'AI provider returned an empty response',
				})
			}

			return { text }
		}),

	updateRecipeForm: protectedProcedure
		.route({
			method: 'POST',
			path: '/ai/update-recipe-form',
			summary: 'Update recipe form state from AI prompt',
			tags: ['AI'],
		})
		.input(AiRecipeUpdateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')
			const canUseAi = metaTags.includes('itemUpdater') || isDictator

			if (!canUseAi) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to use AI tools',
				})
			}

			const userOrgId = context.session.user.organisationId
			if (!isDictator && input.organisationId !== userOrgId) {
				throw new ORPCError('FORBIDDEN', {
					message:
						'You do not have permission to update recipes for this organisation',
				})
			}

			const access = await getAiFeatureAccessForOrganisation(
				input.organisationId,
			)
			assertAiFeaturesEnabled(access)

			const ingredients = await getIngredientsForAiContext(input.organisationId)
			if (ingredients.length === 0) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'No ingredients available for this organisation',
				})
			}

			const schemaExample = {
				name: 'string',
				description: 'string',
				image: 'string',
				categoryTags: ['string'],
				metaTags: ['string'],
				ingredients: [
					{
						id: 'string',
						ingredientId: 'string',
						amount: 100,
						unit: 'string',
						altIngredientId: 'string',
					},
				],
			}

			const systemPrompt = `
You update a recipe form based on a user's request.
Return JSON only. No markdown, no commentary.
The response must be a single object with this exact shape:
${JSON.stringify(schemaExample)}

Rules:
- Use only ingredientId values from the provided ingredient list.
- altIngredientId must be '' or one of the provided ingredient ids.
- amount must be a positive number aligned to the ingredient's precision.
- Keep fields as plain strings/arrays. Do not return null/undefined.
- Preserve existing ingredient row ids when you can; create ids for new rows.
- Keep the output directly usable for UI form state.
`.trim()

			const userPrompt = JSON.stringify({
				userRequest: input.request,
				currentForm: input.currentForm,
				availableIngredients: ingredients,
			})

			const completion = await requestZenChatCompletion({
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt },
				],
			})

			const text = extractMessageText(completion.choices)
			if (!text) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', {
					message: 'AI provider returned an empty response',
				})
			}

			const parsedJson = parseModelJsonResponse(text)
			const normalizedForm = normalizeAndValidateAiRecipeForm(
				parsedJson,
				ingredients,
			)

			return AiRecipeUpdateOutput.parse({
				form: normalizedForm,
			})
		}),

	updateUserMenuForm: protectedProcedure
		.route({
			method: 'POST',
			path: '/ai/update-user-menu-form',
			summary: 'Update user menu form state from AI prompt',
			tags: ['AI'],
		})
		.input(AiUserMenuUpdateInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')
			const canUseAi = metaTags.includes('itemUpdater') || isDictator

			if (!canUseAi) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to use AI tools',
				})
			}

			const userOrgId = context.session.user.organisationId
			if (!isDictator && input.organisationId !== userOrgId) {
				throw new ORPCError('FORBIDDEN', {
					message:
						'You do not have permission to update menus for this organisation',
				})
			}

			const access = await getAiFeatureAccessForOrganisation(
				input.organisationId,
			)
			assertAiFeaturesEnabled(access)

			const [availableIngredients, availableRecipes] = await Promise.all([
				getIngredientsForAiContext(input.organisationId),
				getRecipesForAiContext(input.organisationId),
			])
			if (availableIngredients.length === 0) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'No ingredients available for this organisation',
				})
			}

			const currentFormIngredientContext = buildUserMenuIngredientMacroContext(
				input.currentForm,
				availableIngredients,
			)
			const currentFormForPrompt = buildUserMenuFormPromptContext(
				input.currentForm,
			)

			const schemaExample = {
				name: 'string',
				description: 'string|null',
				startDate: 'YYYY-MM-DD|null',
				endDate: 'YYYY-MM-DD|null',
				meals: [
					{
						id: 'string',
						mealIndex: 0,
						name: 'string',
						recipes: [
							{
								id: 'string',
								recipeId: 'string',
								recipeName: 'string',
								recipeIndex: 0,
								ingredients: [
									{
										id: 'string',
										recipeToIngredientId: 'string',
										ingredientId: 'string',
										ingredientName: 'string',
										serveSize: 100,
										serveUnit: 'g',
										precision: 0.1,
										calories: 120,
										protein: 20,
										fat: 3,
										carbohydrate: 4,
									},
								],
							},
						],
					},
				],
			}

			const baseSystemPrompt = `
	You update a user menu form based on a user's request.
	Return JSON only. No markdown, no commentary.
	The response must be a single object with this exact shape:
	${JSON.stringify(schemaExample)}

	Domain model:
	- A menu is a group of meals.
	- Each meal contains recipe choices for the user.
	- Each recipe contains ingredients and their serve sizes.
	- Meal-level calories/protein/fat/carbohydrate values are intentionally not provided in the input context.
	- Recipe macros must come from ingredient ratios against each ingredient's reference serve size:
	  ratio = ingredientServeSize / referenceIngredientServeSize
	  macro = referenceMacro * ratio
	- ingredient precision is read-only and serveSize must align to it.
	- Keep output directly usable for UI form state.
	- Keep fields plain JSON types. Do not return undefined.
	- startDate and endDate must be YYYY-MM-DD strings or null.
	- mealIndex and recipeIndex must be zero-based integers.
	`.trim()

			const modeRules =
				input.mode === 'thinking'
					? `
	Mode rules (thinking):
	- You may add or delete recipes inside meals.
	- You may add or delete ingredients inside recipes.
	- Use ingredientId values only from availableIngredients.
	- Use recipeId values from availableRecipes whenever selecting existing recipes.
	- Keep existing ids where possible; generate ids for new meals/recipes/ingredients.
	`
					: `
	Mode rules (fast):
	- Only tweak ingredient ratios by changing ingredient serveSize values.
	- Do not add/delete/reorder meals, recipes, or ingredients.
	- Do not change recipeId or ingredientId.
	- Keep menu name/description/dates, meal names, and meal targets unchanged.
	- Preserve existing ids and structure.
	`

			const systemPrompt = `${baseSystemPrompt}\n\n${modeRules}`.trim()

			const userPrompt = JSON.stringify({
				mode: input.mode,
				userRequest: input.request,
				currentForm: currentFormForPrompt,
				currentFormIngredientContext,
				availableIngredients,
				availableRecipes,
			})

			const completion = await requestZenChatCompletion({
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: userPrompt },
				],
			})

			const text = extractMessageText(completion.choices)
			if (!text) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', {
					message: 'AI provider returned an empty response',
				})
			}

			const parsedJson = parseModelJsonResponse(text)
			const normalizedForm =
				input.mode === 'thinking'
					? normalizeAndValidateAiUserMenuForm(
							parsedJson,
							availableIngredients,
							availableRecipes,
						)
					: normalizeAndValidateAiUserMenuFormFast(
							parsedJson,
							input.currentForm,
							availableIngredients,
						)

			return AiUserMenuUpdateOutput.parse({
				form: normalizedForm,
			})
		}),
}
