import { IngredientsPage } from '@/components/admin/ingredient/ingredients-page'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'

import { z } from 'zod'

const ingredientsSearchSchema = z.object({
	view: z.enum(['table', 'grid']).default('table'),
	page: z.number().int().min(1).default(1),
	perPage: z.number().int().min(1).max(100).default(10),
	sort: z
		.array(
			z.object({
				id: z.string(),
				desc: z.boolean(),
			}),
		)
		.default([{ id: 'createdAt', desc: true }]),
})

export const Route = createFileRoute('/$orgSlug/ingredients')({
	component: IngredientsPage,
	validateSearch: zodValidator(ingredientsSearchSchema),
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
