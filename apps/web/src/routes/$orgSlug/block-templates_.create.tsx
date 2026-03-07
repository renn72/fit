import { UserBlockForm } from '@/components/admin/user-block-form'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/block-templates_/create')({
	component: CreateBlockTemplatePage,
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

function CreateBlockTemplatePage() {
	const { session } = Route.useRouteContext()
	const { orgSlug } = Route.useParams()
	const userOrgId = session?.user?.organisationId
	const userId = session?.user?.id

	if (!userOrgId || !userId) {
		return <div>Missing organization</div>
	}

	return (
		<UserBlockForm
			mode='template'
			userOrgId={userOrgId}
			orgSlug={orgSlug}
			user={userId}
		/>
	)
}
