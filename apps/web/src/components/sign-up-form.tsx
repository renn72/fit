import { env } from '@fit/env/web'

import { authClient } from '@/lib/auth-client'
import { refreshSessionInRouter } from '@/lib/auth-session'

import { useForm } from '@tanstack/react-form'
import { useRouter } from '@tanstack/react-router'

import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'

import { toast } from 'sonner'
import z from 'zod'

export default function SignUpForm({
	onSwitchToSignIn,
}: {
	onSwitchToSignIn: () => void
}) {
	const router = useRouter()

	const form = useForm({
		defaultValues: {
			email: '',
			password: '',
			name: '',
		},
		onSubmit: async ({ value }) => {
			await authClient.signUp.email(
				{
					email: value.email,
					password: value.password,
					name: value.name,
					callbackURL: `${env.VITE_WEB_URL}/admin`,
				},
				{
					onSuccess: async () => {
						await refreshSessionInRouter(router)
						await router.navigate({ to: '/onboard' })
						toast.success('Sign up successful')
					},
					onError: (error) => {
						toast.error(error.error.message || error.error.statusText)
					},
				},
			)
		},
		validators: {
			onSubmit: z.object({
				name: z.string().min(2, 'Name must be at least 2 characters'),
				email: z.email('Invalid email address'),
				password: z.string().min(4, 'Password must be at least 8 characters'),
			}),
		},
	})

	// if (isPending) {
	// 	return <Loader />
	// }

	return (
		<div className='p-6 mx-auto mt-10 w-full max-w-md'>
			<h1 className='mb-6 text-3xl font-bold text-center'>Create Account</h1>

			<form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					form.handleSubmit()
				}}
				className='space-y-4'
			>
				<div>
					<form.Field name='name'>
						{(field) => (
							<div className='space-y-2'>
								<Label htmlFor={field.name}>Name</Label>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className='text-destructive'>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name='email'>
						{(field) => (
							<div className='space-y-2'>
								<Label htmlFor={field.name}>Email</Label>
								<Input
									id={field.name}
									name={field.name}
									type='email'
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className='text-destructive'>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name='password'>
						{(field) => (
							<div className='space-y-2'>
								<Label htmlFor={field.name}>Password</Label>
								<Input
									id={field.name}
									name={field.name}
									type='password'
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
								/>
								{field.state.meta.errors.map((error) => (
									<p key={error?.message} className='text-destructive'>
										{error?.message}
									</p>
								))}
							</div>
						)}
					</form.Field>
				</div>

				<form.Subscribe>
					{(state) => (
						<Button
							type='submit'
							className='w-full'
							disabled={!state.canSubmit || state.isSubmitting}
						>
							{state.isSubmitting ? 'Submitting...' : 'Sign Up'}
						</Button>
					)}
				</form.Subscribe>
			</form>

			<div className='mt-4 text-center'>
				<Button
					variant='link'
					onClick={onSwitchToSignIn}
					className='text-accent'
				>
					Already have an account? Sign In
				</Button>
			</div>
		</div>
	)
}
