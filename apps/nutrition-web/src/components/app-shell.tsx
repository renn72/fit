import { cn } from '@fit/components'
import { Avatar, AvatarFallback } from '@fit/components/ui/avatar'
import { Badge } from '@fit/components/ui/badge'
import { Button, buttonVariants } from '@fit/components/ui/button'
import { Separator } from '@fit/components/ui/separator'

import { authClient } from '@/lib/auth-client'
import { type AppSession, clearSessionInRouter } from '@/lib/session'

import { Link, useRouter } from '@tanstack/react-router'

import { BrandMark } from './brand-mark'

import { Leaf, LogOut, Soup, SwatchBook, TrendingUp } from 'lucide-react'

type AppShellProps = {
	children: React.ReactNode
	session: AppSession
}

const navigation = [
	{ to: '/app', label: 'Today', icon: Leaf },
	{ to: '/app/menu', label: 'Menu', icon: Soup },
	{ to: '/app/recipes', label: 'Recipes', icon: SwatchBook },
	{ to: '/app/check-in', label: 'Check-in', icon: TrendingUp },
] as const

export function AppShell({ children, session }: AppShellProps) {
	const router = useRouter()
	const displayName = session?.user?.name?.trim() || 'Client'
	const initials = displayName
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('')

	async function handleSignOut() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: async () => {
					await clearSessionInRouter(router)
					await router.navigate({ to: '/' })
				},
			},
		})
	}

	return (
		<div className='min-h-screen px-4 py-4 sm:px-6 lg:px-8'>
			<div className='mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col rounded-[2rem] border border-white/70 bg-white/68 shadow-[0_32px_90px_rgba(66,108,79,0.18)] backdrop-blur-xl'>
				<header className='flex flex-col gap-5 px-6 py-6 sm:px-8'>
					<div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
						<div className='flex items-center gap-4'>
							<BrandMark />
							<div>
								<div className='flex flex-wrap items-center gap-2'>
									<p className='text-lg font-semibold'>FIT Nutrition</p>
									<Badge variant='secondary' className='rounded-full px-3 py-1'>
										Client app
									</Badge>
								</div>
								<p className='text-sm text-muted-foreground'>
									Stay aligned with your coach without opening the admin tools.
								</p>
							</div>
						</div>

						<div className='flex flex-wrap items-center gap-3'>
							<div className='flex items-center gap-3 rounded-2xl border border-white/70 bg-background/80 px-3 py-2 shadow-sm'>
								<Avatar>
									<AvatarFallback>{initials || 'C'}</AvatarFallback>
								</Avatar>
								<div>
									<p className='text-sm font-medium'>{displayName}</p>
									<p className='text-xs text-muted-foreground'>
										{session?.user?.email || 'Signed in'}
									</p>
								</div>
							</div>

							<Button variant='outline' onClick={handleSignOut}>
								<LogOut className='size-4' />
								Sign out
							</Button>
						</div>
					</div>

					<nav className='flex flex-wrap gap-2'>
						{navigation.map((item) => {
							const Icon = item.icon

							return (
								<Link
									key={item.to}
									to={item.to}
									activeProps={{
										className:
											'bg-foreground text-background shadow-[0_14px_28px_rgba(24,55,35,0.18)]',
									}}
									inactiveProps={{
										className:
											'bg-background/75 text-muted-foreground hover:bg-white hover:text-foreground',
									}}
									className={cn(
										buttonVariants({ variant: 'ghost', size: 'lg' }),
										'h-11 rounded-full border border-white/70 px-4 transition-all',
									)}
								>
									<Icon className='size-4' />
									{item.label}
								</Link>
							)
						})}
					</nav>
				</header>

				<Separator className='bg-white/70' />

				<main className='flex-1 px-6 py-6 sm:px-8'>{children}</main>
			</div>
		</div>
	)
}
