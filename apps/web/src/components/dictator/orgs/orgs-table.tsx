'use client'

import * as React from 'react'

import { DataGrid } from '@/components/data-grid/data-grid'
import { DataGridFilterMenu } from '@/components/data-grid/data-grid-filter-menu'
import { DataGridKeyboardShortcuts } from '@/components/data-grid/data-grid-keyboard-shortcuts'
import { DataGridRowHeightMenu } from '@/components/data-grid/data-grid-row-height-menu'
import { getDataGridSelectColumn } from '@/components/data-grid/data-grid-select-column'
import { DataGridSortMenu } from '@/components/data-grid/data-grid-sort-menu'
import { DataGridViewMenu } from '@/components/data-grid/data-grid-view-menu'
import { OrgRowActions } from '@/components/dictator/orgs/org-row-actions'
import { Badge } from '@/components/ui/badge'
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
				id: 'limits',
				accessorKey: 'limits',
				header: 'Limits',
				cell: ({ row }: { row: any }) => {
					const effectiveMaxMembers = row.getValue('effectiveMaxMembers')
					const effectiveMaxTrainers = row.getValue('effectiveMaxTrainers')
					const baseMaxMembers = row.getValue('baseMaxMembers')
					const baseMaxTrainers = row.getValue('baseMaxTrainers')
					const hasBonus = row.getValue('hasActiveBonus')

					return (
						<div className='flex flex-col gap-1'>
							<div className='flex items-center gap-1'>
								<span className='text-xs'>{effectiveMaxMembers} members</span>
								{hasBonus && effectiveMaxMembers > baseMaxMembers && (
									<Badge variant='secondary' className='text-[10px] h-4'>
										+{effectiveMaxMembers - baseMaxMembers}
									</Badge>
								)}
							</div>
							<div className='flex items-center gap-1'>
								<span className='text-xs'>{effectiveMaxTrainers} trainers</span>
								{hasBonus && effectiveMaxTrainers > baseMaxTrainers && (
									<Badge variant='secondary' className='text-[10px] h-4'>
										+{effectiveMaxTrainers - baseMaxTrainers}
									</Badge>
								)}
							</div>
						</div>
					)
				},
				meta: {
					label: 'Effective Limits',
					cell: {
						variant: 'custom',
					},
				},
			},
			{
				id: 'pricing',
				accessorKey: 'pricing',
				header: 'Pricing',
				cell: ({ row }: { row: any }) => {
					const hasDiscount = row.getValue('hasActiveDiscount')
					const baseMonthly = row.getValue('basePriceMonthly')
					const discountedMonthly = row.getValue('discountedPriceMonthly')
					const discountType = row.getValue('discountType')
					const discountValue = row.getValue('discountValue')

					if (!hasDiscount || baseMonthly === discountedMonthly) {
						return <div className='text-xs'>${baseMonthly / 100}/mo</div>
					}

					return (
						<div className='flex flex-col gap-1'>
							<div className='flex items-center gap-1'>
								<span className='text-xs line-through text-muted-foreground'>
									${baseMonthly / 100}
								</span>
								<span className='text-xs font-medium'>
									${discountedMonthly / 100}/mo
								</span>
							</div>
							<Badge variant='secondary' className='text-[10px] h-4 w-fit'>
								{discountType === 'percentage'
									? `${discountValue}% off`
									: `$${(discountValue ?? 0) / 100} off`}
							</Badge>
						</div>
					)
				},
				meta: {
					label: 'Pricing',
					cell: {
						variant: 'custom',
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
			{
				id: 'actions',
				cell: ({ row }: { row: any }) => <OrgRowActions row={row} />,
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
