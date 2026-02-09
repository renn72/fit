import { useEffect, useState } from 'react'

import Loader from '@/components/loader'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupText,
} from '@/components/ui/input-group'
import { cn } from '@/lib/utils'
import { orpc } from '@/utils/orpc'

import { useForm, useStore } from '@tanstack/react-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'

import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

export const Route = createFileRoute('/admin/onboard')({
	component: OnboardComponent,
})

function slugify(text: string) {
	return text
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.substring(0, 12)
}

const formSchema = z.object({
	name: z
		.string()
		.min(4, 'Bug title must be at least 4 characters.')
		.max(32, 'Bug title must be at most 32 characters.'),
	slug: z
		.string()
		.min(4, 'Description must be at least 4 characters.')
		.max(12, 'Description must be at most 12 characters.'),
	planId: z.string().min(1),
})

function OnboardComponent() {
	const [step, setStep] = useState(1)
	const [isSlugManual, setIsSlugManual] = useState(false)
	const navigate = useNavigate()

	const { data: plans, isPending: isPlansLoading } = useQuery(
		orpc.organisation.getAllPlans.queryOptions(),
	)

	const createOrg = useMutation(
		orpc.organisation.create.mutationOptions({
			onSuccess: () => {
				toast.success('Organisation created successfully')
				navigate({ to: '/admin' })
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to create organisation')
			},
		}),
	)

	const form = useForm({
		defaultValues: {
			name: '',
			slug: '',
			planId: '',
		},
		validators: {
			onSubmit: formSchema,
		},
		onSubmit: async ({ value }) => {
			if (!value.planId) {
				toast.error('Please select a plan')
				return
			}

			await createOrg.mutateAsync(value)
		},
	})

	const organisationName = useStore(form.store, (state) => state.values.name)

	useEffect(() => {
		if (!isSlugManual && organisationName) {
			const suggestedSlug = slugify(organisationName)
			if (suggestedSlug.length >= 4) {
				form.setFieldValue('slug', suggestedSlug)
			}
		}
	}, [organisationName, isSlugManual, form])

	if (isPlansLoading) {
		return <Loader />
	}

	return (
		<div className='container py-12 max-w-4xl'>
			<div className='mb-8 text-center'>
				<h1 className='text-3xl font-bold'>Welcome to Fit</h1>
				<p className='mt-2 text-muted-foreground'>
					Let's get your organisation set up
				</p>
			</div>

			<div className='flex justify-center mb-8'>
				<div className='flex items-center space-x-4'>
					<div
						className={cn(
							'flex items-center justify-center w-10 h-10 rounded-full border-2',
							step >= 1
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-muted text-muted-foreground',
						)}
					>
						{step > 1 ? <Check className='w-6 h-6' /> : 1}
					</div>
					<div
						className={cn('w-12 h-1', step > 1 ? 'bg-primary' : 'bg-muted')}
					/>
					<div
						className={cn(
							'flex items-center justify-center w-10 h-10 rounded-full border-2',
							step >= 2
								? 'border-primary bg-primary text-primary-foreground'
								: 'border-muted text-muted-foreground',
						)}
					>
						2
					</div>
				</div>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault()
					e.stopPropagation()
					form.handleSubmit()
				}}
			>
				{step === 1 && (
					<Card className='mx-auto max-w-md'>
						<CardHeader>
							<CardTitle>Organisation Details</CardTitle>
							<CardDescription>
								Give your organisation a name and a unique web address.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<FieldGroup>
								<form.Field name='name'>
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched &&
											field.state.meta.errors.length > 0
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Organisation Name
												</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													placeholder='e.g. Acme Fitness'
													value={field.state.value}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													aria-invalid={isInvalid}
												/>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										)
									}}
								</form.Field>

								<form.Field name='slug'>
									{(field) => {
										const isInvalid =
											field.state.meta.isTouched &&
											field.state.meta.errors.length > 0
										return (
											<Field data-invalid={isInvalid}>
												<FieldLabel htmlFor={field.name}>
													Slug (Web Address)
												</FieldLabel>
												<InputGroup>
													<InputGroupAddon>
														<InputGroupText>fit.com/</InputGroupText>
													</InputGroupAddon>
													<Input
														id={field.name}
														name={field.name}
														placeholder='my-org'
														value={field.state.value}
														onBlur={field.handleBlur}
														onChange={(e) => {
															setIsSlugManual(true)
															field.handleChange(e.target.value.toLowerCase())
														}}
														aria-invalid={isInvalid}
													/>
												</InputGroup>
												<FieldDescription>
													This will be your unique URL.
												</FieldDescription>
												{isInvalid && (
													<FieldError errors={field.state.meta.errors} />
												)}
											</Field>
										)
									}}
								</form.Field>
							</FieldGroup>
						</CardContent>
						<CardFooter>
							<form.Subscribe
								selector={(state) => [state.canSubmit, state.values]}
							>
								{() => (
									<Button
										type='button'
										className='ml-auto'
										onClick={() => setStep(2)}
									>
										Next Step <ChevronRight className='ml-2 w-4 h-4' />
									</Button>
								)}
							</form.Subscribe>
						</CardFooter>
					</Card>
				)}

				{step === 2 && (
					<div className='space-y-6'>
						<div className='text-center'>
							<h2 className='text-2xl font-semibold'>Choose a Plan</h2>
							<p className='text-muted-foreground'>
								Select the best plan for your organisation's needs.
							</p>
						</div>

						<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
							<form.Field name='planId'>
								{(field) => (
									<>
										{plans?.map((plan) => (
											<Card
												key={plan.id}
												className={cn(
													'relative cursor-pointer transition-all border-2',
													field.state.value === plan.id
														? 'border-primary shadow-md'
														: 'border-border hover:border-muted-foreground/25',
												)}
												onClick={() => field.handleChange(plan.id)}
											>
												{field.state.value === plan.id && (
													<div className='absolute top-3 right-3 p-1 rounded-full bg-primary text-primary-foreground'>
														<Check className='w-4 h-4' />
													</div>
												)}
												<CardHeader>
													<CardTitle>{plan.name}</CardTitle>
													<div className='mt-2'>
														<span className='text-3xl font-bold'>
															${plan.price / 100}
														</span>
														<span className='ml-1 text-muted-foreground'>
															/{plan.interval}
														</span>
													</div>
												</CardHeader>
												<CardContent className='space-y-4'>
													<p className='text-sm text-muted-foreground'>
														{plan.description}
													</p>
													<div className='space-y-2'>
														<div className='flex items-center text-sm font-medium'>
															<Check className='mr-2 w-4 h-4 text-green-500' />
															Up to {plan.maxMembers} members
														</div>
														{plan.features
															?.split(',')
															.filter(Boolean)
															.map((feature, i) => (
																<div
																	key={i}
																	className='flex items-center text-sm'
																>
																	<Check className='mr-2 w-4 h-4 text-green-500' />
																	{feature.trim()}
																</div>
															))}
													</div>
												</CardContent>
											</Card>
										))}
									</>
								)}
							</form.Field>
						</div>

						<div className='flex justify-between items-center mt-8'>
							<Button variant='ghost' onClick={() => setStep(1)}>
								<ChevronLeft className='mr-2 w-4 h-4' /> Back to details
							</Button>
							<form.Subscribe
								selector={(state) => [
									state.canSubmit,
									state.isSubmitting,
									state.values,
								]}
							>
								{([isSubmitting]) => (
									<Button
										type='submit'
										disabled={!!isSubmitting}
										className='px-8'
									>
										{isSubmitting ? 'Creating...' : 'Finish Onboarding'}
									</Button>
								)}
							</form.Subscribe>
						</div>
					</div>
				)}
			</form>
		</div>
	)
}

