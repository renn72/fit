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

import { authClient } from '@/lib/auth-client'
import { refreshSessionInRouter } from '@/lib/session'

import { useRouter } from '@tanstack/react-router'

import { BrandMark } from './brand-mark'

import { ArrowRight, Leaf, LockKeyhole, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

export function AuthPanel() {
	const router = useRouter()
	const [pending, setPending] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [values, setValues] = useState({ email: '', password: '' })

	function updateValue(field: 'email' | 'password', value: string) {
		setValues((current) => ({ ...current, [field]: value }))
	}

	async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setError(null)
		setPending(true)

		await authClient.signIn.email(values, {
			onSuccess: async () => {
				await refreshSessionInRouter(router)
				await router.navigate({ to: '/app' })
				toast.success('Nutrition app ready.')
			},
			onError: ({ error: signInError }) => {
				setError(signInError.message || signInError.statusText)
			},
			onFinished: () => {
				setPending(false)
			},
		})
	}

	return (
		<div className='mx-auto grid w-full max-w-4xl gap-6 md:grid-cols-[1.05fr_0.95fr] md:items-center'>
			<section className='space-y-5'>
				<div className='flex items-center justify-center md:justify-start'>
					<div className='inline-flex items-center gap-3 rounded-full border border-border/70 bg-card/80 px-4 py-2 shadow-sm backdrop-blur-sm'>
						<BrandMark className='size-10 rounded-2xl text-base' />
						<div>
							<p className='text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground'>
								Forma
							</p>
							<p className='text-sm font-semibold'>Forma | Nutrition</p>
						</div>
					</div>
				</div>

				<div className='space-y-3 text-center md:text-left'>
					<Badge variant='secondary' className='gap-1.5 rounded-full px-3 py-1'>
						<ShieldCheck className='size-3.5' />
						Coach-managed access
					</Badge>
					<h1 className='text-4xl font-semibold tracking-tight text-balance sm:text-5xl'>
						Sign in and go straight to the menu your coach assigned.
					</h1>
					<p className='max-w-xl text-base leading-7 text-muted-foreground'>
						Forma | Nutrition is the client-facing view only. Your admin creates
						the account, and the app stays focused on your current menu instead
						of setup tools.
					</p>
				</div>

				<div className='grid gap-3 sm:grid-cols-3'>
					<div className='rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm'>
						<Leaf className='mb-3 size-4 text-primary' />
						<p className='font-medium'>Current menu first</p>
						<p className='mt-1 text-sm text-muted-foreground'>
							Open the plan you should follow today without extra admin layers.
						</p>
					</div>
					<div className='rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm'>
						<LockKeyhole className='mb-3 size-4 text-primary' />
						<p className='font-medium'>Login only</p>
						<p className='mt-1 text-sm text-muted-foreground'>
							An admin creates the client login before you arrive.
						</p>
					</div>
					<div className='rounded-3xl border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-sm'>
						<ArrowRight className='mb-3 size-4 text-primary' />
						<p className='font-medium'>Made for mobile</p>
						<p className='mt-1 text-sm text-muted-foreground'>
							Sticky logo up top, sticky dock down low, scroll in the middle.
						</p>
					</div>
				</div>
			</section>

			<Card className='border-border/70 bg-card/80 shadow-[0_32px_90px_rgba(77,121,91,0.18)] backdrop-blur-sm'>
				<CardHeader className='space-y-2 text-center md:text-left'>
					<CardTitle>Open Forma | Nutrition</CardTitle>
					<CardDescription>
						Use the email and password your coach or admin already created.
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<form className='space-y-4' onSubmit={handleSignIn}>
						<div className='space-y-2'>
							<Label htmlFor='nutrition-signin-email'>Email</Label>
							<Input
								id='nutrition-signin-email'
								type='email'
								autoComplete='email'
								value={values.email}
								onChange={(event) => updateValue('email', event.target.value)}
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='nutrition-signin-password'>Password</Label>
							<Input
								id='nutrition-signin-password'
								type='password'
								autoComplete='current-password'
								value={values.password}
								onChange={(event) =>
									updateValue('password', event.target.value)
								}
							/>
						</div>
						<Button type='submit' className='w-full' disabled={pending}>
							{pending ? 'Opening app...' : 'Open nutrition app'}
						</Button>
					</form>

					<div className='rounded-2xl border border-border/70 bg-background/72 p-4 text-sm text-muted-foreground'>
						<p className='font-medium text-foreground'>Need access?</p>
						<p className='mt-1'>
							An admin creates the account first. If you cannot sign in yet,
							contact your coach instead of creating a new client login here.
						</p>
					</div>

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
