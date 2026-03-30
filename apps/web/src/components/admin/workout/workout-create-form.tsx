'use client'

import * as React from 'react'

import { Badge } from '@fit/components/ui/badge'
import { Button } from '@fit/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@fit/components/ui/card'
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from '@fit/components/ui/field'
import { Input } from '@fit/components/ui/input'
import { ScrollArea } from '@fit/components/ui/scroll-area'
import { Textarea } from '@fit/components/ui/textarea'
import { orpc } from '@/utils/orpc'

import { useForm, useStore } from '@tanstack/react-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
	closestCorners,
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	pointerWithin,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
	BarbellIcon,
	DotsSixVerticalIcon,
	PlusIcon,
	StackPlusIcon,
	TrashIcon,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { z } from 'zod'

const WORKOUT_DROPZONE_ID = 'workout-dropzone'

const workoutItemSchema = z.object({
	id: z.string().min(1),
	sourceId: z.string().min(1),
	name: z.string().min(1),
	type: z.enum(['exercise', 'superset']),
	movementName: z.string().nullable().optional(),
	memberCount: z.number().int().min(0).optional(),
	sets: z.number().int().nullable().optional(),
	reps: z.number().int().nullable().optional(),
	repUnit: z.string().nullable().optional(),
	ormPercent: z.number().nullable().optional(),
	targetRpe: z.number().nullable().optional(),
	restTime: z.number().int().nullable().optional(),
	restUnit: z.string().nullable().optional(),
	tempoDown: z.number().int().nullable().optional(),
	tempoPause: z.number().int().nullable().optional(),
	tempoUp: z.number().int().nullable().optional(),
	notes: z.string().nullable().optional(),
})

const workoutFormSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().nullable(),
	category: z.string().nullable(),
	warmupGroupId: z.string().nullable(),
	items: z
		.array(workoutItemSchema)
		.min(1, 'At least one exercise or superset is required'),
})

type WorkoutBuilderItem = z.infer<typeof workoutItemSchema>

type LibraryItem = {
	id: string
	name: string
	type: 'exercise' | 'superset'
	movementName?: string | null
	memberCount?: number
	sets?: number | null
	reps?: number | null
	repUnit?: string | null
	ormPercent?: number | null
	targetRpe?: number | null
	restTime?: number | null
	restUnit?: string | null
	tempoDown?: number | null
	tempoPause?: number | null
	tempoUp?: number | null
	notes?: string | null
}

type DragData =
	| {
			kind: 'library'
			item: LibraryItem
	  }
	| {
			kind: 'builder'
			item: WorkoutBuilderItem
	  }

interface WorkoutExerciseLink {
	id: string
	index: number
	exercise: {
		id: string
		name: string
		movementName?: string | null
		movement?: {
			name: string
		} | null
		sets?: number | null
		reps?: number | null
		repUnit?: string | null
		ormPercent?: number | null
		targetRpe?: number | null
		restTime?: number | null
		restUnit?: string | null
		tempoDown?: number | null
		tempoPause?: number | null
		tempoUp?: number | null
		notes?: string | null
	}
}

interface WorkoutSuperSetLink {
	id: string
	index: number
	superSet: {
		id: string
		name: string
		superSetExercises?: Array<unknown>
	}
}

export interface WorkoutFormWorkout {
	id: string
	name: string
	description: string | null
	category: string | null
	warmupGroupId: string | null
	exercises: WorkoutExerciseLink[]
	superSets: WorkoutSuperSetLink[]
}

interface OrgExerciseOption {
	id: string
	name: string
	isSuperSet: boolean
	movementName: string | null
	superSetExercises?: Array<unknown>
	sets?: number | null
	reps?: number | null
	repUnit?: string | null
	ormPercent?: number | null
	targetRpe?: number | null
	restTime?: number | null
	restUnit?: string | null
	tempoDown?: number | null
	tempoPause?: number | null
	tempoUp?: number | null
	notes?: string | null
}

interface WarmupGroupOption {
	id: string
	name: string
	warmups?: Array<unknown>
}

