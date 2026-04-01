import { useState } from 'react'

import { cn } from '@fit/components'
import { Button } from '@fit/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@fit/components/ui/dialog'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@fit/components/ui/dropdown-menu'
import { Input } from '@fit/components/ui/input'
import { Label } from '@fit/components/ui/label'

import { authClient } from '@/lib/auth-client'
import { type AppSession, clearSessionInRouter } from '@/lib/session'

import { Link, useRouter } from '@tanstack/react-router'

import { BrandMark } from './brand-mark'
import { useTheme } from './theme-provider'

import {
	Leaf,
	LogOut,
	Mail,
	Moon,
	Soup,
	SwatchBook,
	TrendingUp,
	UserRound,
} from 'lucide-react'
import { toast } from 'sonner'

type AppShellProps = {
	children: React.ReactNode
	session: AppSession
}

type AccountDialog = 'profile' | 'email' | 'password' | null

type NavItem = {
	to: '/app' | '/app/menu' | '/app/recipes' | '/app/check-in'
	label: string
	icon: typeof Leaf
}

type QuickLinkItem = {
	to: '/app/menu' | '/app/check-in'
	label: string
	icon: typeof Leaf
	ariaLabel: string
}

const navigation: NavItem[] = [
	{ to: '/app', label: 'Today', icon: Leaf },
	{ to: '/app/menu', label: 'Menu', icon: Soup },
	{ to: '/app/recipes', label: 'Recipes', icon: SwatchBook },
	{ to: '/app/check-in', label: 'Check-in', icon: TrendingUp },
]

const quickLinks: QuickLinkItem[] = [
	{
		to: '/app/menu',
		label: 'Menu',
		icon: Soup,
		ariaLabel: 'Open nutrition menu',
	},
	{
		to: '/app/check-in',
		label: 'Check-in',
		icon: TrendingUp,
		ariaLabel: 'Open nutrition check-in',
	},
]

function getErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message) {
		return error.message
	}

	return 'Something went wrong. Please try again.'
}

