import { Badge } from '@fit/components/ui/badge'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@fit/components/ui/card'

import { orpc } from '@/lib/orpc'
import type { AppSession } from '@/lib/session'

import { useQuery } from '@tanstack/react-query'

import { CalendarClock, Dumbbell, Flame } from 'lucide-react'

type DashboardOverviewProps = {
	session: AppSession
}

function formatDateLabel(value: Date | string | null | undefined) {
	if (!value) {
		return null
	}

	const date = value instanceof Date ? value : new Date(value)

	if (Number.isNaN(date.getTime())) {
		return null
	}

	return new Intl.DateTimeFormat('en-AU', {
		day: 'numeric',
		month: 'short',
	}).format(date)
}

function getExerciseCount(block: {
	workouts?: Array<{ exercises?: Array<unknown> | null } | null> | null
}) {
	return (
		block.workouts?.reduce((total, workoutItem) => {
			return total + (workoutItem?.exercises?.length ?? 0)
		}, 0) ?? 0
	)
}

function selectCurrentBlock<
	T extends { isTemplate?: boolean; isActive?: boolean },
>(blocks: T[]) {
	const assignedBlocks = blocks.filter((block) => block.isTemplate !== true)
	return (
		assignedBlocks.find((block) => block.isActive) ?? assignedBlocks[0] ?? null
	)
}

type WorkoutSummary = {
	id: string
	dayIndex: number
	name: string
	exercises?: Array<unknown> | null
}

export function DashboardOverview({ session }: DashboardOverviewProps) {
	const userId = session?.user?.id ?? ''
	const { data, error, isPending } = useQuery(
		orpc.userBlock.getByUser.queryOptions({
			input: { userId },
			enabled: !!userId,
		}),
	)

	const blocks = data ?? []
	const currentBlock = selectCurrentBlock(blocks)
	const nextWorkout = currentBlock?.workouts?.[0] ?? null
	const blockDates = [
		formatDateLabel(currentBlock?.startDate),
		formatDateLabel(currentBlock?.endDate),
	]
		.filter(Boolean)
		.join(' - ')

	if (isPending) {
		return (
			<div className='space-y-4'>
				<Card className='border-white/70 bg-white/82 shadow-sm backdrop-blur-sm'>
					<CardHeader>
						<CardTitle>Loading current program...</CardTitle>
						<CardDescription>
							Forma is pulling the latest training block assigned to you.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		)
	}

	if (error) {
		return (
			<Card className='border-white/70 bg-white/82 shadow-sm backdrop-blur-sm'>
				<CardHeader>
					<CardTitle>Current program unavailable</CardTitle>
					<CardDescription>
						We could not load your training block right now. Try again shortly.
					</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	if (!currentBlock) {
		return (
			<Card className='border-white/70 bg-white/82 shadow-sm backdrop-blur-sm'>
				<CardHeader>
					<CardTitle>No current program yet</CardTitle>
					<CardDescription>
						Your coach has not assigned an active training block yet. Once it is
						live, it will show up here first.
					</CardDescription>
				</CardHeader>
			</Card>
		)
	}

	return (
		<div className='space-y-4'>
			<Card className='border-white/70 bg-white/84 shadow-sm backdrop-blur-sm'>
				<CardHeader className='gap-4'>
					<div className='flex flex-wrap items-center gap-2'>
						<Badge className='rounded-full px-3 py-1'>Current program</Badge>
						<Badge variant='secondary' className='rounded-full px-3 py-1'>
							{currentBlock.isActive ? 'Active' : 'Assigned'}
						</Badge>
					</div>
					<div className='space-y-2'>
						<CardTitle className='text-2xl'>{currentBlock.name}</CardTitle>
						<CardDescription className='leading-7'>
							{currentBlock.description ||
								'Your current block is staged here so you can move straight into execution.'}
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className='grid gap-3 sm:grid-cols-3'>
					<SummaryTile
						icon={Dumbbell}
						label='Workouts'
						value={String(currentBlock.workouts?.length ?? 0)}
					/>
					<SummaryTile
						icon={Flame}
						label='Exercises'
						value={String(getExerciseCount(currentBlock))}
					/>
					<SummaryTile
						icon={CalendarClock}
						label='Block window'
						value={blockDates || 'Live now'}
					/>
				</CardContent>
			</Card>

			{nextWorkout ? (
				<Card className='border-white/70 bg-white/80 shadow-sm backdrop-blur-sm'>
					<CardHeader>
						<CardTitle>Next session</CardTitle>
						<CardDescription>
							The first workout in your current block stays closest to your
							thumb.
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3'>
						<div className='rounded-3xl border border-border/70 bg-background/82 p-4'>
							<div className='flex items-center justify-between gap-3'>
								<div>
									<p className='text-sm font-medium'>{nextWorkout.name}</p>
									<p className='mt-1 text-sm text-muted-foreground'>
										{nextWorkout.description || 'No session note attached.'}
									</p>
								</div>
								<Badge variant='outline' className='rounded-full px-3 py-1'>
									Day {nextWorkout.dayIndex + 1}
								</Badge>
							</div>
						</div>
						<div className='grid gap-3 sm:grid-cols-2'>
							<div className='rounded-3xl border border-border/70 bg-background/82 p-4'>
								<p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>
									Warm-ups
								</p>
								<p className='mt-2 text-lg font-semibold'>
									{nextWorkout.warmups?.length ?? 0}
								</p>
							</div>
							<div className='rounded-3xl border border-border/70 bg-background/82 p-4'>
								<p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>
									Exercises
								</p>
								<p className='mt-2 text-lg font-semibold'>
									{nextWorkout.exercises?.length ?? 0}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			) : null}

			<Card className='border-white/70 bg-white/80 shadow-sm backdrop-blur-sm'>
				<CardHeader>
					<CardTitle>Block rhythm</CardTitle>
					<CardDescription>
						Your current workouts are listed in order so you can scan the cycle
						without leaving the mobile shell.
					</CardDescription>
				</CardHeader>
				<CardContent className='space-y-3'>
					{((currentBlock.workouts ?? []) as WorkoutSummary[]).map(
						(workout) => (
							<div
								key={workout.id}
								className='flex items-center justify-between gap-3 rounded-3xl border border-border/70 bg-background/82 p-4'
							>
								<div>
									<p className='text-sm font-medium'>{workout.name}</p>
									<p className='text-sm text-muted-foreground'>
										{workout.exercises?.length ?? 0} exercises
									</p>
								</div>
								<Badge variant='outline' className='rounded-full px-3 py-1'>
									Day {workout.dayIndex + 1}
								</Badge>
							</div>
						),
					)}
				</CardContent>
			</Card>
		</div>
	)
}

function SummaryTile({
	icon: Icon,
	label,
	value,
}: {
	icon: typeof Dumbbell
	label: string
	value: string
}) {
	return (
		<div className='rounded-3xl border border-border/70 bg-background/82 p-4'>
			<div className='flex items-center gap-3'>
				<div className='rounded-2xl bg-primary/12 p-2 text-primary'>
					<Icon className='size-4' />
				</div>
				<div>
					<p className='text-xs uppercase tracking-[0.22em] text-muted-foreground'>
						{label}
					</p>
					<p className='mt-1 text-lg font-semibold'>{value}</p>
				</div>
			</div>
		</div>
	)
}
