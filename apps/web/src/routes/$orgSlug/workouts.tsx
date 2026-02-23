import { WorkoutsPage } from '@/components/admin/workout/workouts-page'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/workouts')({
	component: WorkoutsPage,
	loader: async ({ context }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId

		if (!userOrgId) return <div>missing org</div>

		await context.queryClient.prefetchQuery(
			orpc.workout.getAllOrg.queryOptions({
				input: { organisationId: userOrgId },
			}),
		)
	},
	ssr: false,
})
