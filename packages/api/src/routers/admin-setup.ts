import { db } from '@fit/db'
import { user } from '@fit/db/schema/auth'
import { baseExercise, exercise } from '@fit/db/schema/exercise'
import { baseIngredients, ingredient } from '@fit/db/schema/ingredient'
import { organisation } from '@fit/db/schema/org'

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ORPCError } from '@orpc/server'
import { v4 as uuid } from 'uuid'
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

													name: isOverwrite ? baseEx?.name ?? 'Overwrite' : `Org Exercise ${i}-${k}`,

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

													name: isOverwrite ? baseIng?.name ?? 'Overwrite' : `Org Ingredient ${i}-${l}`,

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
}
