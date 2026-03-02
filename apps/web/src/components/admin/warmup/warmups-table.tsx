'use client'

import * as React from 'react'

import { WarmupRowActions } from '@/components/admin/warmup/warmup-row-actions'
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

interface WarmupGroup {
	id: string
	name: string
	description: string | null
	warmupCount: number
	creatorName: string | null
	createdAt: Date
	warmups: Array<{
		id: string
		name: string
	}>
}

const columnHelper = createColumnHelper<WarmupGroup>()

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
		cell: ({ row }) => {
			const description = row.getValue('description') as string | null
			return description ? (
				<div className='max-w-72 truncate'>{description}</div>
			) : (
				'-'
			)
		},
		meta: {
			label: 'Description',
			variant: 'text',
		},
	}),
	columnHelper.accessor('warmupCount', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Warmups' />
		),
		meta: {
			label: 'Warmups',
			variant: 'number',
		},
	}),
	columnHelper.accessor('creatorName', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Creator' />
		),
		cell: ({ row }) => row.getValue('creatorName') || 'Unknown',
		meta: {
			label: 'Creator',
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
		cell: ({ row }) => <WarmupRowActions row={row} />,
	}),
]

const route = getRouteApi('/$orgSlug/warmups')

export function WarmupsTable() {
	const { session } = route.useRouteContext()
	const userOrgId = session.user.organisationId

	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <Table userOrgId={userOrgId} />
}

function Table({ userOrgId }: { userOrgId: string }) {
	const { orgSlug } = route.useParams()
	const navigate = route.useNavigate()
	const { q, page, perPage, sort } = route.useSearch()
	const { data: groups } = useSuspenseQuery(
		orpc.warmup.getAllGroups.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const groupsData: WarmupGroup[] = React.useMemo(() => {
		return (groups ?? []).map((group) => ({
			id: group.id,
			name: group.name,
			description: group.description,
			warmupCount: group.warmups?.length ?? 0,
			creatorName: group.creator?.name ?? null,
			createdAt: group.createdAt,
			warmups: (group.warmups ?? []).map((warmup) => ({
				id: warmup.id,
				name: warmup.name,
			})),
		}))
	}, [groups])

	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...groupsData]
		const normalizedQuery = q.trim().toLowerCase()
		const filtered =
			normalizedQuery.length === 0
				? processed
				: processed.filter((group) => {
						const nameMatch = group.name.toLowerCase().includes(normalizedQuery)
						const descriptionMatch = (group.description ?? '')
							.toLowerCase()
							.includes(normalizedQuery)
						const warmupMatch = group.warmups.some((warmup) =>
							warmup.name.toLowerCase().includes(normalizedQuery),
						)
						return nameMatch || descriptionMatch || warmupMatch
					})

		if (sort && sort.length > 0) {
			const { id, desc } = sort[0]
			filtered.sort((a, b) => {
				const aValue = a[id as keyof WarmupGroup]
				const bValue = b[id as keyof WarmupGroup]

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
	}, [groupsData, page, perPage, q, sort])

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
			to: '/$orgSlug/warmups',
			params: { orgSlug },
			search: (prev) => ({ ...prev, q: value, page: 1 }),
			replace: true,
		})
	}

	return (
		<div className='flex h-full w-full flex-col gap-4 p-4'>
			<div className='flex items-center justify-between'>
				<h1 className='text-2xl font-bold tracking-tight'>Warmups</h1>
				<Link to='/$orgSlug/warmups/create' params={{ orgSlug }}>
					<Button>Create Warmup Group</Button>
				</Link>
			</div>

			<div className='w-full max-w-sm'>
				<Input
					value={q}
					onChange={(event) => handleSearchChange(event.target.value)}
					placeholder='Search by name, description, or exercise...'
				/>
			</div>

			<DataTable table={table}>
				<DataTableAdvancedToolbar table={table} className='border-b' />
			</DataTable>
		</div>
	)
}
