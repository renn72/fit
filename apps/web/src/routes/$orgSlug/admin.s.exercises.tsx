import { ExercisesTable } from '@/components/admin/exercises-table'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/admin/s/exercises')({
	component: ExercisesTable,
	loader: async ({ context }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId

		if (!userOrgId) return <div>missing org</div>

		await context.queryClient.prefetchQuery(
			orpc.exercise.getAllOrg.queryOptions({
				input: { organisationId: userOrgId },
			}),
		)
	},
	ssr: false,
})
