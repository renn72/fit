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

import { Leaf, LockKeyhole, Sparkles } from 'lucide-react'
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
				toast.success('Signed in to your nutrition workspace.')
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
					toast.success('Account created. Your plan is ready.')
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
				<div className='inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/75 px-4 py-2 shadow-sm backdrop-blur-sm'>
					<BrandMark className='size-9 rounded-xl text-base' />
					<div>
						<p className='text-sm font-semibold'>FIT Nutrition</p>
						<p className='text-xs text-muted-foreground'>
							Client-facing planning, recipes, and weekly check-ins.
						</p>
					</div>
				</div>

				<div className='space-y-3'>
					<Badge variant='secondary' className='gap-1.5 rounded-full px-3 py-1'>
						<Leaf className='size-3.5' />
						Coach-approved daily menus
					</Badge>
					<h1 className='max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl'>
						One clean place to follow your nutrition plan without the admin
						clutter.
					</h1>
					<p className='max-w-xl text-base leading-7 text-muted-foreground'>
						See the meals that matter today, keep recipes within reach, and stay
						aligned with your coach across the whole week.
					</p>
				</div>

				<div className='grid gap-3 sm:grid-cols-3'>
					<div className='rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur-sm'>
						<Sparkles className='mb-3 size-4 text-primary' />
						<p className='font-medium'>Clear daily intent</p>
						<p className='mt-1 text-sm text-muted-foreground'>
							Know exactly what to eat and when to flex.
						</p>
					</div>
					<div className='rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur-sm'>
						<Leaf className='mb-3 size-4 text-primary' />
						<p className='font-medium'>Recipe memory</p>
						<p className='mt-1 text-sm text-muted-foreground'>
							Keep repeat meals fast instead of rebuilding them.
						</p>
					</div>
					<div className='rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur-sm'>
						<LockKeyhole className='mb-3 size-4 text-primary' />
						<p className='font-medium'>Private by default</p>
						<p className='mt-1 text-sm text-muted-foreground'>
							Your client surface stays focused on your plan only.
						</p>
					</div>
				</div>
			</div>

			<Card className='border-white/70 bg-white/82 shadow-[0_32px_90px_rgba(77,121,91,0.18)] backdrop-blur-sm'>
				<CardHeader className='space-y-2'>
					<CardTitle>Access your plan</CardTitle>
					<CardDescription>
						Sign in to review your menu, recipes, and check-ins.
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
									<Label htmlFor='nutrition-signin-email'>Email</Label>
									<Input
										id='nutrition-signin-email'
										type='email'
										autoComplete='email'
										value={signInValues.email}
										onChange={(event) =>
											updateSignInValue('email', event.target.value)
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='nutrition-signin-password'>Password</Label>
									<Input
										id='nutrition-signin-password'
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
										: 'Open nutrition app'}
								</Button>
							</form>
						</TabsContent>

						<TabsContent value='sign-up' className='pt-4'>
							<form className='space-y-4' onSubmit={handleSignUp}>
								<div className='space-y-2'>
									<Label htmlFor='nutrition-signup-name'>Name</Label>
									<Input
										id='nutrition-signup-name'
										autoComplete='name'
										value={signUpValues.name}
										onChange={(event) =>
											updateSignUpValue('name', event.target.value)
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='nutrition-signup-email'>Email</Label>
									<Input
										id='nutrition-signup-email'
										type='email'
										autoComplete='email'
										value={signUpValues.email}
										onChange={(event) =>
											updateSignUpValue('email', event.target.value)
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='nutrition-signup-password'>Password</Label>
									<Input
										id='nutrition-signup-password'
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
										: 'Create nutrition account'}
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
