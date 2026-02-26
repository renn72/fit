import { ExercisesPage } from '@/components/admin/exercise/exercises-page'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'

import { z } from 'zod'

const exercisesSearchSchema = z.object({
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

export const Route = createFileRoute('/$orgSlug/exercises')({
	component: ExercisesPage,
	validateSearch: zodValidator(exercisesSearchSchema),
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
