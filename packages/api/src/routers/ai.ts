import { randomUUID } from 'node:crypto'
import { db } from '@fit/db'
import { env } from '@fit/env/server'

import { ORPCError } from '@orpc/server'
import { protectedProcedure } from '../index'
import {
	AiRecipeFormStateInput,
	AiRecipeUpdateInput,
	AiRecipeUpdateOutput,
	AiTestInput,
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

async function requestZenChatCompletion({
	model,
	messages,
}: {
	model: string
	messages: Array<{ role: 'system' | 'user'; content: string }>
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
				model: input.model,
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
				model: input.model,
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
}
