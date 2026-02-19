import { ExercisesTable } from '@/components/dictator/exercises-table'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator/exercises')({
	component: ExercisesTable,
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(orpc.exercise.getAll.queryOptions())
	},
	ssr: false,
})
