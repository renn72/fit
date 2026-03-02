'use client'

import * as React from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { VirtualizedCombobox } from '@/components/ui-extended/vitrualilzed-combobox'
import { orpc } from '@/utils/orpc'

import { useForm } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
	ArrowDownIcon,
	ArrowUpIcon,
	PlusIcon,
	TrashIcon,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { z } from 'zod'

const exerciseFormSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	movementId: z.string().nullable(),
	sets: z.number().int().min(1).nullable(),
	reps: z.number().int().min(1).nullable(),
	repUnit: z.string().nullable(),
	ormPercent: z.number().min(0).max(100).nullable(),
	targetRpe: z.number().min(1).max(10).nullable(),
	restTime: z.number().int().min(0).nullable(),
	restUnit: z.string().nullable(),
	tempoDown: z.number().int().min(0).nullable(),
	tempoPause: z.number().int().min(0).nullable(),
	tempoUp: z.number().int().min(0).nullable(),
	notes: z.string().nullable(),
})

interface SupersetExercise {
	id: string
	name: string
	movementId: string | null
	movementName: string | null
	sets: number | null
	reps: number | null
	repUnit: string | null
	ormPercent: number | null
	tempoDown: number | null
	tempoPause: number | null
	tempoUp: number | null
	notes: string | null
}

interface SupersetExerciseLink {
	id: string
	exerciseId: string
	order: number
	exercise: SupersetExercise | null
}

export interface ExerciseFormExercise {
	id: string
	name: string
	movementId: string | null
	sets: number | null
	reps: number | null
	repUnit: string | null
	ormPercent: number | null
	targetRpe: number | null
	restTime: number | null
	restUnit: string | null
	tempoDown: number | null
	tempoPause: number | null
	tempoUp: number | null
	notes: string | null
	isSuperSet: boolean
	superSetExercises?: SupersetExerciseLink[]
}

interface ExistingExerciseOption {
	id: string
	name: string
	movementId: string | null
	movementName: string | null
	sets: number | null
	reps: number | null
	repUnit: string | null
	ormPercent: number | null
	tempoDown: number | null
	tempoPause: number | null
	tempoUp: number | null
	notes: string | null
	isSuperSet: boolean
}

interface SuperSetMemberFields {
	name: string
	movementId: string | null
	sets: number | null
	reps: number | null
	repUnit: string | null
	ormPercent: number | null
	tempoDown: number | null
	tempoPause: number | null
	tempoUp: number | null
	notes: string | null
}

type SuperSetMember =
	| (SuperSetMemberFields & {
			id: string
			type: 'existing'
			exerciseId: string
			originalValues: SuperSetMemberFields
	  })
	| (SuperSetMemberFields & {
			id: string
			type: 'new'
	  })

export interface ExerciseFormProps {
	mode: 'create' | 'edit'
	organisationId: string
	exercise?: ExerciseFormExercise
	onSuccess?: () => void
}

function createNewMember(): SuperSetMember {
	return {
		id: crypto.randomUUID(),
		type: 'new',
		name: '',
		movementId: null,
		sets: null,
		reps: null,
		repUnit: 'reps',
		ormPercent: null,
		tempoDown: null,
		tempoPause: null,
		tempoUp: null,
		notes: null,
	}
}

function mapExerciseToMemberFields(
	exercise: Pick<
		SupersetExercise,
		| 'name'
		| 'movementId'
		| 'sets'
		| 'reps'
		| 'repUnit'
		| 'ormPercent'
		| 'tempoDown'
		| 'tempoPause'
		| 'tempoUp'
		| 'notes'
	>,
): SuperSetMemberFields {
	return {
		name: exercise.name,
		movementId: exercise.movementId ?? null,
		sets: exercise.sets ?? null,
		reps: exercise.reps ?? null,
		repUnit: exercise.repUnit ?? null,
		ormPercent: exercise.ormPercent ?? null,
		tempoDown: exercise.tempoDown ?? null,
		tempoPause: exercise.tempoPause ?? null,
		tempoUp: exercise.tempoUp ?? null,
		notes: exercise.notes ?? null,
	}
}

