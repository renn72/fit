'use client'

import * as React from 'react'

import { IngredientRowActions } from '@/components/admin/ingredient/ingredient-row-actions'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDataTable } from '@/hooks/use-data-table'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import _ from 'lodash'

interface Ingredient {
	id: string
	name: string
	category: string | null
	calories: number
	protein: number
	fat: number
	carbohydrate: number
	serveSize: number
	serveUnit: string
	createdAt: Date
	isBase: boolean
	isOverwriteBase: boolean
	creatorName: string
}

const columnHelper = createColumnHelper<Ingredient>()

function splitCategories(category: string | null): string[] {
	if (!category) return []
	return category
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
	columnHelper.accessor('category', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Category' />
		),
		cell: ({ row }) => {
			const categories = splitCategories(
				row.getValue('category') as string | null,
			)
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
	columnHelper.accessor('creatorName', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Created By' />
		),
		cell: ({ row }) => row.getValue('creatorName') || 'Unknown',
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
		cell: ({ row }) => <IngredientRowActions row={row} />,
	}),
]

const route = getRouteApi('/$orgSlug/ingredients')

export function IngredientsTable() {
	const { session } = route.useRouteContext()

	const userOrgId = session.user.organisationId
	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <Table userOrgId={userOrgId} />
}

const Table = ({ userOrgId }: { userOrgId: string }) => {
	const { orgSlug } = route.useParams()
	const navigate = route.useNavigate()
	const { data: ingredients } = useSuspenseQuery(
		orpc.ingredient.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const { q, page, perPage, sort } = route.useSearch()
	const ingredientsData = (ingredients as Ingredient[]) ?? []

	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...ingredientsData]
		const normalizedQuery = q.trim().toLowerCase()
		const filtered =
			normalizedQuery.length === 0
				? processed
				: processed.filter((ingredient) => {
						const name = ingredient.name.toLowerCase()
						const category = (ingredient.category ?? '').toLowerCase()
						return (
							name.includes(normalizedQuery) ||
							category.includes(normalizedQuery)
						)
					})

		if (sort && sort.length > 0) {
			const { id, desc } = sort[0]
			filtered.sort((a, b) => {
				const aValue = a[id as keyof Ingredient]
				const bValue = b[id as keyof Ingredient]

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
	}, [ingredientsData, page, perPage, q, sort])

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
			to: '/$orgSlug/ingredients',
			params: { orgSlug },
			search: (prev) => ({ ...prev, q: value, page: 1 }),
			replace: true,
		})
	}

	return (
		<div className='flex flex-col gap-4 p-4 w-full h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold tracking-tight'>Ingredients</h1>
				<Link to='/$orgSlug/ingredients/create' params={{ orgSlug }}>
					<Button className='cursor-pointer'>Create Ingredient</Button>
				</Link>
			</div>
			<div className='w-full max-w-sm'>
				<Input
					value={q}
					onChange={(event) => handleSearchChange(event.target.value)}
					placeholder='Search by name or category...'
				/>
			</div>
			<DataTable table={table}>
				<DataTableAdvancedToolbar table={table} className='border-b' />
			</DataTable>
		</div>
	)
}
