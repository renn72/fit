import { db } from '@fit/db'
import { baseExercise } from '@fit/db/schema/exercise'
import { baseIngredients } from '@fit/db/schema/ingredient'

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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
