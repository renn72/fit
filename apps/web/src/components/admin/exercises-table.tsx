'use client'

import * as React from 'react'

import { ExerciseCreateDialog } from '@/components/admin/exercise-create-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list'
import { Checkbox } from '@/components/ui/checkbox'
import { useDataTable } from '@/hooks/use-data-table'
import { getSortingStateParser } from '@/lib/parsers'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import _ from 'lodash'
import { parseAsInteger, useQueryState } from 'nuqs'

// Define the shape of our data
interface Exercise {
	id: string
	name: string
	level: string | null
	category: string
	force: string | null
	mechanic: string | null
	equipment: string | null
	primaryMuscles: string
	secondaryMuscles: string
	createdAt: Date
	isBase: boolean
	isOverwriteBase: boolean
}

const columnHelper = createColumnHelper<Exercise>()

const columns = [
	columnHelper.display({
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				//@ts-ignore
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
	columnHelper.accessor('level', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Level' />
		),
		meta: {
			label: 'Level',
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
	columnHelper.accessor('force', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Force' />
		),
		meta: {
			label: 'Force',
			variant: 'text',
		},
	}),
	columnHelper.accessor('mechanic', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Mechanic' />
		),
		meta: {
			label: 'Mechanic',
			variant: 'text',
		},
	}),
	columnHelper.accessor('equipment', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Equipment' />
		),
		meta: {
			label: 'Equipment',
			variant: 'text', // Could be select if we have a finite list
		},
	}),
	columnHelper.accessor('primaryMuscles', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Primary Muscles' />
		),
		meta: {
			label: 'Primary Muscles',
			variant: 'text',
		},
	}),
	columnHelper.accessor('secondaryMuscles', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Secondary Muscles' />
		),
		cell: ({ row }) => (
			<div className='max-w-35 truncate'>
				{row.getValue('secondaryMuscles')}
			</div>
		),
		meta: {
			label: 'Secondary Muscles',
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
	columnHelper.accessor('isBase', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Is Base' />
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getValue('isBase')}
				disabled
				aria-label='Is Base'
			/>
		),
		meta: {
			label: 'Is Base',
			variant: 'boolean',
		},
	}),
	columnHelper.accessor('isOverwriteBase', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Overwrite Base' />
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getValue('isOverwriteBase')}
				disabled
				aria-label='Overwrite Base'
			/>
		),
		meta: {
			label: 'Overwrite Base',
			variant: 'boolean',
		},
	}),
]

const route = getRouteApi('/$orgSlug/admin/s/exercises')

export function ExercisesTable() {
	const { session } = route.useRouteContext()

	const userOrgId = session.user.organisationId
	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <Table userOrgId={userOrgId} />
}

const Table = ({ userOrgId }: { userOrgId: string }) => {
	const { data: exercises } = useSuspenseQuery(
		orpc.exercise.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const [page] = useQueryState('page', parseAsInteger.withDefault(1))
	const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10))
	const [sorting] = useQueryState(
		'sort',
		getSortingStateParser<Exercise>(
			columns
				// TODO any
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
			<DataTable table={table}>
				<DataTableAdvancedToolbar table={table} className='border-b'>
					<DataTableFilterList table={table} />
				</DataTableAdvancedToolbar>
			</DataTable>
		</div>
	)
}
