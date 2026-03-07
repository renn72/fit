import { UserBlockForm } from '@/components/admin/user-block-form'
import { orpc } from '@/utils/orpc'

import { createFileRoute, useSearch } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/user-block-create')({
	component: CreateUserBlockPage,
	loader: async ({ context }) => {
		const userOrgId = context.session?.user?.organisationId
		if (!userOrgId) return

		await Promise.all([
			context.queryClient.prefetchQuery(
				orpc.userBlock.getTemplatesOrg.queryOptions({
					input: { organisationId: userOrgId },
				}),
			),
			context.queryClient.prefetchQuery(
				orpc.workout.getAllOrg.queryOptions({
					input: { organisationId: userOrgId },
				}),
			),
			context.queryClient.prefetchQuery(
				orpc.exercise.getAllOrg.queryOptions({
					input: { organisationId: userOrgId },
				}),
			),
			context.queryClient.prefetchQuery(
				orpc.warmup.getAllGroups.queryOptions({
					input: { organisationId: userOrgId },
				}),
			),
			context.queryClient.prefetchQuery(
				orpc.movement.getAllOrg.queryOptions({
					input: { organisationId: userOrgId },
				}),
			),
		])
	},
	ssr: false,
})

function CreateUserBlockPage() {
	const { session } = Route.useRouteContext()
	const { orgSlug } = Route.useParams()
	const { user } = useSearch({ from: '/$orgSlug' })
	const userOrgId = session?.user?.organisationId

	if (!userOrgId) {
		return <div>Missing organization</div>
	}

	return (
		<UserBlockForm
			userOrgId={userOrgId}
			orgSlug={orgSlug}
			user={user}
		/>
	)
}
