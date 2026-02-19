import { OrgExercisesTable } from '@/components/dictator/org-exercises-table'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator/org-movements')({
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(
			orpc.exercise.getAll.queryOptions({ input: {} }),
		)
	},
	ssr: false,
	component: OrgExercisesTable,
})
