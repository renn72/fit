import { useState } from 'react'

import { Badge } from '@fit/components/ui/badge'
import { Button } from '@fit/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fit/components/ui/card'
import { Input } from '@fit/components/ui/input'
import { Label } from '@fit/components/ui/label'
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@fit/components/ui/tabs'
import { env } from '@fit/env/web'

import { authClient } from '@/lib/auth-client'
import { refreshSessionInRouter } from '@/lib/session'

import { useRouter } from '@tanstack/react-router'

import { BrandMark } from './brand-mark'

import { Dumbbell, LockKeyhole, TimerReset } from 'lucide-react'
import { toast } from 'sonner'

type Mode = 'sign-in' | 'sign-up'

export function AuthPanel() {
	const router = useRouter()
	const [mode, setMode] = useState<Mode>('sign-in')
	const [pendingMode, setPendingMode] = useState<Mode | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [signInValues, setSignInValues] = useState({ email: '', password: '' })
	const [signUpValues, setSignUpValues] = useState({
		name: '',
		email: '',
		password: '',
	})

	function updateSignInValue(field: 'email' | 'password', value: string) {
		setSignInValues((current) => ({ ...current, [field]: value }))
	}

	function updateSignUpValue(
		field: 'name' | 'email' | 'password',
		value: string,
	) {
		setSignUpValues((current) => ({ ...current, [field]: value }))
	}

	async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError(null)
		setPendingMode('sign-in')

		await authClient.signIn.email(signInValues, {
			onSuccess: async () => {
				await refreshSessionInRouter(router)
				await router.navigate({ to: '/app' })
				toast.success('Signed in to your training workspace.')
			},
			onError: ({ error: signInError }) => {
				setError(signInError.message || signInError.statusText)
			},
			onFinished: () => {
				setPendingMode(null)
			},
		})
	}

	async function handleSignUp(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError(null)
		setPendingMode('sign-up')

		await authClient.signUp.email(
			{
				...signUpValues,
				callbackURL: `${env.VITE_WEB_URL}/auth`,
			},
			{
				onSuccess: async () => {
					await refreshSessionInRouter(router)
					await router.navigate({ to: '/app' })
					toast.success('Account created. Training app is ready.')
				},
				onError: ({ error: signUpError }) => {
					setError(signUpError.message || signUpError.statusText)
				},
				onFinished: () => {
					setPendingMode(null)
				},
			},
		)
	}

	return (
		<div className='grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center'>
			<div className='space-y-6'>
				<div className='inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/78 px-4 py-2 shadow-sm backdrop-blur-sm'>
					<BrandMark className='size-9 rounded-xl text-base' />
					<div>
						<p className='text-sm font-semibold'>FIT Training</p>
						<p className='text-xs text-muted-foreground'>
							Client-facing blocks, sessions, and recovery readouts.
						</p>
					</div>
				</div>

				<div className='space-y-3'>
					<Badge variant='secondary' className='gap-1.5 rounded-full px-3 py-1'>
						<Dumbbell className='size-3.5' />
						Focused client training surface
					</Badge>
					<h1 className='max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl'>
						See the next session, the current block, and your recovery signal in
						one view.
					</h1>
					<p className='max-w-xl text-base leading-7 text-muted-foreground'>
						This app keeps training execution sharp for clients by trimming away
						the planning tools and exposing only what matters to the athlete.
					</p>
				</div>

				<div className='grid gap-3 sm:grid-cols-3'>
					<div className='rounded-2xl border border-white/70 bg-white/72 p-4 shadow-sm backdrop-blur-sm'>
						<Dumbbell className='mb-3 size-4 text-primary' />
						<p className='font-medium'>Block visibility</p>
						<p className='mt-1 text-sm text-muted-foreground'>
							Know what the current cycle is trying to achieve.
						</p>
					</div>
					<div className='rounded-2xl border border-white/70 bg-white/72 p-4 shadow-sm backdrop-blur-sm'>
						<TimerReset className='mb-3 size-4 text-primary' />
						<p className='font-medium'>Session timing</p>
						<p className='mt-1 text-sm text-muted-foreground'>
							The next session stays front and center.
						</p>
					</div>
					<div className='rounded-2xl border border-white/70 bg-white/72 p-4 shadow-sm backdrop-blur-sm'>
						<LockKeyhole className='mb-3 size-4 text-primary' />
						<p className='font-medium'>Athlete-only context</p>
						<p className='mt-1 text-sm text-muted-foreground'>
							No admin editing tools leak into the client experience.
						</p>
					</div>
				</div>
			</div>

			<Card className='border-white/70 bg-white/84 shadow-[0_32px_90px_rgba(71,92,173,0.16)] backdrop-blur-sm'>
				<CardHeader className='space-y-2'>
					<CardTitle>Access your training app</CardTitle>
					<CardDescription>
						Sign in to view your block, upcoming sessions, and recovery
						guidance.
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
						<TabsList className='grid w-full grid-cols-2'>
							<TabsTrigger value='sign-in'>Sign in</TabsTrigger>
							<TabsTrigger value='sign-up'>Create account</TabsTrigger>
						</TabsList>

						<TabsContent value='sign-in' className='pt-4'>
							<form className='space-y-4' onSubmit={handleSignIn}>
								<div className='space-y-2'>
									<Label htmlFor='training-signin-email'>Email</Label>
									<Input
										id='training-signin-email'
										type='email'
										autoComplete='email'
										value={signInValues.email}
										onChange={(event) =>
											updateSignInValue('email', event.target.value)
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='training-signin-password'>Password</Label>
									<Input
										id='training-signin-password'
										type='password'
										autoComplete='current-password'
										value={signInValues.password}
										onChange={(event) =>
											updateSignInValue('password', event.target.value)
										}
									/>
								</div>
								<Button
									type='submit'
									className='w-full'
									disabled={pendingMode === 'sign-in'}
								>
									{pendingMode === 'sign-in'
										? 'Opening workspace...'
										: 'Open training app'}
								</Button>
							</form>
						</TabsContent>

						<TabsContent value='sign-up' className='pt-4'>
							<form className='space-y-4' onSubmit={handleSignUp}>
								<div className='space-y-2'>
									<Label htmlFor='training-signup-name'>Name</Label>
									<Input
										id='training-signup-name'
										autoComplete='name'
										value={signUpValues.name}
										onChange={(event) =>
											updateSignUpValue('name', event.target.value)
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='training-signup-email'>Email</Label>
									<Input
										id='training-signup-email'
										type='email'
										autoComplete='email'
										value={signUpValues.email}
										onChange={(event) =>
											updateSignUpValue('email', event.target.value)
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='training-signup-password'>Password</Label>
									<Input
										id='training-signup-password'
										type='password'
										autoComplete='new-password'
										value={signUpValues.password}
										onChange={(event) =>
											updateSignUpValue('password', event.target.value)
										}
									/>
								</div>
								<Button
									type='submit'
									className='w-full'
									disabled={pendingMode === 'sign-up'}
								>
									{pendingMode === 'sign-up'
										? 'Creating account...'
										: 'Create training account'}
								</Button>
							</form>
						</TabsContent>
					</Tabs>

					{error ? (
						<p className='rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
							{error}
						</p>
					) : null}
				</CardContent>
			</Card>
		</div>
	)
}
