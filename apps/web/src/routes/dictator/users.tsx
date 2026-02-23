import { UsersTable } from '@/components/dictator/users/users-table'
import { orpc } from '@/utils/orpc'

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dictator/users')({
	component: UsersTable,
	loader: async ({ context }) => {
		await context.queryClient.prefetchQuery(orpc.user.getAll.queryOptions({}))
	},
	ssr: false,
})
