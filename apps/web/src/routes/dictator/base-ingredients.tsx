import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { orpc } from '@/utils/orpc'
import { useMutation, useQuery } from '@tanstack/react-query'
import { DataGrid } from '@/components/data-grid/data-grid'
import { useDataGrid } from '@/hooks/use-data-grid'
import { DataGridKeyboardShortcuts } from '@/components/data-grid/data-grid-keyboard-shortcuts'
import { DataGridFilterMenu } from '@/components/data-grid/data-grid-filter-menu'
import { DataGridSortMenu } from '@/components/data-grid/data-grid-sort-menu'
import { DataGridRowHeightMenu } from '@/components/data-grid/data-grid-row-height-menu'
import { DataGridViewMenu } from '@/components/data-grid/data-grid-view-menu'
import { getDataGridSelectColumn } from '@/components/data-grid/data-grid-select-column'
import { getFilterFn } from '@/lib/data-grid-filters'
import { Button } from '@/components/ui/button'
import { PlusIcon, TrashIcon } from '@phosphor-icons/react'

export const Route = createFileRoute('/dictator/base-ingredients')({
	component: IngredientsPage,
})

function IngredientsPage() {
	const { data: ingredients = [], refetch } = useQuery(
		orpc.ingredient.getAllBase.queryOptions({ limit: 1000 }),
	)

	const columns = React.useMemo(() => {
		const filterFn = getFilterFn<any>()
		return [
			getDataGridSelectColumn<any>(),
			{
				id: 'name',
				accessorKey: 'name',
				header: 'Name',
				filterFn,
				meta: {
					label: 'Name',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'calories',
				accessorKey: 'calories',
				header: 'Calories',
				filterFn,
				meta: {
					label: 'Calories',
					cell: {
						variant: 'number',
					},
				},
			},
			{
				id: 'protein',
				accessorKey: 'protein',
				header: 'Protein',
				filterFn,
				meta: {
					label: 'Protein',
					cell: {
						variant: 'number',
					},
				},
			},
			{
				id: 'fat',
				accessorKey: 'fat',
				header: 'Fat',
				filterFn,
				meta: {
					label: 'Fat',
					cell: {
						variant: 'number',
					},
				},
			},
			{
				id: 'carbohydrate',
				accessorKey: 'carbohydrate',
				header: 'Carbs',
				filterFn,
				meta: {
					label: 'Carbohydrate',
					cell: {
						variant: 'number',
					},
				},
			},
			{
				id: 'serveSize',
				accessorKey: 'serveSize',
				header: 'Size',
				filterFn,
				meta: {
					label: 'Serve Size',
					cell: {
						variant: 'number',
					},
				},
			},
			{
				id: 'serveUnit',
				accessorKey: 'serveUnit',
				header: 'Unit',
				filterFn,
				meta: {
					label: 'Unit',
					cell: {
						variant: 'short-text',
					},
				},
			},
            {
				id: 'publicFoodKey',
				accessorKey: 'publicFoodKey',
				header: 'Public Key',
				filterFn,
				meta: {
					label: 'Public Food Key',
					cell: {
						variant: 'short-text',
					},
				},
			},
		]
	}, [])

	const { table, ...dataGridProps } = useDataGrid({
		data: ingredients,
		columns,
		getRowId: (row) => row.id,
        enableSearch: true,
	})

	return (
		<div className='flex flex-col gap-4 h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>Base Ingredients</h1>
				<div className='flex items-center gap-2'>
					<DataGridFilterMenu table={table} />
					<DataGridSortMenu table={table} />
					<DataGridRowHeightMenu table={table} />
					<DataGridViewMenu table={table} />
					<Button size='sm' className='gap-2'>
						<PlusIcon /> Add Ingredient
					</Button>
				</div>
			</div>
			<div className='flex-1 border rounded-md overflow-hidden'>
				<DataGridKeyboardShortcuts enableSearch={!!dataGridProps.searchState} />
				<DataGrid table={table} {...dataGridProps} height={undefined} />
			</div>
		</div>
	)
}
