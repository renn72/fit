import { AuthPanel } from '@/components/auth-panel'

import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/auth')({
	beforeLoad: ({ context }) => {
		if (context.session?.user) {
			throw redirect({ to: '/app' })
		}
	},
	component: TrainingAuthPage,
})

function TrainingAuthPage() {
	return (
		<div className='px-4 py-4 sm:px-6 lg:px-8'>
			<div className='mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl items-center rounded-[2rem] border border-border/70 bg-card/80 px-6 py-6 shadow-[0_32px_90px_rgba(71,92,173,0.16)] backdrop-blur-xl sm:px-8 sm:py-8'>
				<AuthPanel />
			</div>
		</div>
	)
}
