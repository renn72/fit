import { AppFeaturesPage } from '@/components/dictator/features/app-features-page'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator/app-features')({
	component: AppFeaturesPage,
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(
			orpc.feature.getAppFeatures.queryOptions(),
		)
	},
	ssr: false,
})
