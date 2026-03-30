'use client'

import * as React from 'react'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@fit/components/ui/alert-dialog'
import { Badge } from '@fit/components/ui/badge'
import { Button } from '@fit/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fit/components/ui/card'
import { orpc } from '@/utils/orpc'

import {
	useMutation,
	useQueryClient,
	useSuspenseQuery,
} from '@tanstack/react-query'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'

import {
	ArrowLeftIcon,
	CalendarIcon,
	PauseCircleIcon,
	PencilSimpleIcon,
	PlayCircleIcon,
	TrashIcon,
} from '@phosphor-icons/react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface UserBlockDetails {
	id: string
	userId: string
	name: string
	description: string | null
	category: string | null
	tags: string[]
	restDayIndexes: number[]
	startDate: Date | null
	endDate: Date | null
	isActive: boolean
	isTemplate: boolean
	createdAt: Date
	updatedAt: Date
	workouts: Array<{
		id: string
		dayIndex: number
		workoutIndex: number
		name: string
		description: string | null
		category: string | null
		warmups: Array<{
			id: string
			name: string
			description: string | null
		}>
		exercises: Array<{
			id: string
			exerciseIndex: number
			label: string | null
			movementName: string | null
			superSetGroup: string | null
			sets: number | null
			reps: number | null
			repUnit: string | null
			targetRpe: number | null
			ormPercent: number | null
			restTime: number | null
			restUnit: string | null
			tempoDown: number | null
			tempoPause: number | null
			tempoUp: number | null
			notes: string | null
		}>
	}>
}

function countExercises(block: UserBlockDetails): number {
	return block.workouts.reduce(
		(total, workoutItem) => total + workoutItem.exercises.length,
		0,
	)
}

function countWarmups(block: UserBlockDetails): number {
	return block.workouts.reduce(
		(total, workoutItem) => total + workoutItem.warmups.length,
		0,
	)
}

function getPrescriptionLine(
	exercise: UserBlockDetails['workouts'][number]['exercises'][number],
): string {
	const parts: string[] = []

	if (exercise.sets !== null) {
		parts.push(`${exercise.sets} sets`)
	}

	if (exercise.reps !== null) {
		parts.push(`${exercise.reps} ${exercise.repUnit?.trim() || 'reps'}`)
	}

	if (exercise.ormPercent !== null) {
		parts.push(`${exercise.ormPercent}% 1RM`)
	}

	if (exercise.targetRpe !== null) {
		parts.push(`RPE ${exercise.targetRpe}`)
	}

	if (exercise.restTime !== null) {
		parts.push(
			`Rest ${exercise.restTime} ${exercise.restUnit?.trim() || 'sec'}`,
		)
	}

	const tempoParts = [
		exercise.tempoDown,
		exercise.tempoPause,
		exercise.tempoUp,
	].filter((value) => value !== null)

	if (tempoParts.length > 0) {
		parts.push(`Tempo ${tempoParts.join('-')}`)
	}

	return parts.join(' • ')
}

