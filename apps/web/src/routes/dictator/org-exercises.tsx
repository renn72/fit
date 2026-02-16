import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { orpc } from '@/utils/orpc'
import { useQuery } from '@tanstack/react-query'
import { DataGrid } from '@/components/data-grid/data-grid'
import { useDataGrid } from '@/hooks/use-data-grid'
import { DataGridKeyboardShortcuts } from '@/components/data-grid/data-grid-keyboard-shortcuts'
import { DataGridFilterMenu } from '@/components/data-grid/data-grid-filter-menu'
import { DataGridSortMenu } from '@/components/data-grid/data-grid-sort-menu'
import { DataGridRowHeightMenu } from '@/components/data-grid/data-grid-row-height-menu'
import { DataGridViewMenu } from '@/components/data-grid/data-grid-view-menu'
import { getDataGridSelectColumn } from '@/components/data-grid/data-grid-select-column'
import { getFilterFn } from '@/lib/data-grid-filters'

export const Route = createFileRoute('/dictator/org-exercises')({
	component: OrgExercisesPage,
})

function OrgExercisesPage() {
	const { data: exercises = [] } = useQuery(
		orpc.exercise.getAll.queryOptions({ limit: 1000 }),
	)

	const columns = React.useMemo(() => {
		const filterFn = getFilterFn<any>()
		return [
			getDataGridSelectColumn<any>(),
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
		]
	}, [])

	const { table, ...dataGridProps } = useDataGrid({
		data: exercises,
		columns,
		getRowId: (row) => row.id,
        enableSearch: true,
	})

	return (
		<div className='flex flex-col gap-4 h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>Org Exercises</h1>
				<div className='flex items-center gap-2'>
					<DataGridFilterMenu table={table} />
					<DataGridSortMenu table={table} />
					<DataGridRowHeightMenu table={table} />
					<DataGridViewMenu table={table} />
				</div>
			</div>
			<div className='flex-1 border rounded-md overflow-hidden'>
				<DataGridKeyboardShortcuts enableSearch={!!dataGridProps.searchState} />
				<DataGrid table={table} {...dataGridProps} height={undefined} />
			</div>
		</div>
	)
}
