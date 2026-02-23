'use client'

import * as React from 'react'

import { MovementCreateDialog } from '@/components/admin/movement/movement-create-dialog'
import { MovementRowActions } from '@/components/admin/movement/movement-row-actions'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDataTable } from '@/hooks/use-data-table'
import { getSortingStateParser } from '@/lib/parsers'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import {
	BarbellIcon,
	ListIcon,
	SquaresFourIcon,
	TargetIcon,
} from '@phosphor-icons/react'
import _ from 'lodash'
import { parseAsInteger, useQueryState } from 'nuqs'

interface Movement {
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

const columnHelper = createColumnHelper<Movement>()

const columns = [
	columnHelper.display({
		id: 'select',
		header: ({ table }) => (
			<Checkbox
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
			variant: 'text',
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
	columnHelper.display({
		id: 'actions',
		cell: ({ row }) => <MovementRowActions row={row} />,
	}),
]

const route = getRouteApi('/$orgSlug/movements')

export function MovementsPage() {
	const { session } = route.useRouteContext()

	const userOrgId = session.user.organisationId
	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <MovementsContent userOrgId={userOrgId} />
}

function MovementsContent({ userOrgId }: { userOrgId: string }) {
	const { data: movements } = useSuspenseQuery(
		orpc.movement.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const [viewMode, setViewMode] = useQueryState('view', {
		defaultValue: 'table',
	})
	const [page] = useQueryState('page', parseAsInteger.withDefault(1))
	const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10))
	const [sorting] = useQueryState(
		'sort',
		getSortingStateParser<Movement>(
			columns
				.map((c) => (c as any).accessorKey)
				.filter((key): key is string => !!key),
		).withDefault([{ id: 'createdAt', desc: true }]),
	)

	const movementsData = (movements as Movement[]) ?? []

	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...movementsData]

		if (sorting && sorting.length > 0) {
			const { id, desc } = sorting[0]
			processed.sort((a, b) => {
				const aValue = a[id as keyof Movement]
				const bValue = b[id as keyof Movement]

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
	}, [movementsData, page, perPage, sorting])

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
				<h1 className='text-2xl font-bold tracking-tight'>Movements</h1>
				<MovementCreateDialog />
			</div>

			<Tabs
				value={viewMode}
				onValueChange={(v) => void setViewMode(v)}
				className='w-full'
			>
				<TabsList className='w-fit'>
					<TabsTrigger value='table' className='gap-2'>
						<ListIcon className='size-4' />
						Table
					</TabsTrigger>
					<TabsTrigger value='grid' className='gap-2'>
						<SquaresFourIcon className='size-4' />
						Grid
					</TabsTrigger>
				</TabsList>

				<TabsContent value='table' className='mt-4'>
					<DataTable table={table}>
						<DataTableAdvancedToolbar table={table} className='border-b'>
							<DataTableFilterList table={table} />
						</DataTableAdvancedToolbar>
					</DataTable>
				</TabsContent>

				<TabsContent value='grid' className='mt-4'>
					<MovementsGridView
						data={paginatedData}
						page={page}
						perPage={perPage}
						total={movementsData.length}
					/>
				</TabsContent>
			</Tabs>
		</div>
	)
}

interface MovementsGridViewProps {
	data: Movement[]
	page: number
	perPage: number
	total: number
}

function MovementsGridView({
	data,
	page,
	perPage,
	total,
}: MovementsGridViewProps) {
	const totalPages = Math.ceil(total / perPage)

	return (
		<div className='flex flex-col gap-4'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{data.map((movement) => (
					<Card key={movement.id} className='flex flex-col'>
						<CardHeader className='pb-3'>
							<CardTitle className='text-lg'>{movement.name}</CardTitle>
							<CardDescription className='flex items-center gap-1'>
								<TargetIcon className='size-3' />
								{movement.category}
								{movement.level && ` • ${movement.level}`}
							</CardDescription>
						</CardHeader>
						<CardContent className='flex-1'>
							<div className='space-y-2'>
								{movement.equipment && (
									<div className='flex items-center gap-2 text-sm'>
										<BarbellIcon className='size-4 text-muted-foreground' />
										<span>{movement.equipment}</span>
									</div>
								)}
								{movement.primaryMuscles && (
									<div className='text-sm'>
										<span className='text-muted-foreground'>Primary: </span>
										<span className='truncate'>{movement.primaryMuscles}</span>
									</div>
								)}
								{movement.mechanic && (
									<div className='text-sm text-muted-foreground'>
										Mechanic: {movement.mechanic}
									</div>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{totalPages > 1 && (
				<div className='flex items-center justify-between px-2'>
					<div className='text-sm text-muted-foreground'>
						Showing {(page - 1) * perPage + 1} to{' '}
						{Math.min(page * perPage, total)} of {total} movements
					</div>
					<div className='flex items-center gap-2'>
						<span className='text-sm'>
							Page {page} of {totalPages}
						</span>
					</div>
				</div>
			)}
		</div>
	)
}