export function UserBlockDetailsPage() {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const { orgSlug, blockId } = useParams({
		from: '/$orgSlug/user-block/$blockId',
	})
	const search = useSearch({ from: '/$orgSlug' })
	const searchUserId = (search as { user?: string }).user
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false)

	const { data } = useSuspenseQuery(
		orpc.userBlock.get.queryOptions({
			input: { id: blockId },
		}),
	)

	const block = data as UserBlockDetails
	const selectedUserId = searchUserId ?? block.userId

	const updateBlock = useMutation(
		orpc.userBlock.update.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.userBlock.get.key(),
				})
				queryClient.invalidateQueries({
					queryKey: orpc.userBlock.getByUser.key(),
				})
				toast.success('Block updated successfully')
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to update block')
			},
		}),
	)

	const deleteBlock = useMutation(
		orpc.userBlock.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.userBlock.getByUser.key(),
				})
				toast.success('Block deleted successfully')
				navigate({
					to: '/$orgSlug/user-blocks',
					params: { orgSlug },
					search: selectedUserId ? { user: selectedUserId } : {},
				})
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to delete block')
			},
		}),
	)

	const maxDayIndex = Math.max(
		...block.workouts.map((workoutItem) => workoutItem.dayIndex),
		...block.restDayIndexes,
		-1,
	)

	const days = Array.from({ length: maxDayIndex + 1 }, (_, dayIndex) => {
		const workouts = block.workouts.filter(
			(workoutItem) => workoutItem.dayIndex === dayIndex,
		)

		return {
			dayIndex,
			isRestDay:
				block.restDayIndexes.includes(dayIndex) && workouts.length === 0,
			workouts,
		}
	})

	return (
		<>
			<div className='flex flex-col gap-6 p-8'>
				<div className='flex flex-wrap gap-3 justify-between items-center'>
					<Button
						variant='ghost'
						size='sm'
						onClick={() =>
							navigate({
								to: '/$orgSlug/user-blocks',
								params: { orgSlug },
								search: selectedUserId ? { user: selectedUserId } : {},
							})
						}
					>
						<ArrowLeftIcon className='mr-2 size-4' />
						Back to Blocks
					</Button>
					<div className='flex flex-wrap gap-2 items-center'>
						<Badge variant={block.isActive ? 'default' : 'secondary'}>
							{block.isActive ? 'Active' : 'Inactive'}
						</Badge>
						<Button
							variant='outline'
							size='sm'
							onClick={() =>
								navigate({
									to: '/$orgSlug/user-block-edit/$blockId',
									params: { orgSlug, blockId },
									search: selectedUserId ? { user: selectedUserId } : {},
								})
							}
						>
							<PencilSimpleIcon className='mr-2 size-4' />
							Edit
						</Button>
						<Button
							variant='outline'
							size='sm'
							onClick={() =>
								updateBlock.mutate({
									id: block.id,
									isActive: !block.isActive,
								})
							}
						>
							{block.isActive ? (
								<>
									<PauseCircleIcon className='mr-2 size-4' />
									Pause
								</>
							) : (
								<>
									<PlayCircleIcon className='mr-2 size-4' />
									Activate
								</>
							)}
						</Button>
						<Button
							variant='outline'
							size='sm'
							onClick={() => setIsDeleteConfirmOpen(true)}
						>
							<TrashIcon className='mr-2 size-4' />
							Delete
						</Button>
					</div>
				</div>

				<Card className='overflow-hidden border-border/70 shadow-sm'>
					<CardHeader className='space-y-3 border-b bg-muted/20'>
						<div className='flex flex-col gap-3 justify-between sm:flex-row sm:items-start'>
							<div className='min-w-0'>
								<CardTitle className='text-2xl leading-tight break-words'>
									{block.name}
								</CardTitle>
								<p className='text-xs text-muted-foreground'>
									Created {format(new Date(block.createdAt), 'MMM d, yyyy')} •
									Updated {format(new Date(block.updatedAt), 'MMM d, yyyy')}
								</p>
							</div>
							{(block.startDate || block.endDate) && (
								<div className='flex gap-1.5 items-center py-1 px-2 text-xs rounded-md border bg-background/80 text-muted-foreground'>
									<CalendarIcon className='size-3.5' />
									<span>
										{block.startDate &&
											format(new Date(block.startDate), 'MMM d, yyyy')}
										{block.startDate && block.endDate ? ' - ' : ''}
										{block.endDate &&
											format(new Date(block.endDate), 'MMM d, yyyy')}
									</span>
								</div>
							)}
						</div>
						<CardDescription className='text-sm leading-relaxed'>
							{block.description || 'No description'}
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-4 pt-4'>
						<div className='grid grid-cols-2 gap-3 text-sm md:grid-cols-5'>
							<BlockStat label='Days' value={Math.max(maxDayIndex + 1, 0)} />
							<BlockStat label='Workouts' value={block.workouts.length} />
							<BlockStat label='Warmups' value={countWarmups(block)} />
							<BlockStat label='Exercises' value={countExercises(block)} />
							<BlockStat
								label='Rest Days'
								value={block.restDayIndexes.length}
							/>
						</div>

						<div className='flex flex-wrap gap-2 items-center'>
							<Badge variant='outline'>
								{block.category || 'Uncategorized'}
							</Badge>
							{block.tags.length > 0 ? (
								block.tags.map((tag) => (
									<Badge key={tag} variant='secondary'>
										{tag}
									</Badge>
								))
							) : (
								<span className='text-sm text-muted-foreground'>No tags</span>
							)}
						</div>
					</CardContent>
				</Card>

				<div className='space-y-4'>
					<div className='flex flex-wrap gap-2 justify-between items-center'>
						<h2 className='text-lg font-semibold'>Schedule</h2>
						<div className='py-1 px-2 text-xs font-medium rounded-md border bg-muted/30 text-muted-foreground'>
							{block.workouts.length} workouts • {block.restDayIndexes.length}{' '}
							rest days
						</div>
					</div>

					{days.length === 0 ? (
						<Card>
							<CardContent className='py-12 text-center text-muted-foreground'>
								No days scheduled yet.
							</CardContent>
						</Card>
					) : (
						days.map((day) => (
							<Card
								key={day.dayIndex}
								className='overflow-hidden border-border/70 shadow-sm'
							>
								<CardHeader className='space-y-2 border-b bg-muted/20'>
									<div className='flex flex-wrap gap-2 justify-between items-center'>
										<CardTitle className='text-base'>
											Day {day.dayIndex + 1}
										</CardTitle>
										<Badge variant={day.isRestDay ? 'secondary' : 'outline'}>
											{day.isRestDay
												? 'Rest Day'
												: `${day.workouts.length} workout${day.workouts.length === 1 ? '' : 's'}`}
										</Badge>
									</div>
								</CardHeader>
								<CardContent className='space-y-4 pt-4'>
									{day.isRestDay ? (
										<p className='text-sm text-muted-foreground'>
											Recovery day with no workout assigned.
										</p>
									) : (
										day.workouts.map((workoutItem) => (
											<div
												key={workoutItem.id}
												className='space-y-4 p-4 rounded-lg border bg-background'
											>
												<div className='space-y-1'>
													<div className='flex flex-wrap gap-2 items-center'>
														<h3 className='font-medium'>{workoutItem.name}</h3>
														{workoutItem.category && (
															<Badge variant='outline'>
																{workoutItem.category}
															</Badge>
														)}
													</div>
													<p className='text-sm text-muted-foreground'>
														{workoutItem.description || 'No description'}
													</p>
												</div>

												{workoutItem.warmups.length > 0 && (
													<div className='space-y-2'>
														<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
															Warmups
														</p>
														<div className='flex flex-wrap gap-2'>
															{workoutItem.warmups.map((warmupItem) => (
																<Badge key={warmupItem.id} variant='secondary'>
																	{warmupItem.name}
																</Badge>
															))}
														</div>
													</div>
												)}

												<div className='space-y-3'>
													<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
														Exercises
													</p>
													<div className='space-y-3'>
														{workoutItem.exercises.map(
															(exerciseItem, index) => {
																const title =
																	exerciseItem.label ||
																	exerciseItem.movementName ||
																	`Exercise ${index + 1}`
																const detailLine =
																	getPrescriptionLine(exerciseItem)

																return (
																	<div
																		key={exerciseItem.id}
																		className='p-3 rounded-lg border bg-muted/20'
																	>
																		<div className='flex flex-wrap gap-2 justify-between items-start'>
																			<div>
																				<p className='font-medium'>{title}</p>
																				{exerciseItem.label &&
																					exerciseItem.movementName &&
																					exerciseItem.label !==
																						exerciseItem.movementName && (
																						<p className='text-xs text-muted-foreground'>
																							Movement:{' '}
																							{exerciseItem.movementName}
																						</p>
																					)}
																			</div>
																			<div className='flex flex-wrap gap-2'>
																				{exerciseItem.superSetGroup && (
																					<Badge variant='secondary'>
																						Superset
																					</Badge>
																				)}
																				<Badge variant='outline'>
																					#{index + 1}
																				</Badge>
																			</div>
																		</div>
																		{detailLine && (
																			<p className='mt-2 text-sm text-muted-foreground'>
																				{detailLine}
																			</p>
																		)}
																		{exerciseItem.notes && (
																			<p className='mt-2 text-sm'>
																				{exerciseItem.notes}
																			</p>
																		)}
																	</div>
																)
															},
														)}
													</div>
												</div>
											</div>
										))
									)}
								</CardContent>
							</Card>
						))
					)}
				</div>
			</div>

			<AlertDialog
				open={isDeleteConfirmOpen}
				onOpenChange={setIsDeleteConfirmOpen}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete block?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently remove the block and all copied workouts,
							warmups, and exercises.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteBlock.mutate({ id: block.id })}
							className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

function BlockStat({ label, value }: { label: string; value: number }) {
	return (
		<div className='p-3 rounded-lg border bg-muted/30'>
			<p className='text-[11px] uppercase tracking-wide text-muted-foreground'>
				{label}
			</p>
			<p className='text-base font-semibold'>{value}</p>
		</div>
	)
}
