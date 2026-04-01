import { AuthPanel } from '@/components/auth-panel'

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/auth')({
	beforeLoad: ({ context }) => {
		console.log({ context })
		if (context.session?.user) {
			throw redirect({ to: '/app' })
		}
	},
	component: NutritionAuthPage,
})

function NutritionAuthPage() {
	return (
		<div className='px-4 py-4 sm:px-6 lg:px-8'>
			<div className='mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl items-center rounded-2xl border bg-card px-6 py-6 sm:px-8 sm:py-8'>
				<AuthPanel />
			</div>
		</div>
	)
}
