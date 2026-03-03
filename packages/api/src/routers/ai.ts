import { db } from '@fit/db'
import { env } from '@fit/env/server'

import { randomUUID } from 'node:crypto'
import { ORPCError } from '@orpc/server'
import { protectedProcedure } from '../index'
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

const DEFAULT_ZEN_MODEL = 'minimax-m2.5-free'

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

async function requestZenChatCompletion({
	messages,
	model = DEFAULT_ZEN_MODEL,
}: {
	messages: Array<{ role: 'system' | 'user'; content: string }>
	model?: string
}) {
	const response = await fetch('https://opencode.ai/zen/v1/chat/completions', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.ZEN_API_KEY}`,
		},
		body: JSON.stringify({
			model,
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
		const amount = roundOneDecimal(item.amount)

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
		availableRecipes.map((recipe) => [recipe.name.trim().toLowerCase(), recipe]),
	)

	const usedMealIds = new Set<string>()
	const usedRecipeIds = new Set<string>()
	const usedIngredientIds = new Set<string>()

	const toUniqueId = (baseId: string, used: Set<string>) => {
		const trimmed = baseId.trim()
		if (trimmed && !used.has(trimmed)) {
			used.add(trimmed)
			return trimmed
		}

		const generated = randomUUID()
		used.add(generated)
		return generated
	}

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
					const serveSize = roundOneDecimal(
						ingredientItem.serveSize > 0
							? ingredientItem.serveSize
							: Math.max(ingredient.serveSize, 1),
					)
					const ratio = ingredient.serveSize > 0 ? serveSize / ingredient.serveSize : 0

					return {
						id: normalizedIngredientId,
						recipeToIngredientId: ingredientItem.recipeToIngredientId.trim(),
						ingredientId: ingredient.id,
						ingredientName: ingredient.name,
						serveSize,
						serveUnit: ingredientItem.serveUnit.trim() || ingredient.serveUnit,
						calories: roundOneDecimal(ingredient.calories * ratio),
						protein: roundOneDecimal(ingredient.protein * ratio),
						fat: roundOneDecimal(ingredient.fat * ratio),
						carbohydrate: roundOneDecimal(ingredient.carbohydrate * ratio),
					}
				},
			)

			const totals = normalizedIngredients.reduce(
				(acc, item) => ({
					calories: acc.calories + item.calories,
					protein: acc.protein + item.protein,
					fat: acc.fat + item.fat,
					carbohydrate: acc.carbohydrate + item.carbohydrate,
				}),
				{ calories: 0, protein: 0, fat: 0, carbohydrate: 0 },
			)

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
		description: parsed.data.description ? parsed.data.description.trim() : null,
		startDate: normalizeNullableDateInput(parsed.data.startDate),
		endDate: normalizeNullableDateInput(parsed.data.endDate),
		meals: normalizedMeals,
	}
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
- amount must be a positive number.
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

			const ingredients = await getIngredientsForAiContext(input.organisationId)
			const recipes = await getRecipesForAiContext(input.organisationId)
			if (ingredients.length === 0) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'No ingredients available for this organisation',
				})
			}

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
						targetCalories: 500,
						targetProtein: 40,
						recipes: [
							{
								id: 'string',
								recipeId: 'string',
								recipeName: 'string',
								recipeIndex: 0,
								calories: 500,
								protein: 40,
								fat: 15,
								carbohydrate: 45,
								ingredients: [
									{
										id: 'string',
										recipeToIngredientId: 'string',
										ingredientId: 'string',
										ingredientName: 'string',
										serveSize: 100,
										serveUnit: 'g',
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

			const systemPrompt = `
You update a user menu form based on a user's request.
Return JSON only. No markdown, no commentary.
The response must be a single object with this exact shape:
${JSON.stringify(schemaExample)}

Rules:
- Use ingredientId values only from the provided ingredient list.
- Use recipeId values from provided recipes whenever possible.
- Keep fields plain JSON types. Do not return undefined.
- Keep ids where possible; create ids for new meals/recipes/ingredients.
- startDate and endDate must be YYYY-MM-DD strings or null.
- mealIndex and recipeIndex must be zero-based integers.
- Keep the output directly usable for UI form state.
`.trim()

			const userPrompt = JSON.stringify({
				userRequest: input.request,
				currentForm: input.currentForm,
				availableIngredients: ingredients,
				availableRecipes: recipes,
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
			const normalizedForm = normalizeAndValidateAiUserMenuForm(
				parsedJson,
				ingredients,
				recipes,
			)

			return AiUserMenuUpdateOutput.parse({
				form: normalizedForm,
			})
		}),
}
