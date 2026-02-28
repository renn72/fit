'use client'

import * as React from 'react'

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
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import {
	BarbellIcon,
	CalendarBlankIcon,
	FireIcon,
	ListIcon,
	MoonIcon,
	PlayCircleIcon,
	SquaresFourIcon,
	TargetIcon,
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

interface WorkoutWarmupGroup {
	id: string
	name: string
	warmups: WorkoutWarmup[]
}

interface Workout {
	id: string
	name: string
	category: string | null
	exercises: WorkoutExercise[]
	superSets: WorkoutSuperSet[]
	warmupGroup?: WorkoutWarmupGroup
}

interface BlockTemplateWorkout {
	id: string
	index: number
	workout: Workout
}

interface BlockTemplate {
	id: string
	name: string
	description: string | null
	category: string | null
	restDayIndex: number | null
	createdAt: Date
	creatorName?: string
	workouts: BlockTemplateWorkout[]
}

const columnHelper = createColumnHelper<BlockTemplate>()

const columns = [
	columnHelper.display({
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && undefined)
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
	columnHelper.accessor('workouts', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Workouts' />
		),
		cell: ({ row }) => {
			const workouts = row.getValue('workouts') as BlockTemplateWorkout[]
			return <span>{workouts?.length || 0} workouts</span>
		},
		meta: {
			label: 'Workouts',
			variant: 'number',
		},
	}),
	columnHelper.accessor('restDayIndex', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Rest Day' />
		),
		cell: ({ row }) => {
			const restDay = row.getValue('restDayIndex') as number | null
			return restDay !== null ? `Day ${restDay + 1}` : '-'
		},
		meta: {
			label: 'Rest Day',
			variant: 'number',
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

const route = getRouteApi('/$orgSlug/block-templates')

export function BlockTemplatesPage() {
	const { session } = route.useRouteContext()

	const userOrgId = session.user.organisationId
	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <BlockTemplatesContent userOrgId={userOrgId} />
}

function BlockTemplatesContent({ userOrgId }: { userOrgId: string }) {
	const { orgSlug } = route.useParams()
	const { data: blockTemplates } = useSuspenseQuery(
		orpc.blockTemplate.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const navigate = route.useNavigate()
	const { view, page, perPage, sort } = route.useSearch()

	const blockTemplatesData = (blockTemplates as BlockTemplate[]) ?? []

	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...blockTemplatesData]

		if (sort && sort.length > 0) {
			const { id, desc } = sort[0]
			processed.sort((a, b) => {
				const aValue = a[id as keyof BlockTemplate]
				const bValue = b[id as keyof BlockTemplate]

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
	}, [blockTemplatesData, page, perPage, sort])

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
			to: '/$orgSlug/block-templates',
			params: { orgSlug },
			search: (prev) => ({ ...prev, view: newView as 'table' | 'grid' }),
			replace: true,
		})
	}

	return (
		<div className='flex flex-col gap-4 p-4 w-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold tracking-tight'>Block Templates</h1>
				<Link to='/$orgSlug/block-templates' params={{ orgSlug }}>
					<Button>Create Block Template</Button>
				</Link>
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
						<DataTableAdvancedToolbar table={table} className='border-b'>
							<DataTableFilterList table={table} />
						</DataTableAdvancedToolbar>
					</DataTable>
				</TabsContent>

				<TabsContent value='grid' className='mt-4'>
					<BlockTemplatesGridView
						data={paginatedData}
						page={page}
						perPage={perPage}
						total={blockTemplatesData.length}
					/>
				</TabsContent>
			</Tabs>
		</div>
	)
}

interface BlockTemplatesGridViewProps {
	data: BlockTemplate[]
	page: number
	perPage: number
	total: number
}

