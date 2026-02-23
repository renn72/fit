'use client'

import * as React from 'react'

import { DataGrid } from '@/components/data-grid/data-grid'
import { DataGridFilterMenu } from '@/components/data-grid/data-grid-filter-menu'
import { DataGridKeyboardShortcuts } from '@/components/data-grid/data-grid-keyboard-shortcuts'
import { DataGridRowHeightMenu } from '@/components/data-grid/data-grid-row-height-menu'
import { getDataGridSelectColumn } from '@/components/data-grid/data-grid-select-column'
import { DataGridSortMenu } from '@/components/data-grid/data-grid-sort-menu'
import { DataGridViewMenu } from '@/components/data-grid/data-grid-view-menu'
import { Button } from '@/components/ui/button'
import { useDataGrid } from '@/hooks/use-data-grid'
import { getFilterFn } from '@/lib/data-grid-filters'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'

import { PlusIcon } from '@phosphor-icons/react'

export function BaseExercisesTable() {
	const { data: exercises } = useSuspenseQuery(
		orpc.exercise.getAllBase.queryOptions({ input: {} }),
	)

	const dataHeight =
		typeof window !== 'undefined' ? window.innerHeight - 138 : 600

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
				id: 'category',
				accessorKey: 'category',
				header: 'Category',
				filterFn,
				meta: {
					label: 'Category',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'level',
				accessorKey: 'level',
				header: 'Level',
				filterFn,
				meta: {
					label: 'Level',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'force',
				accessorKey: 'force',
				header: 'Force',
				filterFn,
				meta: {
					label: 'Force',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'mechanic',
				accessorKey: 'mechanic',
				header: 'Mechanic',
				filterFn,
				meta: {
					label: 'Mechanic',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'equipment',
				accessorKey: 'equipment',
				header: 'Equipment',
				filterFn,
				meta: {
					label: 'Equipment',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'primaryMuscles',
				accessorKey: 'primaryMuscles',
				header: 'Primary Muscles',
				filterFn,
				meta: {
					label: 'Primary Muscles',
					cell: {
						variant: 'short-text',
					},
				},
			},
		]
	}, [])

	const { table, ...dataGridProps } = useDataGrid({
		data: exercises,
		// @ts-ignore TODO: fix types
		columns,
		getRowId: (row) => row.id,
		enableSearch: true,
	})

	return (
		<div className='flex flex-col gap-4 h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>Base Exercises</h1>
				<div className='flex gap-2 items-center'>
					<DataGridFilterMenu table={table} />
					<DataGridSortMenu table={table} />
					<DataGridRowHeightMenu table={table} />
					<DataGridViewMenu table={table} />
					<Button size='sm' className='gap-2'>
						<PlusIcon /> Add Exercise
					</Button>
				</div>
			</div>
			<div className='overflow-hidden flex-1 rounded-md border'>
				<DataGridKeyboardShortcuts enableSearch={!!dataGridProps.searchState} />
				<DataGrid table={table} {...dataGridProps} height={dataHeight} />
			</div>
		</div>
	)
}