export function AppShell({ children, session }: AppShellProps) {
	const router = useRouter()
	const { theme, setTheme } = useTheme()
	const [accountDialog, setAccountDialog] = useState<AccountDialog>(null)
	const [emailDraft, setEmailDraft] = useState(session?.user?.email ?? '')
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [pendingAction, setPendingAction] = useState<
		'email' | 'password' | null
	>(null)
	const displayName = session?.user?.name?.trim() || 'Client'
	const initials = displayName
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('')
	const accountInitials = initials || 'C'
	const navLeft = navigation.slice(0, 2)
	const navRight = navigation.slice(2)
	const [primaryQuickLink, secondaryQuickLink] = quickLinks

	async function handleSignOut() {
		await authClient.signOut({
			fetchOptions: {
				onSuccess: async () => {
					await clearSessionInRouter(router)
					await router.navigate({ to: '/auth' })
				},
			},
		})
	}

	async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setPendingAction('email')

		try {
			await authClient.$fetch('/change-email', {
				method: 'POST',
				body: {
					newEmail: emailDraft,
					callbackURL: window.location.href,
				},
			})
			toast.success('Check your inbox to confirm the new email address.')
			setAccountDialog(null)
		} catch (error) {
			toast.error(getErrorMessage(error))
		} finally {
			setPendingAction(null)
		}
	}

	async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setPendingAction('password')

		try {
			await authClient.$fetch('/change-password', {
				method: 'POST',
				body: {
					currentPassword,
					newPassword,
					revokeOtherSessions: true,
				},
			})
			setCurrentPassword('')
			setNewPassword('')
			toast.success('Password updated.')
			setAccountDialog(null)
		} catch (error) {
			toast.error(getErrorMessage(error))
		} finally {
			setPendingAction(null)
		}
	}

	return (
		<div className='flex overflow-hidden flex-col mx-auto w-full h-[100dvh] max-w-[430px] border-x bg-background'>
			<header className='py-3 px-4 border-b shrink-0 bg-background'>
				<div className='grid gap-3 items-start grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]'>
					<HeaderQuickLink item={primaryQuickLink} />

					<div className='flex flex-col gap-2 items-center min-w-0 text-center'>
						<BrandMark className='text-lg rounded-full size-12' />
						<div className='space-y-0.5'>
							<p className='uppercase text-[0.62rem] tracking-[0.28em] text-muted-foreground'>
								Forma
							</p>
							<p className='text-sm font-semibold'>Forma | Nutrition</p>
						</div>
					</div>

					<HeaderQuickLink item={secondaryQuickLink} align='end' />
				</div>
				<p className='sr-only'>Signed in as {displayName}</p>
			</header>

			<main className='overflow-y-auto flex-1 py-4 px-4 min-h-0'>
				{children}
			</main>

			<footer className='py-3 px-3 border-t shrink-0 bg-background'>
				<nav className='grid grid-cols-5 gap-1 items-end'>
					{navLeft.map((item) => (
						<MobileNavLink key={item.to} item={item} />
					))}

					<div className='flex justify-center'>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button
										variant='outline'
										size='icon-lg'
										className='rounded-full'
									/>
								}
							>
								<span className='text-sm font-semibold tracking-[0.02em]'>
									{accountInitials}
								</span>
								<span className='sr-only'>Account</span>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='center' side='top' className=''>
								<DropdownMenuGroup>
									<DropdownMenuLabel>
										<div className='space-y-1'>
											<p className='font-medium text-foreground'>
												{displayName}
											</p>
											<p className='text-xs truncate'>{session?.user?.email}</p>
										</div>
									</DropdownMenuLabel>
								</DropdownMenuGroup>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => setAccountDialog('profile')}>
									<UserRound className='size-4' />
									Profile
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setTheme('light')}>
									<Leaf className='size-4' />
									Light theme
									<span className='ml-auto text-xs text-muted-foreground'>
										{theme === 'light' ? 'On' : ''}
									</span>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setTheme('dark')}>
									<Moon className='size-4' />
									Dark theme
									<span className='ml-auto text-xs text-muted-foreground'>
										{theme === 'dark' ? 'On' : ''}
									</span>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => setAccountDialog('email')}>
									<Mail className='size-4' />
									Change email
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setAccountDialog('password')}>
									<Leaf className='size-4' />
									Change password
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleSignOut}>
									<LogOut className='size-4' />
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>

					{navRight.map((item) => (
						<MobileNavLink key={item.to} item={item} />
					))}
				</nav>
			</footer>

			<Dialog
				open={accountDialog === 'profile'}
				onOpenChange={(open) => {
					if (!open) {
						setAccountDialog(null)
					}
				}}
			>
				<DialogContent className='max-w-sm'>
					<DialogHeader>
						<DialogTitle>Profile</DialogTitle>
						<DialogDescription>
							Account access is created by your coach or admin.
						</DialogDescription>
					</DialogHeader>
					<div className='space-y-3'>
						<div className='p-4 rounded-xl border bg-muted'>
							<p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>
								Name
							</p>
							<p className='mt-2 font-medium'>{displayName}</p>
						</div>
						<div className='p-4 rounded-xl border bg-muted'>
							<p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>
								Email
							</p>
							<p className='mt-2 font-medium'>{session?.user?.email}</p>
						</div>
					</div>
					<DialogFooter showCloseButton />
				</DialogContent>
			</Dialog>

			<Dialog
				open={accountDialog === 'email'}
				onOpenChange={(open) => {
					if (!open) {
						setAccountDialog(null)
					}
				}}
			>
				<DialogContent className='max-w-sm'>
					<DialogHeader>
						<DialogTitle>Change email</DialogTitle>
						<DialogDescription>
							Update the email attached to your client login.
						</DialogDescription>
					</DialogHeader>
					<form className='space-y-4' onSubmit={handleEmailSubmit}>
						<div className='space-y-2'>
							<Label htmlFor='nutrition-change-email'>New email</Label>
							<Input
								id='nutrition-change-email'
								type='email'
								autoComplete='email'
								value={emailDraft}
								onChange={(event) => setEmailDraft(event.target.value)}
							/>
						</div>
						<DialogFooter>
							<Button type='submit' disabled={pendingAction === 'email'}>
								{pendingAction === 'email' ? 'Updating...' : 'Update email'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog
				open={accountDialog === 'password'}
				onOpenChange={(open) => {
					if (!open) {
						setAccountDialog(null)
					}
				}}
			>
				<DialogContent className='max-w-sm'>
					<DialogHeader>
						<DialogTitle>Change password</DialogTitle>
						<DialogDescription>
							Use your current password to set a new one.
						</DialogDescription>
					</DialogHeader>
					<form className='space-y-4' onSubmit={handlePasswordSubmit}>
						<div className='space-y-2'>
							<Label htmlFor='nutrition-current-password'>
								Current password
							</Label>
							<Input
								id='nutrition-current-password'
								type='password'
								autoComplete='current-password'
								value={currentPassword}
								onChange={(event) => setCurrentPassword(event.target.value)}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='nutrition-new-password'>New password</Label>
							<Input
								id='nutrition-new-password'
								type='password'
								autoComplete='new-password'
								value={newPassword}
								onChange={(event) => setNewPassword(event.target.value)}
							/>
						</div>
						<DialogFooter>
							<Button type='submit' disabled={pendingAction === 'password'}>
								{pendingAction === 'password'
									? 'Updating...'
									: 'Update password'}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</div>
	)
}

function HeaderQuickLink({
	item,
	align = 'start',
}: {
	item: QuickLinkItem
	align?: 'start' | 'end'
}) {
	const Icon = item.icon

	return (
		<Link
			to={item.to}
			aria-label={item.ariaLabel}
			className={cn(
				'flex min-w-0 flex-col items-center gap-2 text-center text-[0.78rem] font-medium text-muted-foreground transition-colors hover:text-foreground',
				align === 'end' ? 'justify-self-end' : 'justify-self-start',
			)}
		>
			<span className='flex justify-center items-center rounded-lg border size-10 bg-muted'>
				<Icon className='size-5' />
			</span>
			<span>{item.label}</span>
		</Link>
	)
}

function MobileNavLink({ item }: { item: NavItem }) {
	const Icon = item.icon

	return (
		<Link
			to={item.to}
			activeProps={{
				className:
					'text-foreground [&_.nav-icon]:border-primary [&_.nav-icon]:bg-primary [&_.nav-icon]:text-primary-foreground',
			}}
			inactiveProps={{
				className: 'text-muted-foreground hover:text-foreground',
			}}
			className={cn(
				'flex min-h-14 flex-col items-center justify-end gap-1 rounded-3xl px-1 pb-1 pt-2 text-[0.68rem] font-medium transition-all',
			)}
		>
			<span className='flex justify-center items-center text-current rounded-full border transition-all nav-icon size-9 bg-background'>
				<Icon className='size-4' />
			</span>
			<span>{item.label}</span>
		</Link>
	)
}
