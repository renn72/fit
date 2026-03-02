'use client'

import * as React from 'react'

import { ExerciseRowActions } from '@/components/admin/exercise/exercise-row-actions'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDataTable } from '@/hooks/use-data-table'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import _ from 'lodash'

interface Exercise {
	id: string
	name: string
	movementName: string | null
	sets: number | null
	reps: number | null
	ormPercent: number | null
	targetRpe: number | null
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

export function ExercisesTable() {
	const { session } = route.useRouteContext()
	const userOrgId = session.user.organisationId

	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <Table userOrgId={userOrgId} />
}

function Table({ userOrgId }: { userOrgId: string }) {
	const { orgSlug } = route.useParams()
	const navigate = route.useNavigate()
	const { q, page, perPage, sort } = route.useSearch()
	const { data: exercises } = useSuspenseQuery(
		orpc.exercise.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const exercisesData = (exercises as Exercise[]) ?? []

	const { paginatedData, pageCount } = React.useMemo(() => {
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
						return nameMatch || movementMatch
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

		return { paginatedData, pageCount }
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
					placeholder='Search by name or movement...'
				/>
			</div>

			<DataTable table={table}>
				<DataTableAdvancedToolbar table={table} className='border-b' />
			</DataTable>
		</div>
	)
}
