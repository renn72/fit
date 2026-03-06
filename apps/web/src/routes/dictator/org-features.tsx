import { OrgFeatureMetaTagsPage } from '@/components/dictator/features/org-feature-meta-tags-page'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator/org-features')({
	component: OrgFeatureMetaTagsPage,
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(
			orpc.organisation.getAll.queryOptions({}),
		)
	},
	ssr: false,
})
