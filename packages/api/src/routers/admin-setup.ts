import { db } from '@fit/db'
import { user } from '@fit/db/schema/auth'
import {
	blockTemplate,
	blockTemplateToWorkout,
} from '@fit/db/schema/block-template'
import { exercise } from '@fit/db/schema/exercise'
import { ingredient } from '@fit/db/schema/ingredient'
import {
	menuTemplate,
	menuTemplateToRecipe,
} from '@fit/db/schema/menu-template'
import { movement } from '@fit/db/schema/movement'
import { organisation, plan, subscription } from '@fit/db/schema/org'
import { recipe, recipeToIngredient } from '@fit/db/schema/recipe'
import { warmup, warmupGroup } from '@fit/db/schema/warmup'
import { workout, workoutToExercise } from '@fit/db/schema/workout'

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

			const baseExs = await db.query.movement.findMany({
				where: { isBase: true },
				limit: 5,
			})
			const baseIngs = await db.query.ingredient.findMany({
				where: { isBase: true },
				limit: 5,
			})

			if (baseExs.length === 0 || baseIngs.length === 0) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Import base exercises and ingredients first.',
				})
			}

			// Fetch available plans
			const availablePlans = await db.query.plan.findMany({
				where: { hidden: false },
			})

			if (availablePlans.length === 0) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'No plans found. Please generate plans first.',
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

					// Assign a random plan
					const randomPlan =
						availablePlans[Math.floor(Math.random() * availablePlans.length)]
					const oneYearFromNow = new Date()
					oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

					await tx.insert(subscription).values({
						id: uuid(),
						organisationId: orgId,
						planId: randomPlan!.id,
						status: 'active',
						currentPeriodEnd: oneYearFromNow,
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

						await tx.insert(movement).values({
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
							baseId: baseEx?.id ?? null,
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
							baseId: baseIng?.id ?? null,
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
				for (const ing of allIngredients) {
					await tx.insert(ingredient).values({
						...ing,
						isBase: true,
					})
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
				for (const ex of exercises) {
					await tx
						.insert(movement)
						.values({
							id: ex.id,
							name: ex.name,
							force: ex.force,
							level: ex.level,
							mechanic: ex.mechanic,
							equipment: ex.equipment,
							primaryMuscles: ex.primaryMuscles.join(','),
							secondaryMuscles: ex.secondaryMuscles.join(','),
							instructions: ex.instructions.join(','),
							category: ex.category,
							images: ex.images.join(','),
							isBase: true,
						})
						.onConflictDoUpdate({
							target: movement.id,
							set: {
								name: ex.name,
								force: ex.force,
								level: ex.level,
								mechanic: ex.mechanic,
								equipment: ex.equipment,
								primaryMuscles: ex.primaryMuscles.join(','),
								secondaryMuscles: ex.secondaryMuscles.join(','),
								instructions: ex.instructions.join(','),
								category: ex.category,
								images: ex.images.join(','),
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

			const baseIngs = await db.query.ingredient.findMany({
				where: { isBase: true },
			})

			const availableIngredients = [
				...orgIngredients.map((ing) => ({ ...ing, isBase: false })),
				...baseIngs.map((ing) => ({ ...ing, isBase: true })),
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
						ingredientId: ing.id,
						isBaseIngredient: ing.isBase,
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
							isBaseIngredient: link.isBaseIngredient,
							amount: link.amount,
							unit: link.unit,
						})),
					)
				}
			})

			return { message: '10 recipes generated successfully' }
		}),

	generateExercises: protectedProcedure
		.route({
			method: 'POST',
			path: '/admin-setup/generate-exercises',
			summary: 'Generate random exercises for an org (Dictator only)',
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
					message: 'You do not have permission to generate exercises',
				})
			}

			const orgMovements = await db.query.movement.findMany({
				where: { organisationId: input.organisationId },
			})

			const baseMovements = await db.query.movement.findMany({
				where: { isBase: true },
			})

			const availableMovements = [...orgMovements, ...baseMovements]

			if (availableMovements.length === 0) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'No movements found. Please import base movements first.',
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

			const exerciseNames = [
				'Squat Protocol',
				'Bench Press Session',
				'Deadlift Training',
				'Overhead Press',
				'Row Variation',
				'Lunges Complex',
				'Pull Up Routine',
				'Dip Workout',
				'Leg Press Session',
				'Curl Variation',
			]

			const repUnits = ['reps', 'seconds', 'meters', 'each']
			const restUnits = ['seconds', 'minutes']

			await db.transaction(async (tx) => {
				for (let i = 0; i < 10; i++) {
					const movement =
						availableMovements[
							Math.floor(Math.random() * availableMovements.length)
						]

					await tx.insert(exercise).values({
						name: exerciseNames[i] || `Exercise ${i + 1}`,
						movementId: movement.id,
						sets: Math.floor(Math.random() * 3) + 2,
						reps: Math.floor(Math.random() * 8) + 3,
						repUnit: repUnits[Math.floor(Math.random() * repUnits.length)],
						ormPercent: Math.floor(Math.random() * 40) + 60,
						targetRpe: Math.floor(Math.random() * 3) + 7,
						restTime: Math.floor(Math.random() * 90) + 30,
						restUnit: restUnits[Math.floor(Math.random() * restUnits.length)],
						tempoDown: Math.floor(Math.random() * 3) + 1,
						tempoPause: Math.floor(Math.random() * 2),
						tempoUp: Math.floor(Math.random() * 2) + 1,
						notes: `Generated exercise using ${movement.name} movement`,
						creatorId: orgUser.id,
						organisationId: input.organisationId,
					})
				}
			})

			return { message: '10 exercises generated successfully' }
		}),

	generateWarmups: protectedProcedure
		.route({
			method: 'POST',
			path: '/admin-setup/generate-warmups',
			summary: 'Generate random warmups for an org (Dictator only)',
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
					message: 'You do not have permission to generate warmups',
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

			const warmupGroupNames = [
				'Upper Body Activation',
				'Lower Body Prep',
				'Full Body Warmup',
				'Core Activation',
				'Cardio Warmup',
				'Mobility Flow',
				'Dynamic Stretching',
				'Strength Prep',
				'Pre-Workout Routine',
				'Joint Mobility',
			]

			const warmupExercises = [
				{ name: 'Arm Circles', description: 'Rotate arms in circular motion' },
				{ name: 'Leg Swings', description: 'Swing legs forward and backward' },
				{
					name: 'Hip Rotations',
					description: 'Rotate hips in circular motion',
				},
				{
					name: 'Shoulder Rolls',
					description: 'Roll shoulders backward and forward',
				},
				{ name: 'Neck Stretches', description: 'Gently stretch neck muscles' },
				{ name: 'Torso Twists', description: 'Rotate torso left and right' },
				{
					name: 'Walking Lunges',
					description: 'Step forward into lunge position',
				},
				{ name: 'High Knees', description: 'March in place with high knees' },
				{
					name: 'Butt Kicks',
					description: 'Jog in place kicking heels to glutes',
				},
				{
					name: 'Jumping Jacks',
					description: 'Jump with arms and legs extended',
				},
				{
					name: 'Mountain Climbers',
					description: 'Drive knees toward chest in plank',
				},
				{ name: 'Inchworms', description: 'Walk hands out to plank and back' },
				{
					name: 'Cat-Cow Stretch',
					description: 'Alternate between arching and rounding back',
				},
				{
					name: "World's Greatest Stretch",
					description: 'Lunge with rotation and reach',
				},
				{
					name: 'Spider-Man Stretch',
					description: 'Lunge with foot outside hand',
				},
			]

			await db.transaction(async (tx) => {
				for (let i = 0; i < 5; i++) {
					const [newGroup] = await tx
						.insert(warmupGroup)
						.values({
							name: warmupGroupNames[i] || `Warmup ${i + 1}`,
							description:
								'A comprehensive warmup routine with multiple exercises',
							creatorId: orgUser.id,
							organisationId: input.organisationId,
						})
						.returning()

					if (!newGroup) {
						throw new ORPCError('INTERNAL_SERVER_ERROR', {
							message: 'Failed to create warmup group',
						})
					}

					// Generate 2-4 warmups per group
					const warmupCount = Math.floor(Math.random() * 3) + 2
					const shuffled = [...warmupExercises].sort(() => Math.random() - 0.5)
					const selectedWarmups = shuffled.slice(0, warmupCount)

					await tx.insert(warmup).values(
						selectedWarmups.map((w) => ({
							name: w.name,
							description: w.description,
							warmupGroupId: newGroup.id,
							images: null,
							link: null,
						})),
					)
				}
			})

			return { message: '5 warmup groups generated successfully' }
		}),

	generateWorkouts: protectedProcedure
		.route({
			method: 'POST',
			path: '/admin-setup/generate-workouts',
			summary: 'Generate random workouts for an org (Dictator only)',
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
					message: 'You do not have permission to generate workouts',
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

			const orgExercises = await db.query.exercise.findMany({
				where: { organisationId: input.organisationId },
			})

			const availableExercises = orgExercises

			if (availableExercises.length < 4) {
				throw new ORPCError('BAD_REQUEST', {
					message:
						'Not enough exercises to create workouts. Please create at least 4 exercises first.',
				})
			}

			const warmupGroups = await db.query.warmupGroup.findMany({
				where: { organisationId: input.organisationId },
				with: {
					warmups: true,
				},
			})

			const workoutNames = [
				'Upper Body Power',
				'Lower Body Strength',
				'Full Body HIIT',
				'Chest & Back Blast',
				'Leg Day Destroyer',
				'Push Workout',
				'Pull Workout',
				'Core & Conditioning',
				'Functional Strength',
				'Hypertrophy Focus',
				'Endurance Builder',
				'Speed & Agility',
				'Power Hour',
				'Total Body Sculpt',
				'Metabolic Conditioning',
				'Beach Body Prep',
				'Athletic Performance',
				'Muscle Building',
				'Fat Loss Circuit',
				'Strength Foundation',
			]

			const categories = [
				'Strength',
				'Hypertrophy',
				'Cardio',
				'Functional',
				'HIIT',
				'Power',
				'Endurance',
			]

			const workoutCount = Math.floor(Math.random() * 11) + 10 // 10-20 workouts

			await db.transaction(async (tx) => {
				for (let i = 0; i < workoutCount; i++) {
					// Randomly select a warmup group if available
					const warmupGroupId =
						warmupGroups.length > 0
							? warmupGroups[Math.floor(Math.random() * warmupGroups.length)]!
									.id
							: null

					const category =
						categories[Math.floor(Math.random() * categories.length)]

					const [newWorkout] = await tx
						.insert(workout)
						.values({
							name: workoutNames[i] || `Workout ${i + 1}`,
							description: `A ${category!.toLowerCase()} focused workout with multiple exercises`,
							category: category,
							creatorId: orgUser.id,
							organisationId: input.organisationId,
							warmupGroupId: warmupGroupId,
						})
						.returning()

					if (!newWorkout) {
						throw new ORPCError('INTERNAL_SERVER_ERROR', {
							message: 'Failed to create workout',
						})
					}

					// Generate 4-8 exercises for this workout
					const exerciseCount = Math.floor(Math.random() * 5) + 4
					const shuffled = [...availableExercises].sort(
						() => Math.random() - 0.5,
					)
					const selectedExercises = shuffled.slice(0, exerciseCount)

					// Add exercises to workout with index
					await tx.insert(workoutToExercise).values(
						selectedExercises.map((ex, index) => ({
							workoutId: newWorkout.id,
							exerciseId: ex.id,
							index: index,
						})),
					)
				}
			})

			return { message: `${workoutCount} workouts generated successfully` }
		}),

	generateBlockTemplates: protectedProcedure
		.route({
			method: 'POST',
			path: '/admin-setup/generate-block-templates',
			summary: 'Generate random block templates for an org (Dictator only)',
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
					message: 'You do not have permission to generate block templates',
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

			const orgWorkouts = await db.query.workout.findMany({
				where: { organisationId: input.organisationId },
			})

			if (orgWorkouts.length < 4) {
				throw new ORPCError('BAD_REQUEST', {
					message:
						'Not enough workouts to create block templates. Please create at least 4 workouts first.',
				})
			}

			const blockTemplateNames = [
				'Hypertrophy Block',
				'Strength Foundation',
				'Power Building',
				'Endurance Block',
				'Fat Loss Program',
				'Muscle Building',
				'Athletic Performance',
				'Body Recomposition',
				'Peak Week Prep',
				'Deload Week',
			]

			const categories = [
				'Hypertrophy',
				'Strength',
				'Power',
				'Endurance',
				'Fat Loss',
			]

			await db.transaction(async (tx) => {
				for (let i = 0; i < 10; i++) {
					// Generate 4-5 workouts for this block template
					const workoutCount = Math.floor(Math.random() * 2) + 4 // 4-5 workouts
					const shuffled = [...orgWorkouts].sort(() => Math.random() - 0.5)
					const selectedWorkouts = shuffled.slice(0, workoutCount)

					// Determine rest days (1-2 rest days between workouts)
					const restDayCount = Math.floor(Math.random() * 2) + 1 // 1-2 rest days
					const totalDays = workoutCount + restDayCount
					const restDayIndices: number[] = []

					// Randomly place rest days in the schedule
					while (restDayIndices.length < restDayCount) {
						const randomIndex = Math.floor(Math.random() * totalDays)
						if (!restDayIndices.includes(randomIndex)) {
							restDayIndices.push(randomIndex)
						}
					}

					// Find the first rest day index for storage
					const firstRestDayIndex =
						restDayIndices.length > 0 ? Math.min(...restDayIndices) : null

					const category =
						categories[Math.floor(Math.random() * categories.length)]

					const [newBlockTemplate] = await tx
						.insert(blockTemplate)
						.values({
							name: blockTemplateNames[i] || `Block Template ${i + 1}`,
							description: `A ${category!.toLowerCase()} focused training block with ${workoutCount} workouts and ${restDayCount} rest day${restDayCount > 1 ? 's' : ''}`,
							category: category,
							restDayIndex: firstRestDayIndex,
							creatorId: orgUser.id,
							organisationId: input.organisationId,
						})
						.returning()

					if (!newBlockTemplate) {
						throw new ORPCError('INTERNAL_SERVER_ERROR', {
							message: 'Failed to create block template',
						})
					}

					// Add workouts to block template with index
					await tx.insert(blockTemplateToWorkout).values(
						selectedWorkouts.map((workout, index) => ({
							blockTemplateId: newBlockTemplate.id,
							workoutId: workout.id,
							index: index,
						})),
					)
				}
			})

			return { message: '10 block templates generated successfully' }
		}),

	generateMenuTemplates: protectedProcedure
		.route({
			method: 'POST',
			path: '/admin-setup/generate-menu-templates',
			summary: 'Generate random menu templates for an org (Dictator only)',
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
					message: 'You do not have permission to generate menu templates',
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

			const orgRecipes = await db.query.recipe.findMany({
				where: { organisationId: input.organisationId },
			})

			if (orgRecipes.length < 6) {
				throw new ORPCError('BAD_REQUEST', {
					message:
						'Not enough recipes to create menu templates. Please create at least 6 recipes first.',
				})
			}

			const menuTemplateNames = [
				'Muscle Building Menu',
				'Fat Loss Meal Plan',
				'Maintenance Menu',
				'Athletic Performance Plan',
				'Vegetarian Menu',
				'High Protein Plan',
				'Clean Eating Menu',
				'Keto Meal Plan',
				'Mediterranean Menu',
				'Balanced Nutrition Plan',
			]

			const categories = [
				'Muscle Building',
				'Fat Loss',
				'Maintenance',
				'Performance',
				'Vegetarian',
				'High Protein',
			]

			await db.transaction(async (tx) => {
				for (let i = 0; i < 10; i++) {
					// Generate 3-5 meals for this menu template
					const mealCount = Math.floor(Math.random() * 3) + 3 // 3-5 meals
					const shuffled = [...orgRecipes].sort(() => Math.random() - 0.5)
					const selectedRecipes = shuffled.slice(0, mealCount * 2) // 2 recipes per meal on average

					const category =
						categories[Math.floor(Math.random() * categories.length)]

					const [newMenuTemplate] = await tx
						.insert(menuTemplate)
						.values({
							name: menuTemplateNames[i] || `Menu Template ${i + 1}`,
							description: `A ${category!.toLowerCase()} focused meal plan with ${mealCount} meals per day`,
							category: category,
							creatorId: orgUser.id,
							organisationId: input.organisationId,
						})
						.returning()

					if (!newMenuTemplate) {
						throw new ORPCError('INTERNAL_SERVER_ERROR', {
							message: 'Failed to create menu template',
						})
					}

					// Add recipes to menu template with mealIndex and recipeIndex
					const menuTemplateRecipes: {
						menuTemplateId: string
						recipeId: string
						mealIndex: number
						recipeIndex: number
					}[] = []

					let recipeIdx = 0
					for (let mealIdx = 0; mealIdx < mealCount; mealIdx++) {
						// 1-2 recipes per meal
						const recipesInMeal = Math.floor(Math.random() * 2) + 1
						for (let r = 0; r < recipesInMeal; r++) {
							if (recipeIdx < selectedRecipes.length) {
								menuTemplateRecipes.push({
									menuTemplateId: newMenuTemplate.id,
									recipeId: selectedRecipes[recipeIdx]!.id,
									mealIndex: mealIdx,
									recipeIndex: r,
								})
								recipeIdx++
							}
						}
					}

					await tx.insert(menuTemplateToRecipe).values(menuTemplateRecipes)
				}
			})

			return { message: '10 menu templates generated successfully' }
		}),

	generateUsers: protectedProcedure
		.route({
			method: 'POST',
			path: '/admin-setup/generate-users',
			summary: 'Generate 5 users for an org (Dictator only)',
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
					message: 'You do not have permission to generate users',
				})
			}

			const org = await db.query.organisation.findFirst({
				where: { id: input.organisationId },
			})

			if (!org) {
				throw new ORPCError('BAD_REQUEST', {
					message: 'Organisation not found',
				})
			}

			const firstNames = [
				'Alex',
				'Jordan',
				'Taylor',
				'Morgan',
				'Casey',
				'Jamie',
				'Riley',
				'Avery',
				'Quinn',
				'Skyler',
				'Drew',
				'Parker',
				'Cameron',
				'Sam',
				'Dakota',
			]

			const lastNames = [
				'Smith',
				'Johnson',
				'Williams',
				'Brown',
				'Jones',
				'Garcia',
				'Miller',
				'Davis',
				'Rodriguez',
				'Martinez',
				'Hernandez',
				'Lopez',
				'Gonzalez',
				'Wilson',
				'Anderson',
			]

			const shuffledFirst = [...firstNames].sort(() => Math.random() - 0.5)
			const shuffledLast = [...lastNames].sort(() => Math.random() - 0.5)

			await db.transaction(async (tx) => {
				for (let i = 0; i < 5; i++) {
					const firstName = shuffledFirst[i]!
					const lastName = shuffledLast[i]!
					const fullName = `${firstName} ${lastName}`
					const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${uuid().substring(0, 8)}@example.com`

					await tx.insert(user).values({
						id: uuid(),
						name: fullName,
						email: email,
						organisationId: input.organisationId,
						organisationSlug: org.slug,
					})
				}
			})

			return { message: '5 users generated successfully' }
		}),

	generatePlans: protectedProcedure
		.route({
			method: 'POST',
			path: '/admin-setup/generate-plans',
			summary: 'Generate 4 random plans (Dictator only)',
			tags: ['Admin Setup'],
		})
		.handler(async ({ context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to generate plans',
				})
			}

			const planTemplates = [
				{
					name: 'Starter',
					description:
						'Perfect for individuals getting started with fitness tracking',
					features: 'Basic tracking, 5 recipes, 3 workouts',
					cta: 'Get Started',
					priceMonthly: 0,
					priceYearly: 0,
					maxMembers: 1,
					maxTrainers: 0,
					tags: 'free,basic',
					hidden: false,
				},
				{
					name: 'Pro',
					description: 'For serious athletes and fitness enthusiasts',
					features:
						'Advanced analytics, unlimited recipes, custom workouts, priority support',
					cta: 'Upgrade Now',
					priceMonthly: 2900,
					priceYearly: 29000,
					maxMembers: 5,
					maxTrainers: 2,
					tags: 'popular,analytics',
					hidden: false,
				},
				{
					name: 'Elite',
					description: 'Complete solution for personal trainers and small gyms',
					features:
						'Client management, team collaboration, API access, white-label options',
					cta: 'Go Elite',
					priceMonthly: 9900,
					priceYearly: 99000,
					maxMembers: 25,
					maxTrainers: 5,
					tags: 'business,api,team',
					hidden: false,
				},
				{
					name: 'Enterprise',
					description:
						'Custom solutions for large organizations and gym chains',
					features:
						'Dedicated support, custom integrations, SLA guarantee, unlimited storage',
					cta: 'Contact Sales',
					priceMonthly: 29900,
					priceYearly: 299000,
					maxMembers: 100,
					maxTrainers: 20,
					tags: 'enterprise,dedicated',
					hidden: true,
				},
			]

			await db.transaction(async (tx) => {
				for (const planTemplate of planTemplates) {
					await tx.insert(plan).values({
						...planTemplate,
					})
				}
			})

			return { message: '4 plans generated successfully' }
		}),
}
