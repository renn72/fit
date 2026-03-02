'use client'

import * as React from 'react'

import { WorkoutRowActions } from '@/components/admin/workout/workout-row-actions'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDataTable } from '@/hooks/use-data-table'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import {
	BarbellIcon,
	FireIcon,
	ListIcon,
	SquaresFourIcon,
	StackPlusIcon,
} from '@phosphor-icons/react'
import _ from 'lodash'

interface WorkoutExercise {
	id: string
	index: number
	exercise: {
		id: string
		name: string
		movement?: {
			name: string
		}
	}
}

interface WorkoutSuperSet {
	id: string
	index: number
	superSet: {
		id: string
		name: string
		isSuperSet: boolean
		superSetExercises?: Array<{
			exercise: {
				id: string
				name: string
				movement?: {
					name: string
				}
			}
		}>
	}
}

interface WorkoutWarmup {
	id: string
	name: string
}

interface Workout {
	id: string
	name: string
	description: string | null
	category: string | null
	createdAt: Date
	creatorName?: string | null
	creator?: {
		name?: string | null
	} | null
	exercises: WorkoutExercise[]
	superSets: WorkoutSuperSet[]
	warmupGroup?: {
		id: string
		name: string
		warmups: WorkoutWarmup[]
	} | null
}

const columnHelper = createColumnHelper<Workout>()

function splitCsv(value: string | null | undefined): string[] {
	if (!value) return []
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
}

const columns = [
	columnHelper.accessor('name', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Name' />
		),
		meta: {
			label: 'Name',
			variant: 'text',
		},
		enableSorting: true,
		enableHiding: false,
	}),
	columnHelper.accessor('description', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Description' />
		),
		cell: ({ row }) => {
			const desc = row.getValue('description') as string | null
			if (!desc) return <span className='text-muted-foreground'>-</span>
			return <div className='max-w-60 truncate'>{desc}</div>
		},
		meta: {
			label: 'Description',
			variant: 'text',
		},
	}),
	columnHelper.accessor('category', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Category' />
		),
		cell: ({ row }) => {
			const categories = splitCsv(row.getValue('category') as string | null)
			if (categories.length === 0) {
				return <span className='text-muted-foreground'>-</span>
			}

			return (
				<div className='flex flex-wrap gap-1'>
					{categories.slice(0, 2).map((category) => (
						<Badge key={category} variant='secondary'>
							{category}
						</Badge>
					))}
					{categories.length > 2 && (
						<span className='text-xs text-muted-foreground'>
							+{categories.length - 2} more
						</span>
					)}
				</div>
			)
		},
		meta: {
			label: 'Category',
			variant: 'text',
		},
	}),
	columnHelper.accessor('exercises', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Items' />
		),
		cell: ({ row }) => {
			const exercises = row.getValue('exercises') as WorkoutExercise[]
			const superSets = row.original.superSets as WorkoutSuperSet[]
			const totalItems = (exercises?.length || 0) + (superSets?.length || 0)
			return <span>{totalItems}</span>
		},
		meta: {
			label: 'Items',
			variant: 'number',
		},
	}),
	columnHelper.accessor('warmupGroup', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Warmup' />
		),
		cell: ({ row }) => {
			const warmupGroup = row.getValue('warmupGroup') as Workout['warmupGroup']
			return warmupGroup ? (
				<span className='text-emerald-700 dark:text-emerald-300'>
					{warmupGroup.name}
				</span>
			) : (
				<span className='text-muted-foreground'>-</span>
			)
		},
		meta: {
			label: 'Warmup',
			variant: 'text',
		},
	}),
	columnHelper.accessor('creatorName', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Created By' />
		),
		cell: ({ row }) => {
			return row.original.creatorName ?? row.original.creator?.name ?? 'Unknown'
		},
		meta: {
			label: 'Created By',
			variant: 'text',
		},
	}),
	columnHelper.accessor('createdAt', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Created At' />
		),
		cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString(),
		meta: {
			label: 'Created At',
			variant: 'date',
		},
	}),
	columnHelper.display({
		id: 'actions',
		cell: ({ row }) => <WorkoutRowActions row={row} />,
	}),
]

const route = getRouteApi('/$orgSlug/workouts')

export function WorkoutsPage() {
	const { session } = route.useRouteContext()

	const userOrgId = session.user.organisationId
	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <WorkoutsContent userOrgId={userOrgId} />
}