function BlockTemplatesGridView({
	data,
	page,
	perPage,
	total,
}: BlockTemplatesGridViewProps) {
	const totalPages = Math.ceil(total / perPage)

	return (
		<div className='flex flex-col gap-4'>
			<div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
				{data.map((blockTemplate) => {
					const sortedWorkouts = [...blockTemplate.workouts].sort(
						(a, b) => a.index - b.index,
					)
					const totalItems = sortedWorkouts.length

					return (
						<Card key={blockTemplate.id} className='flex flex-col'>
							<CardHeader className='pb-3'>
								<CardTitle className='text-lg'>{blockTemplate.name}</CardTitle>
								{blockTemplate.category && (
									<CardDescription>{blockTemplate.category}</CardDescription>
								)}
							</CardHeader>
							<CardContent className='flex-1'>
								<div className='space-y-4'>
									{/* Stats */}
									<div className='grid grid-cols-3 gap-2 text-center'>
										<div className='p-2 bg-blue-50 rounded-lg'>
											<div className='text-xs text-muted-foreground'>
												Workouts
											</div>
											<div className='font-semibold text-blue-600'>
												{totalItems}
											</div>
										</div>
										<div className='p-2 bg-purple-50 rounded-lg'>
											<div className='text-xs text-muted-foreground'>
												Total Days
											</div>
											<div className='font-semibold text-purple-600'>
												{totalItems +
													(blockTemplate.restDayIndex !== null ? 1 : 0)}
											</div>
										</div>
										{blockTemplate.restDayIndex !== null ? (
											<div className='p-2 bg-green-50 rounded-lg'>
												<div className='text-xs text-muted-foreground'>
													Rest Day
												</div>
												<div className='font-semibold text-green-600'>
													Day {blockTemplate.restDayIndex + 1}
												</div>
											</div>
										) : (
											<div className='p-2 bg-gray-50 rounded-lg'>
												<div className='text-xs text-muted-foreground'>
													Rest Day
												</div>
												<div className='font-semibold text-gray-600'>-</div>
											</div>
										)}
									</div>

									{/* Schedule */}
									<div className='space-y-3'>
										<div className='text-sm font-medium text-muted-foreground'>
											Schedule
										</div>
										<div className='overflow-y-auto space-y-2 max-h-80'>
											{sortedWorkouts.map((item, idx) => {
												const dayNumber = idx + 1
												const isRestDay = blockTemplate.restDayIndex === idx

												return (
													<div key={item.id}>
														{isRestDay && (
															<div className='flex gap-2 items-center p-2 mb-2 bg-green-50 rounded-lg'>
																<MoonIcon className='text-green-600 size-4' />
																<span className='text-sm font-medium text-green-700'>
																	REST DAY
																</span>
															</div>
														)}
														<div className='p-3 space-y-2 rounded-lg border'>
															<div className='flex gap-2 items-center'>
																<CalendarBlankIcon className='text-blue-500 size-4' />
																<span className='text-sm font-medium'>
																	Day {dayNumber}: {item.workout.name}
																</span>
															</div>

															{/* Warmup */}
															{item.workout.warmupGroup && (
																<div className='pl-6 space-y-1'>
																	<div className='flex gap-2 items-center text-sm text-orange-600'>
																		<FireIcon className='size-3' />
																		<span className='font-medium'>
																			Warmup: {item.workout.warmupGroup.name}
																		</span>
																	</div>
																	{item.workout.warmupGroup.warmups
																		?.slice(0, 3)
																		.map((warmup) => (
																			<div
																				key={warmup.id}
																				className='flex gap-2 items-center pl-5 text-xs text-muted-foreground'
																			>
																				<PlayCircleIcon className='size-3' />
																				<span>{warmup.name}</span>
																			</div>
																		))}
																	{item.workout.warmupGroup.warmups?.length >
																		3 && (
																		<div className='pl-5 text-xs text-muted-foreground'>
																			+
																			{item.workout.warmupGroup.warmups.length -
																				3}{' '}
																			more
																		</div>
																	)}
																</div>
															)}

															{/* Exercises */}
															<div className='pl-6 space-y-1'>
																{/* Combine exercises and supersets */}
																{[
																	...(item.workout.exercises?.map((e) => ({
																		...e,
																		type: 'exercise' as const,
																	})) || []),
																	...(item.workout.superSets?.map((s) => ({
																		...s,
																		type: 'superset' as const,
																	})) || []),
																]
																	.sort((a, b) => a.index - b.index)
																	.slice(0, 5)
																	.map((exItem, exIdx) => (
																		<div
																			key={`${exItem.id}-${exIdx}`}
																			className='flex gap-2 items-center text-xs'
																		>
																			{exItem.type === 'exercise' ? (
																				<>
																					<BarbellIcon className='text-blue-500 size-3' />
																					<span className='flex-1 truncate'>
																						{exItem.exercise.name}
																					</span>
																					{exItem.exercise.movement?.name && (
																						<span className='text-muted-foreground'>
																							({exItem.exercise.movement.name})
																						</span>
																					)}
																				</>
																			) : (
																				<>
																					<TargetIcon className='text-purple-500 size-3' />
																					<span className='flex-1 font-medium truncate'>
																						{exItem.superSet.name}
																					</span>
																					<span className='text-xs text-muted-foreground'>
																						(
																						{exItem.superSet.superSetExercises
																							?.length || 0}{' '}
																						exercises)
																					</span>
																				</>
																			)}
																		</div>
																	))}
																{item.workout.exercises?.length +
																	item.workout.superSets?.length >
																	5 && (
																	<div className='pl-5 text-xs text-muted-foreground'>
																		+
																		{item.workout.exercises?.length +
																			item.workout.superSets?.length -
																			5}{' '}
																		more
																	</div>
																)}
															</div>
														</div>
													</div>
												)
											})}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					)
				})}
			</div>

			{totalPages > 1 && (
				<div className='flex justify-between items-center px-2'>
					<div className='text-sm text-muted-foreground'>
						Showing {(page - 1) * perPage + 1} to{' '}
						{Math.min(page * perPage, total)} of {total} block templates
					</div>
					<div className='flex gap-2 items-center'>
						<span className='text-sm'>
							Page {page} of {totalPages}
						</span>
					</div>
				</div>
			)}
		</div>
	)
}
