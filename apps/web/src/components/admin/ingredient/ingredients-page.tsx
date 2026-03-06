'use client'

import * as React from 'react'

import { IngredientRowActions } from '@/components/admin/ingredient/ingredient-row-actions'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DocsLink } from '@/components/docs-link'
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

import { FireIcon, ListIcon, SquaresFourIcon } from '@phosphor-icons/react'
import _ from 'lodash'

interface Ingredient {
	id: string
	name: string
	category: string | null
	calories: number
	protein: number
	fat: number
	carbohydrate: number
	serveSize: number
	serveUnit: string
	createdAt: Date
	isBase: boolean
	isOverwriteBase: boolean
	creatorName: string
}

const columnHelper = createColumnHelper<Ingredient>()

function splitCategories(category: string | null): string[] {
	if (!category) return []
	return category
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
}

function formatMacro(value: number, suffix: string): string {
	return `${value.toFixed(1)}${suffix}`
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
			const categories = splitCategories(
				row.getValue('category') as string | null,
			)
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
	columnHelper.accessor('calories', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Calories' />
		),
		meta: {
			label: 'Calories',
			variant: 'number',
		},
		cell: ({ row }) => {
			const value = row.getValue('calories') as number
			return value.toFixed(1)
		},
	}),
	columnHelper.accessor('protein', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Protein' />
		),
		meta: {
			label: 'Protein',
			variant: 'number',
		},
		cell: ({ row }) => {
			const value = row.getValue('protein') as number
			return value.toFixed(1)
		},
	}),
	columnHelper.accessor('fat', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Fat' />
		),
		meta: {
			label: 'Fat',
			variant: 'number',
		},
		cell: ({ row }) => {
			const value = row.getValue('fat') as number
			return value.toFixed(1)
		},
	}),
	columnHelper.accessor('carbohydrate', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Carbs' />
		),
		meta: {
			label: 'Carbs',
			variant: 'number',
		},
		cell: ({ row }) => {
			const value = row.getValue('carbohydrate') as number
			return value.toFixed(1)
		},
	}),
	columnHelper.accessor('serveSize', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Serve Size' />
		),
		meta: {
			label: 'Serve Size',
			variant: 'number',
		},
	}),
	columnHelper.accessor('serveUnit', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Unit' />
		),
		meta: {
			label: 'Unit',
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
		cell: ({ row }) => <IngredientRowActions row={row} />,
	}),
]

const route = getRouteApi('/$orgSlug/ingredients')

export function IngredientsPage() {
	const { session } = route.useRouteContext()

	const userOrgId = session.user.organisationId
	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <IngredientsContent userOrgId={userOrgId} />
}

