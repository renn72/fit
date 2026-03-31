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
		<div className='py-4 px-4 sm:px-6 lg:px-8'>
			<div className='flex items-center py-6 px-6 mx-auto max-w-7xl border sm:py-8 sm:px-8 min-h-[calc(100vh-2rem)] rounded-[2rem] border-white/70 bg-white/66 shadow-[0_32px_90px_rgba(66,108,79,0.18)] backdrop-blur-xl'>
				<AuthPanel />
			</div>
		</div>
	)
}
