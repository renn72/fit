'use client'

import * as React from 'react'

import { ExerciseRowActions } from '@/components/admin/exercise/exercise-row-actions'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Badge } from '@fit/components/ui/badge'
import { Button } from '@fit/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@fit/components/ui/card'
import { Checkbox } from '@fit/components/ui/checkbox'
import { Input } from '@fit/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@fit/components/ui/tabs'
import { useDataTable } from '@/hooks/use-data-table'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import {
	BarbellIcon,
	ClockCountdownIcon,
	ListIcon,
	SquaresFourIcon,
	TargetIcon,
} from '@phosphor-icons/react'
import _ from 'lodash'

interface Exercise {
	id: string
	name: string
	isSuperSet: boolean
	movementId: string | null
	movementName: string | null
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
	superSetExercises: Array<{
		id: string
		exerciseId: string
		order: number
		exercise: {
			id: string
			name: string
			movementName: string | null
			sets: number | null
			reps: number | null
			repUnit: string | null
		} | null
	}>
	createdAt: Date
}

const columnHelper = createColumnHelper<Exercise>()

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
	columnHelper.accessor('isSuperSet', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Superset' />
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getValue('isSuperSet')}
				disabled
				aria-label='Is superset'
			/>
		),
		meta: {
			label: 'Superset',
			variant: 'boolean',
		},
	}),
	columnHelper.accessor('movementName', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Movement' />
		),
		cell: ({ row }) => row.getValue('movementName') || '-',
		meta: {
			label: 'Movement',
			variant: 'text',
		},
	}),
	columnHelper.accessor('sets', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Sets' />
		),
		meta: {
			label: 'Sets',
			variant: 'number',
		},
	}),
	columnHelper.accessor('reps', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Reps' />
		),
		meta: {
			label: 'Reps',
			variant: 'number',
		},
	}),
	columnHelper.accessor('ormPercent', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='% 1RM' />
		),
		cell: ({ row }) => {
			const value = row.getValue('ormPercent') as number | null
			return value ? `${value}%` : '-'
		},
		meta: {
			label: '% 1RM',
			variant: 'number',
		},
	}),
	columnHelper.accessor('targetRpe', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Target RPE' />
		),
		cell: ({ row }) => row.getValue('targetRpe') || '-',
		meta: {
			label: 'Target RPE',
			variant: 'number',
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
		cell: ({ row }) => <ExerciseRowActions row={row} />,
	}),
]

const route = getRouteApi('/$orgSlug/exercises')

export function ExercisesPage() {
	const { session } = route.useRouteContext()
	const userOrgId = session.user.organisationId

	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <ExercisesContent userOrgId={userOrgId} />
}

