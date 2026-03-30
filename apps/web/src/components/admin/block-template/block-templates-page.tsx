'use client'

import * as React from 'react'

import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list'
import { Button } from '@fit/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@fit/components/ui/card'
import { Checkbox } from '@fit/components/ui/checkbox'
import { useDataTable } from '@/hooks/use-data-table'
import { orpc } from '@/utils/orpc'

import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { getRouteApi, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import {
	ListIcon,
	PencilSimpleIcon,
	SquaresFourIcon,
	TrashIcon,
} from '@phosphor-icons/react'
import _ from 'lodash'
import { toast } from 'sonner'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@fit/components/ui/tabs'

interface UserBlockTemplate {
	id: string
	name: string
	description: string | null
	category: string | null
	tags: string[]
	restDayIndexes: number[]
	createdAt: Date
	creatorName: string | null
	workouts: Array<{
		id: string
		dayIndex: number
		warmups: Array<{ id: string }>
		exercises: Array<{ id: string }>
	}>
}

const route = getRouteApi('/$orgSlug/block-templates')
const columnHelper = createColumnHelper<UserBlockTemplate>()

function countTotalExercises(template: UserBlockTemplate): number {
	return template.workouts.reduce(
		(total, workoutItem) => total + workoutItem.exercises.length,
		0,
	)
}

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
	columnHelper.accessor('category', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Category' />
		),
		meta: {
			label: 'Category',
			variant: 'text',
		},
	}),
	columnHelper.display({
		id: 'tags',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Tags' />
		),
		cell: ({ row }) => row.original.tags.length || '-',
		meta: {
			label: 'Tags',
			variant: 'number',
		},
	}),
	columnHelper.display({
		id: 'workouts',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Workouts' />
		),
		cell: ({ row }) => row.original.workouts.length,
		meta: {
			label: 'Workouts',
			variant: 'number',
		},
	}),
	columnHelper.display({
		id: 'restDays',
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Rest Days' />
		),
		cell: ({ row }) => row.original.restDayIndexes.length,
		meta: {
			label: 'Rest Days',
			variant: 'number',
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
	columnHelper.display({
		id: 'actions',
		cell: ({ row }) => <TemplateActions template={row.original} />,
		enableSorting: false,
		enableHiding: false,
	}),
]

export function BlockTemplatesPage() {
	const { session } = route.useRouteContext()
	const userOrgId = session.user.organisationId

	if (!_.isString(userOrgId)) {
		return <div>Missing organisation</div>
	}

	return <BlockTemplatesContent userOrgId={userOrgId} />
}

function BlockTemplatesContent({ userOrgId }: { userOrgId: string }) {
	const { orgSlug } = route.useParams()
	const navigate = route.useNavigate()
	const { view, page, perPage, sort } = route.useSearch()

	const { data } = useSuspenseQuery(
		orpc.userBlock.getTemplatesOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const templates = (data as UserBlockTemplate[]) ?? []
	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...templates]

		if (sort && sort.length > 0) {
			const { id, desc } = sort[0]
			processed.sort((left, right) => {
				const leftValue = left[id as keyof UserBlockTemplate]
				const rightValue = right[id as keyof UserBlockTemplate]

				if (leftValue === rightValue) return 0
				if (leftValue === null || leftValue === undefined) return 1
				if (rightValue === null || rightValue === undefined) return -1
				if (leftValue < rightValue) return desc ? 1 : -1
				return desc ? -1 : 1
			})
		}

		const total = processed.length
		const nextPageCount = Math.max(1, Math.ceil(total / perPage))
		const start = (page - 1) * perPage
		return {
			paginatedData: processed.slice(start, start + perPage),
			pageCount: nextPageCount,
		}
	}, [page, perPage, sort, templates])

	const { table } = useDataTable({
		data: paginatedData,
		columns,
		pageCount,
		getRowId: (row) => row.id,
		initialState: {
			sorting: sort as any,
			columnPinning: { right: ['actions'] },
		},
	})

	return (
		<div className='flex flex-col gap-4 p-4 w-full'>
			<div className='flex flex-wrap gap-3 justify-between items-center'>
				<div>
					<h1 className='text-2xl font-semibold tracking-tight'>Block Templates</h1>
					<p className='text-sm text-muted-foreground'>
						Reusable blocks built on copied workouts and movement-backed exercises.
					</p>
				</div>
				<Link to='/$orgSlug/block-templates/create' params={{ orgSlug }}>
					<Button>Create Template</Button>
				</Link>
			</div>

			<Tabs
				value={view}
				onValueChange={(nextView) =>
					navigate({
						to: '/$orgSlug/block-templates',
						params: { orgSlug },
						search: (prev) => ({
							...prev,
							view: nextView as 'table' | 'grid',
						}),
						replace: true,
					})
				}
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
					<div className='grid gap-4 lg:grid-cols-2'>
						{paginatedData.map((template) => (
							<Card key={template.id} className='flex flex-col'>
								<CardHeader className='space-y-2'>
									<div className='flex gap-3 justify-between items-start'>
										<div>
											<CardTitle className='text-lg'>{template.name}</CardTitle>
											<p className='text-sm text-muted-foreground'>
												{template.category || 'Uncategorized'}
											</p>
										</div>
										<div className='flex gap-2'>
											<Link
												to='/$orgSlug/block-templates/edit/$blockId'
												params={{ orgSlug, blockId: template.id }}
											>
												<Button size='sm' variant='outline'>
													<PencilSimpleIcon className='mr-2 size-4' />
													Edit
												</Button>
											</Link>
										</div>
									</div>
									<p className='text-sm text-muted-foreground line-clamp-2'>
										{template.description || 'No description'}
									</p>
								</CardHeader>
								<CardContent className='space-y-4'>
									<div className='grid grid-cols-2 gap-3 text-sm md:grid-cols-4'>
										<TemplateStat label='Workouts' value={template.workouts.length} />
										<TemplateStat
											label='Exercises'
											value={countTotalExercises(template)}
										/>
										<TemplateStat
											label='Rest Days'
											value={template.restDayIndexes.length}
										/>
										<TemplateStat label='Tags' value={template.tags.length} />
									</div>
									<div className='flex flex-wrap gap-2'>
										{template.tags.length > 0 ? (
											template.tags.map((tag) => (
												<span
													key={tag}
													className='px-2 py-1 text-xs rounded-full border bg-muted'
												>
													{tag}
												</span>
											))
										) : (
											<span className='text-xs text-muted-foreground'>
												No tags
											</span>
										)}
									</div>
									<div className='flex justify-between items-center pt-2 border-t text-sm text-muted-foreground'>
										<span>{template.creatorName || 'Unknown creator'}</span>
										<span>
											{new Date(template.createdAt).toLocaleDateString()}
										</span>
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</TabsContent>
			</Tabs>
		</div>
	)
}

function TemplateStat({
	label,
	value,
}: {
	label: string
	value: number
}) {
	return (
		<div className='p-3 rounded-lg border bg-muted/30'>
			<p className='text-[11px] uppercase tracking-wide text-muted-foreground'>
				{label}
			</p>
			<p className='text-base font-semibold'>{value}</p>
		</div>
	)
}

function TemplateActions({ template }: { template: UserBlockTemplate }) {
	const { orgSlug } = route.useParams()
	const queryClient = useQueryClient()

	const deleteTemplate = useMutation(
		orpc.userBlock.delete.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries({
					queryKey: orpc.userBlock.getTemplatesOrg.key(),
				})
				toast.success('Template deleted successfully')
			},
			onError: (error) => {
				toast.error(error.message || 'Failed to delete template')
			},
		}),
	)

	return (
		<div className='flex gap-2 justify-end'>
			<Link
				to='/$orgSlug/block-templates/edit/$blockId'
				params={{ orgSlug, blockId: template.id }}
			>
				<Button size='sm' variant='outline'>
					<PencilSimpleIcon className='mr-2 size-4' />
					Edit
				</Button>
			</Link>
			<Button
				size='sm'
				variant='outline'
				onClick={() => {
					if (!window.confirm('Delete this block template?')) return
					deleteTemplate.mutate({ id: template.id })
				}}
			>
				<TrashIcon className='mr-2 size-4' />
				Delete
			</Button>
		</div>
	)
}
