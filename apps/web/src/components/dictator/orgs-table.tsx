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

export function OrgsTable() {
	const { data: rawOrgs } = useSuspenseQuery(
		orpc.organisation.getAll.queryOptions({}),
	)

	const orgs = React.useMemo(() => {
		return rawOrgs.map((o) => ({
			...o,
		}))
	}, [rawOrgs])

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
				id: 'slug',
				accessorKey: 'slug',
				header: 'Slug',
				filterFn,
				meta: {
					label: 'Slug',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'state',
				accessorKey: 'state',
				header: 'State',
				filterFn,
				meta: {
					label: 'State',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'planName',
				accessorKey: 'planName',
				header: 'Plan',
				filterFn,
				meta: {
					label: 'Plan',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'memberCount',
				accessorKey: 'memberCount',
				header: 'Members',
				filterFn,
				meta: {
					label: 'Member Count',
					cell: {
						variant: 'number',
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
				id: 'creatorEmail',
				accessorKey: 'creatorEmail',
				header: 'Creator Email',
				filterFn,
				meta: {
					label: 'Creator Email',
					cell: {
						variant: 'short-text',
					},
				},
			},
		]
	}, [])

	const { table, ...dataGridProps } = useDataGrid({
		data: orgs,
		// @ts-ignore TODO: fix types
		columns,
		getRowId: (row) => row.id,
		enableSearch: true,
	})

	return (
		<div className='flex flex-col gap-4 h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>All Organisations</h1>
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
