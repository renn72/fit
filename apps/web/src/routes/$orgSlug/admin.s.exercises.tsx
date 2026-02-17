import { ExercisesTable } from '@/components/admin/exercises-table'
import { getUser } from '@/functions/get-user'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/admin/s/exercises')({
	component: ExercisesTable,
	beforeLoad: async () => {
		const session = await getUser()
		return { session }
	},
	loader: async ({ context, params }) => {
		const { session } = context
		const { orgSlug } = params
		const userOrgId =
			session?.user?.organisationSlug === orgSlug
				? session?.user?.organisationId
				: undefined

		if (userOrgId) {
			await context.queryClient.prefetchQuery(
				orpc.exercise.getAllOrg.queryOptions({
					input: { organisationId: userOrgId },
				}),
			)
		}
	},
	ssr: 'data-only',
})