function ExercisesContent({ userOrgId }: { userOrgId: string }) {
	const { orgSlug } = route.useParams()
	const { data: exercises } = useSuspenseQuery(
		orpc.exercise.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const navigate = route.useNavigate()
	const { view, q, page, perPage, sort } = route.useSearch()
	const exercisesData = (exercises as Exercise[]) ?? []

	const { paginatedData, pageCount, totalCount } = React.useMemo(() => {
		const processed = [...exercisesData]
		const normalizedQuery = q.trim().toLowerCase()
		const filtered =
			normalizedQuery.length === 0
				? processed
				: processed.filter((exercise) => {
						const nameMatch = exercise.name
							.toLowerCase()
							.includes(normalizedQuery)
						const movementMatch = (exercise.movementName ?? '')
							.toLowerCase()
							.includes(normalizedQuery)
						const memberMatch = (exercise.superSetExercises ?? []).some(
							(link) =>
								(link.exercise?.name ?? '')
									.toLowerCase()
									.includes(normalizedQuery),
						)
						return nameMatch || movementMatch || memberMatch
					})

		if (sort && sort.length > 0) {
			const { id, desc } = sort[0]
			filtered.sort((a, b) => {
				const aValue = a[id as keyof Exercise]
				const bValue = b[id as keyof Exercise]

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
	}, [exercisesData, page, perPage, q, sort])

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
			to: '/$orgSlug/exercises',
			params: { orgSlug },
			search: (prev) => ({ ...prev, view: newView as 'table' | 'grid' }),
			replace: true,
		})
	}

	const handleSearchChange = (value: string) => {
		navigate({
			to: '/$orgSlug/exercises',
			params: { orgSlug },
			search: (prev) => ({ ...prev, q: value, page: 1 }),
			replace: true,
		})
	}

	return (
		<div className='flex h-full w-full flex-col gap-4 p-4'>
			<div className='flex items-center justify-between'>
				<h1 className='text-2xl font-bold tracking-tight'>Exercises</h1>
				<Link to='/$orgSlug/exercises/create' params={{ orgSlug }}>
					<Button>Create Exercise</Button>
				</Link>
			</div>

			<div className='w-full max-w-sm'>
				<Input
					value={q}
					onChange={(event) => handleSearchChange(event.target.value)}
					placeholder='Search by name, movement, or superset member...'
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
					<ExercisesGridView
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

interface ExercisesGridViewProps {
	data: Exercise[]
	page: number
	perPage: number
	total: number
}

function ExercisesGridView({
	data,
	page,
	perPage,
	total,
}: ExercisesGridViewProps) {
	const totalPages = Math.ceil(total / perPage)

	return (
		<div className='flex flex-col gap-4'>
			<div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
				{data.map((exercise) => (
					<Card
						key={exercise.id}
						className='overflow-hidden border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md'
					>
						<CardHeader className='space-y-3 border-b bg-gradient-to-r from-orange-50/70 to-cyan-50/70 pb-4 dark:from-orange-950/20 dark:to-cyan-950/20'>
							<div className='flex items-start justify-between gap-3'>
								<div className='min-w-0'>
									<CardTitle className='truncate text-lg leading-tight'>
										{exercise.name}
									</CardTitle>
									<p className='text-xs text-muted-foreground'>
										{new Date(exercise.createdAt).toLocaleDateString()}
									</p>
								</div>
								<ExerciseRowActions
									exercise={{ id: exercise.id, name: exercise.name }}
									buttonClassName='h-8 w-8'
								/>
							</div>

							<div className='flex flex-wrap gap-1'>
								{exercise.isSuperSet ? (
									<Badge variant='default'>Superset</Badge>
								) : exercise.movementName ? (
									<Badge variant='secondary'>{exercise.movementName}</Badge>
								) : (
									<Badge variant='outline'>No movement</Badge>
								)}
							</div>
						</CardHeader>

						<CardContent className='space-y-4 pt-4'>
							{exercise.isSuperSet ? (
								<>
									<div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
										<div className='rounded-lg border bg-pink-50/80 p-2 dark:bg-pink-950/20'>
											<div className='text-[11px] text-muted-foreground'>
												RPE
											</div>
											<div className='text-sm font-semibold text-pink-700 dark:text-pink-300'>
												{exercise.targetRpe ?? '-'}
											</div>
										</div>
										<div className='rounded-lg border bg-cyan-50/80 p-2 dark:bg-cyan-950/20'>
											<div className='text-[11px] text-muted-foreground'>
												Rest
											</div>
											<div className='text-sm font-semibold text-cyan-700 dark:text-cyan-300'>
												{exercise.restTime ?? '-'} {exercise.restUnit || ''}
											</div>
										</div>
										<div className='rounded-lg border bg-violet-50/80 p-2 dark:bg-violet-950/20'>
											<div className='text-[11px] text-muted-foreground'>
												Members
											</div>
											<div className='text-sm font-semibold text-violet-700 dark:text-violet-300'>
												{exercise.superSetExercises?.length ?? 0}
											</div>
										</div>
									</div>

									<div className='space-y-2 rounded-xl border bg-muted/20 p-3 text-sm'>
										<div className='font-medium text-muted-foreground'>
											Superset exercises
										</div>
										{exercise.superSetExercises?.length ? (
											exercise.superSetExercises.map((link) => (
												<div
													key={link.id}
													className='flex items-center justify-between rounded-md border bg-background px-2 py-1.5'
												>
													<div className='min-w-0'>
														<p className='truncate font-medium'>
															{link.exercise?.name ?? 'Unknown exercise'}
														</p>
														{link.exercise?.movementName && (
															<p className='truncate text-xs text-muted-foreground'>
																{link.exercise.movementName}
															</p>
														)}
													</div>
													{link.exercise && (
														<span className='text-xs text-muted-foreground'>
															{link.exercise.sets ?? '-'} x{' '}
															{link.exercise.reps ?? '-'}{' '}
															{link.exercise.repUnit ?? ''}
														</span>
													)}
												</div>
											))
										) : (
											<p className='text-muted-foreground'>
												No member exercises configured.
											</p>
										)}
									</div>

									{exercise.notes && (
										<div className='flex items-start gap-2 rounded-xl border bg-muted/20 p-3 text-sm'>
											<BarbellIcon className='mt-0.5 size-4 text-orange-600 dark:text-orange-300' />
											<p className='line-clamp-2 text-muted-foreground'>
												{exercise.notes}
											</p>
										</div>
									)}
								</>
							) : (
								<>
									<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
										<div className='rounded-lg border bg-orange-50/80 p-2 dark:bg-orange-950/20'>
											<div className='text-[11px] text-muted-foreground'>
												Volume
											</div>
											<div className='text-sm font-semibold text-orange-700 dark:text-orange-300'>
												{exercise.sets ?? '-'} x {exercise.reps ?? '-'}
											</div>
										</div>
										<div className='rounded-lg border bg-emerald-50/80 p-2 dark:bg-emerald-950/20'>
											<div className='text-[11px] text-muted-foreground'>
												Unit
											</div>
											<div className='text-sm font-semibold text-emerald-700 dark:text-emerald-300'>
												{exercise.repUnit || '-'}
											</div>
										</div>
										<div className='rounded-lg border bg-sky-50/80 p-2 dark:bg-sky-950/20'>
											<div className='text-[11px] text-muted-foreground'>
												% 1RM
											</div>
											<div className='text-sm font-semibold text-sky-700 dark:text-sky-300'>
												{exercise.ormPercent ? `${exercise.ormPercent}%` : '-'}
											</div>
										</div>
										<div className='rounded-lg border bg-pink-50/80 p-2 dark:bg-pink-950/20'>
											<div className='text-[11px] text-muted-foreground'>
												RPE
											</div>
											<div className='text-sm font-semibold text-pink-700 dark:text-pink-300'>
												{exercise.targetRpe ?? '-'}
											</div>
										</div>
									</div>

									<div className='space-y-2 rounded-xl border bg-muted/20 p-3 text-sm'>
										<div className='flex items-center gap-2'>
											<ClockCountdownIcon className='size-4 text-cyan-600 dark:text-cyan-300' />
											<span>
												Rest: {exercise.restTime ?? '-'}{' '}
												{exercise.restUnit || ''}
											</span>
										</div>
										<div className='flex items-center gap-2'>
											<TargetIcon className='size-4 text-emerald-600 dark:text-emerald-300' />
											<span>
												Tempo: {exercise.tempoDown ?? '-'} /{' '}
												{exercise.tempoPause ?? '-'} / {exercise.tempoUp ?? '-'}
											</span>
										</div>
										{exercise.notes && (
											<div className='flex items-start gap-2'>
												<BarbellIcon className='mt-0.5 size-4 text-orange-600 dark:text-orange-300' />
												<p className='line-clamp-2 text-muted-foreground'>
													{exercise.notes}
												</p>
											</div>
										)}
									</div>
								</>
							)}
						</CardContent>
					</Card>
				))}
			</div>

			{totalPages > 1 && (
				<div className='flex items-center justify-between px-2'>
					<div className='text-sm text-muted-foreground'>
						Showing {(page - 1) * perPage + 1} to{' '}
						{Math.min(page * perPage, total)} of {total} exercises
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