export interface WorkoutCreateFormProps {
	mode: 'create' | 'edit'
	organisationId: string
	workout?: WorkoutFormWorkout
	onSuccess?: () => void
}

function mapWorkoutToBuilderItems(
	workout: WorkoutFormWorkout | undefined,
): WorkoutBuilderItem[] {
	if (!workout) return []

	return [
		...(workout.exercises ?? []).map((link) => ({
			id: crypto.randomUUID(),
			sourceId: link.exercise.id,
			name: link.exercise.name,
			type: 'exercise' as const,
			movementName:
				link.exercise.movementName ?? link.exercise.movement?.name ?? null,
			memberCount: undefined,
			sets: link.exercise.sets ?? null,
			reps: link.exercise.reps ?? null,
			repUnit: link.exercise.repUnit ?? null,
			ormPercent: link.exercise.ormPercent ?? null,
			targetRpe: link.exercise.targetRpe ?? null,
			restTime: link.exercise.restTime ?? null,
			restUnit: link.exercise.restUnit ?? null,
			tempoDown: link.exercise.tempoDown ?? null,
			tempoPause: link.exercise.tempoPause ?? null,
			tempoUp: link.exercise.tempoUp ?? null,
			notes: link.exercise.notes ?? null,
			index: link.index,
		})),
		...(workout.superSets ?? []).map((link) => ({
			id: crypto.randomUUID(),
			sourceId: link.superSet.id,
			name: link.superSet.name,
			type: 'superset' as const,
			movementName: null,
			memberCount: link.superSet.superSetExercises?.length ?? 0,
			index: link.index,
		})),
	]
		.sort((a, b) => a.index - b.index)
		.map(({ index: _index, ...item }) => item)
}

