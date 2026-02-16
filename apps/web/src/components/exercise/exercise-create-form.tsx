'use client'

import * as React from 'react'

import { ExerciseCreateInput } from '@fit/api/schemas/exercise'

import { Button } from '@/components/ui/button'
import {
	Faceted,
	FacetedBadgeList,
	FacetedContent,
	FacetedEmpty,
	FacetedGroup,
	FacetedInput,
	FacetedItem,
	FacetedList,
	FacetedTrigger,
} from '@/components/ui/faceted'
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { orpc } from '@/utils/orpc'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { zodValidator } from '@tanstack/zod-form-adapter'

import { XIcon } from 'lucide-react'
import { toast } from 'sonner'

const FORCES = ['pull', 'push', 'static'] as const
const LEVELS = ['beginner', 'intermediate', 'expert'] as const
const MECHANICS = ['isolation', 'compound'] as const
const CATEGORIES = [
	'powerlifting',
	'strength',
	'stretching',
	'cardio',
	'olympic weightlifting',
	'strongman',
	'plyometrics',
] as const
const EQUIPMENT = [
	'medicine ball',
	'dumbbell',
	'body only',
	'bands',
	'kettlebells',
	'foam roll',
	'cable',
	'machine',
	'barbell',
	'exercise ball',
	'e-z curl bar',
	'other',
] as const
const MUSCLES = [
	'abdominals',
	'abductors',
	'adductors',
	'biceps',
	'calves',
	'chest',
	'forearms',
	'glutes',
	'hamstrings',
	'lats',
	'lower back',
	'middle back',
	'neck',
	'quadriceps',
	'shoulders',
	'traps',
	'triceps',
] as const

interface ExerciseCreateFormProps {
	onSuccess?: () => void
}

