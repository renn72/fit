import { RecipeCreateForm } from '@/components/admin/recipe/recipe-create-form'
import { orpc } from '@/utils/orpc'

import {
	createFileRoute,
	useNavigate,
	useRouteContext,
} from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/recipes_/create')({
	component: CreateRecipePage,
	loader: async ({ context }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId

		if (!userOrgId) return <div>missing org</div>

		await context.queryClient.prefetchQuery(
			orpc.ingredient.getAllOrg.queryOptions({
				input: { organisationId: userOrgId },
			}),
		)
	},
	ssr: false,
})

function CreateRecipePage() {
	const navigate = useNavigate()
	const { orgSlug } = Route.useParams()
	const { session } = useRouteContext({
		from: '/$orgSlug/recipes_/create',
	})
	const userOrgId = session?.user?.organisationId

	if (!userOrgId) {
		return <div>Missing organization</div>
	}

	return (
		<div className='w-full'>
			<RecipeCreateForm
				organisationId={userOrgId}
				onSuccess={() => {
					navigate({
						to: '/$orgSlug/recipes',
						params: { orgSlug },
					})
				}}
			/>
		</div>
	)
}