function normalizeMemberFields(
	fields: SuperSetMemberFields,
): SuperSetMemberFields {
	const repUnit = fields.repUnit?.trim() ?? ''
	const notes = fields.notes?.trim() ?? ''

	return {
		name: fields.name.trim(),
		movementId: fields.movementId ?? null,
		sets: fields.sets ?? null,
		reps: fields.reps ?? null,
		repUnit: repUnit ? repUnit : null,
		ormPercent: fields.ormPercent ?? null,
		tempoDown: fields.tempoDown ?? null,
		tempoPause: fields.tempoPause ?? null,
		tempoUp: fields.tempoUp ?? null,
		notes: notes ? notes : null,
	}
}

function hasExistingMemberChanges(
	member: Extract<SuperSetMember, { type: 'existing' }>,
) {
	const current = normalizeMemberFields(member)
	const original = normalizeMemberFields(member.originalValues)

	return (
		current.name !== original.name ||
		current.movementId !== original.movementId ||
		current.sets !== original.sets ||
		current.reps !== original.reps ||
		current.repUnit !== original.repUnit ||
		current.ormPercent !== original.ormPercent ||
		current.tempoDown !== original.tempoDown ||
		current.tempoPause !== original.tempoPause ||
		current.tempoUp !== original.tempoUp ||
		current.notes !== original.notes
	)
}

function mapInitialSuperSetMembers(
	exercise?: ExerciseFormExercise,
): SuperSetMember[] {
	if (!exercise?.isSuperSet) return []

	return (exercise.superSetExercises ?? [])
		.sort((a, b) => a.order - b.order)
		.map((link) => {
			const values = mapExerciseToMemberFields({
				name: link.exercise?.name ?? 'Unknown exercise',
				movementId: link.exercise?.movementId ?? null,
				sets: link.exercise?.sets ?? null,
				reps: link.exercise?.reps ?? null,
				repUnit: link.exercise?.repUnit ?? null,
				ormPercent: link.exercise?.ormPercent ?? null,
				tempoDown: link.exercise?.tempoDown ?? null,
				tempoPause: link.exercise?.tempoPause ?? null,
				tempoUp: link.exercise?.tempoUp ?? null,
				notes: link.exercise?.notes ?? null,
			})

			return {
				id: crypto.randomUUID(),
				type: 'existing' as const,
				exerciseId: link.exerciseId,
				...values,
				originalValues: { ...values },
			}
		})
}