export function WorkoutCreateForm({
	mode,
	organisationId,
	workout,
	onSuccess,
}: WorkoutCreateFormProps) {
	const isEditMode = mode === 'edit'
	const queryClient = useQueryClient()

	const { data: exercisesData } = useQuery(
		orpc.exercise.getAllOrg.queryOptions({
			input: { organisationId },
		}),
	)

	const { data: warmupGroupsData } = useQuery(
		orpc.warmup.getAllGroups.queryOptions({
			input: { organisationId },
		}),
	)

	const createWorkout = useMutation(orpc.workout.create.mutationOptions())
	const updateWorkout = useMutation(orpc.workout.update.mutationOptions())
	const addExerciseToWorkout = useMutation(
		orpc.workout.addExercise.mutationOptions(),
	)
	const addSuperSetToWorkout = useMutation(
		orpc.workout.addSuperSet.mutationOptions(),
	)
	const removeExerciseFromWorkout = useMutation(
		orpc.workout.removeExercise.mutationOptions(),
	)
	const removeSuperSetFromWorkout = useMutation(
		orpc.workout.removeSuperSet.mutationOptions(),
	)

	const [libraryQuery, setLibraryQuery] = React.useState('')
	const [activeDragData, setActiveDragData] = React.useState<DragData | null>(
		null,
	)
	const lastOverIdRef = React.useRef<string | null>(null)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 6 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	const initialItems = React.useMemo(
		() => mapWorkoutToBuilderItems(workout),
		[workout],
	)

	const form = useForm({
		defaultValues: {
			name: workout?.name ?? '',
			description: workout?.description ?? ('' as string | null),
			category: workout?.category ?? ('' as string | null),
			warmupGroupId: workout?.warmupGroupId ?? ('' as string | null),
			items: initialItems,
		},
		validators: {
			onSubmit: workoutFormSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				const trimmedName = value.name.trim()
				if (!trimmedName) {
					toast.error('Workout name is required.')
					return
				}

				if (value.items.length === 0) {
					toast.error('Add at least one exercise or superset.')
					return
				}

				let workoutId = workout?.id
				const payload = {
					name: trimmedName,
					description: value.description?.trim() || null,
					category: value.category?.trim() || null,
					warmupGroupId: value.warmupGroupId || null,
				}

				if (isEditMode) {
					if (!workoutId) return
					await updateWorkout.mutateAsync({
						id: workoutId,
						...payload,
					})

					for (const existingExercise of workout?.exercises ?? []) {
						await removeExerciseFromWorkout.mutateAsync({
							workoutId,
							exerciseId: existingExercise.exercise.id,
						})
					}

					for (const existingSuperSet of workout?.superSets ?? []) {
						await removeSuperSetFromWorkout.mutateAsync({
							workoutId,
							superSetId: existingSuperSet.superSet.id,
						})
					}
				} else {
					const created = await createWorkout.mutateAsync(payload)
					workoutId = created.id
				}

				if (!workoutId) {
					throw new Error('Workout could not be saved.')
				}

				for (const [index, item] of value.items.entries()) {
					if (item.type === 'exercise') {
						await addExerciseToWorkout.mutateAsync({
							workoutId,
							exerciseId: item.sourceId,
							index,
						})
					} else {
						await addSuperSetToWorkout.mutateAsync({
							workoutId,
							superSetId: item.sourceId,
							index,
						})
					}
				}

				queryClient.invalidateQueries({
					queryKey: orpc.workout.getAllOrg.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.workout.get.key(),
				})

				toast.success(
					isEditMode
						? 'Workout updated successfully'
						: 'Workout created successfully',
				)
				onSuccess?.()
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: isEditMode
							? 'Failed to update workout'
							: 'Failed to create workout'
				toast.error(message)
			}
		},
	})

	const builderItems = useStore(
		form.store,
		(state) => state.values.items as WorkoutBuilderItem[],
	)

	const exercises = (exercisesData as OrgExerciseOption[] | undefined) ?? []
	const warmupGroups =
		(warmupGroupsData as WarmupGroupOption[] | undefined) ?? []

	const filteredLibraryItems = React.useMemo(() => {
		const searchTerm = libraryQuery.trim().toLowerCase()
		return exercises
			.filter((item) => {
				if (!searchTerm) return true
				const nameMatch = item.name.toLowerCase().includes(searchTerm)
				const movementMatch = (item.movementName ?? '')
					.toLowerCase()
					.includes(searchTerm)
				return nameMatch || movementMatch
			})
			.map((item) =>
				item.isSuperSet
					? ({
							id: item.id,
							name: item.name,
							type: 'superset' as const,
							movementName: null,
							memberCount: item.superSetExercises?.length ?? 0,
						} satisfies LibraryItem)
					: ({
							id: item.id,
							name: item.name,
							type: 'exercise' as const,
							movementName: item.movementName,
							sets: item.sets ?? null,
							reps: item.reps ?? null,
							repUnit: item.repUnit ?? null,
							ormPercent: item.ormPercent ?? null,
							targetRpe: item.targetRpe ?? null,
							restTime: item.restTime ?? null,
							restUnit: item.restUnit ?? null,
							tempoDown: item.tempoDown ?? null,
							tempoPause: item.tempoPause ?? null,
							tempoUp: item.tempoUp ?? null,
							notes: item.notes ?? null,
						} satisfies LibraryItem),
			)
			.sort((a, b) => a.name.localeCompare(b.name))
	}, [exercises, libraryQuery])

	const addLibraryItem = (item: LibraryItem, insertIndex?: number) => {
		const currentItems = form.getFieldValue('items')
		const alreadyAdded = currentItems.some(
			(existing) =>
				existing.type === item.type && existing.sourceId === item.id,
		)

		if (alreadyAdded) {
			toast.error('This item is already in the workout.')
			return
		}

		const nextItem: WorkoutBuilderItem = {
			id: crypto.randomUUID(),
			sourceId: item.id,
			name: item.name,
			type: item.type,
			movementName: item.movementName ?? null,
			memberCount: item.memberCount,
			sets: item.sets ?? null,
			reps: item.reps ?? null,
			repUnit: item.repUnit ?? null,
			ormPercent: item.ormPercent ?? null,
			targetRpe: item.targetRpe ?? null,
			restTime: item.restTime ?? null,
			restUnit: item.restUnit ?? null,
			tempoDown: item.tempoDown ?? null,
			tempoPause: item.tempoPause ?? null,
			tempoUp: item.tempoUp ?? null,
			notes: item.notes ?? null,
		}

		if (
			insertIndex === undefined ||
			insertIndex < 0 ||
			insertIndex > currentItems.length
		) {
			form.setFieldValue('items', [...currentItems, nextItem])
			return
		}

		const nextItems = [...currentItems]
		nextItems.splice(insertIndex, 0, nextItem)
		form.setFieldValue('items', nextItems)
	}

	const removeBuilderItem = (builderId: string) => {
		const currentItems = form.getFieldValue('items')
		form.setFieldValue(
			'items',
			currentItems.filter((item) => item.id !== builderId),
		)
	}

	const moveBuilderItem = (fromId: string, toId: string) => {
		const currentItems = form.getFieldValue('items')
		const fromIndex = currentItems.findIndex((item) => item.id === fromId)
		const toIndex = currentItems.findIndex((item) => item.id === toId)
		if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return

		form.setFieldValue('items', arrayMove(currentItems, fromIndex, toIndex))
	}

	const { setNodeRef: setDropZoneRef, isOver } = useDroppable({
		id: WORKOUT_DROPZONE_ID,
	})

	const onDragStart = (event: DragStartEvent) => {
		const dragData = event.active.data.current as DragData | undefined
		setActiveDragData(dragData ?? null)
		lastOverIdRef.current = null
	}

	const onDragOver = (event: DragOverEvent) => {
		lastOverIdRef.current = event.over ? String(event.over.id) : null
	}

	const onDragEnd = (event: DragEndEvent) => {
		const dragData = event.active.data.current as DragData | undefined
		setActiveDragData(null)

		const overId = event.over
			? String(event.over.id)
			: (lastOverIdRef.current ?? null)
		lastOverIdRef.current = null

		if (!dragData || !overId) return

		if (dragData.kind === 'library') {
			const currentItems = form.getFieldValue('items')
			const insertIndex =
				overId === WORKOUT_DROPZONE_ID
					? currentItems.length
					: currentItems.findIndex((item) => item.id === overId)
			addLibraryItem(
				dragData.item,
				insertIndex === -1 ? currentItems.length : insertIndex,
			)
			return
		}

		if (dragData.kind === 'builder') {
			if (overId === WORKOUT_DROPZONE_ID) {
				const currentItems = form.getFieldValue('items')
				const fromIndex = currentItems.findIndex(
					(item) => item.id === dragData.item.id,
				)
				if (fromIndex === -1 || fromIndex === currentItems.length - 1) return
				form.setFieldValue(
					'items',
					arrayMove(currentItems, fromIndex, currentItems.length - 1),
				)
				return
			}
			moveBuilderItem(dragData.item.id, overId)
		}
	}

	const renderOverlay = () => {
		if (!activeDragData) return null

		if (activeDragData.kind === 'library') {
			return (
				<WorkoutItemPreview
					item={mapLibraryToBuilderItem(activeDragData.item)}
				/>
			)
		}

		return <WorkoutItemPreview item={activeDragData.item} />
	}

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault()
				event.stopPropagation()
				form.handleSubmit()
			}}
			className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]'
		>
			<DndContext
				sensors={sensors}
				collisionDetection={(args) => {
					const pointerCollisions = pointerWithin(args)
					if (pointerCollisions.length > 0) return pointerCollisions
					return closestCorners(args)
				}}
				onDragStart={onDragStart}
				onDragOver={onDragOver}
				onDragEnd={onDragEnd}
			>
				<div className='space-y-6'>
					<Card className='border-border/70'>
						<CardHeader>
							<CardTitle>
								{isEditMode ? 'Edit Workout' : 'Create Workout'}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<FieldGroup>
								<form.Field name='name'>
									{(field) => (
										<Field data-invalid={field.state.meta.errors.length > 0}>
											<FieldLabel htmlFor={field.name}>
												Workout Name *
											</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder='e.g., Lower Body Strength'
											/>
											<FieldError errors={field.state.meta.errors} />
										</Field>
									)}
								</form.Field>

								<form.Field name='description'>
									{(field) => (
										<Field>
											<FieldLabel htmlFor={field.name}>Description</FieldLabel>
											<Textarea
												id={field.name}
												name={field.name}
												value={field.state.value ?? ''}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(e.target.value || null)
												}
												placeholder='Optional coaching notes or workout intent.'
												className='min-h-20'
											/>
										</Field>
									)}
								</form.Field>

								<div className='grid gap-4 lg:grid-cols-2'>
									<form.Field name='category'>
										{(field) => (
											<Field>
												<FieldLabel htmlFor={field.name}>Category</FieldLabel>
												<Input
													id={field.name}
													name={field.name}
													value={field.state.value ?? ''}
													onBlur={field.handleBlur}
													onChange={(e) =>
														field.handleChange(e.target.value || null)
													}
													placeholder='e.g., Strength, Hypertrophy'
												/>
											</Field>
										)}
									</form.Field>

									<form.Field name='warmupGroupId'>
										{(field) => (
											<Field>
												<FieldLabel htmlFor={field.name}>
													Warmup Group
												</FieldLabel>
												<select
													id={field.name}
													name={field.name}
													value={field.state.value ?? ''}
													onBlur={field.handleBlur}
													onChange={(e) =>
														field.handleChange(e.target.value || null)
													}
													className='flex py-1 px-3 w-full h-9 text-sm rounded-md border border-input bg-background'
												>
													<option value=''>No warmup group</option>
													{warmupGroups.map((group) => (
														<option key={group.id} value={group.id}>
															{group.name} ({group.warmups?.length ?? 0})
														</option>
													))}
												</select>
											</Field>
										)}
									</form.Field>
								</div>
							</FieldGroup>
						</CardContent>
					</Card>

					<Card className='border-border/70'>
						<CardHeader className='pb-4 space-y-2 bg-gradient-to-r border-b from-orange-50/70 to-cyan-50/70 dark:from-orange-950/20 dark:to-cyan-950/20'>
							<CardTitle>Workout Builder</CardTitle>
							<p className='text-sm text-muted-foreground'>
								Drag exercises or supersets from the right panel into this list.
							</p>
						</CardHeader>
						<CardContent className='pt-4'>
							<form.Field name='items'>
								{(field) => (
									<div className='space-y-3'>
										<div
											ref={setDropZoneRef}
											className={`rounded-xl border p-3 min-h-40 transition-colors ${
												isOver ? 'border-primary bg-primary/5' : 'border-border'
											}`}
										>
											<SortableContext
												items={builderItems.map((item) => item.id)}
												strategy={verticalListSortingStrategy}
											>
												{builderItems.length === 0 ? (
													<div className='py-8 text-sm text-center text-muted-foreground'>
														Drop exercises/supersets here or use the add
														buttons.
													</div>
												) : (
													<div className='space-y-2'>
														{builderItems.map((item, index) => (
															<SortableWorkoutItem
																key={item.id}
																item={item}
																index={index}
																onRemove={removeBuilderItem}
															/>
														))}
													</div>
												)}
											</SortableContext>
										</div>

										{field.state.meta.errors.length > 0 && (
											<p className='text-sm text-destructive'>
												{field.state.meta.errors.join(', ')}
											</p>
										)}
									</div>
								)}
							</form.Field>
						</CardContent>
					</Card>

					<div className='flex justify-end pt-2 border-t'>
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
											? 'Update Workout'
											: 'Create Workout'}
								</Button>
							)}
						</form.Subscribe>
					</div>
				</div>

				<Card className='xl:sticky xl:top-4 h-fit border-border/70'>
					<CardHeader className='pb-3'>
						<CardTitle>Exercise Library</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<Input
							value={libraryQuery}
							onChange={(event) => setLibraryQuery(event.target.value)}
							placeholder='Search exercises or supersets...'
						/>

						<ScrollArea className='p-2 rounded-md border h-[30rem]'>
							<div className='space-y-2'>
								{filteredLibraryItems.length === 0 ? (
									<p className='py-6 px-2 text-sm text-center text-muted-foreground'>
										No exercises or supersets found.
									</p>
								) : (
									filteredLibraryItems.map((item) => (
										<LibraryDraggableItem
											key={`${item.type}-${item.id}`}
											item={item}
											onAdd={addLibraryItem}
										/>
									))
								)}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>

				<DragOverlay>{renderOverlay()}</DragOverlay>
			</DndContext>
		</form>
	)
}

