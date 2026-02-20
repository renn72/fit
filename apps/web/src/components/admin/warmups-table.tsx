'use client'

import * as React from 'react'

import { WarmupGroupCreateDialog } from '@/components/admin/warmup-group-create-dialog'
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

interface WarmupGroup {
	id: string
	name: string
	description: string | null
	warmupCount: number
	creatorName: string | null
	createdAt: Date
}

const columnHelper = createColumnHelper<WarmupGroup>()

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
	columnHelper.accessor('description', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Description' />
		),
		cell: ({ row }) => {
			const desc = row.getValue('description') as string | null
			return desc ? (desc.length > 50 ? `${desc.slice(0, 50)}...` : desc) : '-'
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
]
const route = getRouteApi('/$orgSlug/warmups')

export function WarmupsTable() {
	const { session } = route.useRouteContext()
	const userOrgId = session.user.organisationId

	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <Table userOrgId={userOrgId} />
}

WarmupsTable.useRouteContext = () => {
	return {
		session: {
			user: {
				organisationId: null as string | null,
			},
		},
	}
}

const Table = ({ userOrgId }: { userOrgId: string }) => {
	const { data: groups } = useSuspenseQuery(
		orpc.warmup.getAllGroups.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const [page] = useQueryState('page', parseAsInteger.withDefault(1))
	const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10))
	const [sorting] = useQueryState(
		'sort',
		getSortingStateParser<WarmupGroup>(
			columns
				.map((c) => (c as any).accessorKey)
				.filter((key): key is string => !!key),
		).withDefault([{ id: 'createdAt', desc: true }]),
	)

	const groupsData: WarmupGroup[] = React.useMemo(() => {
		return (groups ?? []).map((g) => ({
			id: g.id,
			name: g.name,
			description: g.description,
			warmupCount: g.warmups?.length ?? 0,
			creatorName: g.creator?.name ?? null,
			createdAt: g.createdAt,
		}))
	}, [groups])

	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...groupsData]

		if (sorting && sorting.length > 0) {
			const { id, desc } = sorting[0]
			processed.sort((a, b) => {
				const aValue = a[id as keyof WarmupGroup]
				const bValue = b[id as keyof WarmupGroup]

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
	}, [groupsData, page, perPage, sorting])

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
				<h1 className='text-2xl font-bold tracking-tight'>Warmups</h1>
				<WarmupGroupCreateDialog />
			</div>
			<DataTable table={table}>
				<DataTableAdvancedToolbar table={table} className='border-b'>
					<DataTableFilterList table={table} />
				</DataTableAdvancedToolbar>
			</DataTable>
		</div>
	)
}
