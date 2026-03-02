import { WarmupsPage } from '@/components/admin/warmup/warmups-page'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'
import { zodValidator } from '@tanstack/zod-adapter'

import { z } from 'zod'

const warmupsSearchSchema = z.object({
	view: z.enum(['table', 'grid']).default('table'),
	q: z.string().default(''),
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

export const Route = createFileRoute('/$orgSlug/warmups')({
	component: WarmupsPage,
	validateSearch: zodValidator(warmupsSearchSchema),
	loader: async ({ context }) => {
		const session = context.session
		const userOrgId = session?.user?.organisationId

		if (!userOrgId) return

		await context.queryClient.prefetchQuery(
			orpc.warmup.getAllGroups.queryOptions({
				input: { organisationId: userOrgId },
			}),
		)
	},
	ssr: false,
})
