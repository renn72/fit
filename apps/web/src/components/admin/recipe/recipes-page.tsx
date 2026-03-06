'use client'

import * as React from 'react'

import { RecipeRowActions } from '@/components/admin/recipe/recipe-row-actions'
import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list'
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

import { ForkKnifeIcon, ListIcon, SquaresFourIcon } from '@phosphor-icons/react'
import _ from 'lodash'

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
		serveSize?: number
	}
}

interface Recipe {
	id: string
	name: string
	description: string | null
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

function splitCsv(value: string | null | undefined): string[] {
	if (!value) return []
	return value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean)
}

function calculateRecipeTotals(recipe: Recipe): RecipeWithTotals {
	const totals = recipe.ingredients.reduce(
		(acc, item) => {
			const baseServeSize =
				item.ingredient.serveSize && item.ingredient.serveSize > 0
					? item.ingredient.serveSize
					: 100
			const ratio = item.amount / baseServeSize
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

function formatMacro(value: number, suffix: string): string {
	return `${Math.round(value * 10) / 10}${suffix}`
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
	columnHelper.accessor('description', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Description' />
		),
		cell: ({ row }) => (
			<div className='max-w-60 truncate'>
				{(row.getValue('description') as string | null) ?? '-'}
			</div>
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
			const tags = splitCsv(row.getValue('metaTags') as string)
			if (tags.length === 0)
				return <span className='text-muted-foreground'>-</span>
			return (
				<div className='flex flex-wrap gap-1'>
					{tags.slice(0, 3).map((tag) => (
						<Badge key={tag} variant='secondary'>
							{tag}
						</Badge>
					))}
					{tags.length > 3 && (
						<span className='text-xs text-muted-foreground'>
							+{tags.length - 3} more
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
		cell: ({ row }) => (
			<RecipeRowActions
				recipe={{
					id: row.original.id,
					name: row.original.name,
				}}
			/>
		),
	}),
]

const route = getRouteApi('/$orgSlug/recipes')

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

	const navigate = route.useNavigate()
	const { view, q, page, perPage, sort } = route.useSearch()

	const recipesData: RecipeWithTotals[] = React.useMemo(() => {
		return ((recipes as Recipe[]) ?? []).map(calculateRecipeTotals)
	}, [recipes])

	const { paginatedData, pageCount, totalCount } = React.useMemo(() => {
		const processed = [...recipesData]
		const normalizedQuery = q.trim().toLowerCase()
		const filtered =
			normalizedQuery.length === 0
				? processed
				: processed.filter((recipe) => {
						const nameMatch = recipe.name
							.toLowerCase()
							.includes(normalizedQuery)
						const categoryMatch = (recipe.category ?? '')
							.toLowerCase()
							.includes(normalizedQuery)
						return nameMatch || categoryMatch
					})

		if (sort && sort.length > 0) {
			const { id, desc } = sort[0]
			filtered.sort((a, b) => {
				const aValue = a[id as keyof RecipeWithTotals]
				const bValue = b[id as keyof RecipeWithTotals]

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
	}, [recipesData, q, sort, page, perPage])

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
			to: '/$orgSlug/recipes',
			params: { orgSlug },
			search: (prev) => ({ ...prev, view: newView as 'table' | 'grid' }),
			replace: true,
		})
	}

	const handleSearchChange = (value: string) => {
		navigate({
			to: '/$orgSlug/recipes',
			params: { orgSlug },
			search: (prev) => ({ ...prev, q: value, page: 1 }),
			replace: true,
		})
	}

	return (
		<div className='flex flex-col gap-4 p-4 w-full h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold tracking-tight'>Recipes</h1>
				<div className='flex gap-2 items-center'>
					<DocsLink doc='createRecipes' label='Recipe Docs' />
					<Link to='/$orgSlug/recipes/create' params={{ orgSlug }}>
						<Button>Create Recipe</Button>
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
						total={totalCount}
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
			<div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
				{data.map((recipe) => {
					const categories = splitCsv(recipe.category)
					const tags = splitCsv(recipe.metaTags)

					return (
						<Card
							key={recipe.id}
							className='overflow-hidden shadow-sm transition-shadow hover:shadow-md border-border/70 bg-card'
						>
							<CardHeader className='pb-4 space-y-3 bg-gradient-to-r border-b from-orange-50/70 to-emerald-50/70 dark:from-orange-950/20 dark:to-emerald-950/20'>
								<div className='flex gap-3 justify-between items-start'>
									<div className='min-w-0'>
										<CardTitle className='text-lg leading-tight truncate'>
											{recipe.name}
										</CardTitle>
										<p className='text-xs text-muted-foreground'>
											By {recipe.creatorName || 'Unknown'} •{' '}
											{new Date(recipe.createdAt).toLocaleDateString()}
										</p>
									</div>
									<RecipeRowActions
										recipe={{ id: recipe.id, name: recipe.name }}
										buttonClassName='h-8 w-8'
									/>
								</div>

								{(categories.length > 0 || tags.length > 0) && (
									<div className='flex flex-wrap gap-1'>
										{categories.map((category) => (
											<Badge key={`category-${category}`} variant='secondary'>
												{category}
											</Badge>
										))}
										{tags.map((tag) => (
											<Badge key={`tag-${tag}`} variant='outline'>
												{tag}
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
												{formatMacro(recipe.totalCalories, ' kcal')}
											</div>
										</div>
										<div className='p-2 rounded-lg border bg-emerald-50/80 dark:bg-emerald-950/20'>
											<div className='text-[11px] text-muted-foreground'>
												Protein
											</div>
											<div className='text-sm font-semibold text-emerald-700 dark:text-emerald-300'>
												{formatMacro(recipe.totalProtein, ' g')}
											</div>
										</div>
										<div className='p-2 rounded-lg border bg-blue-50/80 dark:bg-blue-950/20'>
											<div className='text-[11px] text-muted-foreground'>
												Carbs
											</div>
											<div className='text-sm font-semibold text-blue-700 dark:text-blue-300'>
												{formatMacro(recipe.totalCarbs, ' g')}
											</div>
										</div>
										<div className='p-2 rounded-lg border bg-pink-50/80 dark:bg-pink-950/20'>
											<div className='text-[11px] text-muted-foreground'>
												Fat
											</div>
											<div className='text-sm font-semibold text-pink-700 dark:text-pink-300'>
												{formatMacro(recipe.totalFat, ' g')}
											</div>
										</div>
									</div>
								</div>

								<ScrollArea className='h-40 rounded-xl border bg-muted/20'>
									<div className='p-3 space-y-2'>
										<div className='text-sm font-medium text-muted-foreground'>
											Ingredients ({recipe.ingredients.length})
										</div>
										{recipe.ingredients.map((item) => (
											<div
												key={item.id}
												className='flex gap-2 items-center py-1.5 px-2 rounded-md border bg-background'
											>
												<ForkKnifeIcon className='size-3.5 text-emerald-600 dark:text-emerald-300 shrink-0' />
												<div className='min-w-0 flex-1'>
													<p className='text-xs font-medium truncate'>
														{item.ingredient.name}
													</p>
													<p className='text-[11px] text-muted-foreground'>
														{item.amount}
														{item.unit}
													</p>
												</div>
											</div>
										))}
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
						{Math.min(page * perPage, total)} of {total} recipes
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
