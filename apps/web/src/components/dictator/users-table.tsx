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

export function UsersTable() {
	const { data: rawUsers } = useSuspenseQuery(orpc.user.getAll.queryOptions({}))

	const users = React.useMemo(() => {
		return rawUsers.map((u) => ({
			...u,
		}))
	}, [rawUsers])

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
				filterFn,
				meta: {
					label: 'Name',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'email',
				accessorKey: 'email',
				header: 'Email',
				filterFn,
				meta: {
					label: 'Email',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'organisationName',
				accessorKey: 'organisationName',
				header: 'Organisation',
				filterFn,
				meta: {
					label: 'Organisation',
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
			{
				id: 'emailVerified',
				accessorKey: 'emailVerified',
				header: 'Verified',
				filterFn,
				meta: {
					label: 'Email Verified',
					cell: {
						variant: 'checkbox',
					},
				},
			},
		]
	}, [])

	const { table, ...dataGridProps } = useDataGrid({
		data: users,
		// @ts-ignore TODO: fix types
		columns,
		getRowId: (row) => row.id,
		enableSearch: true,
	})

	return (
		<div className='flex flex-col gap-4 h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>All Users</h1>
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
