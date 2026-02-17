'use client'

import * as React from 'react'

import { IngredientCreateDialog } from '@/components/admin/ingredient-create-dialog'
import { IngredientRowActions } from '@/components/admin/ingredient-row-actions'
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
interface Ingredient {
	id: string
	name: string
	calories: number
	protein: number
	fat: number
	carbohydrate: number
	serveSize: number
	serveUnit: string
	createdAt: Date
	isBase: boolean
	isOverwriteBase: boolean
}

const columnHelper = createColumnHelper<Ingredient>()

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
	columnHelper.accessor('calories', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Calories' />
		),
		meta: {
			label: 'Calories',
			variant: 'number',
		},
		cell: ({ row }) => {
			const value = row.getValue('calories') as number
			return value.toFixed(1)
		},
	}),
	columnHelper.accessor('protein', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Protein' />
		),
		meta: {
			label: 'Protein',
			variant: 'number',
		},
		cell: ({ row }) => {
			const value = row.getValue('protein') as number
			return value.toFixed(1)
		},
	}),
	columnHelper.accessor('fat', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Fat' />
		),
		meta: {
			label: 'Fat',
			variant: 'number',
		},
		cell: ({ row }) => {
			const value = row.getValue('fat') as number
			return value.toFixed(1)
		},
	}),
	columnHelper.accessor('carbohydrate', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Carbs' />
		),
		meta: {
			label: 'Carbs',
			variant: 'number',
		},
		cell: ({ row }) => {
			const value = row.getValue('carbohydrate') as number
			return value.toFixed(1)
		},
	}),
	columnHelper.accessor('serveSize', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Serve Size' />
		),
		meta: {
			label: 'Serve Size',
			variant: 'number',
		},
	}),
	columnHelper.accessor('serveUnit', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Unit' />
		),
		meta: {
			label: 'Unit',
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
			<div className='w-10'>
				<Checkbox
					checked={row.getValue('isBase')}
					disabled
					aria-label='Is Base'
				/>
			</div>
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
	columnHelper.display({
		id: 'actions',
		cell: ({ row }) => <IngredientRowActions row={row} />,
	}),
]

const route = getRouteApi('/$orgSlug/admin/s/ingredients')

export function IngredientsTable() {
	const { session } = route.useRouteContext()

	const userOrgId = session.user.organisationId
	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <Table userOrgId={userOrgId} />
}

const Table = ({ userOrgId }: { userOrgId: string }) => {
	const { data: ingredients } = useSuspenseQuery(
		orpc.ingredient.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const [page] = useQueryState('page', parseAsInteger.withDefault(1))
	const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10))
	const [sorting] = useQueryState(
		'sort',
		getSortingStateParser<Ingredient>(
			columns
				.map((c) => (c as any).accessorKey)
				.filter((key): key is string => !!key),
		).withDefault([{ id: 'createdAt', desc: true }]),
	)

	const ingredientsData = (ingredients as Ingredient[]) ?? []

	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...ingredientsData]

		if (sorting && sorting.length > 0) {
			const { id, desc } = sorting[0]
			processed.sort((a, b) => {
				const aValue = a[id as keyof Ingredient]
				const bValue = b[id as keyof Ingredient]

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
	}, [ingredientsData, page, perPage, sorting])

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
		<div className='flex flex-col gap-4 p-4 w-full h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold tracking-tight'>Ingredients</h1>
				<IngredientCreateDialog />
			</div>
			<DataTable table={table}>
				<DataTableAdvancedToolbar table={table} className='border-b'>
					<DataTableFilterList table={table} />
				</DataTableAdvancedToolbar>
			</DataTable>
		</div>
	)
}
