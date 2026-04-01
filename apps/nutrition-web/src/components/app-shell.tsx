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
		<div className='mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden border-x border-border/60 bg-background shadow-[0_28px_80px_rgba(24,55,35,0.18)]'>
			<header className='shrink-0 border-b border-border/60 bg-background/95 px-3 pb-4 pt-3 backdrop-blur-xl'>
				<div className='grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-3'>
					<HeaderQuickLink item={primaryQuickLink} />

					<div className='flex min-w-0 flex-col items-center gap-2 pt-0.5 text-center'>
						<div className='rounded-full border border-border/60 bg-card/75 p-1 shadow-[0_14px_32px_rgba(24,55,35,0.16)]'>
							<BrandMark className='size-12 rounded-full text-lg shadow-none' />
						</div>
						<div className='space-y-0.5'>
							<p className='text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground'>
								Forma
							</p>
							<p className='text-sm font-semibold'>Forma | Nutrition</p>
						</div>
					</div>

					<HeaderQuickLink item={secondaryQuickLink} align='end' />
				</div>
				<p className='sr-only'>Signed in as {displayName}</p>
			</header>

			<main className='min-h-0 flex-1 overflow-y-auto px-3 py-3'>
				{children}
			</main>

			<footer className='shrink-0 border-t border-border/60 bg-background/96 px-3 pb-4 pt-2 backdrop-blur-xl'>
				<nav className='grid grid-cols-5 items-end gap-1 pt-4'>
					{navLeft.map((item) => (
						<MobileNavLink key={item.to} item={item} />
					))}

					<div className='flex justify-center'>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button className='h-14 w-14 rounded-full border border-border/60 bg-foreground px-0 text-background shadow-[0_16px_36px_rgba(24,55,35,0.22)] hover:bg-foreground/90' />
								}
							>
								<span className='text-sm font-semibold tracking-[0.02em]'>
									{accountInitials}
								</span>
								<span className='sr-only'>Account</span>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align='center'
								side='top'
								sideOffset={14}
								className='w-60'
							>
								<DropdownMenuGroup>
									<DropdownMenuLabel>
										<div className='space-y-1'>
											<p className='font-medium text-foreground'>
												{displayName}
											</p>
											<p className='truncate text-xs'>{session?.user?.email}</p>
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
						<div className='rounded-2xl border border-border/70 bg-muted/40 p-4'>
							<p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>
								Name
							</p>
							<p className='mt-2 font-medium'>{displayName}</p>
						</div>
						<div className='rounded-2xl border border-border/70 bg-muted/40 p-4'>
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
			<span className='flex size-11 items-center justify-center rounded-[1.15rem] border border-border/60 bg-card/75 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'>
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
					'text-foreground [&_.nav-icon]:border-foreground [&_.nav-icon]:bg-foreground [&_.nav-icon]:text-background [&_.nav-icon]:shadow-[0_12px_30px_rgba(24,55,35,0.18)]',
			}}
			inactiveProps={{
				className: 'text-muted-foreground hover:text-foreground',
			}}
			className={cn(
				'flex min-h-14 flex-col items-center justify-end gap-1 rounded-3xl px-1 pb-1 pt-2 text-[0.68rem] font-medium transition-all',
			)}
		>
			<span className='nav-icon flex size-9 items-center justify-center rounded-full border border-border/60 bg-card/75 text-current transition-all'>
				<Icon className='size-4' />
			</span>
			<span>{item.label}</span>
		</Link>
	)
}
