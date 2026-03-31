'use client'

import { Badge } from '@fit/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fit/components/ui/card'
import { orpc } from '@/utils/orpc'

import { useQuery } from '@tanstack/react-query'
import { useSearch } from '@tanstack/react-router'

import { BarbellIcon, CookingPotIcon } from '@phosphor-icons/react'
import { format } from 'date-fns'

function formatRoundedValue(value: number | null | undefined) {
	if (value === null || value === undefined) {
		return '-'
	}

	return Math.round(value)
}

function formatExercisePrescription(exercise: {
	targetSets: number | null
	reps: number | null
	repUnit: string | null
}) {
	const parts: string[] = []

	if (exercise.targetSets !== null) {
		parts.push(`${exercise.targetSets} sets`)
	}

	if (exercise.reps !== null) {
		parts.push(`${exercise.reps} ${exercise.repUnit || 'reps'}`)
	}

	return parts.join(' x ') || 'Custom prescription'
}

interface UserLogsPageProps {
	orgSlug: string
}

export function UserLogsPage({ orgSlug: _orgSlug }: UserLogsPageProps) {
	const { user } = useSearch({ from: '/$orgSlug' })
	const selectedUser = user || null

	const { data: usersData } = useQuery(orpc.user.getAllByOrg.queryOptions())
	const users = usersData ?? []

	const { data: dailyLogs, isLoading } = useQuery(
		orpc.dailyLog.getByUser.queryOptions({
			input: { userId: selectedUser || '' },
			enabled: !!selectedUser,
		}),
	)

	if (!selectedUser) {
		return (
			<div className='flex flex-col gap-6 p-8'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>User Logs</h1>
					<p className='text-sm text-muted-foreground'>
						Select a user from the sidebar to view their daily logs.
					</p>
				</div>
				<Card>
					<CardContent className='py-12 text-center text-muted-foreground'>
						No user selected.
					</CardContent>
				</Card>
			</div>
		)
	}

	const selectedUserData = users.find((entry) => entry.id === selectedUser)
	const logs = dailyLogs ?? []

	return (
		<div className='flex flex-col gap-6 p-8'>
			<div>
				<h1 className='text-2xl font-semibold tracking-tight'>
					{selectedUserData?.name || 'User'}&apos;s Daily Logs
				</h1>
				<p className='text-sm text-muted-foreground'>
					{logs.length} log{logs.length === 1 ? '' : 's'} available
				</p>
			</div>

			{isLoading ? (
				<Card>
					<CardContent className='py-12 text-center text-muted-foreground'>
						Loading daily logs...
					</CardContent>
				</Card>
			) : logs.length === 0 ? (
				<Card>
					<CardContent className='py-12 text-center text-muted-foreground'>
						No daily logs found for this user yet.
					</CardContent>
				</Card>
			) : (
				<div className='space-y-6'>
					{logs.map((log) => (
						<Card
							key={log.id}
							className='overflow-hidden border-border/70 shadow-sm'
						>
							<CardHeader className='space-y-3 border-b bg-muted/20'>
								<div className='flex flex-wrap gap-3 justify-between items-start'>
									<div>
										<CardTitle className='text-lg'>
											{format(new Date(log.createdAt), 'EEEE, MMM d, yyyy')}
										</CardTitle>
										<CardDescription>
											{log.meals.length} meal{log.meals.length === 1 ? '' : 's'}
											{' '}logged and {log.workouts.length} workout
											{log.workouts.length === 1 ? '' : 's'}
										</CardDescription>
									</div>
									<Badge variant='outline'>
										Updated {format(new Date(log.updatedAt), 'h:mm a')}
									</Badge>
								</div>
							</CardHeader>

							<CardContent className='space-y-6 py-6'>
								<div className='space-y-3'>
									<div className='flex gap-2 items-center text-sm font-medium'>
										<CookingPotIcon className='size-4' />
										<span>Meals</span>
									</div>
									{log.meals.length === 0 ? (
										<p className='text-sm text-muted-foreground'>
											No meals logged for this day.
										</p>
									) : (
										<div className='grid grid-cols-1 gap-3 md:grid-cols-2'>
											{log.meals.map((meal) => (
												<div
													key={meal.id}
													className='p-4 rounded-lg border bg-card'
												>
													<div className='flex gap-3 justify-between items-start'>
														<div>
															<p className='font-medium leading-none'>
																{meal.name}
															</p>
															<p className='mt-2 text-xs text-muted-foreground'>
																Meal {meal.mealIndex + 1}
															</p>
														</div>
														<Badge variant='secondary'>
															{formatRoundedValue(meal.calories)} cal
														</Badge>
													</div>

													<div className='grid grid-cols-3 gap-3 mt-4 text-xs text-muted-foreground'>
														<div>
															<p className='font-medium text-foreground'>
																{formatRoundedValue(meal.protein)}g
															</p>
															<p>Protein</p>
														</div>
														<div>
															<p className='font-medium text-foreground'>
																{formatRoundedValue(meal.carbohydrate)}g
															</p>
															<p>Carbs</p>
														</div>
														<div>
															<p className='font-medium text-foreground'>
																{formatRoundedValue(meal.fat)}g
															</p>
															<p>Fat</p>
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</div>

								<div className='space-y-3'>
									<div className='flex gap-2 items-center text-sm font-medium'>
										<BarbellIcon className='size-4' />
										<span>Training</span>
									</div>
									{log.workouts.length === 0 ? (
										<p className='text-sm text-muted-foreground'>
											No workouts logged for this day.
										</p>
									) : (
										<div className='space-y-4'>
											{log.workouts.map((workout) => (
												<div
													key={workout.id}
													className='p-4 space-y-4 rounded-lg border bg-card'
												>
													<div className='flex flex-wrap gap-3 justify-between items-start'>
														<div>
															<p className='font-medium leading-none'>
																{workout.name}
															</p>
															<p className='mt-2 text-xs text-muted-foreground'>
																Workout {workout.workoutIndex + 1}
															</p>
														</div>
														<Badge variant='outline'>
															Energy {workout.energyLevel.toUpperCase()}
														</Badge>
													</div>

													{workout.warmups.length > 0 ? (
														<div className='space-y-2'>
															<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
																Warmups
															</p>
															<div className='flex flex-wrap gap-2'>
																{workout.warmups.map((warmup) => (
																	<Badge key={warmup.id} variant='secondary'>
																		{warmup.warmupIndex + 1}. {warmup.name}
																	</Badge>
																))}
															</div>
														</div>
													) : null}

													<div className='space-y-3'>
														<p className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
															Exercises
														</p>
														<div className='space-y-3'>
															{workout.exercises.map((exercise) => (
																<div
																	key={exercise.id}
																	className='p-4 rounded-md border bg-muted/20'
																>
																	<div className='flex flex-wrap gap-3 justify-between items-start'>
																		<div>
																			<p className='font-medium leading-none'>
																				{exercise.movement?.name ||
																					exercise.label ||
																					`Exercise ${exercise.exerciseIndex + 1}`}
																			</p>
																			<p className='mt-2 text-xs text-muted-foreground'>
																				{formatExercisePrescription(exercise)}
																			</p>
																		</div>
																		<Badge variant='outline'>
																			Exercise {exercise.exerciseIndex + 1}
																		</Badge>
																	</div>

																	{exercise.notes ? (
																		<p className='mt-3 text-sm text-muted-foreground'>
																			{exercise.notes}
																		</p>
																	) : null}

																	{exercise.sets.length > 0 ? (
																		<div className='grid grid-cols-1 gap-2 mt-4 md:grid-cols-2 xl:grid-cols-3'>
																			{exercise.sets.map((setRow) => (
																				<div
																					key={setRow.id}
																					className='p-3 rounded-md border bg-background'
																				>
																					<div className='flex gap-2 justify-between text-sm font-medium'>
																						<span>Set {setRow.setIndex + 1}</span>
																						<span>
																							{setRow.weight ?? '-'} kg
																						</span>
																					</div>
																					<p className='mt-2 text-xs text-muted-foreground'>
																						{setRow.reps ?? '-'} reps
																						{setRow.rpe !== null &&
																						setRow.rpe !== undefined
																							? ` · RPE ${setRow.rpe}`
																							: ''}
																					</p>
																					{setRow.notes ? (
																						<p className='mt-2 text-xs text-muted-foreground'>
																							{setRow.notes}
																						</p>
																					) : null}
																				</div>
																			))}
																		</div>
																	) : (
																		<p className='mt-4 text-xs text-muted-foreground'>
																			No set logs captured for this exercise.
																		</p>
																	)}
																</div>
															))}
														</div>
													</div>
												</div>
											))}
										</div>
									)}
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	)
}
