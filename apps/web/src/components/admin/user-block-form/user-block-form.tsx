'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TagsInput } from '@/components/ui-extended/tags-input'
import { VirtualizedCombobox } from '@/components/ui-extended/vitrualilzed-combobox'
import { orpc } from '@/utils/orpc'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	type DragEndEvent,
	useSensor,
	useSensors,
} from '@dnd-kit/core'
import {
	SortableContext,
	arrayMove,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
	ArrowsClockwiseIcon,
	ArrowsOutCardinalIcon,
	FloppyDiskBackIcon,
	FolderOpenIcon,
	PlusIcon,
	SparkleIcon,
	TrashIcon,
} from '@phosphor-icons/react'
import { toast } from 'sonner'

type NullableNumber = number | null

interface BlockWarmupForm {
	id: string
	sourceWarmupId: string | null
	name: string
	description: string | null
	images: string | null
	link: string | null
}

interface BlockExerciseForm {
	id: string
	sourceExerciseId: string | null
	movementId: string | null
	superSetGroup: string | null
	label: string | null
	sets: NullableNumber
	reps: NullableNumber
	repUnit: string | null
	ormPercent: NullableNumber
	targetRpe: NullableNumber
	restTime: NullableNumber
	restUnit: string | null
	tempoDown: NullableNumber
	tempoPause: NullableNumber
	tempoUp: NullableNumber
	notes: string | null
}

interface BlockWorkoutForm {
	id: string
	sourceWorkoutId: string | null
	sourceWarmupGroupId: string | null
	dayIndex: number
	name: string
	description: string | null
	category: string | null
	warmups: BlockWarmupForm[]
	exercises: BlockExerciseForm[]
}

interface BlockFormData {
	name: string
	description: string | null
	category: string | null
	tags: string[]
	startDate: string | null
	endDate: string | null
	restDayIndexes: number[]
	workouts: BlockWorkoutForm[]
}

interface UserBlockFormProps {
	userOrgId: string
	orgSlug: string
	user?: string
	blockId?: string
	mode?: 'menu' | 'template'
}

function getDateInputValue(date: Date): string {
	const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
	return localDate.toISOString().split('T')[0]!
}

function getTodayDateString(): string {
	return getDateInputValue(new Date())
}

function createEmptyWarmup(index: number): BlockWarmupForm {
	return {
		id: crypto.randomUUID(),
		sourceWarmupId: null,
		name: `Warmup ${index + 1}`,
		description: null,
		images: null,
		link: null,
	}
}

function createEmptyExercise(_index: number): BlockExerciseForm {
	return {
		id: crypto.randomUUID(),
		sourceExerciseId: null,
		movementId: null,
		superSetGroup: null,
		label: null,
		sets: null,
		reps: null,
		repUnit: 'reps',
		ormPercent: null,
		targetRpe: null,
		restTime: null,
		restUnit: 'sec',
		tempoDown: null,
		tempoPause: null,
		tempoUp: null,
		notes: null,
	}
}

function createEmptyWorkout(dayIndex: number): BlockWorkoutForm {
	return {
		id: crypto.randomUUID(),
		sourceWorkoutId: null,
		sourceWarmupGroupId: null,
		dayIndex,
		name: `Workout ${dayIndex + 1}`,
		description: null,
		category: null,
		warmups: [],
		exercises: [],
	}
}

function createEmptyBlockForm(): BlockFormData {
	return {
		name: '',
		description: null,
		category: null,
		tags: [],
		startDate: getTodayDateString(),
		endDate: null,
		restDayIndexes: [],
		workouts: [],
	}
}

function normalizeTags(tags: string[]): string[] {
	return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)))
}

function normalizeRestDayIndexes(restDayIndexes: number[]): number[] {
	return Array.from(
		new Set(
			restDayIndexes.filter(
				(dayIndex) => Number.isInteger(dayIndex) && dayIndex >= 0,
			),
		),
	).sort((left, right) => left - right)
}

function deepCloneWarmup(warmup: BlockWarmupForm): BlockWarmupForm {
	return {
		...warmup,
		id: crypto.randomUUID(),
	}
}

function deepCloneExercise(exercise: BlockExerciseForm): BlockExerciseForm {
	return {
		...exercise,
		id: crypto.randomUUID(),
	}
}

function deepCloneWorkout(workout: BlockWorkoutForm): BlockWorkoutForm {
	return {
		...workout,
		id: crypto.randomUUID(),
		warmups: workout.warmups.map(deepCloneWarmup),
		exercises: workout.exercises.map(deepCloneExercise),
	}
}

function cleanupSupersetGroups(
	exercises: BlockExerciseForm[],
): BlockExerciseForm[] {
	const counts = new Map<string, number>()

	for (const exercise of exercises) {
		if (!exercise.superSetGroup) continue
		counts.set(
			exercise.superSetGroup,
			(counts.get(exercise.superSetGroup) ?? 0) + 1,
		)
	}

	return exercises.map((exercise) => {
		if (!exercise.superSetGroup) return exercise
		if ((counts.get(exercise.superSetGroup) ?? 0) > 1) return exercise
		return {
			...exercise,
			superSetGroup: null,
		}
	})
}

function mapExistingBlockToForm(block: any): BlockFormData {
	return {
		name: block.name,
		description: block.description ?? null,
		category: block.category ?? null,
		tags: block.tags ?? [],
		startDate: block.startDate
			? getDateInputValue(new Date(block.startDate))
			: getTodayDateString(),
		endDate: block.endDate ? getDateInputValue(new Date(block.endDate)) : null,
		restDayIndexes: block.restDayIndexes ?? [],
		workouts: (block.workouts ?? []).map((workoutItem: any) => ({
			id: crypto.randomUUID(),
			sourceWorkoutId: workoutItem.sourceWorkoutId ?? null,
			sourceWarmupGroupId: workoutItem.sourceWarmupGroupId ?? null,
			dayIndex: workoutItem.dayIndex,
			name: workoutItem.name,
			description: workoutItem.description ?? null,
			category: workoutItem.category ?? null,
			warmups: (workoutItem.warmups ?? []).map((warmupItem: any) => ({
				id: crypto.randomUUID(),
				sourceWarmupId: warmupItem.sourceWarmupId ?? null,
				name: warmupItem.name,
				description: warmupItem.description ?? null,
				images: warmupItem.images ?? null,
				link: warmupItem.link ?? null,
			})),
			exercises: (workoutItem.exercises ?? []).map((exerciseItem: any) => ({
				id: crypto.randomUUID(),
				sourceExerciseId: exerciseItem.sourceExerciseId ?? null,
				movementId: exerciseItem.movementId ?? null,
				superSetGroup: exerciseItem.superSetGroup ?? null,
				label: exerciseItem.label ?? null,
				sets: exerciseItem.sets ?? null,
				reps: exerciseItem.reps ?? null,
				repUnit: exerciseItem.repUnit ?? 'reps',
				ormPercent: exerciseItem.ormPercent ?? null,
				targetRpe: exerciseItem.targetRpe ?? null,
				restTime: exerciseItem.restTime ?? null,
				restUnit: exerciseItem.restUnit ?? 'sec',
				tempoDown: exerciseItem.tempoDown ?? null,
				tempoPause: exerciseItem.tempoPause ?? null,
				tempoUp: exerciseItem.tempoUp ?? null,
				notes: exerciseItem.notes ?? null,
			})),
		})),
	}
}