function mapLibraryToBuilderItem(item: LibraryItem): WorkoutBuilderItem {
	return {
		id: `overlay-${item.type}-${item.id}`,
		sourceId: item.id,
		name: item.name,
		type: item.type,
		movementName: item.movementName ?? null,
		memberCount: item.memberCount,
		sets: item.sets ?? null,
		reps: item.reps ?? null,
		repUnit: item.repUnit ?? null,
		ormPercent: item.ormPercent ?? null,
		targetRpe: item.targetRpe ?? null,
		restTime: item.restTime ?? null,
		restUnit: item.restUnit ?? null,
		tempoDown: item.tempoDown ?? null,
		tempoPause: item.tempoPause ?? null,
		tempoUp: item.tempoUp ?? null,
		notes: item.notes ?? null,
	}
}

function getExerciseDetailBadges(
	item: Pick<
		WorkoutBuilderItem,
		| 'movementName'
		| 'sets'
		| 'reps'
		| 'repUnit'
		| 'ormPercent'
		| 'targetRpe'
		| 'restTime'
		| 'restUnit'
		| 'tempoDown'
		| 'tempoPause'
		| 'tempoUp'
	>,
): string[] {
	const details: string[] = []

	if (item.movementName) details.push(item.movementName)

	const hasSetsOrReps = item.sets !== null || item.reps !== null
	if (hasSetsOrReps) {
		const sets = item.sets === null ? '?' : String(item.sets)
		const reps = item.reps === null ? '?' : String(item.reps)
		details.push(`${sets} x ${reps}${item.repUnit ? ` ${item.repUnit}` : ''}`)
	}

	if (item.ormPercent !== null) details.push(`${item.ormPercent}% 1RM`)
	if (item.targetRpe !== null) details.push(`RPE ${item.targetRpe}`)
	if (item.restTime !== null)
		details.push(
			`Rest ${item.restTime}${item.restUnit ? ` ${item.restUnit}` : ''}`,
		)

	const hasTempo =
		item.tempoDown !== null || item.tempoPause !== null || item.tempoUp !== null
	if (hasTempo) {
		const down = item.tempoDown === null ? '-' : String(item.tempoDown)
		const pause = item.tempoPause === null ? '-' : String(item.tempoPause)
		const up = item.tempoUp === null ? '-' : String(item.tempoUp)
		details.push(`Tempo ${down}-${pause}-${up}`)
	}

	return details
}

