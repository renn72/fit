'use client'

import * as React from 'react'

import { MovementRowActions } from '@/components/admin/movement/movement-row-actions'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDataTable } from '@/hooks/use-data-table'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import {
	BarbellIcon,
	ListIcon,
	SquaresFourIcon,
	TargetIcon,
} from '@phosphor-icons/react'
import _ from 'lodash'

interface Movement {
	id: string
	name: string
	level: string | null
	category: string | null
	force: string | null
	mechanic: string | null
	equipment: string | null
	primaryMuscles: string | null
	secondaryMuscles: string | null
	instructions: string | null
	createdAt: Date
	isBase: boolean
	isOverwriteBase: boolean
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

export function MovementsPage() {
	const { session } = route.useRouteContext()
	const userOrgId = session.user.organisationId

	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <MovementsContent userOrgId={userOrgId} />
}

function MovementsContent({ userOrgId }: { userOrgId: string }) {
	const { orgSlug } = route.useParams()
	const { data: movements } = useSuspenseQuery(
		orpc.movement.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const navigate = route.useNavigate()
	const { view, q, page, perPage, sort } = route.useSearch()
	const movementsData = (movements as Movement[]) ?? []

	const { paginatedData, pageCount, totalCount } = React.useMemo(() => {
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

		return { paginatedData, pageCount, totalCount: total }
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

	const handleViewChange = (newView: string) => {
		navigate({
			to: '/$orgSlug/movements',
			params: { orgSlug },
			search: (prev) => ({ ...prev, view: newView as 'table' | 'grid' }),
			replace: true,
		})
	}

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

			<Tabs value={view} onValueChange={handleViewChange} className='w-full'>
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
						<DataTableAdvancedToolbar table={table} className='border-b' />
					</DataTable>
				</TabsContent>

				<TabsContent value='grid' className='mt-4'>
					<MovementsGridView
						data={paginatedData}
						page={page}
						perPage={perPage}
						total={totalCount}
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
			<div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
				{data.map((movement) => {
					const categories = splitCsv(movement.category)
					const levels = splitCsv(movement.level)
					return (
						<Card
							key={movement.id}
							className='overflow-hidden border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md'
						>
							<CardHeader className='space-y-3 border-b bg-gradient-to-r from-sky-50/70 to-emerald-50/70 pb-4 dark:from-sky-950/20 dark:to-emerald-950/20'>
								<div className='flex items-start justify-between gap-3'>
									<div className='min-w-0'>
										<CardTitle className='truncate text-lg leading-tight'>
											{movement.name}
										</CardTitle>
										<p className='text-xs text-muted-foreground'>
											{new Date(movement.createdAt).toLocaleDateString()}
										</p>
									</div>
									<MovementRowActions
										movement={{
											id: movement.id,
											name: movement.name,
											isBase: movement.isBase,
										}}
										buttonClassName='h-8 w-8'
									/>
								</div>

								{(categories.length > 0 || levels.length > 0) && (
									<div className='flex flex-wrap gap-1'>
										{categories.map((category) => (
											<Badge key={`category-${category}`} variant='secondary'>
												{category}
											</Badge>
										))}
										{levels.map((level) => (
											<Badge key={`level-${level}`} variant='outline'>
												{level}
											</Badge>
										))}
									</div>
								)}
							</CardHeader>

							<CardContent className='space-y-4 pt-4'>
								<div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
									<div className='rounded-lg border bg-sky-50/80 p-2 dark:bg-sky-950/20'>
										<div className='text-[11px] text-muted-foreground'>
											Force
										</div>
										<div className='text-sm font-semibold text-sky-700 dark:text-sky-300'>
											{movement.force || '-'}
										</div>
									</div>
									<div className='rounded-lg border bg-emerald-50/80 p-2 dark:bg-emerald-950/20'>
										<div className='text-[11px] text-muted-foreground'>
											Mechanic
										</div>
										<div className='text-sm font-semibold text-emerald-700 dark:text-emerald-300'>
											{movement.mechanic || '-'}
										</div>
									</div>
									<div className='rounded-lg border bg-orange-50/80 p-2 dark:bg-orange-950/20'>
										<div className='text-[11px] text-muted-foreground'>
											Equipment
										</div>
										<div className='text-sm font-semibold text-orange-700 dark:text-orange-300'>
											{movement.equipment || '-'}
										</div>
									</div>
								</div>

								<ScrollArea className='h-28 rounded-xl border bg-muted/20'>
									<div className='space-y-2 p-3 text-sm'>
										<div className='flex items-start gap-2'>
											<TargetIcon className='mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-300' />
											<div className='min-w-0'>
												<p className='text-xs text-muted-foreground'>
													Primary muscles
												</p>
												<p className='truncate font-medium'>
													{movement.primaryMuscles || '-'}
												</p>
											</div>
										</div>
										<div className='flex items-start gap-2'>
											<BarbellIcon className='mt-0.5 size-4 shrink-0 text-sky-600 dark:text-sky-300' />
											<div className='min-w-0'>
												<p className='text-xs text-muted-foreground'>
													Secondary muscles
												</p>
												<p className='truncate font-medium'>
													{movement.secondaryMuscles || '-'}
												</p>
											</div>
										</div>
										{movement.instructions && (
											<p className='line-clamp-2 text-xs text-muted-foreground'>
												{movement.instructions}
											</p>
										)}
									</div>
								</ScrollArea>
							</CardContent>
						</Card>
					)
				})}
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
