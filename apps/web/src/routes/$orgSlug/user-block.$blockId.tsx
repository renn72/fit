import { UserBlockDetailsPage } from '@/components/admin/user-blocks/user-block-details-page'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/user-block/$blockId')({
	component: UserBlockDetailsPage,
	loader: async ({ context, params }) => {
		await context.queryClient.prefetchQuery(
			orpc.userBlock.get.queryOptions({
				input: { id: params.blockId },
			}),
		)
	},
	ssr: false,
})
