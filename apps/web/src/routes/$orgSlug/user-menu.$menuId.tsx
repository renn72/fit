import { UserMenuDetailsPage } from '@/components/admin/user-menus/user-menu-details-page'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/$orgSlug/user-menu/$menuId')({
	component: UserMenuDetailsPage,
	loader: async ({ context, params }) => {
		const { menuId } = params

		// Prefetch the menu data
		await context.queryClient.prefetchQuery(
			orpc.userMenu.get.queryOptions({
				input: { id: menuId },
			}),
		)
	},
	ssr: false,
})
