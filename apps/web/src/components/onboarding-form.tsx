import { useEffect, useState } from 'react'

import { Loader } from '@/components/loader'
import { Badge } from '@/components/ui/badge'
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
import { useNavigate } from '@tanstack/react-router'

import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

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

export function OnboardingForm() {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [step, setStep] = useState(1)
	const [isSlugManual, setIsSlugManual] = useState(false)
	const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(
		'monthly',
	)
	const navigate = useNavigate()

	const { data: plans } = useQuery(orpc.organisation.getAllPlans.queryOptions())

	const createOrg = useMutation(
		orpc.organisation.create.mutationOptions({
			onSuccess: () => {
				toast.success('Organisation created successfully')
				navigate({ to: `/admin/${organisationSlug}/s/dashboard` })
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to create organisation')
			},
			onSettled: () => setIsSubmitting(false),
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

			setIsSubmitting(true)
			await createOrg.mutateAsync(value)
		},
	})

	const organisationName = useStore(form.store, (state) => state.values.name)
	const planId = useStore(form.store, (state) => state.values.planId)
	const organisationSlug = useStore(form.store, (state) => state.values.slug)

	useEffect(() => {
		if (!isSlugManual && organisationName) {
			const suggestedSlug = slugify(organisationName)
			if (suggestedSlug.length >= 4) {
				form.setFieldValue('slug', suggestedSlug)
			}
		}
	}, [organisationName, isSlugManual, form])

	if (!plans) {
		return <Loader />
	}

	return (
		<div className='flex justify-center'>
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

								<div className='flex justify-center items-center mt-6 space-x-4'>
									<button
										type='button'
										onClick={() => setBillingInterval('monthly')}
										className={cn(
											'text-sm font-medium',
											billingInterval === 'monthly'
												? 'text-primary'
												: 'text-muted-foreground',
										)}
									>
										Monthly
									</button>
									<div
										className='flex items-center p-1 w-12 h-6 rounded-full transition-colors cursor-pointer bg-muted'
										onMouseDown={() =>
											setBillingInterval((prev) =>
												prev === 'monthly' ? 'yearly' : 'monthly',
											)
										}
									>
										<div
											className={cn(
												'w-4 h-4 transition-transform bg-background rounded-full shadow-sm',
												billingInterval === 'yearly' ? 'translate-x-6' : '',
											)}
										/>
									</div>
									<button
										type='button'
										onClick={() => setBillingInterval('yearly')}
										className={cn(
											'text-sm font-medium',
											billingInterval === 'yearly'
												? 'text-primary'
												: 'text-muted-foreground',
										)}
									>
										Yearly
										<Badge className='ml-2' variant='secondary'>
											Save 20%
										</Badge>
									</button>
								</div>
							</div>

							<div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
								<form.Field name='planId'>
									{(field) => (
										<>
											{plans?.map((plan) => (
												<Card
													key={plan.id}
													className={cn(
														'relative flex flex-col cursor-pointer transition-all border-2',
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
														<CardTitle className='capitalize'>
															{plan.name}
														</CardTitle>
														<div className='mt-2'>
															<span className='text-3xl font-bold'>
																{(() => {
																	const price =
																		billingInterval === 'monthly'
																			? plan.priceMonthly
																			: plan.priceYearly
																	return price === 0
																		? 'Free'
																		: `$${price / 100}`
																})()}
															</span>
															{((billingInterval === 'monthly'
																? plan.priceMonthly
																: plan.priceYearly) ?? 0) > 0 && (
																<span className='ml-1 text-muted-foreground'>
																	/{billingInterval === 'monthly' ? 'mo' : 'yr'}
																</span>
															)}
														</div>
													</CardHeader>
													<CardContent className='space-y-4 grow'>
														<p className='text-sm text-muted-foreground first-letter:uppercase'>
															{plan.description}
														</p>
														<div className='space-y-2'>
															<div className='flex items-center text-sm font-medium'>
																<Check className='mr-2 w-4 h-4 text-green-500' />
																Up to {plan.maxMembers} members
															</div>
															<div className='flex items-center text-sm font-medium'>
																<Check className='mr-2 w-4 h-4 text-green-500' />
																Up to {plan.maxTrainers} trainers
															</div>
															{plan.features
																?.split(',')
																.filter(Boolean)
																.map((feature, i) => (
																	<div
																		key={i}
																		className='flex items-center text-sm first-letter:uppercase'
																	>
																		<Check className='mr-2 w-4 h-4 text-green-500' />
																		{feature.trim()}
																	</div>
																))}
														</div>
													</CardContent>
													<CardFooter className='pt-4'>
														<Button
															type='button'
															variant={
																field.state.value === plan.id
																	? 'default'
																	: 'outline'
															}
															className='w-full capitalize'
														>
															{plan.cta}
														</Button>
													</CardFooter>
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
								<Button
									type='submit'
									disabled={isSubmitting || planId === ''}
									className={cn(
										'px-8',
										isSubmitting || planId === ''
											? 'cursor-not-allowed'
											: 'cursor-pointer',
									)}
								>
									{isSubmitting ? 'Creating...' : 'Create'}
								</Button>
							</div>
						</div>
					)}
				</form>
			</div>
		</div>
	)
}
