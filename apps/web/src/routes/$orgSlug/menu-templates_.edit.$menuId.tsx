import { UserMenuForm } from '@/components/admin/user-menu-form'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/menu-templates_/edit/$menuId')({
	component: EditMenuTemplatePage,
	loader: async ({ context, params }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId
		const { menuId } = params

		if (!userOrgId || !menuId) return

		await Promise.all([
			context.queryClient.prefetchQuery(
				orpc.recipe.getOrg.queryOptions({
					input: { organisationId: userOrgId },
				}),
			),
			context.queryClient.prefetchQuery(
				orpc.userMenu.getTemplatesOrg.queryOptions({
					input: { organisationId: userOrgId },
				}),
			),
			context.queryClient.prefetchQuery(
				orpc.userMenu.get.queryOptions({
					input: { id: menuId },
				}),
			),
		])
	},
	ssr: false,
})

function EditMenuTemplatePage() {
	const { session } = Route.useRouteContext()
	const { orgSlug, menuId } = Route.useParams()
	const userOrgId = session?.user?.organisationId
	const userId = session?.user?.id

	if (!userOrgId || !userId) {
		return <div>Missing organization</div>
	}

	return (
		<UserMenuForm
			mode='template'
			userOrgId={userOrgId}
			menuId={menuId}
			orgSlug={orgSlug}
			user={userId}
		/>
	)
}
