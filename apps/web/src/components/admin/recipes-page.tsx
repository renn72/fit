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

import { ChefHat, Fire, List, SquaresFour, Tag } from '@phosphor-icons/react'
import _ from 'lodash'
import { parseAsInteger, useQueryState } from 'nuqs'

interface RecipeIngredient {
	id: string
	amount: number
	unit: string
	ingredient: {
		id: string
		name: string
		calories: number
		protein: number
		fat: number
		carbohydrate: number
	}
}

interface Recipe {
	id: string
	name: string
	description: string
	category: string | null
	image: string | null
	metaTags: string
	createdAt: Date
	creatorName?: string
	ingredients: RecipeIngredient[]
}

interface RecipeWithTotals extends Recipe {
	totalCalories: number
	totalProtein: number
	totalFat: number
	totalCarbs: number
}

const columnHelper = createColumnHelper<RecipeWithTotals>()

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
		cell: ({ row }) => (
			<div className='max-w-60 truncate'>{row.getValue('description')}</div>
		),
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
	columnHelper.accessor('totalCalories', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Calories' />
		),
		cell: ({ row }) => {
			const value = row.getValue('totalCalories') as number
			return <span className='font-medium'>{value.toFixed(0)} kcal</span>
		},
		meta: {
			label: 'Calories',
			variant: 'number',
		},
	}),
	columnHelper.accessor('totalProtein', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Protein' />
		),
		cell: ({ row }) => {
			const value = row.getValue('totalProtein') as number
			return <span>{value.toFixed(1)}g</span>
		},
		meta: {
			label: 'Protein',
			variant: 'number',
		},
	}),
	columnHelper.accessor('totalCarbs', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Carbs' />
		),
		cell: ({ row }) => {
			const value = row.getValue('totalCarbs') as number
			return <span>{value.toFixed(1)}g</span>
		},
		meta: {
			label: 'Carbs',
			variant: 'number',
		},
	}),
	columnHelper.accessor('totalFat', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Fat' />
		),
		cell: ({ row }) => {
			const value = row.getValue('totalFat') as number
			return <span>{value.toFixed(1)}g</span>
		},
		meta: {
			label: 'Fat',
			variant: 'number',
		},
	}),
	columnHelper.accessor('metaTags', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Tags' />
		),
		cell: ({ row }) => {
			const tags = row.getValue('metaTags') as string
			if (!tags) return null
			const tagList = tags.split(',').filter(Boolean).slice(0, 3)
			return (
				<div className='flex flex-wrap gap-1'>
					{tagList.map((tag, i) => (
						<span
							key={i}
							className='inline-flex items-center py-1 px-2 text-xs font-medium rounded-md ring-1 ring-inset bg-muted ring-gray-500/10'
						>
							{tag.trim()}
						</span>
					))}
					{tags.split(',').filter(Boolean).length > 3 && (
						<span className='text-xs text-muted-foreground'>
							+{tags.split(',').filter(Boolean).length - 3} more
						</span>
					)}
				</div>
			)
		},
		meta: {
			label: 'Tags',
			variant: 'text',
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

const route = getRouteApi('/$orgSlug/recipes')

function calculateRecipeTotals(recipe: Recipe): RecipeWithTotals {
	const totals = recipe.ingredients.reduce(
		(acc, item) => {
			const ratio = item.amount / 100 // Assuming ingredient macros are per 100g
			acc.calories += item.ingredient.calories * ratio
			acc.protein += item.ingredient.protein * ratio
			acc.fat += item.ingredient.fat * ratio
			acc.carbs += item.ingredient.carbohydrate * ratio
			return acc
		},
		{ calories: 0, protein: 0, fat: 0, carbs: 0 },
	)

	return {
		...recipe,
		totalCalories: totals.calories,
		totalProtein: totals.protein,
		totalFat: totals.fat,
		totalCarbs: totals.carbs,
	}
}

export function RecipesPage() {
	const { session } = route.useRouteContext()

	const userOrgId = session.user.organisationId
	if (!_.isString(userOrgId)) return <div>Missing org</div>
	return <RecipesContent userOrgId={userOrgId} />
}

function RecipesContent({ userOrgId }: { userOrgId: string }) {
	const { orgSlug } = route.useParams()
	const { data: recipes } = useSuspenseQuery(
		orpc.recipe.getOrg.queryOptions({
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
		getSortingStateParser<RecipeWithTotals>(
			columns
				.map((c) => (c as any).accessorKey)
				.filter((key): key is string => !!key),
		).withDefault([{ id: 'createdAt', desc: true }]),
	)

	const recipesData: RecipeWithTotals[] = React.useMemo(() => {
		return ((recipes as Recipe[]) ?? []).map(calculateRecipeTotals)
	}, [recipes])

	const { paginatedData, pageCount } = React.useMemo(() => {
		const processed = [...recipesData]

		if (sorting && sorting.length > 0) {
			const { id, desc } = sorting[0]
			processed.sort((a, b) => {
				const aValue = a[id as keyof RecipeWithTotals]
				const bValue = b[id as keyof RecipeWithTotals]

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
	}, [recipesData, page, perPage, sorting])

	const { table } = useDataTable({
		data: paginatedData,
		columns,
		pageCount,
		getRowId: (originalRow) => originalRow.id,
		initialState: {
			sorting: [{ id: 'createdAt', desc: true }],
		},
	})

	return (
		<div className='flex flex-col gap-4 p-4 w-full h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold tracking-tight'>Recipes</h1>
				<Link to='/$orgSlug/recipes/create' params={{ orgSlug: orgSlug }}>
					<Button>Create</Button>
				</Link>
			</div>

			<Tabs
				value={viewMode}
				onValueChange={(v) => void setViewMode(v)}
				className='w-full'
			>
				<TabsList className='w-fit'>
					<TabsTrigger value='table' className='gap-2'>
						<List className='size-4' />
						Table
					</TabsTrigger>
					<TabsTrigger value='grid' className='gap-2'>
						<SquaresFour className='size-4' />
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
					<RecipesGridView
						data={paginatedData}
						page={page}
						perPage={perPage}
						total={recipesData.length}
					/>
				</TabsContent>
			</Tabs>
		</div>
	)
}

interface RecipesGridViewProps {
	data: RecipeWithTotals[]
	page: number
	perPage: number
	total: number
}

function RecipesGridView({ data, page, perPage, total }: RecipesGridViewProps) {
	const totalPages = Math.ceil(total / perPage)

	return (
		<div className='flex flex-col gap-4'>
			<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
				{data.map((recipe) => (
					<Card key={recipe.id} className='flex flex-col'>
						<CardHeader className='pb-3'>
							<CardTitle className='text-lg'>{recipe.name}</CardTitle>
							{recipe.category && (
								<CardDescription className='flex items-center gap-1'>
									<ChefHat className='size-3' />
									{recipe.category}
								</CardDescription>
							)}
						</CardHeader>
						<CardContent className='flex-1'>
							<div className='space-y-4'>
								{/* Nutrition Totals */}
								<div className='grid grid-cols-4 gap-2 text-center'>
									<div className='p-2 bg-orange-50 rounded-lg'>
										<div className='text-xs text-muted-foreground'>Cal</div>
										<div className='font-semibold text-orange-600'>
											{recipe.totalCalories.toFixed(0)}
										</div>
									</div>
									<div className='p-2 bg-blue-50 rounded-lg'>
										<div className='text-xs text-muted-foreground'>Pro</div>
										<div className='font-semibold text-blue-600'>
											{recipe.totalProtein.toFixed(0)}g
										</div>
									</div>
									<div className='p-2 bg-green-50 rounded-lg'>
										<div className='text-xs text-muted-foreground'>Carb</div>
										<div className='font-semibold text-green-600'>
											{recipe.totalCarbs.toFixed(0)}g
										</div>
									</div>
									<div className='p-2 bg-yellow-50 rounded-lg'>
										<div className='text-xs text-muted-foreground'>Fat</div>
										<div className='font-semibold text-yellow-600'>
											{recipe.totalFat.toFixed(0)}g
										</div>
									</div>
								</div>

								{/* Ingredients List */}
								{recipe.ingredients.length > 0 && (
									<div className='space-y-2'>
										<div className='text-sm font-medium text-muted-foreground'>
											Ingredients ({recipe.ingredients.length})
										</div>
										<div className='space-y-2'>
											{recipe.ingredients.slice(0, 3).map((item) => {
												const ratio = item.amount / 100
												const cal = item.ingredient.calories * ratio
												const pro = item.ingredient.protein * ratio
												const carb = item.ingredient.carbohydrate * ratio
												const fat = item.ingredient.fat * ratio
												return (
													<div
														key={item.id}
														className='text-sm py-2 border-b border-border/50 last:border-0'
													>
														<div className='flex items-center justify-between mb-1'>
															<span className='truncate flex-1 font-medium'>
																{item.ingredient.name}
															</span>
															<span className='text-muted-foreground text-xs'>
																{item.amount}
																{item.unit}
															</span>
														</div>
														<div className='grid grid-cols-4 gap-1 text-xs'>
															<div className='text-orange-600'>
																{cal.toFixed(0)} cal
															</div>
															<div className='text-blue-600'>
																{pro.toFixed(1)}g pro
															</div>
															<div className='text-green-600'>
																{carb.toFixed(1)}g carb
															</div>
															<div className='text-yellow-600'>
																{fat.toFixed(1)}g fat
															</div>
														</div>
													</div>
												)
											})}
											{recipe.ingredients.length > 3 && (
												<div className='text-sm text-muted-foreground py-1'>
													+{recipe.ingredients.length - 3} more ingredients
												</div>
											)}
										</div>
									</div>
								)}

								{/* Tags */}
								{recipe.metaTags && (
									<div className='flex flex-wrap gap-1 pt-2'>
										<Tag className='size-3 text-muted-foreground mt-0.5' />
										{recipe.metaTags
											.split(',')
											.filter(Boolean)
											.slice(0, 3)
											.map((tag, i) => (
												<span
													key={i}
													className='inline-flex items-center py-0.5 px-1.5 text-xs font-medium rounded-md ring-1 ring-inset bg-muted ring-gray-500/10'
												>
													{tag.trim()}
												</span>
											))}
										{recipe.metaTags.split(',').filter(Boolean).length > 3 && (
											<span className='text-xs text-muted-foreground'>
												+{recipe.metaTags.split(',').filter(Boolean).length - 3}
											</span>
										)}
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
						{Math.min(page * perPage, total)} of {total} recipes
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
