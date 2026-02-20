'use client'

import * as React from 'react'

import { WorkoutCreateDialog } from '@/components/admin/workout-create-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDataTable } from '@/hooks/use-data-table'
import { getSortingStateParser } from '@/lib/parsers'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import {
	Barbell,
	Fire,
	List,
	SquaresFour,
	Target,
	Timer,
} from '@phosphor-icons/react'
import _ from 'lodash'
import { parseAsInteger, useQueryState } from 'nuqs'

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
	creatorName?: string
	exercises: WorkoutExercise[]
	superSets: WorkoutSuperSet[]
	warmupGroup?: {
		id: string
		name: string
		warmups: WorkoutWarmup[]
	}
}

const columnHelper = createColumnHelper<Workout>()

const columns = [
	columnHelper.display({
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && 'indeterminate')
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label='Select all'
				className='translate-y-0.5'
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label='Select row'
				className='translate-y-0.5'
			/>
		),
		enableSorting: false,
		enableHiding: false,
	}),
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
			return desc ? (desc.length > 50 ? `${desc.slice(0, 50)}...` : desc) : '-'
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
		meta: {
			label: 'Category',
			variant: 'text',
		},
	}),
	columnHelper.accessor('exercises', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Exercises' />
		),
		cell: ({ row }) => {
			const exercises = row.getValue('exercises') as WorkoutExercise[]
			const superSets = row.original.superSets as WorkoutSuperSet[]
			const totalItems = (exercises?.length || 0) + (superSets?.length || 0)
			return <span>{totalItems} items</span>
		},
		meta: {
			label: 'Exercises',
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
				<span className='text-green-600'>{warmupGroup.name}</span>
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

	const [viewMode, setViewMode] = useQueryState('view', {
		defaultValue: 'table',
	})
	const [page] = useQueryState('page', parseAsInteger.withDefault(1))
	const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10))
	const [sorting] = useQueryState(
		'sort',
		getSortingStateParser<Workout>(
			columns
				.map((c) => (c as any).accessorKey)
				.filter((key): key is string => !!key),
		).withDefault([{ id: 'createdAt', desc: true }]),
	)

	const workoutsData = (workouts as Workout[]) ?? []

	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...workoutsData]

		if (sorting && sorting.length > 0) {
			const { id, desc } = sorting[0]
			processed.sort((a, b) => {
				const aValue = a[id as keyof Workout]
				const bValue = b[id as keyof Workout]

				if (aValue === bValue) return 0
				if (aValue === null || aValue === undefined) return 1
				if (bValue === null || bValue === undefined) return -1

				if (aValue < bValue) return desc ? 1 : -1
				return desc ? -1 : 1
			})
		}

		const total = processed.length
		const pageCount = Math.ceil(total / perPage)
		const start = (page - 1) * perPage
		const end = start + perPage
		const paginatedData = processed.slice(start, end)

		return { paginatedData, pageCount }
	}, [workoutsData, page, perPage, sorting])

	const { table } = useDataTable({
		data: paginatedData,
		columns,
		pageCount,
		getRowId: (originalRow) => originalRow.id,
		initialState: {
			sorting: [{ id: 'createdAt', desc: true }],
			columnPinning: { right: ['actions'] },
		},
	})

	return (
		<div className='flex flex-col gap-4 p-4 w-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold tracking-tight'>Workouts</h1>
				<WorkoutCreateDialog />
			</div>

			<Tabs
				value={viewMode}
				onValueChange={(v) => void setViewMode(v)}
				className='w-full'
			>
				<TabsList className='w-fit'>
					<TabsTrigger value='table' className='gap-2'>
						<List className='size-4' />
						Table
					</TabsTrigger>
					<TabsTrigger value='grid' className='gap-2'>
						<SquaresFour className='size-4' />
						Grid
					</TabsTrigger>
				</TabsList>

				<TabsContent value='table' className='mt-4'>
					<DataTable table={table}>
						<DataTableAdvancedToolbar table={table} className='border-b'>
							<DataTableFilterList table={table} />
						</DataTableAdvancedToolbar>
					</DataTable>
				</TabsContent>

				<TabsContent value='grid' className='mt-4'>
					<WorkoutsGridView
						data={paginatedData}
						page={page}
						perPage={perPage}
						total={workoutsData.length}
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
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{data.map((workout) => {
					const totalItems =
						(workout.exercises?.length || 0) + (workout.superSets?.length || 0)
					return (
						<Card key={workout.id} className='flex flex-col'>
							<CardHeader className='pb-3'>
								<CardTitle className='text-lg'>{workout.name}</CardTitle>
								{workout.category && (
									<CardDescription>{workout.category}</CardDescription>
								)}
							</CardHeader>
							<CardContent className='flex-1'>
								<div className='space-y-4'>
									{/* Stats */}
									<div className='grid grid-cols-3 gap-2 text-center'>
										<div className='p-2 bg-blue-50 rounded-lg'>
											<div className='text-xs text-muted-foreground'>
												Exercises
											</div>
											<div className='font-semibold text-blue-600'>
												{workout.exercises?.length || 0}
											</div>
										</div>
										<div className='p-2 bg-purple-50 rounded-lg'>
											<div className='text-xs text-muted-foreground'>
												Supersets
											</div>
											<div className='font-semibold text-purple-600'>
												{workout.superSets?.length || 0}
											</div>
										</div>
										<div className='p-2 bg-orange-50 rounded-lg'>
											<div className='text-xs text-muted-foreground'>Total</div>
											<div className='font-semibold text-orange-600'>
												{totalItems}
											</div>
										</div>
									</div>

									{/* Warmup */}
									{workout.warmupGroup && (
										<div className='flex items-center gap-2 p-2 bg-green-50 rounded-lg'>
											<Fire className='size-4 text-green-600' />
											<div className='flex-1'>
												<div className='text-xs text-muted-foreground'>
													Warmup
												</div>
												<div className='font-medium text-green-700'>
													{workout.warmupGroup.name}
												</div>
											</div>
											<div className='text-xs text-green-600'>
												{workout.warmupGroup.warmups?.length || 0} exercises
											</div>
										</div>
									)}

									{/* Exercise List */}
									{totalItems > 0 && (
										<div className='space-y-2'>
											<div className='text-sm font-medium text-muted-foreground'>
												Workout Structure
											</div>
											<div className='space-y-1'>
												{/* Combine and sort exercises and supersets by index */}
												{[
													...(workout.exercises?.map((e) => ({
														...e,
														type: 'exercise' as const,
													})) || []),
													...(workout.superSets?.map((s) => ({
														...s,
														type: 'superset' as const,
													})) || []),
												]
													.sort((a, b) => a.index - b.index)
													.slice(0, 5)
													.map((item, idx) => (
														<div
															key={item.id}
															className='flex items-center gap-2 text-sm py-1'
														>
															<span className='text-muted-foreground w-6'>
																{idx + 1}.
															</span>
															{item.type === 'exercise' ? (
																<>
																	<Barbell className='size-3 text-blue-500' />
																	<span className='flex-1 truncate'>
																		{item.exercise.name}
																	</span>
																</>
															) : (
																<>
																	<Target className='size-3 text-purple-500' />
																	<span className='flex-1 truncate'>
																		{item.superSet.name}
																	</span>
																	<span className='text-xs text-muted-foreground'>
																		(
																		{item.superSet.superSetExercises?.length ||
																			0}{' '}
																		exercises)
																	</span>
																</>
															)}
														</div>
													))}
												{totalItems > 5 && (
													<div className='text-sm text-muted-foreground py-1'>
														+{totalItems - 5} more items
													</div>
												)}
											</div>
										</div>
									)}
								</div>
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