function buildWarmupsFromGroup(group: any): BlockWarmupForm[] {
	return (group.warmups ?? []).map((warmupItem: any) => ({
		id: crypto.randomUUID(),
		sourceWarmupId: warmupItem.id,
		name: warmupItem.name,
		description: warmupItem.description ?? null,
		images: warmupItem.images ?? null,
		link: warmupItem.link ?? null,
	})) as BlockWarmupForm[]
}

function buildExercisesFromLibrary(exerciseItem: any): BlockExerciseForm[] {
	if (exerciseItem.isSuperSet) {
		const superSetGroup = crypto.randomUUID()
		return (exerciseItem.superSetExercises ?? []).map((memberLink: any) => ({
			id: crypto.randomUUID(),
			sourceExerciseId: memberLink.exercise?.id ?? null,
			movementId: memberLink.exercise?.movementId ?? null,
			superSetGroup,
			label: memberLink.exercise?.name ?? null,
			sets: memberLink.exercise?.sets ?? null,
			reps: memberLink.exercise?.reps ?? null,
			repUnit: memberLink.exercise?.repUnit ?? 'reps',
			ormPercent: memberLink.exercise?.ormPercent ?? null,
			targetRpe:
				memberLink.exercise?.targetRpe ?? exerciseItem.targetRpe ?? null,
			restTime: memberLink.exercise?.restTime ?? exerciseItem.restTime ?? null,
			restUnit: memberLink.exercise?.restUnit ?? exerciseItem.restUnit ?? 'sec',
			tempoDown: memberLink.exercise?.tempoDown ?? null,
			tempoPause: memberLink.exercise?.tempoPause ?? null,
			tempoUp: memberLink.exercise?.tempoUp ?? null,
			notes: memberLink.exercise?.notes ?? exerciseItem.notes ?? null,
		})) as BlockExerciseForm[]
	}

	return [
		{
			id: crypto.randomUUID(),
			sourceExerciseId: exerciseItem.id,
			movementId: exerciseItem.movementId ?? null,
			superSetGroup: null,
			label: exerciseItem.name,
			sets: exerciseItem.sets ?? null,
			reps: exerciseItem.reps ?? null,
			repUnit: exerciseItem.repUnit ?? 'reps',
			ormPercent: exerciseItem.ormPercent ?? null,
			targetRpe: exerciseItem.targetRpe ?? null,
			restTime: exerciseItem.restTime ?? null,
			restUnit: exerciseItem.restUnit ?? 'sec',
			tempoDown: exerciseItem.tempoDown ?? null,
			tempoPause: exerciseItem.tempoPause ?? null,
			tempoUp: exerciseItem.tempoUp ?? null,
			notes: exerciseItem.notes ?? null,
		},
	] as BlockExerciseForm[]
}

function buildWorkoutFromLibrary(
	workoutItem: any,
	dayIndex: number,
): BlockWorkoutForm {
	const orderedItems = [
		...(workoutItem.exercises ?? []).map((link: any) => ({
			index: link.index,
			type: 'exercise' as const,
			payload: link.exercise,
		})),
		...(workoutItem.superSets ?? []).map((link: any) => ({
			index: link.index,
			type: 'superset' as const,
			payload: link.superSet,
		})),
	].sort((left, right) => left.index - right.index)

	const exercises = orderedItems.flatMap((item) =>
		buildExercisesFromLibrary(item.payload),
	)

	return {
		id: crypto.randomUUID(),
		sourceWorkoutId: workoutItem.id,
		sourceWarmupGroupId: workoutItem.warmupGroup?.id ?? null,
		dayIndex,
		name: workoutItem.name,
		description: workoutItem.description ?? null,
		category: workoutItem.category ?? null,
		warmups: workoutItem.warmupGroup
			? buildWarmupsFromGroup(workoutItem.warmupGroup)
			: [],
		exercises,
	}
}

function SortableShell({
	id,
	children,
	className,
}: {
	id: string
	children: React.ReactNode
	className?: string
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id })

	return (
		<div
			ref={setNodeRef}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
			}}
			className={cn(className, isDragging && 'opacity-70')}
		>
			<div className='flex gap-3 items-start'>
				<button
					type='button'
					className='flex justify-center items-center mt-3 w-8 h-8 rounded-md border bg-muted/40 text-muted-foreground hover:bg-muted'
					{...attributes}
					{...listeners}
				>
					<ArrowsOutCardinalIcon className='size-4' />
				</button>
				<div className='min-w-0 flex-1'>{children}</div>
			</div>
		</div>
	)
}

function numberInputValue(value: NullableNumber): string {
	return value === null ? '' : String(value)
}

function parseNullableNumber(value: string): NullableNumber {
	if (!value.trim()) return null
	const parsed = Number(value)
	return Number.isNaN(parsed) ? null : parsed
}

function reorderIds<T extends { id: string }>(
	items: T[],
	activeId: string,
	overId: string,
): T[] {
	const oldIndex = items.findIndex((item) => item.id === activeId)
	const newIndex = items.findIndex((item) => item.id === overId)
	if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return items
	return arrayMove(items, oldIndex, newIndex)
}

