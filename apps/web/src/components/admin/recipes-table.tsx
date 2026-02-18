'use client'

import * as React from 'react'

import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list'
import { Button } from '@/components/ui/button'
import { useDataTable } from '@/hooks/use-data-table'
import { getSortingStateParser } from '@/lib/parsers'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import _ from 'lodash'
import { parseAsInteger, useQueryState } from 'nuqs'

// Define the shape of our data
interface Recipe {
	id: string
	name: string
	description: string
	category: string | null
	image: string | null
	metaTags: string
	createdAt: Date
	creatorName?: string
}

const columnHelper = createColumnHelper<Recipe>()

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
			<div className='max-w-60 truncate'>{row.getValue('description')}</div>
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
			const tags = row.getValue('metaTags') as string
			if (!tags) return null
			const tagList = tags.split(',').filter(Boolean).slice(0, 3)
			return (
				<div className='flex flex-wrap gap-1'>
					{tagList.map((tag, i) => (
						<span
							key={i}
							className='inline-flex items-center py-1 px-2 text-xs font-medium rounded-md ring-1 ring-inset bg-muted ring-gray-500/10'
						>
							{tag.trim()}
						</span>
					))}
					{tags.split(',').filter(Boolean).length > 3 && (
						<span className='text-xs text-muted-foreground'>
							+{tags.split(',').filter(Boolean).length - 3} more
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

const route = getRouteApi('/$orgSlug/admin/s/recipes')

export function RecipesTable() {
	const { session } = route.useRouteContext()

	const userOrgId = session.user.organisationId
	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <Table userOrgId={userOrgId} />
}

const Table = ({ userOrgId }: { userOrgId: string }) => {
	const { orgSlug } = route.useParams()
	const { data: recipes } = useSuspenseQuery(
		orpc.recipe.getOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const [page] = useQueryState('page', parseAsInteger.withDefault(1))
	const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10))
	const [sorting] = useQueryState(
		'sort',
		getSortingStateParser<Recipe>(
			columns
				.map((c) => (c as any).accessorKey)
				.filter((key): key is string => !!key),
		).withDefault([{ id: 'createdAt', desc: true }]),
	)

	const recipesData = (recipes as Recipe[]) ?? []

	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...recipesData]

		if (sorting && sorting.length > 0) {
			const { id, desc } = sorting[0]
			processed.sort((a, b) => {
				const aValue = a[id as keyof Recipe]
				const bValue = b[id as keyof Recipe]

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
	}, [recipesData, page, perPage, sorting])

	const { table } = useDataTable({
		data: paginatedData,
		columns,
		pageCount,
		getRowId: (originalRow) => originalRow.id,
		initialState: {
			sorting: [{ id: 'createdAt', desc: true }],
		},
	})

	return (
		<div className='flex flex-col gap-4 p-4 w-full h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold tracking-tight'>Recipes</h1>
			</div>
			<Link to='/$orgSlug/admin/s/recipes/create' params={{ orgSlug: orgSlug }}>
				<Button>Create</Button>
			</Link>
			<DataTable table={table}>
				<DataTableAdvancedToolbar table={table} className='border-b'>
					<DataTableFilterList table={table} />
				</DataTableAdvancedToolbar>
			</DataTable>
		</div>
	)
}
