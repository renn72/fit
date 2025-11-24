import { Link } from '@tanstack/react-router'
import { ModeToggle } from './mode-toggle'
import UserMenu from './user-menu'

export default function Header() {
	const links = [{ to: '/', label: 'Home' }] as const

	return (
		<div>
			<div className='flex flex-row justify-between items-center py-1 px-2'>
				<nav className='flex gap-4 text-lg'>
					{links.map(({ to, label }) => {
						return (
							<Link key={to} to={to}>
								{label}
							</Link>
						)
					})}
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
