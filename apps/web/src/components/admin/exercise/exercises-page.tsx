'use client'

import * as React from 'react'

import { ExerciseCreateDialog } from '@/components/admin/exercise/exercise-create-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list'
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
import { getRouteApi } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import {
	BarbellIcon,
	ListIcon,
	SquaresFourIcon,
	TargetIcon,
	TimerIcon,
} from '@phosphor-icons/react'
import _ from 'lodash'
import { parseAsInteger, useQueryState } from 'nuqs'

interface Exercise {
	id: string
	name: string
	movementName: string | null
	sets: number | null
	reps: number | null
	repUnit: string | null
	ormPercent: number | null
	targetRpe: number | null
	restTime: number | null
	restUnit: string | null
	createdAt: Date
}

const columnHelper = createColumnHelper<Exercise>()

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
	columnHelper.accessor('movementName', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Movement' />
		),
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
	columnHelper.accessor('repUnit', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Rep Unit' />
		),
		meta: {
			label: 'Rep Unit',
			variant: 'text',
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
			<DataTableColumnHeader column={column} label='TargetIcon RPE' />
		),
		meta: {
			label: 'TargetIcon RPE',
			variant: 'number',
		},
	}),
	columnHelper.accessor('restTime', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Rest' />
		),
		cell: ({ row }) => {
			const time = row.getValue('restTime') as number | null
			const unit = row.original.repUnit
			return time ? `${time} ${unit || 's'}` : '-'
		},
		meta: {
			label: 'Rest',
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

const route = getRouteApi('/$orgSlug/exercises')

export function ExercisesPage() {
	const { session } = route.useRouteContext()

	const userOrgId = session.user.organisationId
	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <ExercisesContent userOrgId={userOrgId} />
}

function ExercisesContent({ userOrgId }: { userOrgId: string }) {
	const { data: exercises } = useSuspenseQuery(
		orpc.exercise.getAllOrg.queryOptions({
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
		getSortingStateParser<Exercise>(
			columns
				.map((c) => (c as any).accessorKey)
				.filter((key): key is string => !!key),
		).withDefault([{ id: 'createdAt', desc: true }]),
	)

	const exercisesData = (exercises as Exercise[]) ?? []

	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...exercisesData]

		if (sorting && sorting.length > 0) {
			const { id, desc } = sorting[0]
			processed.sort((a, b) => {
				const aValue = a[id as keyof Exercise]
				const bValue = b[id as keyof Exercise]

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
	}, [exercisesData, page, perPage, sorting])

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
				<h1 className='text-2xl font-bold tracking-tight'>Exercises</h1>
				<ExerciseCreateDialog />
			</div>

			<Tabs
				value={viewMode}
				onValueChange={(v) => void setViewMode(v)}
				className='w-full'
			>
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
					<ExercisesGridView
						data={paginatedData}
						page={page}
						perPage={perPage}
						total={exercisesData.length}
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
			<div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
				{data.map((exercise) => (
					<Card key={exercise.id} className='flex flex-col'>
						<CardHeader className='pb-3'>
							<CardTitle className='text-lg'>{exercise.name}</CardTitle>
							{exercise.movementName && (
								<CardDescription className='flex gap-1 items-center'>
									<BarbellIcon className='size-3' />
									{exercise.movementName}
								</CardDescription>
							)}
						</CardHeader>
						<CardContent className='flex-1'>
							<div className='grid grid-cols-2 gap-3'>
								<div className='flex gap-2 items-center'>
									<TargetIcon className='text-blue-500 size-4' />
									<span className='text-sm'>
										{exercise.sets ?? '-'} x {exercise.reps ?? '-'}{' '}
										{exercise.repUnit}
									</span>
								</div>
								{exercise.ormPercent && (
									<div className='flex gap-2 items-center'>
										<BarbellIcon className='text-green-500 size-4' />
										<span className='text-sm'>{exercise.ormPercent}% 1RM</span>
									</div>
								)}
								{exercise.targetRpe && (
									<div className='flex gap-2 items-center'>
										<TargetIcon className='text-orange-500 size-4' />
										<span className='text-sm'>RPE {exercise.targetRpe}</span>
									</div>
								)}
								{exercise.restTime && (
									<div className='flex gap-2 items-center'>
										<TimerIcon className='text-purple-500 size-4' />
										<span className='text-sm'>
											{exercise.restTime} {exercise.restUnit || 's'}
										</span>
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{totalPages > 1 && (
				<div className='flex justify-between items-center px-2'>
					<div className='text-sm text-muted-foreground'>
						Showing {(page - 1) * perPage + 1} to{' '}
						{Math.min(page * perPage, total)} of {total} exercises
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
