import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	beforeLoad: ({ context }) => {
		throw redirect({ to: context.session?.user ? '/app' : '/auth' })
	},
	component: () => null,
})