export function UserBlockForm({
	userOrgId,
	orgSlug,
	user,
	blockId,
	mode = 'menu',
}: UserBlockFormProps) {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const isEditMode = Boolean(blockId)
	const isTemplateMode = mode === 'template'
	const [selectedTemplate, setSelectedTemplate] = React.useState<any>(null)
	const [selectedWorkoutId, setSelectedWorkoutId] = React.useState<
		string | null
	>(null)
	const [formData, setFormData] = React.useState<BlockFormData>(
		createEmptyBlockForm(),
	)

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: { distance: 6 },
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	)

	const { data: existingBlock } = useQuery(
		orpc.userBlock.get.queryOptions({
			input: { id: blockId ?? '' },
			enabled: isEditMode,
		}),
	)

	const { data: blockTemplates } = useQuery(
		orpc.userBlock.getTemplatesOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const { data: workoutsData } = useQuery(
		orpc.workout.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const { data: exercisesData } = useQuery(
		orpc.exercise.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const { data: warmupGroupsData } = useQuery(
		orpc.warmup.getAllGroups.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const { data: movementsData } = useQuery(
		orpc.movement.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const selectedUserId = isTemplateMode
		? undefined
		: user || existingBlock?.userId || undefined

	React.useEffect(() => {
		if (!existingBlock) return
		const nextFormData = mapExistingBlockToForm(existingBlock)
		setFormData(nextFormData)
		setSelectedWorkoutId(nextFormData.workouts[0]?.id ?? null)
	}, [existingBlock])

	const movementOptions = React.useMemo(
		() =>
			(movementsData ?? []).map((movementItem) => ({
				value: movementItem.id,
				label: movementItem.name,
			})),
		[movementsData],
	)

	const batchCreateBlock = useMutation(
		orpc.userBlock.batchCreate.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.userBlock.getTemplatesOrg.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.userBlock.getByUser.key(),
				})
				toast.success(
					isTemplateMode
						? 'Block template created successfully'
						: 'Block created successfully',
				)

				if (isTemplateMode) {
					navigate({
						to: '/$orgSlug/block-templates',
						params: { orgSlug },
					})
					return
				}

				navigate({
					to: '/$orgSlug/user-blocks',
					params: { orgSlug },
					search: selectedUserId ? { user: selectedUserId } : {},
				})
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to create block')
			},
		}),
	)

	const batchUpdateBlock = useMutation(
		orpc.userBlock.batchUpdate.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.userBlock.getTemplatesOrg.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.userBlock.getByUser.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.userBlock.get.key(),
				})
				toast.success(
					isTemplateMode
						? 'Block template updated successfully'
						: 'Block updated successfully',
				)

				if (isTemplateMode) {
					navigate({
						to: '/$orgSlug/block-templates',
						params: { orgSlug },
					})
					return
				}

				navigate({
					to: '/$orgSlug/user-blocks',
					params: { orgSlug },
					search: selectedUserId ? { user: selectedUserId } : {},
				})
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to update block')
			},
		}),
	)

	const blockTemplatesList = (blockTemplates ?? []) as any[]
	const workoutsList = (workoutsData ?? []) as any[]
	const exercisesList = (exercisesData ?? []) as any[]
	const warmupGroupsList = (warmupGroupsData ?? []) as any[]

	const canSave = React.useMemo(
		() =>
			formData.name.trim().length > 0 &&
			formData.workouts.every(
				(workoutItem) =>
					workoutItem.name.trim().length > 0 &&
					workoutItem.exercises.every(
						(exerciseItem) => !!exerciseItem.movementId,
					),
			),
		[formData],
	)

	const maxKnownDay = React.useMemo(() => {
		const workoutDays = formData.workouts.map(
			(workoutItem) => workoutItem.dayIndex,
		)
		const restDays = formData.restDayIndexes
		return Math.max(-1, ...workoutDays, ...restDays)
	}, [formData.restDayIndexes, formData.workouts])

	const dayChips = React.useMemo(
		() =>
			Array.from({ length: Math.max(maxKnownDay + 3, 7) }, (_, index) => index),
		[maxKnownDay],
	)

	const setWorkout = React.useCallback(
		(
			workoutId: string,
			updater: (current: BlockWorkoutForm) => BlockWorkoutForm,
		) => {
			setFormData((prev) => ({
				...prev,
				workouts: prev.workouts.map((workoutItem) =>
					workoutItem.id === workoutId ? updater(workoutItem) : workoutItem,
				),
			}))
		},
		[],
	)

	const addWorkout = React.useCallback((nextWorkout?: BlockWorkoutForm) => {
		let createdWorkoutId: string | null = nextWorkout?.id ?? null
		setFormData((prev) => {
			const fallbackDay =
				prev.workouts.length > 0
					? Math.max(
							...prev.workouts.map((workoutItem) => workoutItem.dayIndex),
							...prev.restDayIndexes,
						) + 1
					: 0
			const workoutItem = nextWorkout ?? createEmptyWorkout(fallbackDay)
			createdWorkoutId = workoutItem.id
			return {
				...prev,
				workouts: [...prev.workouts, workoutItem],
			}
		})
		setSelectedWorkoutId(createdWorkoutId)
	}, [])

	const removeWorkout = React.useCallback((workoutId: string) => {
		setFormData((prev) => ({
			...prev,
			workouts: prev.workouts.filter(
				(workoutItem) => workoutItem.id !== workoutId,
			),
		}))
		setSelectedWorkoutId((prev) => (prev === workoutId ? null : prev))
	}, [])

	const duplicateWorkout = React.useCallback((workoutId: string) => {
		setFormData((prev) => {
			const targetIndex = prev.workouts.findIndex(
				(workoutItem) => workoutItem.id === workoutId,
			)
			if (targetIndex < 0) return prev
			const nextWorkout = deepCloneWorkout(prev.workouts[targetIndex]!)
			nextWorkout.dayIndex =
				Math.max(
					...prev.workouts.map((workoutItem) => workoutItem.dayIndex),
					...prev.restDayIndexes,
					-1,
				) + 1
			nextWorkout.name = `${nextWorkout.name} Copy`
			const workouts = [...prev.workouts]
			workouts.splice(targetIndex + 1, 0, nextWorkout)
			return { ...prev, workouts }
		})
	}, [])

	const toggleRestDay = React.useCallback((dayIndex: number) => {
		setFormData((prev) => {
			if (
				prev.workouts.some((workoutItem) => workoutItem.dayIndex === dayIndex)
			) {
				return prev
			}

			const exists = prev.restDayIndexes.includes(dayIndex)
			return {
				...prev,
				restDayIndexes: normalizeRestDayIndexes(
					exists
						? prev.restDayIndexes.filter((restDay) => restDay !== dayIndex)
						: [...prev.restDayIndexes, dayIndex],
				),
			}
		})
	}, [])

	const addWarmup = React.useCallback(
		(workoutId: string) => {
			setWorkout(workoutId, (workoutItem) => ({
				...workoutItem,
				warmups: [
					...workoutItem.warmups,
					createEmptyWarmup(workoutItem.warmups.length),
				],
			}))
		},
		[setWorkout],
	)

	const addExercise = React.useCallback(
		(workoutId: string) => {
			setWorkout(workoutId, (workoutItem) => ({
				...workoutItem,
				exercises: [
					...workoutItem.exercises,
					createEmptyExercise(workoutItem.exercises.length),
				],
			}))
		},
		[setWorkout],
	)

	const importWorkout = React.useCallback(
		(workoutItem: any) => {
			const nextDayIndex =
				Math.max(
					...formData.workouts.map((entry) => entry.dayIndex),
					...formData.restDayIndexes,
					-1,
				) + 1
			const nextWorkout = buildWorkoutFromLibrary(workoutItem, nextDayIndex)
			setFormData((prev) => ({
				...prev,
				workouts: [...prev.workouts, nextWorkout],
			}))
			setSelectedWorkoutId(nextWorkout.id)
		},
		[formData.restDayIndexes, formData.workouts],
	)

	const importWarmupGroup = React.useCallback(
		(group: any) => {
			if (!selectedWorkoutId) {
				toast.error('Select a workout before importing warmups')
				return
			}
			setWorkout(selectedWorkoutId, (workoutItem) => ({
				...workoutItem,
				sourceWarmupGroupId: group.id,
				warmups: [...workoutItem.warmups, ...buildWarmupsFromGroup(group)],
			}))
		},
		[selectedWorkoutId, setWorkout],
	)

	const importExercise = React.useCallback(
		(exerciseItem: any) => {
			if (!selectedWorkoutId) {
				toast.error('Select a workout before importing exercises')
				return
			}
			setWorkout(selectedWorkoutId, (workoutItem) => ({
				...workoutItem,
				exercises: [
					...workoutItem.exercises,
					...buildExercisesFromLibrary(exerciseItem),
				],
			}))
		},
		[selectedWorkoutId, setWorkout],
	)

	const handleWorkoutDragEnd = React.useCallback((event: DragEndEvent) => {
		const { active, over } = event
		if (!over || active.id === over.id) return
		setFormData((prev) => ({
			...prev,
			workouts: reorderIds(prev.workouts, String(active.id), String(over.id)),
		}))
	}, [])

	const handleTemplateSelect = React.useCallback((template: any) => {
		setSelectedTemplate(template)
		const nextFormData = mapExistingBlockToForm(template)
		nextFormData.startDate = getTodayDateString()
		nextFormData.endDate = null
		setFormData(nextFormData)
		setSelectedWorkoutId(nextFormData.workouts[0]?.id ?? null)
	}, [])

	const handleStartBlank = React.useCallback(() => {
		setSelectedTemplate({ id: null, isBlank: true })
		const nextFormData = createEmptyBlockForm()
		setFormData(nextFormData)
		setSelectedWorkoutId(null)
	}, [])

	const handleSubmit = React.useCallback(async () => {
		if (!canSave) {
			toast.error('Complete the required block fields before saving')
			return
		}

		if (!isEditMode && !user) {
			toast.error(
				isTemplateMode
					? 'Unable to resolve template owner'
					: 'No user selected for this block',
			)
			return
		}

		const payload = {
			name: formData.name.trim(),
			description: formData.description?.trim() || null,
			category: formData.category?.trim() || null,
			tags: normalizeTags(formData.tags),
			restDayIndexes: normalizeRestDayIndexes(formData.restDayIndexes),
			startDate:
				isTemplateMode || !formData.startDate
					? null
					: new Date(formData.startDate),
			endDate:
				isTemplateMode || !formData.endDate ? null : new Date(formData.endDate),
			workouts: formData.workouts.map((workoutItem, workoutIndex) => ({
				dayIndex: Math.max(0, workoutItem.dayIndex),
				workoutIndex,
				sourceWorkoutId: workoutItem.sourceWorkoutId,
				sourceWarmupGroupId: workoutItem.sourceWarmupGroupId,
				name: workoutItem.name.trim(),
				description: workoutItem.description?.trim() || null,
				category: workoutItem.category?.trim() || null,
				warmups: workoutItem.warmups.map((warmupItem, warmupIndex) => ({
					warmupIndex,
					sourceWarmupId: warmupItem.sourceWarmupId,
					name: warmupItem.name.trim(),
					description: warmupItem.description?.trim() || null,
					images: warmupItem.images?.trim() || null,
					link: warmupItem.link?.trim() || null,
				})),
				exercises: cleanupSupersetGroups(workoutItem.exercises).map(
					(exerciseItem, exerciseIndex) => ({
						exerciseIndex,
						sourceExerciseId: exerciseItem.sourceExerciseId,
						movementId: exerciseItem.movementId,
						superSetGroup: exerciseItem.superSetGroup,
						superSetOrder: null,
						label: exerciseItem.label?.trim() || null,
						sets: exerciseItem.sets,
						reps: exerciseItem.reps,
						repUnit: exerciseItem.repUnit?.trim() || null,
						ormPercent: exerciseItem.ormPercent,
						targetRpe: exerciseItem.targetRpe,
						restTime: exerciseItem.restTime,
						restUnit: exerciseItem.restUnit?.trim() || null,
						tempoDown: exerciseItem.tempoDown,
						tempoPause: exerciseItem.tempoPause,
						tempoUp: exerciseItem.tempoUp,
						notes: exerciseItem.notes?.trim() || null,
					}),
				),
			})),
		}

		if (isEditMode) {
			await batchUpdateBlock.mutateAsync({
				id: blockId!,
				...payload,
			})
			return
		}

		await batchCreateBlock.mutateAsync({
			userId: user!,
			blockTemplateId: isTemplateMode ? null : (selectedTemplate?.id ?? null),
			isTemplate: isTemplateMode,
			...payload,
		})
	}, [
		batchCreateBlock,
		batchUpdateBlock,
		blockId,
		canSave,
		formData,
		isEditMode,
		isTemplateMode,
		selectedTemplate?.id,
		user,
	])

	const backTarget = isTemplateMode
		? {
				to: '/$orgSlug/block-templates' as const,
				search: {},
			}
		: {
				to: '/$orgSlug/user-blocks' as const,
				search: selectedUserId ? { user: selectedUserId } : {},
			}

	if (!isEditMode && !isTemplateMode && !selectedTemplate) {
		return (
			<div className='flex flex-col gap-6 p-6'>
				<div className='flex flex-wrap gap-3 justify-between items-center'>
					<div>
						<h1 className='text-2xl font-semibold tracking-tight'>
							Create User Block
						</h1>
						<p className='text-sm text-muted-foreground'>
							Start from a reusable block template or build a block from
							scratch.
						</p>
					</div>
					<Button variant='outline' onClick={handleStartBlank}>
						<SparkleIcon className='mr-2 size-4' />
						Start Blank
					</Button>
				</div>

				<div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
					{blockTemplatesList.map((template) => (
						<Card
							key={template.id}
							className='transition-colors cursor-pointer border-border/70 hover:border-primary/60'
							onClick={() => handleTemplateSelect(template)}
						>
							<CardHeader className='space-y-2'>
								<CardTitle className='text-lg'>{template.name}</CardTitle>
								<p className='text-sm text-muted-foreground line-clamp-2'>
									{template.description || 'No description'}
								</p>
							</CardHeader>
							<CardContent className='text-sm text-muted-foreground space-y-1'>
								<p>{template.workouts?.length || 0} workouts</p>
								<p>{template.restDayIndexes?.length || 0} rest days</p>
								<p>{template.tags?.length || 0} tags</p>
							</CardContent>
						</Card>
					))}
					{blockTemplatesList.length === 0 && (
						<Card className='border-dashed'>
							<CardContent className='py-12 text-center text-sm text-muted-foreground'>
								No block templates available yet. Start from scratch instead.
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		)
	}

	return (
		<div className='grid gap-6 p-6 xl:grid-cols-[minmax(0,1fr)_360px]'>
			<div className='space-y-6'>
				<div className='flex flex-wrap gap-3 justify-between items-center'>
					<div>
						<h1 className='text-2xl font-semibold tracking-tight'>
							{isTemplateMode
								? isEditMode
									? 'Edit Block Template'
									: 'Create Block Template'
								: isEditMode
									? 'Edit User Block'
									: 'Create User Block'}
						</h1>
						<p className='text-sm text-muted-foreground'>
							Import workouts, warmups, and exercises, then refine the schedule
							in place.
						</p>
					</div>
					<div className='flex gap-2'>
						<Button
							variant='outline'
							onClick={() =>
								navigate({
									to: backTarget.to,
									params: { orgSlug },
									search: backTarget.search,
								})
							}
						>
							Back
						</Button>
						<Button
							onClick={() => void handleSubmit()}
							disabled={
								!canSave ||
								batchCreateBlock.isPending ||
								batchUpdateBlock.isPending
							}
						>
							<FloppyDiskBackIcon className='mr-2 size-4' />
							{batchCreateBlock.isPending || batchUpdateBlock.isPending
								? 'Saving...'
								: 'Save Block'}
						</Button>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Block Details</CardTitle>
					</CardHeader>
					<CardContent className='space-y-4'>
						<div className='grid gap-4 md:grid-cols-2'>
							<div className='space-y-2'>
								<Label htmlFor='block-name'>Name</Label>
								<Input
									id='block-name'
									value={formData.name}
									onChange={(event) =>
										setFormData((prev) => ({
											...prev,
											name: event.target.value,
										}))
									}
									placeholder='e.g. 6 Week Hypertrophy Block'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='block-category'>Category</Label>
								<Input
									id='block-category'
									value={formData.category ?? ''}
									onChange={(event) =>
										setFormData((prev) => ({
											...prev,
											category: event.target.value || null,
										}))
									}
									placeholder='e.g. Strength'
								/>
							</div>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='block-description'>Description</Label>
							<Textarea
								id='block-description'
								value={formData.description ?? ''}
								onChange={(event) =>
									setFormData((prev) => ({
										...prev,
										description: event.target.value || null,
									}))
								}
								placeholder='Add intent, focus, and coaching notes for this block.'
								className='min-h-28'
							/>
						</div>

						<div className='space-y-2'>
							<Label>Tags</Label>
							<TagsInput
								value={formData.tags}
								onValueChange={(nextTags) =>
									setFormData((prev) => ({
										...prev,
										tags: normalizeTags(nextTags),
									}))
								}
								placeholder='Add tags...'
							/>
						</div>

						{!isTemplateMode && (
							<div className='grid gap-4 md:grid-cols-2'>
								<div className='space-y-2'>
									<Label htmlFor='block-start-date'>Start Date</Label>
									<Input
										id='block-start-date'
										type='date'
										value={formData.startDate ?? ''}
										onChange={(event) =>
											setFormData((prev) => ({
												...prev,
												startDate: event.target.value || null,
											}))
										}
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='block-end-date'>End Date</Label>
									<Input
										id='block-end-date'
										type='date'
										value={formData.endDate ?? ''}
										onChange={(event) =>
											setFormData((prev) => ({
												...prev,
												endDate: event.target.value || null,
											}))
										}
									/>
								</div>
							</div>
						)}

						<div className='space-y-3'>
							<div className='flex flex-wrap gap-2 justify-between items-center'>
								<div>
									<Label>Rest Days</Label>
									<p className='text-xs text-muted-foreground'>
										Workout days are locked. Toggle open days as rest days.
									</p>
								</div>
								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() =>
										toggleRestDay(
											Math.max(
												...formData.workouts.map(
													(workoutItem) => workoutItem.dayIndex,
												),
												...formData.restDayIndexes,
												-1,
											) + 1,
										)
									}
								>
									<PlusIcon className='mr-2 size-4' />
									Add Rest Day
								</Button>
							</div>
							<div className='flex flex-wrap gap-2'>
								{dayChips.map((dayIndex) => {
									const hasWorkout = formData.workouts.some(
										(workoutItem) => workoutItem.dayIndex === dayIndex,
									)
									const isRestDay = formData.restDayIndexes.includes(dayIndex)
									return (
										<Button
											key={dayIndex}
											type='button'
											size='sm'
											variant={isRestDay ? 'default' : 'outline'}
											disabled={hasWorkout}
											onClick={() => toggleRestDay(dayIndex)}
										>
											Day {dayIndex + 1}
											{hasWorkout ? ' • Workout' : isRestDay ? ' • Rest' : ''}
										</Button>
									)
								})}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className='flex flex-row gap-3 justify-between items-center'>
						<div>
							<CardTitle>Workout Schedule</CardTitle>
							<p className='text-sm text-muted-foreground'>
								Drag workouts to reorder the build. Day numbers stay editable.
							</p>
						</div>
						<div className='flex gap-2'>
							<Button
								type='button'
								variant='outline'
								size='sm'
								onClick={() => addWorkout()}
							>
								<PlusIcon className='mr-2 size-4' />
								Add Workout
							</Button>
						</div>
					</CardHeader>
					<CardContent className='space-y-4'>
						{formData.workouts.length === 0 ? (
							<div className='py-12 text-sm text-center rounded-lg border border-dashed text-muted-foreground'>
								No workouts in this block yet. Import one from the library or
								add a blank workout.
							</div>
						) : (
							<DndContext
								sensors={sensors}
								collisionDetection={closestCenter}
								onDragEnd={handleWorkoutDragEnd}
							>
								<SortableContext
									items={formData.workouts.map((workoutItem) => workoutItem.id)}
									strategy={verticalListSortingStrategy}
								>
									<div className='space-y-4'>
										{formData.workouts.map((workoutItem, index) => (
											<SortableShell key={workoutItem.id} id={workoutItem.id}>
												<WorkoutEditorCard
													workout={workoutItem}
													workoutIndex={index}
													movementOptions={movementOptions}
													selected={selectedWorkoutId === workoutItem.id}
													onSelect={() => setSelectedWorkoutId(workoutItem.id)}
													onChange={(nextWorkout) =>
														setWorkout(workoutItem.id, () => nextWorkout)
													}
													onDuplicate={() => duplicateWorkout(workoutItem.id)}
													onRemove={() => removeWorkout(workoutItem.id)}
													onAddWarmup={() => addWarmup(workoutItem.id)}
													onAddExercise={() => addExercise(workoutItem.id)}
													sensors={sensors}
												/>
											</SortableShell>
										))}
									</div>
								</SortableContext>
							</DndContext>
						)}
					</CardContent>
				</Card>
			</div>

			<div className='space-y-4'>
				<Card>
					<CardHeader>
						<CardTitle>Import Library</CardTitle>
					</CardHeader>
					<CardContent className='space-y-3 text-sm text-muted-foreground'>
						<p>
							Selected workout:{' '}
							<span className='font-medium text-foreground'>
								{formData.workouts.find(
									(workoutItem) => workoutItem.id === selectedWorkoutId,
								)?.name || 'None'}
							</span>
						</p>
						<p>
							Import full workouts into the block, or import warmups and
							exercises into the currently selected workout.
						</p>
					</CardContent>
				</Card>

				<Card className='overflow-hidden'>
					<CardContent className='p-0'>
						<Tabs defaultValue='workouts'>
							<TabsList className='grid grid-cols-3 rounded-none border-b'>
								<TabsTrigger value='workouts'>Workouts</TabsTrigger>
								<TabsTrigger value='exercises'>Exercises</TabsTrigger>
								<TabsTrigger value='warmups'>Warmups</TabsTrigger>
							</TabsList>
							<TabsContent value='workouts' className='m-0'>
								<ScrollArea className='h-[520px] p-4'>
									<div className='space-y-3'>
										{workoutsList.map((workoutItem) => (
											<Card key={workoutItem.id} className='border-border/70'>
												<CardContent className='space-y-3 p-4'>
													<div className='flex gap-3 justify-between items-start'>
														<div className='min-w-0'>
															<p className='font-medium'>{workoutItem.name}</p>
															<p className='text-xs text-muted-foreground'>
																{workoutItem.exercises?.length || 0} items
																{workoutItem.warmupGroup
																	? ` • ${workoutItem.warmupGroup.warmups?.length || 0} warmups`
																	: ''}
															</p>
														</div>
														<Button
															size='sm'
															onClick={() => importWorkout(workoutItem)}
														>
															<FolderOpenIcon className='mr-2 size-4' />
															Import
														</Button>
													</div>
													<p className='text-xs text-muted-foreground line-clamp-2'>
														{workoutItem.description || 'No description'}
													</p>
												</CardContent>
											</Card>
										))}
									</div>
								</ScrollArea>
							</TabsContent>
							<TabsContent value='exercises' className='m-0'>
								<ScrollArea className='h-[520px] p-4'>
									<div className='space-y-3'>
										{exercisesList.map((exerciseItem) => (
											<Card key={exerciseItem.id} className='border-border/70'>
												<CardContent className='space-y-3 p-4'>
													<div className='flex gap-3 justify-between items-start'>
														<div className='min-w-0'>
															<p className='font-medium'>{exerciseItem.name}</p>
															<p className='text-xs text-muted-foreground'>
																{exerciseItem.isSuperSet
																	? `${exerciseItem.superSetExercises?.length || 0} exercise superset`
																	: exerciseItem.movementName || 'No movement'}
															</p>
														</div>
														<Button
															size='sm'
															disabled={!selectedWorkoutId}
															onClick={() => importExercise(exerciseItem)}
														>
															<FolderOpenIcon className='mr-2 size-4' />
															Import
														</Button>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								</ScrollArea>
							</TabsContent>
							<TabsContent value='warmups' className='m-0'>
								<ScrollArea className='h-[520px] p-4'>
									<div className='space-y-3'>
										{warmupGroupsList.map((group) => (
											<Card key={group.id} className='border-border/70'>
												<CardContent className='space-y-3 p-4'>
													<div className='flex gap-3 justify-between items-start'>
														<div className='min-w-0'>
															<p className='font-medium'>{group.name}</p>
															<p className='text-xs text-muted-foreground'>
																{group.warmups?.length || 0} warmups
															</p>
														</div>
														<Button
															size='sm'
															disabled={!selectedWorkoutId}
															onClick={() => importWarmupGroup(group)}
														>
															<FolderOpenIcon className='mr-2 size-4' />
															Import
														</Button>
													</div>
													<p className='text-xs text-muted-foreground line-clamp-2'>
														{group.description || 'No description'}
													</p>
												</CardContent>
											</Card>
										))}
									</div>
								</ScrollArea>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}

function WorkoutEditorCard({
	workout,
	workoutIndex,
	movementOptions,
	selected,
	onSelect,
	onChange,
	onDuplicate,
	onRemove,
	onAddWarmup,
	onAddExercise,
	sensors,
}: {
	workout: BlockWorkoutForm
	workoutIndex: number
	movementOptions: Array<{ value: string; label: string }>
	selected: boolean
	onSelect: () => void
	onChange: (workout: BlockWorkoutForm) => void
	onDuplicate: () => void
	onRemove: () => void
	onAddWarmup: () => void
	onAddExercise: () => void
	sensors: ReturnType<typeof useSensors>
}) {
	const warmupIds = workout.warmups.map((warmupItem) => warmupItem.id)
	const exerciseIds = workout.exercises.map((exerciseItem) => exerciseItem.id)
	const superSetGroups = Array.from(
		new Set(
			workout.exercises
				.map((exerciseItem) => exerciseItem.superSetGroup)
				.filter(Boolean),
		),
	)

	const updateWarmups = React.useCallback(
		(updater: (warmups: BlockWarmupForm[]) => BlockWarmupForm[]) => {
			onChange({
				...workout,
				warmups: updater(workout.warmups),
			})
		},
		[onChange, workout],
	)

	const updateExercises = React.useCallback(
		(updater: (exercises: BlockExerciseForm[]) => BlockExerciseForm[]) => {
			onChange({
				...workout,
				exercises: cleanupSupersetGroups(updater(workout.exercises)),
			})
		},
		[onChange, workout],
	)

	return (
		<Card
			className={cn(
				'border-border/70 transition-colors',
				selected && 'border-primary/60 shadow-sm',
			)}
			onClick={onSelect}
		>
			<CardHeader className='space-y-4'>
				<div className='flex flex-wrap gap-3 justify-between items-start'>
					<div className='space-y-1'>
						<CardTitle className='text-lg'>
							Workout {workoutIndex + 1}
						</CardTitle>
						<p className='text-sm text-muted-foreground'>
							{workout.exercises.length} exercises • {workout.warmups.length}{' '}
							warmups
							{superSetGroups.length > 0
								? ` • ${superSetGroups.length} supersets`
								: ''}
						</p>
					</div>
					<div className='flex gap-2'>
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={onDuplicate}
						>
							<ArrowsClockwiseIcon className='mr-2 size-4' />
							Duplicate
						</Button>
						<Button
							type='button'
							variant='outline'
							size='sm'
							onClick={onRemove}
						>
							<TrashIcon className='mr-2 size-4' />
							Remove
						</Button>
					</div>
				</div>

				<div className='grid gap-4 md:grid-cols-[100px_minmax(0,1fr)]'>
					<div className='space-y-2'>
						<Label>Day</Label>
						<Input
							type='number'
							min='1'
							value={workout.dayIndex + 1}
							onChange={(event) =>
								onChange({
									...workout,
									dayIndex: Math.max(0, Number(event.target.value || 1) - 1),
								})
							}
						/>
					</div>
					<div className='space-y-2'>
						<Label>Name</Label>
						<Input
							value={workout.name}
							onChange={(event) =>
								onChange({
									...workout,
									name: event.target.value,
								})
							}
							placeholder='Workout name'
						/>
					</div>
				</div>

				<div className='grid gap-4 md:grid-cols-2'>
					<div className='space-y-2'>
						<Label>Category</Label>
						<Input
							value={workout.category ?? ''}
							onChange={(event) =>
								onChange({
									...workout,
									category: event.target.value || null,
								})
							}
							placeholder='Workout category'
						/>
					</div>
					<div className='space-y-2'>
						<Label>Description</Label>
						<Input
							value={workout.description ?? ''}
							onChange={(event) =>
								onChange({
									...workout,
									description: event.target.value || null,
								})
							}
							placeholder='Short workout description'
						/>
					</div>
				</div>
			</CardHeader>

			<CardContent className='space-y-6'>
				<div className='space-y-3'>
					<div className='flex flex-wrap gap-2 justify-between items-center'>
						<div>
							<h3 className='font-medium'>Warmups</h3>
							<p className='text-sm text-muted-foreground'>
								Drag to reorder and edit each warmup in place.
							</p>
						</div>
						<Button
							type='button'
							size='sm'
							variant='outline'
							onClick={onAddWarmup}
						>
							<PlusIcon className='mr-2 size-4' />
							Add Warmup
						</Button>
					</div>

					{workout.warmups.length === 0 ? (
						<div className='py-4 text-sm text-center rounded-lg border border-dashed text-muted-foreground'>
							No warmups yet.
						</div>
					) : (
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={(event) => {
								const { active, over } = event
								if (!over || active.id === over.id) return
								updateWarmups((warmups) =>
									reorderIds(warmups, String(active.id), String(over.id)),
								)
							}}
						>
							<SortableContext
								items={warmupIds}
								strategy={verticalListSortingStrategy}
							>
								<div className='space-y-3'>
									{workout.warmups.map((warmupItem, warmupIndex) => (
										<SortableShell key={warmupItem.id} id={warmupItem.id}>
											<Card className='border-border/60'>
												<CardContent className='p-4 space-y-3'>
													<div className='flex gap-3 justify-between items-center'>
														<p className='font-medium'>
															Warmup {warmupIndex + 1}
														</p>
														<Button
															type='button'
															size='icon'
															variant='ghost'
															onClick={() =>
																updateWarmups((warmups) =>
																	warmups.filter(
																		(entry) => entry.id !== warmupItem.id,
																	),
																)
															}
														>
															<TrashIcon className='size-4 text-destructive' />
														</Button>
													</div>
													<div className='grid gap-3 md:grid-cols-2'>
														<Input
															value={warmupItem.name}
															onChange={(event) =>
																updateWarmups((warmups) =>
																	warmups.map((entry) =>
																		entry.id === warmupItem.id
																			? {
																					...entry,
																					name: event.target.value,
																				}
																			: entry,
																	),
																)
															}
															placeholder='Warmup name'
														/>
														<Input
															value={warmupItem.link ?? ''}
															onChange={(event) =>
																updateWarmups((warmups) =>
																	warmups.map((entry) =>
																		entry.id === warmupItem.id
																			? {
																					...entry,
																					link: event.target.value || null,
																				}
																			: entry,
																	),
																)
															}
															placeholder='Video or reference link'
														/>
													</div>
													<Textarea
														value={warmupItem.description ?? ''}
														onChange={(event) =>
															updateWarmups((warmups) =>
																warmups.map((entry) =>
																	entry.id === warmupItem.id
																		? {
																				...entry,
																				description: event.target.value || null,
																			}
																		: entry,
																),
															)
														}
														placeholder='Warmup coaching notes'
														className='min-h-20'
													/>
												</CardContent>
											</Card>
										</SortableShell>
									))}
								</div>
							</SortableContext>
						</DndContext>
					)}
				</div>

				<div className='space-y-3'>
					<div className='flex flex-wrap gap-2 justify-between items-center'>
						<div>
							<h3 className='font-medium'>Exercises</h3>
							<p className='text-sm text-muted-foreground'>
								Each exercise must point at a movement. Use "Pair with previous"
								to build supersets.
							</p>
						</div>
						<Button
							type='button'
							size='sm'
							variant='outline'
							onClick={onAddExercise}
						>
							<PlusIcon className='mr-2 size-4' />
							Add Exercise
						</Button>
					</div>

					{workout.exercises.length === 0 ? (
						<div className='py-4 text-sm text-center rounded-lg border border-dashed text-muted-foreground'>
							No exercises yet.
						</div>
					) : (
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={(event) => {
								const { active, over } = event
								if (!over || active.id === over.id) return
								updateExercises((exercises) =>
									reorderIds(exercises, String(active.id), String(over.id)),
								)
							}}
						>
							<SortableContext
								items={exerciseIds}
								strategy={verticalListSortingStrategy}
							>
								<div className='space-y-3'>
									{workout.exercises.map((exerciseItem, exerciseIndex) => {
										const previousExercise =
											workout.exercises[exerciseIndex - 1] ?? null
										const isInSuperset = Boolean(exerciseItem.superSetGroup)
										const superSetNumber = exerciseItem.superSetGroup
											? superSetGroups.indexOf(exerciseItem.superSetGroup) + 1
											: null

										return (
											<SortableShell key={exerciseItem.id} id={exerciseItem.id}>
												<Card
													className={cn(
														'border-border/60',
														isInSuperset &&
															'border-amber-400/70 bg-amber-50/40 dark:bg-amber-950/10',
													)}
												>
													<CardContent className='p-4 space-y-4'>
														<div className='flex flex-wrap gap-2 justify-between items-center'>
															<div className='flex gap-2 items-center'>
																<p className='font-medium'>
																	Exercise {exerciseIndex + 1}
																</p>
																{isInSuperset && (
																	<span className='px-2 py-0.5 text-xs rounded-full border border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-800 dark:bg-amber-900/40 dark:text-amber-100'>
																		Superset {superSetNumber}
																	</span>
																)}
															</div>
															<div className='flex gap-2'>
																<Button
																	type='button'
																	size='sm'
																	variant='outline'
																	disabled={!previousExercise}
																	onClick={() =>
																		updateExercises((exercises) => {
																			const nextExercises = [...exercises]
																			const currentIndex =
																				nextExercises.findIndex(
																					(entry) =>
																						entry.id === exerciseItem.id,
																				)
																			if (currentIndex < 1) return nextExercises
																			const prevGroup =
																				nextExercises[currentIndex - 1]
																					?.superSetGroup
																			const nextGroup =
																				prevGroup || crypto.randomUUID()
																			nextExercises[currentIndex - 1] = {
																				...nextExercises[currentIndex - 1]!,
																				superSetGroup: nextGroup,
																			}
																			nextExercises[currentIndex] = {
																				...nextExercises[currentIndex]!,
																				superSetGroup: nextGroup,
																			}
																			return nextExercises
																		})
																	}
																>
																	<ArrowsClockwiseIcon className='mr-2 size-4' />
																	Pair With Previous
																</Button>
																{isInSuperset && (
																	<Button
																		type='button'
																		size='sm'
																		variant='outline'
																		onClick={() =>
																			updateExercises((exercises) =>
																				exercises.map((entry) =>
																					entry.id === exerciseItem.id
																						? { ...entry, superSetGroup: null }
																						: entry,
																				),
																			)
																		}
																	>
																		Clear Pair
																	</Button>
																)}
																<Button
																	type='button'
																	size='icon'
																	variant='ghost'
																	onClick={() =>
																		updateExercises((exercises) =>
																			exercises.filter(
																				(entry) => entry.id !== exerciseItem.id,
																			),
																		)
																	}
																>
																	<TrashIcon className='size-4 text-destructive' />
																</Button>
															</div>
														</div>

														<div className='grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]'>
															<Input
																value={exerciseItem.label ?? ''}
																onChange={(event) =>
																	updateExercises((exercises) =>
																		exercises.map((entry) =>
																			entry.id === exerciseItem.id
																				? {
																						...entry,
																						label: event.target.value || null,
																					}
																				: entry,
																		),
																	)
																}
																placeholder='Exercise label'
															/>
															<VirtualizedCombobox
																options={movementOptions}
																selectedOption={exerciseItem.movementId ?? ''}
																onSelectOption={(movementId) =>
																	updateExercises((exercises) =>
																		exercises.map((entry) =>
																			entry.id === exerciseItem.id
																				? {
																						...entry,
																						movementId: movementId || null,
																					}
																				: entry,
																		),
																	)
																}
																searchPlaceholder='Select movement'
																width='100%'
																height='320px'
															/>
														</div>

														<div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
															<LabeledNumberInput
																label='Sets'
																value={exerciseItem.sets}
																onChange={(value) =>
																	updateExercises((exercises) =>
																		exercises.map((entry) =>
																			entry.id === exerciseItem.id
																				? { ...entry, sets: value }
																				: entry,
																		),
																	)
																}
															/>
															<LabeledNumberInput
																label='Reps'
																value={exerciseItem.reps}
																onChange={(value) =>
																	updateExercises((exercises) =>
																		exercises.map((entry) =>
																			entry.id === exerciseItem.id
																				? { ...entry, reps: value }
																				: entry,
																		),
																	)
																}
															/>
															<div className='space-y-2'>
																<Label>Rep Unit</Label>
																<Input
																	value={exerciseItem.repUnit ?? ''}
																	onChange={(event) =>
																		updateExercises((exercises) =>
																			exercises.map((entry) =>
																				entry.id === exerciseItem.id
																					? {
																							...entry,
																							repUnit:
																								event.target.value || null,
																						}
																					: entry,
																			),
																		)
																	}
																	placeholder='reps'
																/>
															</div>
															<LabeledNumberInput
																label='Target RPE'
																value={exerciseItem.targetRpe}
																onChange={(value) =>
																	updateExercises((exercises) =>
																		exercises.map((entry) =>
																			entry.id === exerciseItem.id
																				? { ...entry, targetRpe: value }
																				: entry,
																		),
																	)
																}
															/>
														</div>

														<div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
															<LabeledNumberInput
																label='1RM %'
																value={exerciseItem.ormPercent}
																onChange={(value) =>
																	updateExercises((exercises) =>
																		exercises.map((entry) =>
																			entry.id === exerciseItem.id
																				? { ...entry, ormPercent: value }
																				: entry,
																		),
																	)
																}
															/>
															<LabeledNumberInput
																label='Rest Time'
																value={exerciseItem.restTime}
																onChange={(value) =>
																	updateExercises((exercises) =>
																		exercises.map((entry) =>
																			entry.id === exerciseItem.id
																				? { ...entry, restTime: value }
																				: entry,
																		),
																	)
																}
															/>
															<div className='space-y-2'>
																<Label>Rest Unit</Label>
																<Input
																	value={exerciseItem.restUnit ?? ''}
																	onChange={(event) =>
																		updateExercises((exercises) =>
																			exercises.map((entry) =>
																				entry.id === exerciseItem.id
																					? {
																							...entry,
																							restUnit:
																								event.target.value || null,
																						}
																					: entry,
																			),
																		)
																	}
																	placeholder='sec'
																/>
															</div>
															<div className='grid gap-2 grid-cols-3'>
																<LabeledNumberInput
																	label='Down'
																	value={exerciseItem.tempoDown}
																	onChange={(value) =>
																		updateExercises((exercises) =>
																			exercises.map((entry) =>
																				entry.id === exerciseItem.id
																					? { ...entry, tempoDown: value }
																					: entry,
																			),
																		)
																	}
																/>
																<LabeledNumberInput
																	label='Pause'
																	value={exerciseItem.tempoPause}
																	onChange={(value) =>
																		updateExercises((exercises) =>
																			exercises.map((entry) =>
																				entry.id === exerciseItem.id
																					? { ...entry, tempoPause: value }
																					: entry,
																			),
																		)
																	}
																/>
																<LabeledNumberInput
																	label='Up'
																	value={exerciseItem.tempoUp}
																	onChange={(value) =>
																		updateExercises((exercises) =>
																			exercises.map((entry) =>
																				entry.id === exerciseItem.id
																					? { ...entry, tempoUp: value }
																					: entry,
																			),
																		)
																	}
																/>
															</div>
														</div>

														<Textarea
															value={exerciseItem.notes ?? ''}
															onChange={(event) =>
																updateExercises((exercises) =>
																	exercises.map((entry) =>
																		entry.id === exerciseItem.id
																			? {
																					...entry,
																					notes: event.target.value || null,
																				}
																			: entry,
																	),
																)
															}
															placeholder='Notes, cues, or progression detail'
															className='min-h-20'
														/>
													</CardContent>
												</Card>
											</SortableShell>
										)
									})}
								</div>
							</SortableContext>
						</DndContext>
					)}
				</div>
			</CardContent>
		</Card>
	)
}

function LabeledNumberInput({
	label,
	value,
	onChange,
}: {
	label: string
	value: NullableNumber
	onChange: (value: NullableNumber) => void
}) {
	return (
		<div className='space-y-2'>
			<Label>{label}</Label>
			<Input
				type='number'
				value={numberInputValue(value)}
				onChange={(event) => onChange(parseNullableNumber(event.target.value))}
			/>
		</div>
	)
}
