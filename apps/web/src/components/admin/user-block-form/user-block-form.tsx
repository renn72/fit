'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { Button } from '@fit/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@fit/components/ui/card'
import { Input } from '@fit/components/ui/input'
import { Label } from '@fit/components/ui/label'
import { ScrollArea } from '@fit/components/ui/scroll-area'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@fit/components/ui/select'
import { Textarea } from '@fit/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger } from '@fit/components/ui/tabs'
import { TagsInput } from '@/components/ui-extended/tags-input'
import { VirtualizedCombobox } from '@/components/ui-extended/vitrualilzed-combobox'
import { orpc } from '@/utils/orpc'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'

import {
	DragOverlay,
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCorners,
	closestCenter,
	type DragEndEvent,
	type DragOverEvent,
	type DragStartEvent,
	pointerWithin,
	useDraggable,
	useDroppable,
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
	BarbellIcon,
	DotsSixVerticalIcon,
	FloppyDiskBackIcon,
	FolderOpenIcon,
	PlusIcon,
	SparkleIcon,
	StackPlusIcon,
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

interface WorkoutLibraryItem {
	id: string
	name: string
	description: string | null
	category: string | null
	warmupGroup?: WarmupGroupLibraryItem | null
	exercises?: Array<{
		index: number
		exercise: ExerciseLibraryItem
	}>
	superSets?: Array<{
		index: number
		superSet: ExerciseLibraryItem
	}>
}

interface WarmupGroupLibraryItem {
	id: string
	name: string
	description: string | null
	warmups?: Array<unknown>
}

interface ExerciseLibraryItem {
	id: string
	name: string
	isSuperSet: boolean
	movementId?: string | null
	movementName?: string | null
	superSetExercises?: Array<{
		exercise?: ExerciseLibraryItem | null
	}>
	sets?: NullableNumber
	reps?: NullableNumber
	repUnit?: string | null
	ormPercent?: NullableNumber
	targetRpe?: NullableNumber
	restTime?: NullableNumber
	restUnit?: string | null
	tempoDown?: NullableNumber
	tempoPause?: NullableNumber
	tempoUp?: NullableNumber
	notes?: string | null
}

type ExerciseDragData =
	| {
			kind: 'library'
			item: ExerciseLibraryItem
	  }
	| {
			kind: 'builder'
			item: BlockExerciseForm
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

function getNextDayIndex(
	workouts: BlockWorkoutForm[],
	restDayIndexes: number[],
): number {
	return Math.max(
		...workouts.map((workoutItem) => workoutItem.dayIndex),
		...restDayIndexes,
		-1,
	) + 1
}

function getScheduledDayIndexes(
	workouts: BlockWorkoutForm[],
	restDayIndexes: number[],
): number[] {
	return Array.from(
		new Set([
			...workouts.map((workoutItem) => workoutItem.dayIndex),
			...restDayIndexes,
		]),
	).sort((left, right) => left - right)
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

function buildWarmupsFromGroup(group: WarmupGroupLibraryItem): BlockWarmupForm[] {
	return (group.warmups ?? []).map((warmupItem: any) => ({
		id: crypto.randomUUID(),
		sourceWarmupId: warmupItem.id,
		name: warmupItem.name,
		description: warmupItem.description ?? null,
		images: warmupItem.images ?? null,
		link: warmupItem.link ?? null,
	})) as BlockWarmupForm[]
}

function buildExercisesFromLibrary(
	exerciseItem: ExerciseLibraryItem,
): BlockExerciseForm[] {
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
	workoutItem: WorkoutLibraryItem,
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
	data,
}: {
	id: string
	children: React.ReactNode
	className?: string
	data?: Record<string, unknown>
}) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id, data })

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
	const [selectedDayIndex, setSelectedDayIndex] = React.useState<number | null>(
		null,
	)
	const [selectedWorkoutImportId, setSelectedWorkoutImportId] =
		React.useState('')
	const [exerciseLibraryQuery, setExerciseLibraryQuery] = React.useState('')
	const [activeExerciseDragData, setActiveExerciseDragData] =
		React.useState<ExerciseDragData | null>(null)
	const lastExerciseOverIdRef = React.useRef<string | null>(null)
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
		setSelectedDayIndex(
			getScheduledDayIndexes(
				nextFormData.workouts,
				nextFormData.restDayIndexes,
			)[0] ?? null,
		)
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
	const workoutsList = (workoutsData ?? []) as WorkoutLibraryItem[]
	const exercisesList = (exercisesData ?? []) as ExerciseLibraryItem[]
	const warmupGroupsList = (warmupGroupsData ?? []) as WarmupGroupLibraryItem[]

	const scheduledDayIndexes = React.useMemo(
		() => getScheduledDayIndexes(formData.workouts, formData.restDayIndexes),
		[formData.restDayIndexes, formData.workouts],
	)

	const workoutsByDayIndex = React.useMemo(
		() =>
			new Map(
				formData.workouts.map((workoutItem) => [
					workoutItem.dayIndex,
					workoutItem,
				]),
			),
		[formData.workouts],
	)

	React.useEffect(() => {
		setSelectedDayIndex((currentDayIndex) => {
			if (scheduledDayIndexes.length === 0) return null
			if (
				currentDayIndex !== null &&
				scheduledDayIndexes.includes(currentDayIndex)
			) {
				return currentDayIndex
			}
			return scheduledDayIndexes[0] ?? null
		})
	}, [scheduledDayIndexes])

	const activeWorkout = React.useMemo(() => {
		if (selectedDayIndex === null) return null
		return workoutsByDayIndex.get(selectedDayIndex) ?? null
	}, [selectedDayIndex, workoutsByDayIndex])

	const isSelectedRestDay =
		selectedDayIndex !== null &&
		formData.restDayIndexes.includes(selectedDayIndex) &&
		!activeWorkout

	const activeExerciseDropzoneId = activeWorkout
		? `user-block-exercise-dropzone-${activeWorkout.id}`
		: 'user-block-exercise-dropzone-none'

	const hasUniqueWorkoutDays = React.useMemo(() => {
		const workoutDayIndexes = formData.workouts.map(
			(workoutItem) => workoutItem.dayIndex,
		)
		return new Set(workoutDayIndexes).size === workoutDayIndexes.length
	}, [formData.workouts])

	const hasWorkoutRestOverlap = React.useMemo(
		() =>
			formData.restDayIndexes.some((dayIndex) =>
				formData.workouts.some(
					(workoutItem) => workoutItem.dayIndex === dayIndex,
				),
			),
		[formData.restDayIndexes, formData.workouts],
	)

	const canSave = React.useMemo(
		() =>
			formData.name.trim().length > 0 &&
			hasUniqueWorkoutDays &&
			!hasWorkoutRestOverlap &&
			formData.workouts.every(
				(workoutItem) =>
					workoutItem.name.trim().length > 0 &&
					workoutItem.exercises.every(
						(exerciseItem) => !!exerciseItem.movementId,
					),
			),
		[formData, hasUniqueWorkoutDays, hasWorkoutRestOverlap],
	)

	const filteredExerciseLibraryItems = React.useMemo(() => {
		const searchTerm = exerciseLibraryQuery.trim().toLowerCase()
		return [...exercisesList]
			.filter((exerciseItem) => {
				if (!searchTerm) return true

				const nameMatch = exerciseItem.name.toLowerCase().includes(searchTerm)
				const movementMatch = (exerciseItem.movementName ?? '')
					.toLowerCase()
					.includes(searchTerm)
				const memberMatch = (exerciseItem.superSetExercises ?? []).some(
					(memberLink) =>
						(memberLink.exercise?.name ?? '')
							.toLowerCase()
							.includes(searchTerm),
				)

				return nameMatch || movementMatch || memberMatch
			})
			.sort((left, right) => left.name.localeCompare(right.name))
	}, [exerciseLibraryQuery, exercisesList])

	const selectedDaySummary = React.useMemo(() => {
		if (activeWorkout) {
			return `Day ${activeWorkout.dayIndex + 1}: ${activeWorkout.name}`
		}
		if (isSelectedRestDay && selectedDayIndex !== null) {
			return `Day ${selectedDayIndex + 1}: Rest Day`
		}
		return 'No day selected'
	}, [activeWorkout, isSelectedRestDay, selectedDayIndex])

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

	const updateWorkoutDayIndex = React.useCallback((workoutId: string, day: number) => {
		const nextDayIndex = Math.max(0, day)
		let hasConflict = false
		setFormData((prev) => {
			const currentWorkout = prev.workouts.find(
				(workoutItem) => workoutItem.id === workoutId,
			)
			if (!currentWorkout || currentWorkout.dayIndex === nextDayIndex) {
				return prev
			}

			if (
				prev.workouts.some(
					(workoutItem) =>
						workoutItem.id !== workoutId &&
						workoutItem.dayIndex === nextDayIndex,
				)
			) {
				hasConflict = true
				return prev
			}

			return {
				...prev,
				restDayIndexes: prev.restDayIndexes.filter(
					(dayIndex) => dayIndex !== nextDayIndex,
				),
				workouts: prev.workouts.map((workoutItem) =>
					workoutItem.id === workoutId
						? { ...workoutItem, dayIndex: nextDayIndex }
						: workoutItem,
				),
			}
		})
		if (hasConflict) {
			toast.error('That day already has a workout. Pick an open day.')
			return
		}
		setSelectedDayIndex(nextDayIndex)
	}, [])

	const addWorkout = React.useCallback(() => {
		let createdDayIndex: number | null = null
		setFormData((prev) => {
			const preferredDayIndex =
				selectedDayIndex !== null &&
				prev.restDayIndexes.includes(selectedDayIndex) &&
				!prev.workouts.some(
					(workoutItem) => workoutItem.dayIndex === selectedDayIndex,
				)
					? selectedDayIndex
					: null
			const nextDayIndex =
				preferredDayIndex ??
				getNextDayIndex(prev.workouts, prev.restDayIndexes)
			createdDayIndex = nextDayIndex

			return {
				...prev,
				restDayIndexes: prev.restDayIndexes.filter(
					(dayIndex) => dayIndex !== nextDayIndex,
				),
				workouts: [...prev.workouts, createEmptyWorkout(nextDayIndex)],
			}
		})
		if (createdDayIndex !== null) {
			setSelectedDayIndex(createdDayIndex)
		}
	}, [selectedDayIndex])

	const removeWorkout = React.useCallback((workoutId: string) => {
		setFormData((prev) => ({
			...prev,
			workouts: prev.workouts.filter(
				(workoutItem) => workoutItem.id !== workoutId,
			),
		}))
	}, [])

	const duplicateWorkout = React.useCallback((workoutId: string) => {
		let createdDayIndex: number | null = null
		setFormData((prev) => {
			const targetIndex = prev.workouts.findIndex(
				(workoutItem) => workoutItem.id === workoutId,
			)
			if (targetIndex < 0) return prev
			const nextWorkout = deepCloneWorkout(prev.workouts[targetIndex]!)
			nextWorkout.dayIndex = getNextDayIndex(
				prev.workouts,
				prev.restDayIndexes,
			)
			nextWorkout.name = `${nextWorkout.name} Copy`
			createdDayIndex = nextWorkout.dayIndex
			const workouts = [...prev.workouts]
			workouts.splice(targetIndex + 1, 0, nextWorkout)
			return { ...prev, workouts }
		})
		if (createdDayIndex !== null) {
			setSelectedDayIndex(createdDayIndex)
		}
	}, [])

	const toggleRestDay = React.useCallback((dayIndex: number) => {
		let addedRestDay = false
		setFormData((prev) => {
			if (
				prev.workouts.some((workoutItem) => workoutItem.dayIndex === dayIndex)
			) {
				return prev
			}

			const exists = prev.restDayIndexes.includes(dayIndex)
			addedRestDay = !exists
			return {
				...prev,
				restDayIndexes: normalizeRestDayIndexes(
					exists
						? prev.restDayIndexes.filter((restDay) => restDay !== dayIndex)
						: [...prev.restDayIndexes, dayIndex],
				),
			}
		})
		if (addedRestDay) {
			setSelectedDayIndex(dayIndex)
		}
	}, [])

	const updateRestDayIndex = React.useCallback(
		(currentDayIndex: number, day: number) => {
			const nextDayIndex = Math.max(0, day)
			let hasConflict = false

			setFormData((prev) => {
				if (currentDayIndex === nextDayIndex) return prev
				if (
					prev.restDayIndexes.includes(nextDayIndex) ||
					prev.workouts.some(
						(workoutItem) => workoutItem.dayIndex === nextDayIndex,
					)
				) {
					hasConflict = true
					return prev
				}

				return {
					...prev,
					restDayIndexes: normalizeRestDayIndexes(
						prev.restDayIndexes.map((dayIndex) =>
							dayIndex === currentDayIndex ? nextDayIndex : dayIndex,
						),
					),
				}
			})

			if (hasConflict) {
				toast.error('That day is already scheduled. Pick an open day.')
				return
			}

			setSelectedDayIndex(nextDayIndex)
		},
		[],
	)

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

	const addLibraryExerciseToWorkout = React.useCallback(
		(
			workoutId: string,
			exerciseItem: ExerciseLibraryItem,
			insertIndex?: number,
		) => {
			setWorkout(workoutId, (workoutItem) => {
				const nextExercises = [...workoutItem.exercises]
				const exercisesToInsert = buildExercisesFromLibrary(exerciseItem)
				const safeInsertIndex =
					insertIndex === undefined ||
					insertIndex < 0 ||
					insertIndex > nextExercises.length
						? nextExercises.length
						: insertIndex

				nextExercises.splice(safeInsertIndex, 0, ...exercisesToInsert)

				return {
					...workoutItem,
					exercises: nextExercises,
				}
			})
		},
		[setWorkout],
	)

	const importWarmupGroup = React.useCallback(
		(workoutId: string, group: WarmupGroupLibraryItem) => {
			setWorkout(workoutId, (workoutItem) => ({
				...workoutItem,
				sourceWarmupGroupId: group.id,
				warmups: [...workoutItem.warmups, ...buildWarmupsFromGroup(group)],
			}))
		},
		[setWorkout],
	)

	const addLibraryExerciseToActiveWorkout = React.useCallback(
		(exerciseItem: ExerciseLibraryItem) => {
			if (!activeWorkout) {
				toast.error('Select or create a workout day before adding exercises.')
				return
			}

			addLibraryExerciseToWorkout(activeWorkout.id, exerciseItem)
		},
		[activeWorkout, addLibraryExerciseToWorkout],
	)

	const importWorkout = React.useCallback(
		(workoutItem: WorkoutLibraryItem) => {
			let nextDayIndex: number | null = null

			setFormData((prev) => {
				const preferredDayIndex =
					selectedDayIndex !== null &&
					prev.restDayIndexes.includes(selectedDayIndex) &&
					!prev.workouts.some(
						(workoutEntry) => workoutEntry.dayIndex === selectedDayIndex,
					)
						? selectedDayIndex
						: null
				nextDayIndex =
					preferredDayIndex ??
					getNextDayIndex(prev.workouts, prev.restDayIndexes)

				return {
					...prev,
					restDayIndexes: prev.restDayIndexes.filter(
						(dayIndex) => dayIndex !== nextDayIndex,
					),
					workouts: [
						...prev.workouts,
						buildWorkoutFromLibrary(workoutItem, nextDayIndex),
					],
				}
			})

			if (nextDayIndex !== null) {
				setSelectedDayIndex(nextDayIndex)
			}
			setSelectedWorkoutImportId('')
		},
		[selectedDayIndex],
	)

	const onExerciseDragStart = React.useCallback((event: DragStartEvent) => {
		const dragData = event.active.data.current as ExerciseDragData | undefined
		setActiveExerciseDragData(dragData ?? null)
		lastExerciseOverIdRef.current = null
	}, [])

	const onExerciseDragOver = React.useCallback((event: DragOverEvent) => {
		lastExerciseOverIdRef.current = event.over ? String(event.over.id) : null
	}, [])

	const onExerciseDragEnd = React.useCallback(
		(event: DragEndEvent) => {
			const dragData = event.active.data.current as ExerciseDragData | undefined
			setActiveExerciseDragData(null)

			const overId = event.over
				? String(event.over.id)
				: (lastExerciseOverIdRef.current ?? null)
			lastExerciseOverIdRef.current = null

			if (!dragData || !overId || !activeWorkout) return

			if (dragData.kind === 'library') {
				const insertIndex =
					overId === activeExerciseDropzoneId
						? activeWorkout.exercises.length
						: activeWorkout.exercises.findIndex(
								(exerciseItem) => exerciseItem.id === overId,
							)
				addLibraryExerciseToWorkout(
					activeWorkout.id,
					dragData.item,
					insertIndex === -1 ? activeWorkout.exercises.length : insertIndex,
				)
				return
			}

			setWorkout(activeWorkout.id, (workoutItem) => {
				if (overId === activeExerciseDropzoneId) {
					const fromIndex = workoutItem.exercises.findIndex(
						(exerciseItem) => exerciseItem.id === dragData.item.id,
					)
					if (
						fromIndex === -1 ||
						fromIndex === workoutItem.exercises.length - 1
					) {
						return workoutItem
					}

					return {
						...workoutItem,
						exercises: arrayMove(
							workoutItem.exercises,
							fromIndex,
							workoutItem.exercises.length - 1,
						),
					}
				}

				return {
					...workoutItem,
					exercises: reorderIds(
						workoutItem.exercises,
						dragData.item.id,
						overId,
					),
				}
			})
		},
		[
			activeExerciseDropzoneId,
			activeWorkout,
			addLibraryExerciseToWorkout,
			setWorkout,
		],
	)

	const handleTemplateSelect = React.useCallback((template: any) => {
		setSelectedTemplate(template)
		const nextFormData = mapExistingBlockToForm(template)
		nextFormData.startDate = getTodayDateString()
		nextFormData.endDate = null
		setFormData(nextFormData)
		setSelectedDayIndex(
			getScheduledDayIndexes(
				nextFormData.workouts,
				nextFormData.restDayIndexes,
			)[0] ?? null,
		)
	}, [])

	const handleStartBlank = React.useCallback(() => {
		setSelectedTemplate({ id: null, isBlank: true })
		const nextFormData = createEmptyBlockForm()
		setFormData(nextFormData)
		setSelectedDayIndex(null)
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
			workouts: [...formData.workouts]
				.sort((left, right) => left.dayIndex - right.dayIndex)
				.map((workoutItem, workoutIndex) => ({
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

	const renderExerciseDragOverlay = () => {
		if (!activeExerciseDragData) return null
		return activeExerciseDragData.kind === 'library' ? (
			<ExerciseLibraryDragPreview item={activeExerciseDragData.item} />
		) : (
			<BlockExerciseDragPreview item={activeExerciseDragData.item} />
		)
	}

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={(args) => {
				const pointerCollisions = pointerWithin(args)
				if (pointerCollisions.length > 0) return pointerCollisions
				return closestCorners(args)
			}}
			onDragStart={onExerciseDragStart}
			onDragOver={onExerciseDragOver}
			onDragEnd={onExerciseDragEnd}
		>
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
								Navigate day by day, import full workouts and warmups from
								selects, then drag exercises into the active workout.
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
						</CardContent>
					</Card>

					<Card>
						<CardHeader className='space-y-4'>
							<div>
								<CardTitle>Day Planner</CardTitle>
								<p className='text-sm text-muted-foreground'>
									Move between scheduled days with tabs. Workout and rest days
									each get their own editor.
								</p>
							</div>

							<div className='flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between'>
								<div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
									<div className='space-y-2 min-w-0 sm:min-w-[280px]'>
										<Label>Import Workout</Label>
										<Select
											value={selectedWorkoutImportId}
											onValueChange={(value) =>
												setSelectedWorkoutImportId(value ?? '')
											}
										>
											<SelectTrigger className='w-full'>
												<SelectValue placeholder='Select a workout to import' />
											</SelectTrigger>
											<SelectContent>
												{workoutsList.map((workoutItem) => (
													<SelectItem
														key={workoutItem.id}
														value={workoutItem.id}
													>
														{workoutItem.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<Button
										type='button'
										variant='outline'
										onClick={() => {
											const workoutItem = workoutsList.find(
												(entry) => entry.id === selectedWorkoutImportId,
											)
											if (!workoutItem) return
											importWorkout(workoutItem)
										}}
										disabled={!selectedWorkoutImportId}
									>
										<FolderOpenIcon className='mr-2 size-4' />
										Import Workout
									</Button>
								</div>

								<div className='flex flex-wrap gap-2'>
									<Button
										type='button'
										variant='outline'
										onClick={addWorkout}
									>
										<PlusIcon className='mr-2 size-4' />
										Add Workout
									</Button>
									<Button
										type='button'
										variant='outline'
										onClick={() =>
											toggleRestDay(
												getNextDayIndex(
													formData.workouts,
													formData.restDayIndexes,
												),
											)
										}
									>
										<PlusIcon className='mr-2 size-4' />
										Add Rest Day
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className='space-y-4'>
							{scheduledDayIndexes.length === 0 ? (
								<div className='py-12 text-sm text-center rounded-lg border border-dashed text-muted-foreground'>
									No scheduled days yet. Add a blank workout, import a workout,
									or create a rest day to start the block.
								</div>
							) : (
								<>
									<Tabs
										value={selectedDayIndex === null ? '' : String(selectedDayIndex)}
										onValueChange={(value) => {
											if (!value) return
											setSelectedDayIndex(Number(value))
										}}
									>
										<div className='overflow-x-auto pb-2'>
											<TabsList className='justify-start p-1 w-max min-w-full h-auto rounded-xl bg-muted/40'>
												{scheduledDayIndexes.map((dayIndex) => {
													const workoutItem = workoutsByDayIndex.get(dayIndex)
													const isRestDay =
														formData.restDayIndexes.includes(dayIndex) &&
														!workoutItem

													return (
														<TabsTrigger
															key={dayIndex}
															value={String(dayIndex)}
															className='flex flex-col gap-1 items-start py-2 px-3 min-w-32 h-auto text-left'
														>
															<span className='text-[11px] uppercase tracking-wide text-muted-foreground'>
																Day {dayIndex + 1}
															</span>
															<span className='text-sm font-medium truncate max-w-full'>
																{workoutItem?.name ??
																	(isRestDay ? 'Rest Day' : 'Open')}
															</span>
														</TabsTrigger>
													)
												})}
											</TabsList>
										</div>
									</Tabs>

									{activeWorkout ? (
										<WorkoutEditorCard
											key={activeWorkout.id}
											workout={activeWorkout}
											movementOptions={movementOptions}
											warmupGroups={warmupGroupsList}
											exerciseDropzoneId={activeExerciseDropzoneId}
											onChange={(nextWorkout) =>
												setWorkout(activeWorkout.id, () => nextWorkout)
											}
											onChangeDay={(dayIndex) =>
												updateWorkoutDayIndex(activeWorkout.id, dayIndex)
											}
											onDuplicate={() => duplicateWorkout(activeWorkout.id)}
											onRemove={() => removeWorkout(activeWorkout.id)}
											onImportWarmupGroup={(group) =>
												importWarmupGroup(activeWorkout.id, group)
											}
											onAddWarmup={() => addWarmup(activeWorkout.id)}
											onAddExercise={() => addExercise(activeWorkout.id)}
											sensors={sensors}
										/>
									) : isSelectedRestDay && selectedDayIndex !== null ? (
										<RestDayEditorCard
											dayIndex={selectedDayIndex}
											onChangeDay={(dayIndex) =>
												updateRestDayIndex(selectedDayIndex, dayIndex)
											}
											onConvertToWorkout={addWorkout}
											onRemove={() => toggleRestDay(selectedDayIndex)}
										/>
									) : (
										<div className='py-10 text-sm text-center rounded-lg border border-dashed text-muted-foreground'>
											Select a day tab to continue.
										</div>
									)}
								</>
							)}
						</CardContent>
					</Card>
				</div>

				<Card className='overflow-hidden xl:sticky xl:top-4 h-fit'>
					<CardHeader className='space-y-3'>
						<div>
							<CardTitle>Exercise Library</CardTitle>
							<p className='text-sm text-muted-foreground'>
								Drag exercises or supersets into the active workout. Workout and
								warmup imports now live in the planner selects.
							</p>
						</div>
						<div className='space-y-1 text-sm text-muted-foreground'>
							<p>
								Selected day:{' '}
								<span className='font-medium text-foreground'>
									{selectedDaySummary}
								</span>
							</p>
							<p>
								{activeWorkout
									? `Drop into ${activeWorkout.name} or use the add button.`
									: 'Select or create a workout day before dragging exercises.'}
							</p>
						</div>
						<Input
							value={exerciseLibraryQuery}
							onChange={(event) => setExerciseLibraryQuery(event.target.value)}
							placeholder='Search exercises or supersets...'
						/>
					</CardHeader>
					<CardContent className='pt-0'>
						<ScrollArea className='h-[560px] pr-4'>
							<div className='space-y-2 pb-4'>
								{filteredExerciseLibraryItems.length === 0 ? (
									<p className='py-8 text-sm text-center text-muted-foreground'>
										No exercises or supersets match your search.
									</p>
								) : (
									filteredExerciseLibraryItems.map((exerciseItem) => (
										<ExerciseLibraryDraggableItem
											key={exerciseItem.id}
											item={exerciseItem}
											disabled={!activeWorkout}
											onAdd={() =>
												addLibraryExerciseToActiveWorkout(exerciseItem)
											}
										/>
									))
								)}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>
			</div>

			<DragOverlay>{renderExerciseDragOverlay()}</DragOverlay>
		</DndContext>
	)
}

function WorkoutEditorCard({
	workout,
	movementOptions,
	warmupGroups,
	exerciseDropzoneId,
	onChange,
	onChangeDay,
	onDuplicate,
	onRemove,
	onImportWarmupGroup,
	onAddWarmup,
	onAddExercise,
	sensors,
}: {
	workout: BlockWorkoutForm
	movementOptions: Array<{ value: string; label: string }>
	warmupGroups: WarmupGroupLibraryItem[]
	exerciseDropzoneId: string
	onChange: (workout: BlockWorkoutForm) => void
	onChangeDay: (dayIndex: number) => void
	onDuplicate: () => void
	onRemove: () => void
	onImportWarmupGroup: (group: WarmupGroupLibraryItem) => void
	onAddWarmup: () => void
	onAddExercise: () => void
	sensors: ReturnType<typeof useSensors>
}) {
	const warmupIds = workout.warmups.map((warmupItem) => warmupItem.id)
	const exerciseIds = workout.exercises.map((exerciseItem) => exerciseItem.id)
	const [selectedWarmupGroupId, setSelectedWarmupGroupId] = React.useState('')
	const superSetGroups = Array.from(
		new Set(
			workout.exercises
				.map((exerciseItem) => exerciseItem.superSetGroup)
				.filter(Boolean),
		),
	)
	const { setNodeRef: setExerciseDropzoneRef, isOver: isExerciseDropOver } =
		useDroppable({
			id: exerciseDropzoneId,
		})

	React.useEffect(() => {
		setSelectedWarmupGroupId('')
	}, [workout.id])

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
		<Card className='border-border/70'>
			<CardHeader className='space-y-4'>
				<div className='flex flex-wrap gap-3 justify-between items-start'>
					<div className='space-y-1'>
						<CardTitle className='text-lg'>Day {workout.dayIndex + 1}</CardTitle>
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
								onChangeDay(Math.max(0, Number(event.target.value || 1) - 1))
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
					<div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
						<div>
							<h3 className='font-medium'>Warmups</h3>
							<p className='text-sm text-muted-foreground'>
								Import a warmup group with the select or edit warmups in place.
							</p>
						</div>
						<div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
							<div className='space-y-2 min-w-0 sm:min-w-[260px]'>
								<Label>Import Warmup Group</Label>
								<Select
									value={selectedWarmupGroupId}
									onValueChange={(value) =>
										setSelectedWarmupGroupId(value ?? '')
									}
								>
									<SelectTrigger className='w-full'>
										<SelectValue placeholder='Select a warmup group' />
									</SelectTrigger>
									<SelectContent>
										{warmupGroups.map((group) => (
											<SelectItem key={group.id} value={group.id}>
												{group.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<Button
								type='button'
								variant='outline'
								onClick={() => {
									const group = warmupGroups.find(
										(entry) => entry.id === selectedWarmupGroupId,
									)
									if (!group) return
									onImportWarmupGroup(group)
									setSelectedWarmupGroupId('')
								}}
								disabled={!selectedWarmupGroupId}
							>
								<FolderOpenIcon className='mr-2 size-4' />
								Import Warmup Group
							</Button>
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
					</div>

					{workout.warmups.length === 0 ? (
						<div className='py-4 text-sm text-center rounded-lg border border-dashed text-muted-foreground'>
							No warmups yet. Import a warmup group or add one manually.
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
								Each exercise must point at a movement. Drag in from the
								exercise library or use "Pair with previous" to build supersets.
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

					<div
						ref={setExerciseDropzoneRef}
						className={cn(
							'rounded-xl border p-3 transition-colors',
							isExerciseDropOver && 'border-primary bg-primary/5',
						)}
					>
						<SortableContext
							items={exerciseIds}
							strategy={verticalListSortingStrategy}
						>
							{workout.exercises.length === 0 ? (
								<div className='py-8 text-sm text-center text-muted-foreground'>
									Drop exercises here from the library or add one manually.
								</div>
							) : (
								<div className='space-y-3'>
									{workout.exercises.map((exerciseItem, exerciseIndex) => {
										const previousExercise =
											workout.exercises[exerciseIndex - 1] ?? null
										const isInSuperset = Boolean(exerciseItem.superSetGroup)
										const superSetNumber = exerciseItem.superSetGroup
											? superSetGroups.indexOf(exerciseItem.superSetGroup) + 1
											: null

										return (
											<SortableShell
												key={exerciseItem.id}
												id={exerciseItem.id}
												data={{
													kind: 'builder',
													item: exerciseItem,
												} satisfies ExerciseDragData}
											>
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
							)}
						</SortableContext>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

function RestDayEditorCard({
	dayIndex,
	onChangeDay,
	onConvertToWorkout,
	onRemove,
}: {
	dayIndex: number
	onChangeDay: (dayIndex: number) => void
	onConvertToWorkout: () => void
	onRemove: () => void
}) {
	return (
		<Card className='border-border/70 border-dashed'>
			<CardHeader className='space-y-3'>
				<div className='flex flex-wrap gap-3 justify-between items-start'>
					<div className='space-y-1'>
						<CardTitle className='text-lg'>Rest Day</CardTitle>
						<p className='text-sm text-muted-foreground'>
							Keep this day open, move it to another slot, or turn it into a
							workout.
						</p>
					</div>
					<div className='flex gap-2'>
						<Button type='button' variant='outline' size='sm' onClick={onConvertToWorkout}>
							<PlusIcon className='mr-2 size-4' />
							Convert To Workout
						</Button>
						<Button type='button' variant='outline' size='sm' onClick={onRemove}>
							<TrashIcon className='mr-2 size-4' />
							Remove Rest Day
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className='space-y-4'>
				<div className='grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]'>
					<div className='space-y-2'>
						<Label>Day</Label>
						<Input
							type='number'
							min='1'
							value={dayIndex + 1}
							onChange={(event) =>
								onChangeDay(Math.max(0, Number(event.target.value || 1) - 1))
							}
						/>
					</div>
					<div className='flex items-center px-4 py-3 text-sm rounded-lg border border-dashed text-muted-foreground bg-muted/20'>
						This day has no workout scheduled. Import a workout from the planner
						select or convert it into a blank workout.
					</div>
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

function ExerciseLibraryDraggableItem({
	item,
	disabled,
	onAdd,
}: {
	item: ExerciseLibraryItem
	disabled: boolean
	onAdd: () => void
}) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id: `user-block-library-exercise-${item.id}`,
			disabled,
			data: {
				kind: 'library',
				item,
			} satisfies ExerciseDragData,
		})

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform) }}
			className={cn(
				'flex gap-3 items-start p-3 rounded-lg border bg-background transition-opacity',
				isDragging && 'opacity-60',
				disabled && 'opacity-60',
			)}
		>
			<button
				type='button'
				className='mt-0.5 cursor-grab text-muted-foreground hover:text-foreground disabled:cursor-not-allowed'
				disabled={disabled}
				{...attributes}
				{...listeners}
			>
				<DotsSixVerticalIcon className='size-4' />
			</button>

			<div className='pt-0.5'>
				{item.isSuperSet ? (
					<StackPlusIcon className='text-amber-600 size-4' />
				) : (
					<BarbellIcon className='text-orange-600 size-4' />
				)}
			</div>

			<div className='min-w-0 flex-1 space-y-1'>
				<div className='flex flex-wrap gap-2 items-center'>
					<p className='text-sm font-medium truncate'>{item.name}</p>
					{item.isSuperSet ? (
						<span className='px-1.5 py-0.5 text-[10px] rounded-full border bg-muted text-muted-foreground'>
							Superset
						</span>
					) : null}
				</div>
				<p className='text-xs text-muted-foreground'>
					{formatExerciseLibrarySummary(item)}
				</p>
			</div>

			<Button
				type='button'
				variant='ghost'
				size='icon'
				className='w-8 h-8'
				disabled={disabled}
				onClick={onAdd}
			>
				<PlusIcon className='size-4' />
			</Button>
		</div>
	)
}

function ExerciseLibraryDragPreview({ item }: { item: ExerciseLibraryItem }) {
	return (
		<div className='p-3 rounded-lg border shadow-lg w-[320px] bg-background'>
			<div className='flex gap-3 items-start'>
				<div className='pt-0.5'>
					{item.isSuperSet ? (
						<StackPlusIcon className='text-amber-600 size-4' />
					) : (
						<BarbellIcon className='text-orange-600 size-4' />
					)}
				</div>
				<div className='min-w-0 flex-1'>
					<p className='font-medium truncate'>{item.name}</p>
					<p className='text-xs text-muted-foreground'>
						{formatExerciseLibrarySummary(item)}
					</p>
				</div>
			</div>
		</div>
	)
}

function BlockExerciseDragPreview({ item }: { item: BlockExerciseForm }) {
	return (
		<div className='p-3 rounded-lg border shadow-lg w-[320px] bg-background'>
			<div className='flex gap-3 items-start'>
				<BarbellIcon className='text-orange-600 mt-0.5 size-4' />
				<div className='min-w-0 flex-1'>
					<p className='font-medium truncate'>
						{item.label?.trim() || 'Exercise'}
					</p>
					<p className='text-xs text-muted-foreground'>
						{formatBlockExerciseSummary(item)}
					</p>
				</div>
			</div>
		</div>
	)
}

function formatExerciseLibrarySummary(item: ExerciseLibraryItem): string {
	if (item.isSuperSet) {
		return `${item.superSetExercises?.length ?? 0} exercise superset`
	}

	const details: string[] = []
	if (item.movementName) details.push(item.movementName)
	if (
		(item.sets !== null && item.sets !== undefined) ||
		(item.reps !== null && item.reps !== undefined)
	) {
		const sets =
			item.sets === null || item.sets === undefined ? '?' : String(item.sets)
		const reps =
			item.reps === null || item.reps === undefined ? '?' : String(item.reps)
		details.push(`${sets} x ${reps}${item.repUnit ? ` ${item.repUnit}` : ''}`)
	}
	if (item.targetRpe !== null && item.targetRpe !== undefined) {
		details.push(`RPE ${item.targetRpe}`)
	}
	if (item.restTime !== null && item.restTime !== undefined) {
		details.push(`Rest ${item.restTime}${item.restUnit ? ` ${item.restUnit}` : ''}`)
	}

	return details.join(' • ') || 'No movement details'
}

function formatBlockExerciseSummary(item: BlockExerciseForm): string {
	const details: string[] = []
	if (item.sets !== null || item.reps !== null) {
		const sets = item.sets === null ? '?' : String(item.sets)
		const reps = item.reps === null ? '?' : String(item.reps)
		details.push(`${sets} x ${reps}${item.repUnit ? ` ${item.repUnit}` : ''}`)
	}
	if (item.targetRpe !== null) details.push(`RPE ${item.targetRpe}`)
	if (item.restTime !== null) {
		details.push(`Rest ${item.restTime}${item.restUnit ? ` ${item.restUnit}` : ''}`)
	}
	if (item.superSetGroup) details.push('Superset')
	return details.join(' • ') || 'No programmed details'
}
