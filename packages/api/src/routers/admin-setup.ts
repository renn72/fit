import { db } from '@fit/db'
import { user } from '@fit/db/schema/auth'
import { baseExercise, exercise } from '@fit/db/schema/exercise'
import { baseIngredients, ingredient } from '@fit/db/schema/ingredient'
import { organisation } from '@fit/db/schema/org'
import { recipe, recipeToIngredient } from '@fit/db/schema/recipe'

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ORPCError } from '@orpc/server'
import { v4 as uuid } from 'uuid'
import { z } from 'zod'
import { protectedProcedure } from '../index'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function parseCsvLine(line: string): string[] {
	const result: string[] = []
	let current = ''
	let inQuotes = false
	for (let i = 0; i < line.length; i++) {
		const char = line[i]
		if (char === '"') {
			inQuotes = !inQuotes
		} else if (char === ',' && !inQuotes) {
			result.push(current.trim())
			current = ''
		} else {
			current += char
		}
	}
	result.push(current.trim())
	return result
}

function splitCsvLines(content: string): string[] {
	const lines: string[] = []
	let current = ''
	let inQuotes = false
	for (let i = 0; i < content.length; i++) {
		const char = content[i]
		if (char === '"') {
			inQuotes = !inQuotes
			current += char
		} else if ((char === '\n' || char === '\r') && !inQuotes) {
			if (current.trim().length > 0) {
				lines.push(current)
			}
			current = ''
			if (char === '\r' && content[i + 1] === '\n') {
				i++
			}
		} else {
			current += char
		}
	}
	if (current.trim().length > 0) {
		lines.push(current)
	}
	return lines
}

