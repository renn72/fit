'use client'

import * as React from 'react'

import { WarmupRowActions } from '@/components/admin/warmup/warmup-row-actions'
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
	ListIcon,
	PlayCircleIcon,
	SquaresFourIcon,
	UsersThreeIcon,
} from '@phosphor-icons/react'
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
		description: string | null
		images: string | null
		link: string | null
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

export function WarmupsPage() {
	const { session } = route.useRouteContext()
	const userOrgId = session.user.organisationId

	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <WarmupsContent userOrgId={userOrgId} />
}

function WarmupsContent({ userOrgId }: { userOrgId: string }) {
	const { orgSlug } = route.useParams()
	const { data: groups } = useSuspenseQuery(
		orpc.warmup.getAllGroups.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const navigate = route.useNavigate()
	const { view, q, page, perPage, sort } = route.useSearch()

	const groupsData: WarmupGroup[] = React.useMemo(() => {
		return (groups ?? []).map((group) => ({
			id: group.id,
			name: group.name,
			description: group.description,
			warmupCount: group.warmups?.length ?? 0,
			creatorName: group.creator?.name ?? null,
			createdAt: group.createdAt,
			warmups: group.warmups ?? [],
		}))
	}, [groups])

	const { paginatedData, pageCount, totalCount } = React.useMemo(() => {
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

		return { paginatedData, pageCount, totalCount: total }
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

	const handleViewChange = (newView: string) => {
		navigate({
			to: '/$orgSlug/warmups',
			params: { orgSlug },
			search: (prev) => ({ ...prev, view: newView as 'table' | 'grid' }),
			replace: true,
		})
	}

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
					<WarmupsGridView
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

interface WarmupsGridViewProps {
	data: WarmupGroup[]
	page: number
	perPage: number
	total: number
}

function WarmupsGridView({ data, page, perPage, total }: WarmupsGridViewProps) {
	const totalPages = Math.ceil(total / perPage)

	return (
		<div className='flex flex-col gap-4'>
			<div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
				{data.map((group) => (
					<Card
						key={group.id}
						className='overflow-hidden border-border/70 bg-card shadow-sm transition-shadow hover:shadow-md'
					>
						<CardHeader className='space-y-3 border-b bg-gradient-to-r from-fuchsia-50/70 to-cyan-50/70 pb-4 dark:from-fuchsia-950/20 dark:to-cyan-950/20'>
							<div className='flex items-start justify-between gap-3'>
								<div className='min-w-0'>
									<CardTitle className='truncate text-lg leading-tight'>
										{group.name}
									</CardTitle>
									<p className='text-xs text-muted-foreground'>
										By {group.creatorName || 'Unknown'} •{' '}
										{new Date(group.createdAt).toLocaleDateString()}
									</p>
								</div>
								<WarmupRowActions
									group={{ id: group.id, name: group.name }}
									buttonClassName='h-8 w-8'
								/>
							</div>

							<div className='flex flex-wrap gap-1'>
								<Badge variant='secondary'>
									{group.warmupCount} exercise
									{group.warmupCount === 1 ? '' : 's'}
								</Badge>
							</div>
						</CardHeader>

						<CardContent className='space-y-4 pt-4'>
							{group.description ? (
								<p className='line-clamp-2 text-sm text-muted-foreground'>
									{group.description}
								</p>
							) : (
								<p className='text-sm text-muted-foreground'>
									No description provided.
								</p>
							)}

							<ScrollArea className='h-36 rounded-xl border bg-muted/20'>
								<div className='space-y-2 p-3'>
									<div className='flex items-center gap-2 text-sm font-medium text-muted-foreground'>
										<UsersThreeIcon className='size-4 text-cyan-600 dark:text-cyan-300' />
										Warmup Exercises
									</div>
									{group.warmups.length === 0 ? (
										<p className='text-sm text-muted-foreground'>
											No exercises added.
										</p>
									) : (
										group.warmups.map((warmup) => (
											<div
												key={warmup.id}
												className='flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm'
											>
												<PlayCircleIcon className='size-4 text-fuchsia-600 dark:text-fuchsia-300' />
												<div className='min-w-0 flex-1'>
													<p className='truncate font-medium'>{warmup.name}</p>
													{warmup.description && (
														<p className='truncate text-xs text-muted-foreground'>
															{warmup.description}
														</p>
													)}
												</div>
											</div>
										))
									)}
								</div>
							</ScrollArea>
						</CardContent>
					</Card>
				))}
			</div>

			{totalPages > 1 && (
				<div className='flex items-center justify-between px-2'>
					<div className='text-sm text-muted-foreground'>
						Showing {(page - 1) * perPage + 1} to{' '}
						{Math.min(page * perPage, total)} of {total} warmup groups
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
