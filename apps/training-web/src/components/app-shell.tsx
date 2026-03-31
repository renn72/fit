import { useState } from 'react'

import { cn } from '@fit/components'
import { Avatar, AvatarFallback } from '@fit/components/ui/avatar'
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
	Activity,
	CalendarClock,
	Dumbbell,
	LogOut,
	Mail,
	Moon,
	ShieldCheck,
	Sun,
	UserRound,
} from 'lucide-react'
import { toast } from 'sonner'

type AppShellProps = {
	children: React.ReactNode
	session: AppSession
}

type AccountDialog = 'profile' | 'email' | 'password' | null

type NavItem = {
	to: '/app' | '/app/plan' | '/app/sessions' | '/app/recovery'
	label: string
	icon: typeof Activity
}

const navigation: NavItem[] = [
	{ to: '/app', label: 'Today', icon: Activity },
	{ to: '/app/plan', label: 'Plan', icon: Dumbbell },
	{ to: '/app/sessions', label: 'Sessions', icon: CalendarClock },
	{ to: '/app/recovery', label: 'Recovery', icon: ShieldCheck },
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
	const displayName = session?.user?.name?.trim() || 'Athlete'
	const initials = displayName
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('')
	const navLeft = navigation.slice(0, 2)
	const navRight = navigation.slice(2)

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
		<div className='mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden border-x border-white/60 bg-white/76 shadow-[0_28px_80px_rgba(71,92,173,0.16)] backdrop-blur-xl'>
			<header className='shrink-0 border-b border-white/70 bg-background/86 backdrop-blur-xl'>
				<div className='grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 pb-3 pt-4'>
					<div className='min-w-0'>
						<p className='text-[0.65rem] uppercase tracking-[0.24em] text-muted-foreground'>
							Signed in
						</p>
						<p className='truncate text-sm font-medium'>{displayName}</p>
					</div>

					<div className='flex flex-col items-center gap-1 text-center'>
						<BrandMark className='size-10 rounded-2xl text-base' />
						<div>
							<p className='text-[0.62rem] uppercase tracking-[0.28em] text-muted-foreground'>
								Forma
							</p>
							<p className='text-sm font-semibold'>Forma | Training</p>
						</div>
					</div>

					<div className='justify-self-end'>
						<div className='flex items-center gap-2 rounded-full border border-white/70 bg-white/82 px-2 py-1.5 shadow-sm'>
							<Avatar className='size-8'>
								<AvatarFallback>{initials || 'A'}</AvatarFallback>
							</Avatar>
							<p className='hidden text-xs font-medium text-muted-foreground sm:block'>
								Coach-built
							</p>
						</div>
					</div>
				</div>
			</header>

			<main className='min-h-0 flex-1 overflow-y-auto px-4 py-4'>
				{children}
			</main>

			<footer className='shrink-0 border-t border-white/70 bg-background/92 px-3 py-3 backdrop-blur-xl'>
				<nav className='grid grid-cols-5 items-end gap-1'>
					{navLeft.map((item) => (
						<MobileNavLink key={item.to} item={item} />
					))}

					<div className='flex justify-center'>
						<DropdownMenu>
							<DropdownMenuTrigger
								render={
									<Button className='h-14 w-14 rounded-full shadow-[0_16px_36px_rgba(71,92,173,0.24)]' />
								}
							>
								<UserRound className='size-5' />
								<span className='sr-only'>Account</span>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								align='center'
								side='top'
								sideOffset={14}
								className='w-60'
							>
								<DropdownMenuLabel>
									<div className='space-y-1'>
										<p className='font-medium text-foreground'>{displayName}</p>
										<p className='truncate text-xs'>{session?.user?.email}</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => setAccountDialog('profile')}>
									<UserRound className='size-4' />
									Profile
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setTheme('light')}>
									<Sun className='size-4' />
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
									<ShieldCheck className='size-4' />
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
				<p className='mt-2 text-center text-[0.68rem] text-muted-foreground'>
					Sticky dock for quick mobile navigation.
				</p>
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
							<Label htmlFor='training-change-email'>New email</Label>
							<Input
								id='training-change-email'
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
							<Label htmlFor='training-current-password'>
								Current password
							</Label>
							<Input
								id='training-current-password'
								type='password'
								autoComplete='current-password'
								value={currentPassword}
								onChange={(event) => setCurrentPassword(event.target.value)}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='training-new-password'>New password</Label>
							<Input
								id='training-new-password'
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

function MobileNavLink({ item }: { item: NavItem }) {
	const Icon = item.icon

	return (
		<Link
			to={item.to}
			activeProps={{
				className:
					'bg-foreground text-background shadow-[0_12px_30px_rgba(37,52,109,0.18)]',
			}}
			inactiveProps={{
				className:
					'bg-white/72 text-muted-foreground hover:bg-white hover:text-foreground',
			}}
			className={cn(
				'flex min-h-14 flex-col items-center justify-center gap-1 rounded-3xl border border-white/70 px-2 text-[0.68rem] font-medium transition-all',
			)}
		>
			<Icon className='size-4' />
			<span>{item.label}</span>
		</Link>
	)
}