export function ExerciseCreateForm({ onSuccess }: ExerciseCreateFormProps) {
	const queryClient = useQueryClient()

	const { mutate, isPending } = useMutation(
		orpc.exercise.create.mutationOptions({
			onSuccess: () => {
				toast.success('Exercise created successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.exercise.getAllOrg.queryKey(),
				})
				onSuccess?.()
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to create exercise')
			},
		}),
	)

	const form = useForm({
		defaultValues: {
			name: '',
			force: '' as string,
			level: 'beginner' as string,
			mechanic: '' as string,
			equipment: '' as string,
			category: 'strength' as string,
			primaryMuscles: [] as string[],
			secondaryMuscles: [] as string[],
			instructions: [''] as string[],
			images: [] as string[],
			baseExerciseId: null as string | null,
		},
		validatorAdapter: zodValidator(),
		validators: {
			onSubmit: ExerciseCreateInput.omit({
				primaryMuscles: true,
				secondaryMuscles: true,
				instructions: true,
				images: true,
			}),
		},
		onSubmit: async ({ value }) => {
			if (value.primaryMuscles.length === 0) {
				toast.error('At least one primary muscle is required')
				return
			}
			if (value.instructions.filter(Boolean).length === 0) {
				toast.error('At least one instruction step is required')
				return
			}

			mutate({
				...value,
				force: value.force === 'none' ? null : value.force,
				mechanic: value.mechanic === 'none' ? null : value.mechanic,
				equipment: value.equipment === 'none' ? null : value.equipment,
				primaryMuscles: value.primaryMuscles.join(','),
				secondaryMuscles: value.secondaryMuscles.join(','),
				instructions: value.instructions.filter(Boolean).join(','),
				images: value.images.filter(Boolean).join(','),
			} as any)
		},
	})

	return (
		<form
			id='exercise-create-form'
			onSubmit={(e) => {
				e.preventDefault()
				e.stopPropagation()
				form.handleSubmit()
			}}
			className='space-y-6'
		>
			<FieldGroup>
				<form.Field
					name='name'
					children={(field) => {
						const isInvalid =
							field.state.meta.isTouched && !field.state.meta.isValid
						return (
							<Field data-invalid={isInvalid}>
								<FieldLabel htmlFor={field.name}>Name</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(e) => field.handleChange(e.target.value)}
									aria-invalid={isInvalid}
									placeholder='e.g. Bench Press'
									autoComplete='off'
								/>
								{isInvalid && <FieldError errors={field.state.meta.errors} />}
							</Field>
						)
					}}
				/>

				<div className='grid grid-cols-2 gap-4'>
					<form.Field
						name='category'
						children={(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Category</FieldLabel>
								<Select
									name={field.name}
									value={field.state.value}
									onValueChange={field.handleChange}
								>
									<SelectTrigger id={field.name}>
										<SelectValue placeholder='Select category' />
									</SelectTrigger>
									<SelectContent>
										{CATEGORIES.map((c) => (
											<SelectItem key={c} value={c}>
												{c.charAt(0).toUpperCase() + c.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						)}
					/>
					<form.Field
						name='level'
						children={(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Level</FieldLabel>
								<Select
									name={field.name}
									value={field.state.value}
									onValueChange={field.handleChange}
								>
									<SelectTrigger id={field.name}>
										<SelectValue placeholder='Select level' />
									</SelectTrigger>
									<SelectContent>
										{LEVELS.map((l) => (
											<SelectItem key={l} value={l}>
												{l.charAt(0).toUpperCase() + l.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						)}
					/>
				</div>

				<div className='grid grid-cols-3 gap-4'>
					<form.Field
						name='force'
						children={(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Force</FieldLabel>
								<Select
									name={field.name}
									value={field.state.value ?? ''}
									onValueChange={field.handleChange}
								>
									<SelectTrigger id={field.name}>
										<SelectValue placeholder='Force' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='none'>None</SelectItem>
										{FORCES.map((f) => (
											<SelectItem key={f} value={f}>
												{f.charAt(0).toUpperCase() + f.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						)}
					/>
					<form.Field
						name='mechanic'
						children={(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Mechanic</FieldLabel>
								<Select
									name={field.name}
									value={field.state.value ?? ''}
									onValueChange={field.handleChange}
								>
									<SelectTrigger id={field.name}>
										<SelectValue placeholder='Mechanic' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='none'>None</SelectItem>
										{MECHANICS.map((m) => (
											<SelectItem key={m} value={m}>
												{m.charAt(0).toUpperCase() + m.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						)}
					/>
					<form.Field
						name='equipment'
						children={(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Equipment</FieldLabel>
								<Select
									name={field.name}
									value={field.state.value ?? ''}
									onValueChange={field.handleChange}
								>
									<SelectTrigger id={field.name}>
										<SelectValue placeholder='Equipment' />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='none'>None</SelectItem>
										{EQUIPMENT.map((e) => (
											<SelectItem key={e} value={e}>
												{e.charAt(0).toUpperCase() + e.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						)}
					/>
				</div>

				<div className='grid grid-cols-2 gap-4'>
					<form.Field
						name='primaryMuscles'
						children={(field) => (
							<Field>
								<FieldLabel>Primary Muscles</FieldLabel>
								<Faceted
									multiple
									value={field.state.value}
									onValueChange={(val) => field.handleChange(val as string[])}
								>
									<FacetedTrigger className='flex justify-between items-center py-2 px-3 w-full h-9 text-sm bg-transparent rounded-md border shadow-sm focus:ring-1 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed border-input ring-offset-background placeholder:text-muted-foreground focus:ring-ring'>
										<FacetedBadgeList
											options={MUSCLES.map((m) => ({ label: m, value: m }))}
											placeholder='Select muscles'
										/>
									</FacetedTrigger>
									<FacetedContent>
										<FacetedInput placeholder='Search muscles...' />
										<FacetedList>
											<FacetedEmpty>No muscles found.</FacetedEmpty>
											<FacetedGroup>
												{MUSCLES.map((m) => (
													<FacetedItem key={m} value={m}>
														{m.charAt(0).toUpperCase() + m.slice(1)}
													</FacetedItem>
												))}
											</FacetedGroup>
										</FacetedList>
									</FacetedContent>
								</Faceted>
							</Field>
						)}
					/>
					<form.Field
						name='secondaryMuscles'
						children={(field) => (
							<Field>
								<FieldLabel>Secondary Muscles</FieldLabel>
								<Faceted
									multiple
									value={field.state.value}
									onValueChange={(val) => field.handleChange(val as string[])}
								>
									<FacetedTrigger className='flex justify-between items-center py-2 px-3 w-full h-9 text-sm bg-transparent rounded-md border shadow-sm focus:ring-1 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed border-input ring-offset-background placeholder:text-muted-foreground focus:ring-ring'>
										<FacetedBadgeList
											options={MUSCLES.map((m) => ({ label: m, value: m }))}
											placeholder='Select muscles'
										/>
									</FacetedTrigger>
									<FacetedContent>
										<FacetedInput placeholder='Search muscles...' />
										<FacetedList>
											<FacetedEmpty>No muscles found.</FacetedEmpty>
											<FacetedGroup>
												{MUSCLES.map((m) => (
													<FacetedItem key={m} value={m}>
														{m.charAt(0).toUpperCase() + m.slice(1)}
													</FacetedItem>
												))}
											</FacetedGroup>
										</FacetedList>
									</FacetedContent>
								</Faceted>
							</Field>
						)}
					/>
				</div>

				<form.Field
					name='instructions'
					mode='array'
					children={(field) => (
						<Field>
							<FieldLabel>Instructions</FieldLabel>
							<div className='space-y-2'>
								{field.state.value.map((_, i) => (
									<form.Field
										key={i}
										name={`instructions[${i}]`}
										children={(subField) => (
											<div className='flex gap-2'>
												<Textarea
													value={subField.state.value}
													onChange={(e) =>
														subField.handleChange(e.target.value)
													}
													placeholder={`Step ${i + 1}`}
													className='min-h-[60px]'
												/>
												{field.state.value.length > 1 && (
													<Button
														type='button'
														variant='ghost'
														size='icon'
														onClick={() => field.removeValue(i)}
													>
														<XIcon className='size-4' />
													</Button>
												)}
											</div>
										)}
									/>
								))}
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() => field.pushValue('')}
								>
									Add Step
								</Button>
							</div>
						</Field>
					)}
				/>

				<form.Field
					name='images'
					mode='array'
					children={(field) => (
						<Field>
							<FieldLabel>Image URLs</FieldLabel>
							<div className='space-y-2'>
								{field.state.value.map((_, i) => (
									<form.Field
										key={i}
										name={`images[${i}]`}
										children={(subField) => (
											<div className='flex gap-2'>
												<Input
													value={subField.state.value}
													onChange={(e) =>
														subField.handleChange(e.target.value)
													}
													placeholder='https://example.com/image.jpg'
												/>
												{field.state.value.length > 1 && (
													<Button
														type='button'
														variant='ghost'
														size='icon'
														onClick={() => field.removeValue(i)}
													>
														<XIcon className='size-4' />
													</Button>
												)}
											</div>
										)}
									/>
								))}
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() => field.pushValue('')}
								>
									Add Image
								</Button>
							</div>
						</Field>
					)}
				/>
			</FieldGroup>

			<div className='flex gap-2 justify-end'>
				<Button
					type='button'
					variant='outline'
					onClick={() => form.reset()}
					disabled={isPending}
				>
					Reset
				</Button>
				<Button type='submit' disabled={isPending}>
					{isPending ? 'Creating...' : 'Create Exercise'}
				</Button>
			</div>
		</form>
	)
}