export const adminSetupRouter = {
	generateDummyData: protectedProcedure
		.route({
			method: 'POST',
			path: '/admin-setup/generate-dummy-data',
			summary: 'Generate dummy data (Dictator only)',
			tags: ['Admin Setup'],
		})
		.handler(async ({ context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to generate dummy data',
				})
			}

			const baseExs = await db.query.baseExercise.findMany({ limit: 5 })
			const baseIngs = await db.query.baseIngredients.findMany({ limit: 5 })

			if (baseExs.length === 0 || baseIngs.length === 0) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Import base exercises and ingredients first.',
				})
			}

			await db.transaction(async (tx) => {
				for (let i = 1; i <= 3; i++) {
					const creatorId = uuid()
					const orgId = uuid()
					const orgSlug = `org-${i}-${Math.random().toString(36).substring(7)}`

					// Create Creator User
					await tx.insert(user).values({
						id: creatorId,
						name: `Creator ${i}`,
						email: `creator${i}@example.com`,
						organisationId: orgId,
						organisationSlug: orgSlug,
						organisationCreatorId: orgId,
					})

					// Create Org
					await tx.insert(organisation).values({
						id: orgId,
						name: `Organisation ${i}`,
						slug: orgSlug,
						creatorId: creatorId,
						state: 'active',
					})

					// Create members (5-10)
					const memberCount = Math.floor(Math.random() * 6) + 5
					for (let j = 1; j <= memberCount; j++) {
						await tx.insert(user).values({
							id: uuid(),
							name: `User ${i}-${j}`,
							email: `user${i}-${j}@example.com`,
							organisationId: orgId,
							organisationSlug: orgSlug,
						})
					}

					// Create exercises (5-10)
					const exerciseCount = Math.floor(Math.random() * 6) + 5
					for (let k = 1; k <= exerciseCount; k++) {
						const isOverwrite = k === 1
						const baseEx = isOverwrite ? baseExs[i % baseExs.length] : null

						await tx.insert(exercise).values({
							id: uuid(),
							name: isOverwrite
								? (baseEx?.name ?? 'Overwrite')
								: `Org Exercise ${i}-${k}`,
							organisationId: orgId,
							creatorId: creatorId,
							category: baseEx?.category ?? 'Strength',
							instructions: baseEx?.instructions ?? 'Generated instructions',
							primaryMuscles: baseEx?.primaryMuscles ?? 'Generated muscles',
							secondaryMuscles: baseEx?.secondaryMuscles ?? '',
							level: baseEx?.level ?? 'Beginner',
							force: baseEx?.force ?? 'Push',
							mechanic: baseEx?.mechanic ?? 'Compound',
							equipment: baseEx?.equipment ?? 'None',
							images: baseEx?.images ?? '',
							baseExerciseId: baseEx?.id ?? null,
						})
					}

					// Create ingredients (5-10)
					const ingredientCount = Math.floor(Math.random() * 6) + 5
					for (let l = 1; l <= ingredientCount; l++) {
						const isOverwrite = l === 1
						const baseIng = isOverwrite ? baseIngs[i % baseIngs.length] : null

						await tx.insert(ingredient).values({
							id: uuid(),
							name: isOverwrite
								? (baseIng?.name ?? 'Overwrite')
								: `Org Ingredient ${i}-${l}`,
							organisationId: orgId,
							creatorId: creatorId,
							calories: baseIng?.calories ?? 100,
							protein: baseIng?.protein ?? 10,
							fat: baseIng?.fat ?? 5,
							carbohydrate: baseIng?.carbohydrate ?? 20,
							serveSize: baseIng?.serveSize ?? 100,
							serveUnit: baseIng?.serveUnit ?? 'grams',
							baseIngredientId: baseIng?.id ?? null,
						})
					}
				}
			})

			return { message: 'Dummy data generated successfully' }
		}),

	importBaseIngredients: protectedProcedure
		.route({
			method: 'POST',
			path: '/admin-setup/import-base-ingredients',
			summary: 'Import base ingredients',
			tags: ['Admin Setup'],
		})
		.handler(async () => {
			const solidPath = path.resolve(
				__dirname,
				'../../../data/ingredient-solid.csv',
			)
			const liquidPath = path.resolve(
				__dirname,
				'../../../data/ingredient-liquid.csv',
			)

			const importFile = async (
				filePath: string,
				unit: 'grams' | 'mls',
				serveSize: number,
			) => {
				const content = await fs.readFile(filePath, 'utf-8')
				const lines = splitCsvLines(content)
				const dataLines = lines.slice(1)

				const entries = []
				for (const line of dataLines) {
					const cols = parseCsvLine(line)
					if (cols.length < 40) continue

					const publicFoodKey = cols[0] || ''
					const name = cols[2] || ''
					const energyKj = Number.parseFloat(cols[4] || '') || 0
					const protein = Number.parseFloat(cols[6] || '') || 0
					const fat = Number.parseFloat(cols[8] || '') || 0
					const carbohydrate = Number.parseFloat(cols[39] || '') || 0

					entries.push({
						publicFoodKey,
						name,
						calories: energyKj / 4.184,
						protein,
						fat,
						carbohydrate,
						serveSize,
						serveUnit: unit,
					})
				}
				return entries
			}

			const solidIngredients = await importFile(solidPath, 'grams', 100)
			const liquidIngredients = await importFile(liquidPath, 'mls', 100)

			const allIngredients = [...solidIngredients, ...liquidIngredients]

			await db.transaction(async (tx) => {
				for (const ingredient of allIngredients) {
					await tx.insert(baseIngredients).values(ingredient)
				}
			})

			return { count: allIngredients.length }
		}),

	importExercises: protectedProcedure
		.route({
			method: 'POST',
			path: '/admin-setup/import-exercises',
			summary: 'Import exercises',
			tags: ['Admin Setup'],
		})
		.handler(async () => {
			const filePath = path.resolve(
				__dirname,
				'../../../data/free-exercise-db/exercises_data.json',
			)

			console.log('starting import')

			const fileContent = await fs.readFile(filePath, 'utf-8')
			const exercises = JSON.parse(fileContent)

			return await db.transaction(async (tx) => {
				let count = 0
				for (const exercise of exercises) {
					await tx
						.insert(baseExercise)
						.values({
							id: exercise.id,
							name: exercise.name,
							force: exercise.force,
							level: exercise.level,
							mechanic: exercise.mechanic,
							equipment: exercise.equipment,
							primaryMuscles: exercise.primaryMuscles.join(','),
							secondaryMuscles: exercise.secondaryMuscles.join(','),
							instructions: exercise.instructions.join(','),
							category: exercise.category,
							images: exercise.images.join(','),
						})
						.onConflictDoUpdate({
							target: baseExercise.id,
							set: {
								name: exercise.name,
								force: exercise.force,
								level: exercise.level,
								mechanic: exercise.mechanic,
								equipment: exercise.equipment,
								primaryMuscles: exercise.primaryMuscles.join(','),
								secondaryMuscles: exercise.secondaryMuscles.join(','),
								instructions: exercise.instructions.join(','),
								category: exercise.category,
								images: exercise.images.join(','),
							},
						})
					count++
				}

				console.log('finished import')
				return { count }
			})
		}),

	generateRecipes: protectedProcedure
		.route({
			method: 'POST',
			path: '/admin-setup/generate-recipes',
			summary: 'Generate random recipes for an org (Dictator only)',
			tags: ['Admin Setup'],
		})
		.input(
			z.object({
				organisationId: z.string().min(1),
			}),
		)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to generate recipes',
				})
			}

			const orgIngredients = await db.query.ingredient.findMany({
				where: { organisationId: input.organisationId },
			})

			const baseIngs = await db.query.baseIngredients.findMany()

			const availableIngredients = [
				...orgIngredients.map((ing) => ({ ...ing, isBase: false })),
				...baseIngs.map((ing) => ({ ...ing, isBase: true, id: ing.id })),
			]

			if (availableIngredients.length < 3) {
				throw new ORPCError('BAD_REQUEST', {
					message:
						'Not enough ingredients to create recipes. Please create at least 3 ingredients first.',
				})
			}

			const orgUser = await db.query.user.findFirst({
				where: { organisationId: input.organisationId },
			})

			if (!orgUser) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'No users found in this organisation',
				})
			}

			const recipeNames = [
				'Chicken Power Bowl',
				'Beef Protein Salad',
				'Salmon Omega Meal',
				'Tofu Veggie Stir Fry',
				'Egg White Breakfast',
				'Turkey Lean Wrap',
				'Quinoa Energy Bowl',
				'Steak & Greens',
				'Pasta Protein Mix',
				'Fish Taco Bowl',
			]

			const categories = [
				'Breakfast',
				'Lunch',
				'Dinner',
				'Snack',
				'Post-Workout',
			]
			const tags = [
				'high-protein',
				'low-carb',
				'balanced',
				'keto-friendly',
				'muscle-building',
			]

			await db.transaction(async (tx) => {
				for (let i = 0; i < 10; i++) {
					const ingredientCount = Math.floor(Math.random() * 2) + 3
					const shuffled = [...availableIngredients].sort(
						() => 0.5 - Math.random(),
					)
					const selectedIngredients = shuffled.slice(0, ingredientCount)

					const ingredientLinks = selectedIngredients.map((ing: any) => ({
						ingredientId: ing.isBase ? ing.id : undefined,
						customIngredientId: ing.isBase ? undefined : ing.id,
						amount: Math.floor(Math.random() * 90) + 10,
						unit: 'grams',
					}))

					const [newRecipe] = await tx
						.insert(recipe)
						.values({
							name: recipeNames[i] || `Recipe ${i + 1}`,
							description: `A delicious and nutritious meal with ${ingredientLinks.length} main ingredients.`,
							category:
								categories[Math.floor(Math.random() * categories.length)],
							metaTags: tags
								.slice(0, Math.floor(Math.random() * 3) + 1)
								.join(','),
							creatorId: orgUser.id,
							organisationId: input.organisationId,
						})
						.returning()

					if (!newRecipe) {
						throw new ORPCError('INTERNAL_SERVER_ERROR', {
							message: 'Failed to create recipe',
						})
					}

					await tx.insert(recipeToIngredient).values(
						ingredientLinks.map((link) => ({
							recipeId: newRecipe.id,
							ingredientId: link.ingredientId,
							customIngredientId: link.customIngredientId,
							amount: link.amount,
							unit: link.unit,
						})),
					)
				}
			})

			return { message: '10 recipes generated successfully' }
		}),
}