export function ExerciseForm({
	mode,
	organisationId,
	exercise,
	onSuccess,
}: ExerciseFormProps) {
	const queryClient = useQueryClient()
	const isEditMode = mode === 'edit'

	const { data: movements } = useQuery(
		orpc.movement.getAllOrg.queryOptions({
			input: { organisationId },
		}),
	)

	const { data: existingExercisesData } = useQuery(
		orpc.exercise.getAllOrg.queryOptions({
			input: { organisationId },
		}),
	)

	const [isSuperSetMode, setIsSuperSetMode] = React.useState(
		Boolean(exercise?.isSuperSet),
	)
	const [selectedExistingExerciseId, setSelectedExistingExerciseId] =
		React.useState('')
	const [superSetMembers, setSuperSetMembers] = React.useState<
		SuperSetMember[]
	>(() => mapInitialSuperSetMembers(exercise))

	const createExercise = useMutation(
		orpc.exercise.create.mutationOptions({
			onSuccess: () => {
				toast.success('Exercise created successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.exercise.getAllOrg.key(),
				})
				onSuccess?.()
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const updateExercise = useMutation(
		orpc.exercise.update.mutationOptions({
			onSuccess: () => {
				toast.success('Exercise updated successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.exercise.getAllOrg.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.exercise.get.key(),
				})
				onSuccess?.()
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const createSuperSet = useMutation(
		orpc.exercise.createSuperSet.mutationOptions({
			onSuccess: () => {
				toast.success('Superset created successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.exercise.getAllOrg.key(),
				})
				onSuccess?.()
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const updateSuperSet = useMutation(
		orpc.exercise.updateSuperSet.mutationOptions({
			onSuccess: () => {
				toast.success('Superset updated successfully')
				queryClient.invalidateQueries({
					queryKey: orpc.exercise.getAllOrg.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.exercise.get.key(),
				})
				onSuccess?.()
			},
			onError: (error) => {
				toast.error(error.message)
			},
		}),
	)

	const movementOptions =
		movements?.map((movement) => ({
			value: movement.id,
			label: movement.name,
		})) ?? []

	const availableExercises = React.useMemo(() => {
		const allExercises =
			(existingExercisesData as ExistingExerciseOption[]) ?? []
		return allExercises.filter((item) => {
			if (item.isSuperSet) return false
			if (exercise?.id && item.id === exercise.id) return false
			return true
		})
	}, [existingExercisesData, exercise?.id])

	const availableExerciseMap = React.useMemo(
		() => new Map(availableExercises.map((item) => [item.id, item])),
		[availableExercises],
	)

	const existingExerciseOptions = React.useMemo(
		() =>
			availableExercises.map((item) => ({
				value: item.id,
				label: item.movementName
					? `${item.name} (${item.movementName})`
					: item.name,
			})),
		[availableExercises],
	)

	const form = useForm({
		defaultValues: {
			name: exercise?.name ?? '',
			movementId: exercise?.movementId ?? (null as string | null),
			sets: exercise?.sets ?? (null as number | null),
			reps: exercise?.reps ?? (null as number | null),
			repUnit: exercise?.repUnit ?? ('reps' as string | null),
			ormPercent: exercise?.ormPercent ?? (null as number | null),
			targetRpe: exercise?.targetRpe ?? (null as number | null),
			restTime: exercise?.restTime ?? (null as number | null),
			restUnit: exercise?.restUnit ?? ('seconds' as string | null),
			tempoDown: exercise?.tempoDown ?? (null as number | null),
			tempoPause: exercise?.tempoPause ?? (null as number | null),
			tempoUp: exercise?.tempoUp ?? (null as number | null),
			notes: exercise?.notes ?? ('' as string | null),
		},
		validators: {
			onSubmit: exerciseFormSchema,
		},
		onSubmit: async ({ value }) => {
			if (isSuperSetMode) {
				if (superSetMembers.length === 0) {
					toast.error(
						'Add at least one exercise to the superset before saving.',
					)
					return
				}

				const membersPayload = superSetMembers.map((member, index) => {
					if (member.type === 'existing' && !hasExistingMemberChanges(member)) {
						return {
							order: index,
							exerciseId: member.exerciseId,
						}
					}

					const normalizedMember = normalizeMemberFields(member)
					if (!normalizedMember.name) {
						throw new Error('Each exercise in the superset needs a name.')
					}

					return {
						order: index,
						newExercise: {
							name: normalizedMember.name,
							movementId: normalizedMember.movementId,
							sets: normalizedMember.sets,
							reps: normalizedMember.reps,
							repUnit: normalizedMember.repUnit,
							ormPercent: normalizedMember.ormPercent,
							tempoDown: normalizedMember.tempoDown,
							tempoPause: normalizedMember.tempoPause,
							tempoUp: normalizedMember.tempoUp,
							notes: normalizedMember.notes,
						},
					}
				})

				if (isEditMode) {
					if (!exercise?.id) return
					await updateSuperSet.mutateAsync({
						id: exercise.id,
						name: value.name.trim(),
						targetRpe: value.targetRpe,
						restTime: value.restTime,
						restUnit: value.restUnit || null,
						notes: value.notes?.trim() || null,
						members: membersPayload,
					})
					return
				}

				await createSuperSet.mutateAsync({
					name: value.name.trim(),
					targetRpe: value.targetRpe,
					restTime: value.restTime,
					restUnit: value.restUnit || null,
					notes: value.notes?.trim() || null,
					members: membersPayload,
				})
				return
			}

			const payload = {
				name: value.name.trim(),
				movementId: value.movementId || null,
				sets: value.sets,
				reps: value.reps,
				repUnit: value.repUnit || null,
				ormPercent: value.ormPercent,
				targetRpe: value.targetRpe,
				restTime: value.restTime,
				restUnit: value.restUnit || null,
				tempoDown: value.tempoDown,
				tempoPause: value.tempoPause,
				tempoUp: value.tempoUp,
				notes: value.notes?.trim() || null,
				isSuperSet: false,
			}

			if (isEditMode) {
				if (!exercise?.id) return
				await updateExercise.mutateAsync({
					id: exercise.id,
					...payload,
				})
				return
			}

			await createExercise.mutateAsync(payload)
		},
	})

	const addExistingMember = () => {
		if (!selectedExistingExerciseId) return

		const existing = availableExerciseMap.get(selectedExistingExerciseId)
		if (!existing) return

		const alreadyAdded = superSetMembers.some(
			(member) =>
				member.type === 'existing' && member.exerciseId === existing.id,
		)
		if (alreadyAdded) {
			toast.error('This exercise is already in the superset.')
			return
		}

		const values = mapExerciseToMemberFields(existing)
		setSuperSetMembers((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				type: 'existing',
				exerciseId: existing.id,
				...values,
				originalValues: { ...values },
			},
		])
		setSelectedExistingExerciseId('')
	}

	const addNewMember = () => {
		setSuperSetMembers((prev) => [...prev, createNewMember()])
	}

	const removeMember = (memberId: string) => {
		setSuperSetMembers((prev) =>
			prev.filter((member) => member.id !== memberId),
		)
	}

	const moveMember = (memberId: string, direction: 'up' | 'down') => {
		setSuperSetMembers((prev) => {
			const index = prev.findIndex((member) => member.id === memberId)
			if (index === -1) return prev
			const targetIndex = direction === 'up' ? index - 1 : index + 1
			if (targetIndex < 0 || targetIndex >= prev.length) return prev
			const next = [...prev]
			const [moved] = next.splice(index, 1)
			next.splice(targetIndex, 0, moved)
			return next
		})
	}

	const updateMember = (
		memberId: string,
		patch: Partial<SuperSetMemberFields>,
	) => {
		setSuperSetMembers((prev) =>
			prev.map((member) => {
				if (member.id !== memberId) return member
				return { ...member, ...patch }
			}),
		)
	}

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault()
				event.stopPropagation()
				form.handleSubmit()
			}}
			className='space-y-6'
		>
			<div className='flex items-center justify-between rounded-lg border p-4'>
				<div>
					<p className='font-medium'>Exercise Mode</p>
					<p className='text-sm text-muted-foreground'>
						Switch between a standard exercise and a superset builder.
					</p>
				</div>
				<div className='flex items-center gap-2'>
					<span
						className={`text-sm ${!isSuperSetMode ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
					>
						Exercise
					</span>
					<Switch
						checked={isSuperSetMode}
						onCheckedChange={(checked) => setIsSuperSetMode(Boolean(checked))}
					/>
					<span
						className={`text-sm ${isSuperSetMode ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
					>
						Superset
					</span>
				</div>
			</div>

			<FieldGroup>
				<form.Field name='name'>
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor={field.name}>
								{isSuperSetMode ? 'Superset Name' : 'Exercise Name'}
							</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder={
									isSuperSetMode
										? 'e.g. Pull + Hinge Superset'
										: 'e.g. Bench Press - Week 1'
								}
							/>
							<FieldError errors={field.state.meta.errors} />
						</Field>
					)}
				</form.Field>

				{!isSuperSetMode && (
					<>
						<form.Field name='movementId'>
							{(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Movement</FieldLabel>
									<VirtualizedCombobox
										options={movementOptions}
										selectedOption={field.state.value || ''}
										onSelectOption={(value) =>
											field.handleChange(value || null)
										}
										searchPlaceholder='Select a movement...'
										width='100%'
										height='200px'
									/>
									<FieldDescription>
										Optional link to a movement definition.
									</FieldDescription>
								</Field>
							)}
						</form.Field>

						<div className='grid gap-4 lg:grid-cols-3'>
							<form.Field name='sets'>
								{(field) => (
									<Field data-invalid={field.state.meta.errors.length > 0}>
										<FieldLabel htmlFor={field.name}>Sets</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type='number'
											value={field.state.value ?? ''}
											onBlur={field.handleBlur}
											onChange={(e) => {
												const value = e.target.value
												field.handleChange(
													value === '' ? null : Number.parseInt(value, 10),
												)
											}}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>

							<form.Field name='reps'>
								{(field) => (
									<Field data-invalid={field.state.meta.errors.length > 0}>
										<FieldLabel htmlFor={field.name}>Reps</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											type='number'
											value={field.state.value ?? ''}
											onBlur={field.handleBlur}
											onChange={(e) => {
												const value = e.target.value
												field.handleChange(
													value === '' ? null : Number.parseInt(value, 10),
												)
											}}
										/>
										<FieldError errors={field.state.meta.errors} />
									</Field>
								)}
							</form.Field>

							<form.Field name='repUnit'>
								{(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>Rep Unit</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value ?? ''}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(e.target.value || null)
											}
											placeholder='reps, sec, min'
										/>
									</Field>
								)}
							</form.Field>
						</div>

						<form.Field name='ormPercent'>
							{(field) => (
								<Field data-invalid={field.state.meta.errors.length > 0}>
									<FieldLabel htmlFor={field.name}>% 1RM</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type='number'
										min='0'
										max='100'
										value={field.state.value ?? ''}
										onBlur={field.handleBlur}
										onChange={(e) => {
											const value = e.target.value
											field.handleChange(
												value === '' ? null : Number.parseFloat(value),
											)
										}}
									/>
									<FieldError errors={field.state.meta.errors} />
								</Field>
							)}
						</form.Field>
					</>
				)}

				<div className='grid gap-4 lg:grid-cols-2'>
					<form.Field name='targetRpe'>
						{(field) => (
							<Field data-invalid={field.state.meta.errors.length > 0}>
								<FieldLabel htmlFor={field.name}>Target RPE</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type='number'
									min='1'
									max='10'
									step='0.5'
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => {
										const value = e.target.value
										field.handleChange(
											value === '' ? null : Number.parseFloat(value),
										)
									}}
								/>
								<FieldError errors={field.state.meta.errors} />
							</Field>
						)}
					</form.Field>

					<form.Field name='restTime'>
						{(field) => (
							<Field>
								<FieldLabel htmlFor={field.name}>Rest Time</FieldLabel>
								<Input
									id={field.name}
									name={field.name}
									type='number'
									min='0'
									value={field.state.value ?? ''}
									onBlur={field.handleBlur}
									onChange={(e) => {
										const value = e.target.value
										field.handleChange(
											value === '' ? null : Number.parseInt(value, 10),
										)
									}}
								/>
							</Field>
						)}
					</form.Field>
				</div>

				<form.Field name='restUnit'>
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Rest Unit</FieldLabel>
							<Input
								id={field.name}
								name={field.name}
								value={field.state.value ?? ''}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value || null)}
								placeholder='seconds, minutes'
							/>
						</Field>
					)}
				</form.Field>

				{!isSuperSetMode && (
					<div className='grid gap-4 lg:grid-cols-3'>
						<form.Field name='tempoDown'>
							{(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Tempo Down</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type='number'
										min='0'
										value={field.state.value ?? ''}
										onBlur={field.handleBlur}
										onChange={(e) => {
											const value = e.target.value
											field.handleChange(
												value === '' ? null : Number.parseInt(value, 10),
											)
										}}
										placeholder='seconds'
									/>
								</Field>
							)}
						</form.Field>

						<form.Field name='tempoPause'>
							{(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Tempo Pause</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type='number'
										min='0'
										value={field.state.value ?? ''}
										onBlur={field.handleBlur}
										onChange={(e) => {
											const value = e.target.value
											field.handleChange(
												value === '' ? null : Number.parseInt(value, 10),
											)
										}}
										placeholder='seconds'
									/>
								</Field>
							)}
						</form.Field>

						<form.Field name='tempoUp'>
							{(field) => (
								<Field>
									<FieldLabel htmlFor={field.name}>Tempo Up</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type='number'
										min='0'
										value={field.state.value ?? ''}
										onBlur={field.handleBlur}
										onChange={(e) => {
											const value = e.target.value
											field.handleChange(
												value === '' ? null : Number.parseInt(value, 10),
											)
										}}
										placeholder='seconds'
									/>
								</Field>
							)}
						</form.Field>
					</div>
				)}

				{isSuperSetMode && (
					<div className='space-y-4 rounded-lg border p-4'>
						<div className='flex items-center justify-between'>
							<div>
								<p className='font-medium'>Superset Exercises</p>
								<p className='text-sm text-muted-foreground'>
									Add existing exercises or define new ones in this superset.
								</p>
							</div>
							<Button type='button' variant='outline' onClick={addNewMember}>
								<PlusIcon className='mr-2 size-4' />
								Add New Exercise
							</Button>
						</div>

						<div className='grid gap-3 lg:grid-cols-[1fr_auto]'>
							<VirtualizedCombobox
								options={existingExerciseOptions}
								selectedOption={selectedExistingExerciseId}
								onSelectOption={setSelectedExistingExerciseId}
								searchPlaceholder='Select existing exercise...'
								width='100%'
								height='200px'
							/>
							<Button
								type='button'
								variant='secondary'
								onClick={addExistingMember}
								disabled={!selectedExistingExerciseId}
							>
								Add Existing
							</Button>
						</div>

						<div className='space-y-3'>
							{superSetMembers.length === 0 && (
								<p className='text-sm text-muted-foreground'>
									No exercises added to this superset yet.
								</p>
							)}

							{superSetMembers.map((member, index) => {
								const isCustomized =
									member.type === 'existing' && hasExistingMemberChanges(member)

								return (
									<div
										key={member.id}
										className='space-y-3 rounded-lg border p-3'
									>
										<div className='flex items-center justify-between gap-2'>
											<div className='flex items-center gap-2'>
												<Badge variant='outline'>#{index + 1}</Badge>
												<Badge
													variant={
														member.type === 'existing' ? 'secondary' : 'default'
													}
												>
													{member.type === 'existing'
														? 'Existing Exercise'
														: 'New Exercise'}
												</Badge>
												{member.type === 'existing' && (
													<Badge variant='outline'>
														{isCustomized ? 'Customized Copy' : 'Copied'}
													</Badge>
												)}
											</div>
											<div className='flex items-center gap-1'>
												<Button
													type='button'
													size='icon'
													variant='ghost'
													onClick={() => moveMember(member.id, 'up')}
													disabled={index === 0}
												>
													<ArrowUpIcon className='size-4' />
												</Button>
												<Button
													type='button'
													size='icon'
													variant='ghost'
													onClick={() => moveMember(member.id, 'down')}
													disabled={index === superSetMembers.length - 1}
												>
													<ArrowDownIcon className='size-4' />
												</Button>
												<Button
													type='button'
													size='icon'
													variant='ghost'
													onClick={() => removeMember(member.id)}
												>
													<TrashIcon className='size-4 text-destructive' />
												</Button>
											</div>
										</div>

										{member.type === 'existing' && (
											<p className='text-xs text-muted-foreground'>
												{isCustomized
													? 'This member will be saved as a customized superset child exercise.'
													: 'This member will be copied into the superset as a child exercise.'}
											</p>
										)}

										<div className='space-y-3'>
											<div className='grid gap-3 lg:grid-cols-2'>
												<div className='space-y-1'>
													<FieldLabel>Name</FieldLabel>
													<Input
														value={member.name}
														onChange={(e) =>
															updateMember(member.id, {
																name: e.target.value,
															})
														}
														placeholder='e.g. Incline Dumbbell Press'
													/>
												</div>
												<div className='space-y-1'>
													<FieldLabel>Movement</FieldLabel>
													<VirtualizedCombobox
														options={movementOptions}
														selectedOption={member.movementId || ''}
														onSelectOption={(value) =>
															updateMember(member.id, {
																movementId: value || null,
															})
														}
														searchPlaceholder='Select a movement...'
														width='100%'
														height='200px'
													/>
												</div>
											</div>

											<div className='grid gap-3 lg:grid-cols-4'>
												<div className='space-y-1'>
													<FieldLabel>Sets</FieldLabel>
													<Input
														type='number'
														value={member.sets ?? ''}
														onChange={(e) => {
															const value = e.target.value
															updateMember(member.id, {
																sets:
																	value === ''
																		? null
																		: Number.parseInt(value, 10),
															})
														}}
													/>
												</div>
												<div className='space-y-1'>
													<FieldLabel>Reps</FieldLabel>
													<Input
														type='number'
														value={member.reps ?? ''}
														onChange={(e) => {
															const value = e.target.value
															updateMember(member.id, {
																reps:
																	value === ''
																		? null
																		: Number.parseInt(value, 10),
															})
														}}
													/>
												</div>
												<div className='space-y-1'>
													<FieldLabel>Rep Unit</FieldLabel>
													<Input
														value={member.repUnit ?? ''}
														onChange={(e) =>
															updateMember(member.id, {
																repUnit: e.target.value || null,
															})
														}
														placeholder='reps'
													/>
												</div>
												<div className='space-y-1'>
													<FieldLabel>% 1RM</FieldLabel>
													<Input
														type='number'
														min='0'
														max='100'
														value={member.ormPercent ?? ''}
														onChange={(e) => {
															const value = e.target.value
															updateMember(member.id, {
																ormPercent:
																	value === ''
																		? null
																		: Number.parseFloat(value),
															})
														}}
													/>
												</div>
											</div>

											<div className='grid gap-3 lg:grid-cols-3'>
												<div className='space-y-1'>
													<FieldLabel>Tempo Down</FieldLabel>
													<Input
														type='number'
														value={member.tempoDown ?? ''}
														onChange={(e) => {
															const value = e.target.value
															updateMember(member.id, {
																tempoDown:
																	value === ''
																		? null
																		: Number.parseInt(value, 10),
															})
														}}
													/>
												</div>
												<div className='space-y-1'>
													<FieldLabel>Tempo Pause</FieldLabel>
													<Input
														type='number'
														value={member.tempoPause ?? ''}
														onChange={(e) => {
															const value = e.target.value
															updateMember(member.id, {
																tempoPause:
																	value === ''
																		? null
																		: Number.parseInt(value, 10),
															})
														}}
													/>
												</div>
												<div className='space-y-1'>
													<FieldLabel>Tempo Up</FieldLabel>
													<Input
														type='number'
														value={member.tempoUp ?? ''}
														onChange={(e) => {
															const value = e.target.value
															updateMember(member.id, {
																tempoUp:
																	value === ''
																		? null
																		: Number.parseInt(value, 10),
															})
														}}
													/>
												</div>
											</div>

											<div className='space-y-1'>
												<FieldLabel>Notes</FieldLabel>
												<Textarea
													value={member.notes ?? ''}
													onChange={(e) =>
														updateMember(member.id, {
															notes: e.target.value || null,
														})
													}
													placeholder='Optional notes for this exercise'
													className='min-h-20'
												/>
											</div>
										</div>
									</div>
								)
							})}
						</div>
					</div>
				)}

				<form.Field name='notes'>
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>Notes</FieldLabel>
							<Textarea
								id={field.name}
								name={field.name}
								value={field.state.value ?? ''}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value || null)}
								placeholder='Programming notes, intent, or coaching cues.'
								className='min-h-24'
							/>
						</Field>
					)}
				</form.Field>
			</FieldGroup>

			<div className='flex justify-end border-t pt-4'>
				<form.Subscribe
					selector={(state) => [state.canSubmit, state.isSubmitting]}
				>
					{([canSubmit, isSubmitting]) => (
						<Button type='submit' disabled={!canSubmit || isSubmitting}>
							{isSubmitting
								? isEditMode
									? 'Updating...'
									: 'Creating...'
								: isEditMode
									? isSuperSetMode
										? 'Update Superset'
										: 'Update Exercise'
									: isSuperSetMode
										? 'Create Superset'
										: 'Create Exercise'}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	)
}
