'use client'

import * as React from 'react'

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
import { getRouteApi, Link } from '@tanstack/react-router'
import { createColumnHelper } from '@tanstack/react-table'

import {
	CookingPotIcon,
	ForkKnifeIcon,
	ListIcon,
	SquaresFourIcon,
} from '@phosphor-icons/react'
import _ from 'lodash'
import { parseAsInteger, useQueryState } from 'nuqs'

interface Recipe {
	id: string
	name: string
	category: string | null
	calories: number | null
}

interface MenuTemplateRecipe {
	id: string
	mealIndex: number
	recipeIndex: number
	recipe: Recipe
}

interface MenuTemplate {
	id: string
	name: string
	description: string | null
	category: string | null
	createdAt: Date
	creatorName?: string
	recipes: MenuTemplateRecipe[]
}

const columnHelper = createColumnHelper<MenuTemplate>()

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
	columnHelper.accessor('category', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Category' />
		),
		meta: {
			label: 'Category',
			variant: 'text',
		},
	}),
	columnHelper.accessor('recipes', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Recipes' />
		),
		cell: ({ row }) => {
			const recipes = row.getValue('recipes') as MenuTemplateRecipe[]
			const mealCount = new Set(recipes.map((r) => r.mealIndex)).size
			return (
				<span>
					{recipes?.length || 0} recipes ({mealCount} meals)
				</span>
			)
		},
		meta: {
			label: 'Recipes',
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
]

const route = getRouteApi('/$orgSlug/menu-templates')

export function MenuTemplatesPage() {
	const { session } = route.useRouteContext()

	const userOrgId = session.user.organisationId
	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <MenuTemplatesContent userOrgId={userOrgId} />
}

function MenuTemplatesContent({ userOrgId }: { userOrgId: string }) {
	const { orgSlug } = route.useParams()
	const { data: menuTemplates } = useSuspenseQuery(
		orpc.menuTemplate.getAllOrg.queryOptions({
			input: { organisationId: userOrgId },
		}),
	)
	console.log(menuTemplates)

	const [viewMode, setViewMode] = useQueryState('view', {
		defaultValue: 'table',
	})
	const [page] = useQueryState('page', parseAsInteger.withDefault(1))
	const [perPage] = useQueryState('perPage', parseAsInteger.withDefault(10))
	const [sorting] = useQueryState(
		'sort',
		getSortingStateParser<MenuTemplate>(
			columns
				.map((c) => (c as any).accessorKey)
				.filter((key): key is string => !!key),
		).withDefault([{ id: 'createdAt', desc: true }]),
	)

	const menuTemplatesData = (menuTemplates as MenuTemplate[]) ?? []

	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...menuTemplatesData]

		if (sorting && sorting.length > 0) {
			const { id, desc } = sorting[0]
			processed.sort((a, b) => {
				const aValue = a[id as keyof MenuTemplate]
				const bValue = b[id as keyof MenuTemplate]

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
	}, [menuTemplatesData, page, perPage, sorting])

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
				<h1 className='text-2xl font-bold tracking-tight'>Menu Templates</h1>
				<Link to='/$orgSlug/menu-templates/create' params={{ orgSlug }}>
					<Button>Create Menu Template</Button>
				</Link>
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
					<MenuTemplatesGridView
						data={paginatedData}
						page={page}
						perPage={perPage}
						total={menuTemplatesData.length}
					/>
				</TabsContent>
			</Tabs>
		</div>
	)
}

interface MenuTemplatesGridViewProps {
	data: MenuTemplate[]
	page: number
	perPage: number
	total: number
}

function MenuTemplatesGridView({
	data,
	page,
	perPage,
	total,
}: MenuTemplatesGridViewProps) {
	const totalPages = Math.ceil(total / perPage)

	return (
		<div className='flex flex-col gap-4'>
			<div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
				{data.map((menuTemplate) => {
					const sortedRecipes = [...menuTemplate.recipes].sort((a, b) => {
						if (a.mealIndex !== b.mealIndex) {
							return a.mealIndex - b.mealIndex
						}
						return a.recipeIndex - b.recipeIndex
					})
					const totalItems = sortedRecipes.length
					const mealCount = new Set(sortedRecipes.map((r) => r.mealIndex)).size

					return (
						<Card key={menuTemplate.id} className='flex flex-col'>
							<CardHeader className='pb-3'>
								<CardTitle className='text-lg'>{menuTemplate.name}</CardTitle>
								{menuTemplate.category && (
									<CardDescription>{menuTemplate.category}</CardDescription>
								)}
							</CardHeader>
							<CardContent className='flex-1'>
								<div className='space-y-4'>
									{/* Stats */}
									<div className='grid grid-cols-2 gap-2 text-center'>
										<div className='p-2 bg-orange-50 rounded-lg'>
											<div className='text-xs text-muted-foreground'>
												Recipes
											</div>
											<div className='font-semibold text-orange-600'>
												{totalItems}
											</div>
										</div>
										<div className='p-2 bg-green-50 rounded-lg'>
											<div className='text-xs text-muted-foreground'>Meals</div>
											<div className='font-semibold text-green-600'>
												{mealCount}
											</div>
										</div>
									</div>

									{/* Meals */}
									<div className='space-y-3'>
										<div className='text-sm font-medium text-muted-foreground'>
											Meal Schedule
										</div>
										<div className='overflow-y-auto space-y-2 max-h-80'>
											{Array.from(
												new Set(sortedRecipes.map((r) => r.mealIndex)),
											)
												.sort((a, b) => a - b)
												.map((mealIndex) => {
													const mealRecipes = sortedRecipes.filter(
														(r) => r.mealIndex === mealIndex,
													)
													return (
														<div
															key={mealIndex}
															className='p-3 space-y-2 rounded-lg border'
														>
															<div className='flex gap-2 items-center'>
																<CookingPotIcon className='text-orange-500 size-4' />
																<span className='text-sm font-medium'>
																	Meal {mealIndex + 1}
																</span>
															</div>
															<div className='pl-6 space-y-1'>
																{mealRecipes.map((recipeItem) => (
																	<div
																		key={recipeItem.id}
																		className='flex gap-2 items-center text-xs'
																	>
																		<ForkKnifeIcon className='text-green-500 size-3' />
																		<span className='flex-1 truncate'>
																			{recipeItem.recipe.name}
																		</span>
																		{recipeItem.recipe.category && (
																			<span className='text-muted-foreground'>
																				({recipeItem.recipe.category})
																			</span>
																		)}
																	</div>
																))}
															</div>
														</div>
													)
												})}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					)
				})}
			</div>

			{totalPages > 1 && (
				<div className='flex justify-between items-center px-2'>
					<div className='text-sm text-muted-foreground'>
						Showing {(page - 1) * perPage + 1} to{' '}
						{Math.min(page * perPage, total)} of {total} menu templates
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
