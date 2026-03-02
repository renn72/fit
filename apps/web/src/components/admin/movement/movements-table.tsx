'use client'

import * as React from 'react'

import { MovementRowActions } from '@/components/admin/movement/movement-row-actions'
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

interface Movement {
	id: string
	name: string
	level: string | null
	category: string | null
	equipment: string | null
	primaryMuscles: string | null
	createdAt: Date
	isBase: boolean
}

const columnHelper = createColumnHelper<Movement>()

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
	columnHelper.accessor('level', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Level' />
		),
		cell: ({ row }) => {
			const levels = splitCsv(row.getValue('level') as string | null)
			return levels.length > 0 ? levels.join(', ') : '-'
		},
		meta: {
			label: 'Level',
			variant: 'text',
		},
	}),
	columnHelper.accessor('equipment', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Equipment' />
		),
		cell: ({ row }) => row.getValue('equipment') || '-',
		meta: {
			label: 'Equipment',
			variant: 'text',
		},
	}),
	columnHelper.accessor('primaryMuscles', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Primary Muscles' />
		),
		cell: ({ row }) => (
			<div className='max-w-52 truncate'>
				{row.getValue('primaryMuscles') || '-'}
			</div>
		),
		meta: {
			label: 'Primary Muscles',
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
		cell: ({ row }) => <MovementRowActions row={row} />,
	}),
]

const route = getRouteApi('/$orgSlug/movements')

export function MovementsTable() {
	const { session } = route.useRouteContext()
	const userOrgId = session.user.organisationId

	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <Table userOrgId={userOrgId} />
}

function Table({ userOrgId }: { userOrgId: string }) {
	const { orgSlug } = route.useParams()
	const navigate = route.useNavigate()
	const { q, page, perPage, sort } = route.useSearch()
	const { data: movements } = useSuspenseQuery(
		orpc.movement.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const movementsData = (movements as Movement[]) ?? []

	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...movementsData]
		const normalizedQuery = q.trim().toLowerCase()
		const filtered =
			normalizedQuery.length === 0
				? processed
				: processed.filter((movement) => {
						const nameMatch = movement.name
							.toLowerCase()
							.includes(normalizedQuery)
						const categoryMatch = (movement.category ?? '')
							.toLowerCase()
							.includes(normalizedQuery)
						return nameMatch || categoryMatch
					})

		if (sort && sort.length > 0) {
			const { id, desc } = sort[0]
			filtered.sort((a, b) => {
				const aValue = a[id as keyof Movement]
				const bValue = b[id as keyof Movement]

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
	}, [movementsData, page, perPage, q, sort])

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
			to: '/$orgSlug/movements',
			params: { orgSlug },
			search: (prev) => ({ ...prev, q: value, page: 1 }),
			replace: true,
		})
	}

	return (
		<div className='flex h-full w-full flex-col gap-4 p-4'>
			<div className='flex items-center justify-between'>
				<h1 className='text-2xl font-bold tracking-tight'>Movements</h1>
				<Link to='/$orgSlug/movements/create' params={{ orgSlug }}>
					<Button>Create Movement</Button>
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
