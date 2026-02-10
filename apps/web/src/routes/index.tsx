import { orpc } from '@/utils/orpc'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
	component: HomeComponent,
})

function HomeComponent() {
	const healthCheck = useQuery(orpc.healthCheck.queryOptions())

	return (
		<div className='container py-2 px-4 mx-auto max-w-3xl'>
			<div className='grid gap-6'>
				<section className='p-4 rounded-lg border'>
					<h2 className='mb-2 font-medium'>API Status</h2>
					<div className='flex gap-2 items-center'>
						<div
							className={`h-2 w-2 rounded-full ${healthCheck.data ? 'bg-green-500' : 'bg-red-500'}`}
						/>
						<span className='text-sm text-muted-foreground'>
							{healthCheck.isLoading
								? 'Checking...'
								: healthCheck.data
									? 'Connected'
									: 'Disconnected'}
						</span>
					</div>
				</section>
			</div>
		</div>
	)
}
