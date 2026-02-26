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
	const navigate = useNavigate()
	const { orgSlug } = Route.useParams()
	const { session } = Route.useRouteContext()
	const userOrgId = session?.user?.organisationId

	if (!userOrgId) {
		return <div>Missing organization</div>
	}

	return (
		<div className='flex flex-col gap-4 p-4 mx-auto w-full max-w-4xl'>
			<div className='flex gap-4 items-center'>
				<Button
					onClick={() =>
						navigate({ to: '/$orgSlug/menu-templates', params: { orgSlug } })
					}
					variant='ghost'
					className='text-sm text-muted-foreground hover:text-foreground'
				>
					← Back to Menu Templates
				</Button>
			</div>

			<div className='space-y-2'>
				<h1 className='text-2xl font-bold tracking-tight'>
					Create Menu Template
				</h1>
				<p className='text-muted-foreground'>
					Create a new menu template by adding meals and selecting recipes for
					each meal.
				</p>
			</div>

			<MenuTemplateCreateForm organisationId={userOrgId} />
		</div>
	)
}
