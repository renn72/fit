'use client'

import * as React from 'react'

import { RecipeRowActions } from '@/components/admin/recipe/recipe-row-actions'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDataTable } from '@/hooks/use-data-table'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import _ from 'lodash'

interface Recipe {
	id: string
	name: string
	description: string | null
	category: string | null
	image: string | null
	metaTags: string
	createdAt: Date
	creatorName?: string
}

const columnHelper = createColumnHelper<Recipe>()

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
		cell: ({ row }) => (
			<div className='max-w-60 truncate'>
				{(row.getValue('description') as string | null) ?? '-'}
			</div>
		),
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
	columnHelper.accessor('metaTags', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Tags' />
		),
		cell: ({ row }) => {
			const tags = splitCsv(row.getValue('metaTags') as string)
			if (tags.length === 0) {
				return <span className='text-muted-foreground'>-</span>
			}

			return (
				<div className='flex flex-wrap gap-1'>
					{tags.slice(0, 3).map((tag) => (
						<Badge key={tag} variant='outline'>
							{tag}
						</Badge>
					))}
					{tags.length > 3 && (
						<span className='text-xs text-muted-foreground'>
							+{tags.length - 3} more
						</span>
					)}
				</div>
			)
		},
		meta: {
			label: 'Tags',
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
		cell: ({ row }) => (
			<RecipeRowActions
				recipe={{
					id: row.original.id,
					name: row.original.name,
				}}
			/>
		),
	}),
]

const route = getRouteApi('/$orgSlug/recipes')

export function RecipesTable() {
	const { session } = route.useRouteContext()

	const userOrgId = session.user.organisationId
	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <Table userOrgId={userOrgId} />
}

function Table({ userOrgId }: { userOrgId: string }) {
	const navigate = route.useNavigate()
	const { orgSlug } = route.useParams()
	const { data: recipes } = useSuspenseQuery(
		orpc.recipe.getOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const { q, page, perPage, sort } = route.useSearch()
	const recipesData = (recipes as Recipe[]) ?? []

	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...recipesData]
		const normalizedQuery = q.trim().toLowerCase()
		const filtered =
			normalizedQuery.length === 0
				? processed
				: processed.filter((recipe) => {
						const nameMatch = recipe.name
							.toLowerCase()
							.includes(normalizedQuery)
						const categoryMatch = (recipe.category ?? '')
							.toLowerCase()
							.includes(normalizedQuery)
						return nameMatch || categoryMatch
					})

		if (sort && sort.length > 0) {
			const { id, desc } = sort[0]
			filtered.sort((a, b) => {
				const aValue = a[id as keyof Recipe]
				const bValue = b[id as keyof Recipe]

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
	}, [recipesData, q, page, perPage, sort])

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
			to: '/$orgSlug/recipes',
			params: { orgSlug },
			search: (prev) => ({ ...prev, q: value, page: 1 }),
			replace: true,
		})
	}

	return (
		<div className='flex flex-col gap-4 p-4 w-full h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold tracking-tight'>Recipes</h1>
				<Link to='/$orgSlug/recipes/create' params={{ orgSlug }}>
					<Button>Create Recipe</Button>
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
				<DataTableAdvancedToolbar table={table} className='border-b'>
					<DataTableFilterList table={table} />
				</DataTableAdvancedToolbar>
			</DataTable>
		</div>
	)
}