function IngredientsContent({ userOrgId }: { userOrgId: string }) {
	const { orgSlug } = route.useParams()
	const { data: ingredients } = useSuspenseQuery(
		orpc.ingredient.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)

	const navigate = route.useNavigate()
	const { view, q, page, perPage, sort } = route.useSearch()

	const ingredientsData = (ingredients as Ingredient[]) ?? []

	const { paginatedData, pageCount, totalCount } = React.useMemo(() => {
		const processed = [...ingredientsData]
		const normalizedQuery = q.trim().toLowerCase()
		const filtered =
			normalizedQuery.length === 0
				? processed
				: processed.filter((ingredient) => {
						const name = ingredient.name.toLowerCase()
						const category = (ingredient.category ?? '').toLowerCase()
						return (
							name.includes(normalizedQuery) ||
							category.includes(normalizedQuery)
						)
					})

		if (sort && sort.length > 0) {
			const { id, desc } = sort[0]
			filtered.sort((a, b) => {
				const aValue = a[id as keyof Ingredient]
				const bValue = b[id as keyof Ingredient]

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
	}, [ingredientsData, page, perPage, q, sort])

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
			to: '/$orgSlug/ingredients',
			params: { orgSlug },
			search: (prev) => ({ ...prev, view: newView as 'table' | 'grid' }),
			replace: true,
		})
	}

	const handleSearchChange = (value: string) => {
		navigate({
			to: '/$orgSlug/ingredients',
			params: { orgSlug },
			search: (prev) => ({ ...prev, q: value, page: 1 }),
			replace: true,
		})
	}

	return (
		<div className='flex flex-col gap-4 p-4 w-full h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold tracking-tight'>Ingredients</h1>
				<div className='flex gap-2 items-center'>
					<DocsLink doc='createIngredients' label='Ingredient Docs' />
					<Link to='/$orgSlug/ingredients/create' params={{ orgSlug }}>
						<Button className='cursor-pointer'>Create Ingredient</Button>
					</Link>
				</div>
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
					<IngredientsGridView
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

interface IngredientsGridViewProps {
	data: Ingredient[]
	page: number
	perPage: number
	total: number
}

function IngredientsGridView({
	data,
	page,
	perPage,
	total,
}: IngredientsGridViewProps) {
	const totalPages = Math.ceil(total / perPage)

	return (
		<div className='flex flex-col gap-4'>
			<div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
				{data.map((ingredient) => {
					const categories = splitCategories(ingredient.category)
					return (
						<Card
							key={ingredient.id}
							className='overflow-hidden shadow-sm transition-shadow hover:shadow-md border-border/70 bg-card'
						>
							<CardHeader className='pb-4 space-y-3 bg-gradient-to-r border-b from-orange-50/70 to-emerald-50/70 dark:from-orange-950/20 dark:to-emerald-950/20'>
								<div className='flex gap-3 justify-between items-start'>
									<div className='min-w-0'>
										<CardTitle className='text-lg leading-tight truncate'>
											{ingredient.name}
										</CardTitle>
										<p className='text-xs text-muted-foreground'>
											By {ingredient.creatorName || 'Unknown'} •{' '}
											{new Date(ingredient.createdAt).toLocaleDateString()}
										</p>
									</div>
									<div className='py-1 px-2 text-xs font-medium rounded-md border bg-background/80 shrink-0'>
										{ingredient.serveSize} {ingredient.serveUnit}
									</div>
								</div>

								{categories.length > 0 && (
									<div className='flex flex-wrap gap-1'>
										{categories.map((category) => (
											<Badge key={category} variant='secondary'>
												{category}
											</Badge>
										))}
									</div>
								)}
							</CardHeader>

							<CardContent className='pt-4 space-y-4'>
								<div>
									<div className='mb-2 text-sm font-medium'>Nutrition</div>
									<div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
										<div className='p-2 rounded-lg border bg-orange-50/80 dark:bg-orange-950/20'>
											<div className='text-[11px] text-muted-foreground'>
												Calories
											</div>
											<div className='text-sm font-semibold text-orange-700 dark:text-orange-300'>
												{formatMacro(ingredient.calories, ' kcal')}
											</div>
										</div>
										<div className='p-2 rounded-lg border bg-emerald-50/80 dark:bg-emerald-950/20'>
											<div className='text-[11px] text-muted-foreground'>
												Protein
											</div>
											<div className='text-sm font-semibold text-emerald-700 dark:text-emerald-300'>
												{formatMacro(ingredient.protein, ' g')}
											</div>
										</div>
										<div className='p-2 rounded-lg border bg-blue-50/80 dark:bg-blue-950/20'>
											<div className='text-[11px] text-muted-foreground'>
												Carbs
											</div>
											<div className='text-sm font-semibold text-blue-700 dark:text-blue-300'>
												{formatMacro(ingredient.carbohydrate, ' g')}
											</div>
										</div>
										<div className='p-2 rounded-lg border bg-pink-50/80 dark:bg-pink-950/20'>
											<div className='text-[11px] text-muted-foreground'>
												Fat
											</div>
											<div className='text-sm font-semibold text-pink-700 dark:text-pink-300'>
												{formatMacro(ingredient.fat, ' g')}
											</div>
										</div>
									</div>
								</div>

								<ScrollArea className='h-16 rounded-xl border bg-muted/20'>
									<div className='p-3 text-sm'>
										<div className='flex gap-2 items-center'>
											<FireIcon className='text-orange-500 size-4' />
											<span className='font-medium'>Serving reference:</span>
											<span className='text-muted-foreground'>
												per {ingredient.serveSize} {ingredient.serveUnit}
											</span>
										</div>
									</div>
								</ScrollArea>
							</CardContent>
						</Card>
					)
				})}
			</div>

			{totalPages > 1 && (
				<div className='flex justify-between items-center px-2'>
					<div className='text-sm text-muted-foreground'>
						Showing {(page - 1) * perPage + 1} to{' '}
						{Math.min(page * perPage, total)} of {total} ingredients
					</div>
					<div className='flex gap-2 items-center'>
						<span className='text-sm'>
							Page {page} of {totalPages}
						</span>
					</div>
				</div>
			)}
		</div>
	)
}
