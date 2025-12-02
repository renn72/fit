import { orpc } from '@/utils/orpc'

import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ModeToggle } from './mode-toggle'
import { Spinner } from './ui/spinner'
import { UserMenu } from './user-menu'

export default function Header() {
	const links = [{ to: '/', label: 'Home' }] as const

	const healthCheck = useQuery(orpc.healthCheck.queryOptions())

	return (
		<div>
			<div className='flex flex-row justify-between items-center py-1 px-2'>
				<nav className='flex gap-4 items-center text-lg'>
					{links.map(({ to, label }) => {
						return (
							<Link key={to} to={to}>
								{label}
							</Link>
						)
					})}
					{healthCheck.isLoading ? (
						<Spinner />
					) : (
						<div
							className={`h-2 w-2 rounded-full ${healthCheck.data ? 'bg-green-500' : 'bg-red-500'}`}
						/>
					)}
				</nav>
				<div className='flex gap-2 items-center'>
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
			<hr />
		</div>
	)
}