function WorkoutsContent({ userOrgId }: { userOrgId: string }) {
	const { orgSlug } = route.useParams()
	const { data: workouts } = useSuspenseQuery(
		orpc.workout.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const navigate = route.useNavigate()
	const { view, q, page, perPage, sort } = route.useSearch()

	const workoutsData = (workouts as Workout[]) ?? []

	const { paginatedData, pageCount, totalCount } = React.useMemo(() => {
		const processed = [...workoutsData]
		const normalizedQuery = q.trim().toLowerCase()
		const filtered =
			normalizedQuery.length === 0
				? processed
				: processed.filter((workout) => {
						const nameMatch = workout.name
							.toLowerCase()
							.includes(normalizedQuery)
						const categoryMatch = (workout.category ?? '')
							.toLowerCase()
							.includes(normalizedQuery)
						return nameMatch || categoryMatch
				  })

		if (sort && sort.length > 0) {
			const { id, desc } = sort[0]
			filtered.sort((a, b) => {
				const aValue = a[id as keyof Workout]
				const bValue = b[id as keyof Workout]

				if (aValue === bValue) return 0
				if (aValue === null || aValue === undefined) return 1
				if (bValue === null || bValue === undefined) return -1

				if (aValue < bValue) return desc ? 1 : -1
				return desc ? -1 : 1
			})
		}

		const total = filtered.length
		const pageCount = Math.ceil(total / perPage)
		const start = (page - 1) * perPage
		const end = start + perPage
		const paginatedData = filtered.slice(start, end)

		return { paginatedData, pageCount, totalCount: total }
	}, [workoutsData, q, sort, page, perPage])

	const { table } = useDataTable({
		data: paginatedData,
		columns,
		pageCount,
		getRowId: (originalRow) => originalRow.id,
		initialState: {
			sorting: sort as any,
			columnPinning: { right: ['actions'] },
		},
	})

	const handleViewChange = (newView: string) => {
		navigate({
			to: '/$orgSlug/workouts',
			params: { orgSlug },
			search: (prev) => ({ ...prev, view: newView as 'table' | 'grid' }),
			replace: true,
		})
	}

	const handleSearchChange = (value: string) => {
		navigate({
			to: '/$orgSlug/workouts',
			params: { orgSlug },
			search: (prev) => ({ ...prev, q: value, page: 1 }),
			replace: true,
		})
	}

	return (
		<div className='flex h-full w-full flex-col gap-4 p-4'>
			<div className='flex items-center justify-between'>
				<h1 className='text-2xl font-bold tracking-tight'>Workouts</h1>
				<Link to='/$orgSlug/workouts/create' params={{ orgSlug }}>
					<Button>Create Workout</Button>
				</Link>
			</div>

			<div className='w-full max-w-sm'>
				<Input
					value={q}
					onChange={(event) => handleSearchChange(event.target.value)}
					placeholder='Search by name or category...'
				/>
			</div>

			<Tabs value={view} onValueChange={handleViewChange} className='w-full'>
				<TabsList className='w-fit'>
					<TabsTrigger value='table' className='gap-2'>
						<ListIcon className='size-4' />
						Table
					</TabsTrigger>
					<TabsTrigger value='grid' className='gap-2'>
						<SquaresFourIcon className='size-4' />
						Grid
					</TabsTrigger>
				</TabsList>

				<TabsContent value='table' className='mt-4'>
					<DataTable table={table}>
						<DataTableAdvancedToolbar table={table} className='border-b' />
					</DataTable>
				</TabsContent>

				<TabsContent value='grid' className='mt-4'>
					<WorkoutsGridView
						data={paginatedData}
						page={page}
						perPage={perPage}
						total={totalCount}
					/>
				</TabsContent>
			</Tabs>
		</div>
	)
}

interface WorkoutsGridViewProps {
	data: Workout[]
	page: number
	perPage: number
	total: number
}

function WorkoutsGridView({
	data,
	page,
	perPage,
	total,
}: WorkoutsGridViewProps) {
	const totalPages = Math.ceil(total / perPage)

	return (
		<div className='flex flex-col gap-4'>
			<div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
				{data.map((workout) => {
					const orderedItems = [
						...(workout.exercises?.map((item) => ({
							id: item.id,
							index: item.index,
							type: 'exercise' as const,
							name: item.exercise.name,
							movementName: item.exercise.movement?.name ?? null,
						})) ?? []),
						...(workout.superSets?.map((item) => ({
							id: item.id,
							index: item.index,
							type: 'superset' as const,
							name: item.superSet.name,
							movementName: null,
							memberCount: item.superSet.superSetExercises?.length ?? 0,
						})) ?? []),
					].sort((a, b) => a.index - b.index)

					const categories = splitCsv(workout.category)
					const creatorName = workout.creatorName ?? workout.creator?.name ?? 'Unknown'
					const totalItems = orderedItems.length
					const regularCount = workout.exercises?.length ?? 0
					const supersetCount = workout.superSets?.length ?? 0

					return (
						<Card
							key={workout.id}
							className='overflow-hidden border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md'
						>
							<CardHeader className='space-y-3 border-b bg-gradient-to-r from-orange-50/70 to-cyan-50/70 pb-4 dark:from-orange-950/20 dark:to-cyan-950/20'>
								<div className='flex items-start justify-between gap-3'>
									<div className='min-w-0'>
										<CardTitle className='truncate text-lg leading-tight'>
											{workout.name}
										</CardTitle>
										<p className='text-xs text-muted-foreground'>
											By {creatorName} •{' '}
											{new Date(workout.createdAt).toLocaleDateString()}
										</p>
									</div>
									<WorkoutRowActions
										workout={{ id: workout.id, name: workout.name }}
										buttonClassName='h-8 w-8'
									/>
								</div>

								{categories.length > 0 && (
									<div className='flex flex-wrap gap-1'>
										{categories.map((category) => (
											<Badge key={category} variant='secondary'>
												{category}
											</Badge>
										))}
									</div>
								)}

								{workout.description && (
									<p className='line-clamp-2 text-sm text-muted-foreground'>
										{workout.description}
									</p>
								)}
							</CardHeader>

							<CardContent className='space-y-4 pt-4'>
								<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
									<div className='rounded-lg border bg-orange-50/80 p-2 dark:bg-orange-950/20'>
										<div className='text-[11px] text-muted-foreground'>
											Exercises
										</div>
										<div className='text-sm font-semibold text-orange-700 dark:text-orange-300'>
											{regularCount}
										</div>
									</div>
									<div className='rounded-lg border bg-violet-50/80 p-2 dark:bg-violet-950/20'>
										<div className='text-[11px] text-muted-foreground'>
											Supersets
										</div>
										<div className='text-sm font-semibold text-violet-700 dark:text-violet-300'>
											{supersetCount}
										</div>
									</div>
									<div className='rounded-lg border bg-cyan-50/80 p-2 dark:bg-cyan-950/20'>
										<div className='text-[11px] text-muted-foreground'>
											Total Items
										</div>
										<div className='text-sm font-semibold text-cyan-700 dark:text-cyan-300'>
											{totalItems}
										</div>
									</div>
									<div className='rounded-lg border bg-emerald-50/80 p-2 dark:bg-emerald-950/20'>
										<div className='text-[11px] text-muted-foreground'>
											Warmup
										</div>
										<div className='truncate text-sm font-semibold text-emerald-700 dark:text-emerald-300'>
											{workout.warmupGroup?.name ?? 'None'}
										</div>
									</div>
								</div>

								<div className='space-y-2 rounded-xl border bg-muted/20 p-3 text-sm'>
									<div className='flex items-center justify-between'>
										<div className='font-medium text-muted-foreground'>
											Workout Structure
										</div>
										<div className='text-xs text-muted-foreground'>
											{totalItems} item{totalItems === 1 ? '' : 's'}
										</div>
									</div>

									{orderedItems.length === 0 ? (
										<p className='text-muted-foreground'>No exercises added yet.</p>
									) : (
										<ScrollArea className='max-h-52'>
											<div className='space-y-2'>
												{orderedItems.map((item, idx) => (
													<div
														key={item.id}
														className='flex items-center gap-2 rounded-md border bg-background px-2 py-1.5'
													>
														<Badge variant='outline' className='px-1.5'>
															{idx + 1}
														</Badge>
														{item.type === 'exercise' ? (
															<BarbellIcon className='size-4 text-orange-600 dark:text-orange-300' />
														) : (
															<StackPlusIcon className='size-4 text-violet-600 dark:text-violet-300' />
														)}
														<div className='min-w-0 flex-1'>
															<p className='truncate font-medium'>{item.name}</p>
															<p className='truncate text-xs text-muted-foreground'>
																{item.type === 'superset'
																	? `${item.memberCount ?? 0} exercises`
																	: item.movementName || 'No movement'}
															</p>
														</div>
													</div>
												))}
											</div>
										</ScrollArea>
									)}
								</div>

								{workout.warmupGroup && (
									<div className='flex items-center gap-2 rounded-xl border bg-emerald-50/80 p-3 text-sm dark:bg-emerald-950/20'>
										<FireIcon className='size-4 text-emerald-600 dark:text-emerald-300' />
										<span>
											Warmup group has {workout.warmupGroup.warmups?.length ?? 0}{' '}
											item{(workout.warmupGroup.warmups?.length ?? 0) === 1 ? '' : 's'}
										</span>
									</div>
								)}
							</CardContent>
						</Card>
					)
				})}
			</div>

			{totalPages > 1 && (
				<div className='flex items-center justify-between px-2'>
					<div className='text-sm text-muted-foreground'>
						Showing {(page - 1) * perPage + 1} to{' '}
						{Math.min(page * perPage, total)} of {total} workouts
					</div>
					<div className='flex items-center gap-2'>
						<span className='text-sm'>
							Page {page} of {totalPages}
						</span>
					</div>
				</div>
			)}
		</div>
	)
}
