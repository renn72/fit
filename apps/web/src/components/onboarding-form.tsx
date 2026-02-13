import { useEffect, useMemo, useState } from 'react'

import { Loader } from '@/components/loader'
import { Badge } from '@/components/ui/badge'
import { Button, LoadingButton } from '@/components/ui/button'
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
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

const timezones = Intl.supportedValuesOf('timeZone')
	.map((tz) => {
		const formatter = new Intl.DateTimeFormat('en-US', {
			timeZone: tz,
			timeZoneName: 'longOffset',
		})
		const parts = formatter.formatToParts(new Date())
		const offset = parts.find((p) => p.type === 'timeZoneName')?.value || ''

		// Extract numeric offset for sorting (e.g., "GMT+10:30" -> 10.5)
		let numericOffset = 0
		const match = offset.match(/([+-])(\d{1,2}):(\d{2})/)
		if (match) {
			const sign = match[1] === '+' ? 1 : -1
			const hours = Number.parseInt(match[2], 10)
			const minutes = Number.parseInt(match[3], 10)
			numericOffset = sign * (hours + minutes / 60)
		}

		return {
			id: tz,
			label: `(${offset}) ${tz.replace(/_/g, ' ')}`,
			offset: numericOffset,
		}
	})
	.sort((a, b) => a.offset - b.offset || a.id.localeCompare(b.id))

const formSchema = z.object({
	name: z
		.string()
		.min(4, 'Bug title must be at least 4 characters.')
		.max(32, 'Bug title must be at most 32 characters.'),
	slug: z
		.string()
		.min(4, 'Description must be at least 4 characters.')
		.max(12, 'Description must be at most 12 characters.'),
	timezone: z.string().min(1, 'Please select a timezone'),
	planId: z.string().min(1),
	code: z.string().optional(),
})

export function OnboardingForm() {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [step, setStep] = useState(1)
	const [isSlugManual, setIsSlugManual] = useState(false)
	const [accessCode, setAccessCode] = useState('')
	const [hiddenPlan, setHiddenPlan] = useState<any>(null)
	const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>(
		'monthly',
	)
	const navigate = useNavigate()

	const { data: publicPlans } = useQuery(
		orpc.organisation.getAllPlans.queryOptions(),
	)

	const validateCode = useMutation(
		orpc.organisation.getPlanByCode.mutationOptions({
			onSuccess: (plan) => {
				setHiddenPlan(plan)
				form.setFieldValue('planId', plan?.id || '')
				form.setFieldValue('code', accessCode)
				toast.success(`Access code accepted: ${plan?.name} plan unlocked`)
			},
			onError: (error) => {
				toast.error(error.message || 'Invalid access code')
				setHiddenPlan(null)
			},
		}),
	)

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
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			planId: '',
			code: '',
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

	const plans = useMemo(() => {
		if (!publicPlans) return []
		const all = [...publicPlans]
		if (hiddenPlan && !all.find((p) => p.id === hiddenPlan.id)) {
			all.push(hiddenPlan)
		}
		return all
	}, [publicPlans, hiddenPlan])

	useEffect(() => {
		if (!isSlugManual && organisationName) {
			const suggestedSlug = slugify(organisationName)
			if (suggestedSlug.length >= 4) {
				form.setFieldValue('slug', suggestedSlug)
			}
		}
	}, [organisationName, isSlugManual, form])

	if (!publicPlans) {
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

									<form.Field name='timezone'>
										{(field) => {
											const isInvalid =
												field.state.meta.isTouched &&
												field.state.meta.errors.length > 0
											return (
												<Field data-invalid={isInvalid}>
													<FieldLabel htmlFor={field.name}>Timezone</FieldLabel>
													<Select
														value={field.state.value}
														onValueChange={(value) => field.handleChange(value)}
													>
														<SelectTrigger className='w-full'>
															<SelectValue placeholder='Select a timezone' />
														</SelectTrigger>
														<SelectContent>
															{timezones.map((tz) => (
																<SelectItem key={tz.id} value={tz.id}>
																	{tz.label}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
													<FieldDescription>
														The default timezone for your organisation.
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

								<div className='mx-auto mt-6 max-w-sm'>
									<InputGroup>
										<Input
											placeholder='Access code (optional)'
											value={accessCode}
											onChange={(e) => setAccessCode(e.target.value)}
										/>
										<LoadingButton
											type='button'
											variant='secondary'
											onClick={() => validateCode.mutate({ code: accessCode })}
											disabled={!accessCode}
											loading={validateCode.isPending}
										>
											Apply
										</LoadingButton>
									</InputGroup>
								</div>

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
								<LoadingButton
									type='submit'
									loading={isSubmitting}
									disabled={planId === ''}
									className='px-8'
								>
									Create
								</LoadingButton>
							</div>
						</div>
					)}
				</form>
			</div>
		</div>
	)
}
