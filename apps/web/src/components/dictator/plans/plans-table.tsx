'use client'

import * as React from 'react'

import { DataGrid } from '@/components/data-grid/data-grid'
import { DataGridFilterMenu } from '@/components/data-grid/data-grid-filter-menu'
import { DataGridKeyboardShortcuts } from '@/components/data-grid/data-grid-keyboard-shortcuts'
import { DataGridRowHeightMenu } from '@/components/data-grid/data-grid-row-height-menu'
import { getDataGridSelectColumn } from '@/components/data-grid/data-grid-select-column'
import { DataGridSortMenu } from '@/components/data-grid/data-grid-sort-menu'
import { DataGridViewMenu } from '@/components/data-grid/data-grid-view-menu'
import { PlanCreateDialog } from '@/components/dictator/plans/plan-create-dialog'
import { PlanRowActions } from '@/components/dictator/plans/plan-row-actions'
import { Checkbox } from '@/components/ui/checkbox'
import { useDataGrid } from '@/hooks/use-data-grid'
import { getFilterFn } from '@/lib/data-grid-filters'
import { orpc } from '@/utils/orpc'

import { useSuspenseQuery } from '@tanstack/react-query'

export function PlansTable() {
	const { data: rawPlans } = useSuspenseQuery(
		orpc.organisation.getAllPlansAdmin.queryOptions({}),
	)

	const plans = React.useMemo(() => {
		return rawPlans.map((p) => ({
			...p,
			priceMonthlyDisplay: `$${p.priceMonthly / 100}`,
			priceYearlyDisplay: `$${p.priceYearly / 100}`,
		}))
	}, [rawPlans])

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
				id: 'description',
				accessorKey: 'description',
				header: 'Description',
				filterFn,
				meta: {
					label: 'Description',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'priceMonthlyDisplay',
				accessorKey: 'priceMonthlyDisplay',
				header: 'Monthly Price',
				filterFn,
				meta: {
					label: 'Monthly Price',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'priceYearlyDisplay',
				accessorKey: 'priceYearlyDisplay',
				header: 'Yearly Price',
				filterFn,
				meta: {
					label: 'Yearly Price',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'maxMembers',
				accessorKey: 'maxMembers',
				header: 'Max Members',
				filterFn,
				meta: {
					label: 'Max Members',
					cell: {
						variant: 'number',
					},
				},
			},
			{
				id: 'maxTrainers',
				accessorKey: 'maxTrainers',
				header: 'Max Trainers',
				filterFn,
				meta: {
					label: 'Max Trainers',
					cell: {
						variant: 'number',
					},
				},
			},
			{
				id: 'hidden',
				accessorKey: 'hidden',
				header: 'Hidden',
				cell: ({ row }: { row: any }) => (
					<Checkbox
						checked={row.getValue('hidden')}
						disabled
						aria-label='Hidden'
					/>
				),
				filterFn,
				meta: {
					label: 'Hidden',
					cell: {
						variant: 'checkbox',
					},
				},
			},
			{
				id: 'cta',
				accessorKey: 'cta',
				header: 'CTA',
				filterFn,
				meta: {
					label: 'CTA',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'metaTags',
				accessorKey: 'metaTags',
				header: 'Meta Tags',
				filterFn,
				meta: {
					label: 'Meta Tags',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'actions',
				cell: ({ row }: { row: any }) => <PlanRowActions row={row} />,
			},
		]
	}, [])

	const { table, ...dataGridProps } = useDataGrid({
		data: plans,
		// @ts-ignore TODO: fix types
		columns,
		getRowId: (row) => row.id,
		enableSearch: true,
	})

	return (
		<div className='flex flex-col gap-4 h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold'>Plans</h1>
				<div className='flex gap-2 items-center'>
					<PlanCreateDialog />
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
