import { db } from '@fit/db'
import { baseExercise } from '@fit/db/schema/exercise'

import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { protectedProcedure } from '../index'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const adminSetupRouter = {
	importExercises: protectedProcedure.handler(async () => {
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
						primaryMuscles: exercise.primaryMuscles,
						secondaryMuscles: exercise.secondaryMuscles,
						instructions: exercise.instructions,
						category: exercise.category,
						images: exercise.images,
					})
					.onConflictDoUpdate({
						target: baseExercise.id,
						set: {
							name: exercise.name,
							force: exercise.force,
							level: exercise.level,
							mechanic: exercise.mechanic,
							equipment: exercise.equipment,
							primaryMuscles: exercise.primaryMuscles,
							secondaryMuscles: exercise.secondaryMuscles,
							instructions: exercise.instructions,
							category: exercise.category,
							images: exercise.images,
						},
					})
				count++
			}

			console.log('finished import')
			return { count }
		})
	}),
}
