'use client'

import * as React from 'react'

import { WarmupGroupCreateDialog } from '@/components/admin/warmup/warmup-group-create-dialog'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list'
import { Button } from '@/components/ui/button'
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
	ListIcon,
	PlayCircleIcon,
	SquaresFourIcon,
} from '@phosphor-icons/react'
import _ from 'lodash'
import { parseAsInteger, useQueryState } from 'nuqs'

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
		description: string | null
		images: string | null
		link: string | null
	}>
}

const columnHelper = createColumnHelper<WarmupGroup>()

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

export function WarmupsPage() {
	const { session } = route.useRouteContext()
	const userOrgId = session.user.organisationId

	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <WarmupsContent userOrgId={userOrgId} />
}

WarmupsPage.useRouteContext = () => {
	return {
		session: {
			user: {
				organisationId: null as string | null,
			},
		},
	}
}

function WarmupsContent({ userOrgId }: { userOrgId: string }) {
	const { data: groups } = useSuspenseQuery(
		orpc.warmup.getAllGroups.queryOptions({
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
			warmups: g.warmups ?? [],
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
					<WarmupGridView
						data={paginatedData}
						page={page}
						perPage={perPage}
						total={groupsData.length}
						onPageChange={(newPage) => {
							void newPage
						}}
					/>
				</TabsContent>
			</Tabs>
		</div>
	)
}

interface WarmupGridViewProps {
	data: WarmupGroup[]
	page: number
	perPage: number
	total: number
	onPageChange: (page: number) => void
}

function WarmupGridView({
	data,
	page,
	perPage,
	total,
	onPageChange,
}: WarmupGridViewProps) {
	const totalPages = Math.ceil(total / perPage)

	return (
		<div className='flex flex-col gap-4'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{data.map((group) => (
					<Card key={group.id} className='flex flex-col'>
						<CardHeader className='pb-3'>
							<CardTitle className='text-lg'>{group.name}</CardTitle>
							{group.description && (
								<CardDescription className='line-clamp-2'>
									{group.description}
								</CardDescription>
							)}
						</CardHeader>
						<CardContent className='flex-1'>
							<div className='space-y-2'>
								<div className='text-sm text-muted-foreground'>
									{group.warmupCount} exercise
									{group.warmupCount !== 1 ? 's' : ''}
								</div>
								<div className='space-y-1'>
									{group.warmups.slice(0, 3).map((warmup) => (
										<div
											key={warmup.id}
											className='flex items-center gap-2 text-sm'
										>
											<PlayCircleIcon className='size-3 text-muted-foreground' />
											<span className='truncate'>{warmup.name}</span>
										</div>
									))}
									{group.warmups.length > 3 && (
										<div className='text-sm text-muted-foreground pl-5'>
											+{group.warmups.length - 3} more
										</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{totalPages > 1 && (
				<div className='flex items-center justify-between px-2'>
					<div className='text-sm text-muted-foreground'>
						Showing {(page - 1) * perPage + 1} to{' '}
						{Math.min(page * perPage, total)} of {total} warmups
					</div>
					<div className='flex items-center gap-2'>
						<Button
							variant='outline'
							size='sm'
							onClick={() => onPageChange(page - 1)}
							disabled={page <= 1}
						>
							Previous
						</Button>
						<span className='text-sm'>
							Page {page} of {totalPages}
						</span>
						<Button
							variant='outline'
							size='sm'
							onClick={() => onPageChange(page + 1)}
							disabled={page >= totalPages}
						>
							Next
						</Button>
					</div>
				</div>
			)}
		</div>
	)
}
