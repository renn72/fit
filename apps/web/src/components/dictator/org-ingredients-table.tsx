'use client'

import * as React from 'react'

import { DataGrid } from '@/components/data-grid/data-grid'
import { DataGridFilterMenu } from '@/components/data-grid/data-grid-filter-menu'
import { DataGridKeyboardShortcuts } from '@/components/data-grid/data-grid-keyboard-shortcuts'
import { DataGridRowHeightMenu } from '@/components/data-grid/data-grid-row-height-menu'
import { getDataGridSelectColumn } from '@/components/data-grid/data-grid-select-column'
import { DataGridSortMenu } from '@/components/data-grid/data-grid-sort-menu'
import { DataGridViewMenu } from '@/components/data-grid/data-grid-view-menu'
import { useDataGrid } from '@/hooks/use-data-grid'
import { getFilterFn } from '@/lib/data-grid-filters'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'

export function OrgIngredientsTable() {
	const { data: rawIngredients } = useSuspenseQuery(
		orpc.ingredient.getAll.queryOptions({ input: {} }),
	)

	const ingredients = React.useMemo(() => {
		return rawIngredients.map((i) => ({
			...i,

			name: i.name.replace(/^Overwrite: /, ''),
		}))
	}, [rawIngredients])

	const dataHeight =
		typeof window !== 'undefined' ? window.innerHeight - 138 : 600

	const columns = React.useMemo(() => {
		const filterFn = getFilterFn<any>()

		return [
			getDataGridSelectColumn<any>(),
			{
				id: 'createdAt',
				accessorKey: 'createdAt',
				header: 'Created At',
				filterFn,
				meta: {
					label: 'Created At',
					cell: {
						variant: 'date',
					},
				},
			},
			{
				id: 'name',
				accessorKey: 'name',
				header: 'Name',
				minSize: 260,
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
						precision: 1,
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
						precision: 1,
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
						precision: 1,
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
						precision: 1,
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
					label: 'Serve Unit',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'isOverwrite',
				accessorFn: (row: any) => !!row.baseIngredientId,
				header: 'Overwrite',
				filterFn,
				meta: {
					label: 'Is Overwrite',
					cell: {
						variant: 'checkbox',
					},
				},
			},
			{
				id: 'creatorName',
				accessorKey: 'creatorName',
				header: 'Creator',
				filterFn,
				meta: {
					label: 'Creator',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'organisationSlug',
				accessorKey: 'organisationSlug',
				header: 'Org Slug',
				filterFn,
				meta: {
					label: 'Org Slug',
					cell: {
						variant: 'short-text',
					},
				},
			},
		]
	}, [])

	const { table, ...dataGridProps } = useDataGrid({
		data: ingredients,
		// @ts-ignore TODO: fix types
		columns,
		getRowId: (row) => row.id,
		enableSearch: true,
	})

	return (
		<div className='flex flex-col gap-4 h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>Org Ingredients</h1>
				<div className='flex gap-2 items-center'>
					<DataGridFilterMenu table={table} />
					<DataGridSortMenu table={table} />
					<DataGridRowHeightMenu table={table} />
					<DataGridViewMenu table={table} />
				</div>
			</div>
			<div className='overflow-hidden flex-1 rounded-md border'>
				<DataGridKeyboardShortcuts enableSearch={!!dataGridProps.searchState} />
				<DataGrid table={table} {...dataGridProps} height={dataHeight} />
			</div>
		</div>
	)
}
