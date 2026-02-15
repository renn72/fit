import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list'
import { Checkbox } from '@/components/ui/checkbox'
import { getUserForce } from '@/functions/get-user-force'
import { useDataTable } from '@/hooks/use-data-table'
import { getSortingStateParser } from '@/lib/parsers'
import { orpc } from '@/utils/orpc'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
	createColumnHelper,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table'
import { parseAsInteger, useQueryState } from 'nuqs'
import * as React from 'react'

export const Route = createFileRoute('/$orgSlug/admin/s/ingredients')({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await getUserForce()
		return { session }
	},
})

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
	createdAt: number
	isBase: boolean
	isOverwriteBase: boolean
}

const columnHelper = createColumnHelper<Ingredient>()

const columns = [
	columnHelper.accessor('name', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label="Name" />
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
			<DataTableColumnHeader column={column} label="Calories" />
		),
		meta: {
			label: 'Calories',
			variant: 'number',
		},
	}),
	columnHelper.accessor('protein', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label="Protein" />
		),
		meta: {
			label: 'Protein',
			variant: 'number',
		},
	}),
	columnHelper.accessor('fat', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label="Fat" />
		),
		meta: {
			label: 'Fat',
			variant: 'number',
		},
	}),
	columnHelper.accessor('carbohydrate', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label="Carbs" />
		),
		meta: {
			label: 'Carbs',
			variant: 'number',
		},
	}),
	columnHelper.accessor('serveSize', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label="Serve Size" />
		),
		meta: {
			label: 'Serve Size',
			variant: 'number',
		},
	}),
	columnHelper.accessor('serveUnit', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label="Unit" />
		),
		meta: {
			label: 'Unit',
			variant: 'text',
		},
	}),
	columnHelper.accessor('createdAt', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label="Created At" />
		),
		cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString(),
		meta: {
			label: 'Created At',
			variant: 'date',
		},
	}),
	columnHelper.accessor('isBase', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label="Is Base" />
		),
		cell: ({ row }) => (
			<Checkbox checked={row.getValue('isBase')} disabled aria-label="Is Base" />
		),
		meta: {
			label: 'Is Base',
			variant: 'boolean',
		},
	}),
	columnHelper.accessor('isOverwriteBase', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label="Overwrite Base" />
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getValue('isOverwriteBase')}
				disabled
				aria-label="Overwrite Base"
			/>
		),
		meta: {
			label: 'Overwrite Base',
			variant: 'boolean',
		},
	}),
]

function RouteComponent() {
	const { orgSlug } = Route.useParams()
	const { session } = Route.useRouteContext()

	// We need to resolve the orgId from the session based on the slug.
	// Assuming user can only access their own org for now or we check if slug matches.
	// The session user object has organisationSlug and organisationId.

	const userOrgId =
		session?.user?.organisationSlug === orgSlug
			? session?.user?.organisationId
			: undefined

	const { data: ingredients, isLoading: isIngredientsLoading } = useQuery(
		orpc.ingredient.getAllOrg.queryOptions({
			input: { organisationId: userOrgId! },
			enabled: userOrgId !== undefined,
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
		getRowId: (originalRow, index) => originalRow.id,
		initialState: {
			sorting: [{ id: 'createdAt', desc: true }],
			columnPinning: { right: ['actions'] },
		},
	})

	if (userOrgId && isIngredientsLoading) {
		return <div className="p-4">Loading...</div>
	}

	if (!userOrgId) {
		return <div className="p-4">Organisation not found or access denied.</div>
	}

	return (
		<div className="flex flex-col gap-4 p-4 w-full h-full">
			<div className="flex justify-between items-center">
				<h1 className="text-2xl font-bold tracking-tight">Ingredients</h1>
			</div>
			<DataTable table={table}>
				<DataTableAdvancedToolbar table={table} className="border-b">
					<DataTableFilterList table={table} />
				</DataTableAdvancedToolbar>
			</DataTable>
		</div>
	)
}
