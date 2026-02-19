import { BaseExercisesTable } from '@/components/dictator/base-exercises-table'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator/base-movements')({
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(
			orpc.exercise.getAllBase.queryOptions({ input: {} }),
		)
	},
	ssr: false,
	component: BaseExercisesTable,
})
