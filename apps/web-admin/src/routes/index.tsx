import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { authClient } from '@/lib/auth-client'

import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: HomeComponent,
})

function HomeComponent() {
	const { data: session, isPending } = authClient.useSession()

	return (
		<div className='container py-2 px-4 mx-auto max-w-3xl'>
			<div className='grid gap-6'>
				<section className='p-4 rounded-lg border'>
					<h2 className='mb-2 font-medium'>Authentication Status</h2>
					{isPending ? (
						<Skeleton className='w-48 h-6' />
					) : session ? (
						<p>Welcome, {session.user.name}!</p>
					) : (
						<div className='flex flex-col gap-4 items-center'>
							<p className='text-lg'>You are not logged in.</p>
							<Button>
								<Link to='/login'>Sign In</Link>
							</Button>
						</div>
					)}
				</section>
			</div>
		</div>
	)
}