function ExerciseDetails({ item }: { item: WorkoutBuilderItem }) {
	if (item.type !== 'exercise') {
		return (
			<p className='text-xs truncate text-muted-foreground'>
				{`${item.memberCount ?? 0} exercises`}
			</p>
		)
	}

	const detailBadges = getExerciseDetailBadges(item)
	const trimmedNotes = item.notes?.trim() ?? ''

	return (
		<div className='space-y-1'>
			<div className='flex flex-wrap gap-1'>
				{detailBadges.length === 0 ? (
					<Badge variant='outline' className='px-1 font-normal text-[10px]'>
						No details
					</Badge>
				) : (
					detailBadges.map((detail) => (
						<Badge
							key={detail}
							variant='outline'
							className='px-1 font-normal text-[10px]'
						>
							{detail}
						</Badge>
					))
				)}
			</div>
			{trimmedNotes ? (
				<p className='text-xs line-clamp-2 text-muted-foreground'>
					{trimmedNotes}
				</p>
			) : null}
		</div>
	)
}

function WorkoutItemPreview({ item }: { item: WorkoutBuilderItem }) {
	return (
		<div className='p-3 rounded-lg border shadow-lg w-[320px] bg-background'>
			<div className='flex gap-2 items-center'>
				<Badge variant='outline' className='px-1.5'>
					{item.type === 'exercise' ? 'EX' : 'SS'}
				</Badge>
				{item.type === 'exercise' ? (
					<BarbellIcon className='text-orange-600 dark:text-orange-300 size-4' />
				) : (
					<StackPlusIcon className='text-violet-600 dark:text-violet-300 size-4' />
				)}
				<div className='flex-1 min-w-0'>
					<p className='font-medium truncate'>{item.name}</p>
					<ExerciseDetails item={item} />
				</div>
			</div>
		</div>
	)
}

