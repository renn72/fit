import { MenuTemplateCreateForm } from '@/components/admin/menu-template/menu-template-create-form'
import { Button } from '@/components/ui/button'
import { orpc } from '@/utils/orpc'

import { createFileRoute, useNavigate } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/menu-templates_/create')({
	component: CreateMenuTemplatePage,
	loader: async ({ context }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId

		if (!userOrgId) return

		await Promise.all([
			context.queryClient.prefetchQuery(
				orpc.recipe.getOrg.queryOptions({
					input: { organisationId: userOrgId },
				}),
			),
			context.queryClient.prefetchQuery(
				orpc.menuTemplate.getAllOrg.queryOptions({
					input: { organisationId: userOrgId },
				}),
			),
		])
	},
	ssr: false,
})

function CreateMenuTemplatePage() {
	const { session } = Route.useRouteContext()
	const userOrgId = session?.user?.organisationId

	if (!userOrgId) {
		return <div>Missing organization</div>
	}

	return <MenuTemplateCreateForm organisationId={userOrgId} />
}