function LibraryDraggableItem({
	item,
	onAdd,
}: {
	item: LibraryItem
	onAdd: (item: LibraryItem) => void
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: `library-${item.type}-${item.id}`,
			data: {
				kind: 'library',
				item,
			} satisfies DragData,
		})

	const style = {
		transform: CSS.Translate.toString(transform),
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 ${
				isDragging ? 'opacity-60' : ''
			}`}
		>
			<button
				type='button'
				className='cursor-grab text-muted-foreground hover:text-foreground'
				{...attributes}
				{...listeners}
			>
				<DotsSixVerticalIcon className='size-4' />
			</button>

			{item.type === 'exercise' ? (
				<BarbellIcon className='text-orange-600 dark:text-orange-300 size-4' />
			) : (
				<StackPlusIcon className='text-violet-600 dark:text-violet-300 size-4' />
			)}

			<div className='flex-1 min-w-0'>
				<div className='flex gap-2 items-center'>
					<p className='text-sm font-medium truncate'>{item.name}</p>
					{item.type === 'superset' ? (
						<Badge variant='secondary' className='py-0 px-1.5 text-[10px]'>
							Superset
						</Badge>
					) : null}
				</div>
				<ExerciseDetails item={mapLibraryToBuilderItem(item)} />
			</div>

			<Button
				type='button'
				variant='ghost'
				size='icon'
				onClick={() => onAdd(item)}
				className='w-7 h-7'
			>
				<PlusIcon className='size-4' />
			</Button>
		</div>
	)
}

function SortableWorkoutItem({
	item,
	index,
	onRemove,
}: {
	item: WorkoutBuilderItem
	index: number
	onRemove: (itemId: string) => void
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: item.id,
		data: {
			kind: 'builder',
			item,
		} satisfies DragData,
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
	}

	return (
		<div
			ref={setNodeRef}
			style={style}
			className={`flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 ${
				isDragging ? 'opacity-60' : ''
			}`}
		>
			<button
				type='button'
				className='cursor-grab text-muted-foreground hover:text-foreground'
				{...attributes}
				{...listeners}
			>
				<DotsSixVerticalIcon className='size-4' />
			</button>

			<Badge variant='outline' className='px-1.5'>
				{index + 1}
			</Badge>

			{item.type === 'exercise' ? (
				<BarbellIcon className='text-orange-600 dark:text-orange-300 size-4' />
			) : (
				<StackPlusIcon className='text-violet-600 dark:text-violet-300 size-4' />
			)}

			<div className='flex-1 min-w-0'>
				<div className='flex gap-2 items-center'>
					<p className='text-sm font-medium truncate'>{item.name}</p>
					{item.type === 'superset' ? (
						<Badge variant='secondary' className='py-0 px-1.5 text-[10px]'>
							Superset
						</Badge>
					) : null}
				</div>
				<ExerciseDetails item={item} />
			</div>

			<Button
				type='button'
				variant='ghost'
				size='icon'
				onClick={() => onRemove(item.id)}
				className='w-7 h-7 text-destructive'
			>
				<TrashIcon className='size-4' />
			</Button>
		</div>
	)
}
