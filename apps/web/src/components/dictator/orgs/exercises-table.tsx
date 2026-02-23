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

export function ExercisesTable() {
	const { data: exercises } = useSuspenseQuery(
		orpc.exercise.getAll.queryOptions(),
	)

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
				id: 'movementName',
				accessorKey: 'movementName',
				header: 'Movement',
				filterFn,
				meta: {
					label: 'Movement',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'sets',
				accessorKey: 'sets',
				header: 'Sets',
				filterFn,
				meta: {
					label: 'Sets',
					cell: {
						variant: 'number',
					},
				},
			},
			{
				id: 'reps',
				accessorKey: 'reps',
				header: 'Reps',
				filterFn,
				meta: {
					label: 'Reps',
					cell: {
						variant: 'number',
					},
				},
			},
			{
				id: 'repUnit',
				accessorKey: 'repUnit',
				header: 'Rep Unit',
				filterFn,
				meta: {
					label: 'Rep Unit',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'ormPercent',
				accessorKey: 'ormPercent',
				header: '% 1RM',
				filterFn,
				meta: {
					label: '% 1RM',
					cell: {
						variant: 'number',
					},
				},
			},
			{
				id: 'targetRpe',
				accessorKey: 'targetRpe',
				header: 'Target RPE',
				filterFn,
				meta: {
					label: 'Target RPE',
					cell: {
						variant: 'number',
					},
				},
			},
			{
				id: 'restTime',
				accessorKey: 'restTime',
				header: 'Rest',
				filterFn,
				meta: {
					label: 'Rest Time',
					cell: {
						variant: 'number',
					},
				},
			},
			{
				id: 'restUnit',
				accessorKey: 'restUnit',
				header: 'Rest Unit',
				filterFn,
				meta: {
					label: 'Rest Unit',
					cell: {
						variant: 'short-text',
					},
				},
			},
			{
				id: 'tempoDown',
				accessorKey: 'tempoDown',
				header: 'Tempo Down',
				filterFn,
				meta: {
					label: 'Tempo Down',
					cell: {
						variant: 'number',
					},
				},
			},
			{
				id: 'tempoPause',
				accessorKey: 'tempoPause',
				header: 'Tempo Pause',
				filterFn,
				meta: {
					label: 'Tempo Pause',
					cell: {
						variant: 'number',
					},
				},
			},
			{
				id: 'tempoUp',
				accessorKey: 'tempoUp',
				header: 'Tempo Up',
				filterFn,
				meta: {
					label: 'Tempo Up',
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
				<h1 className='text-2xl font-bold'>All Exercises</h1>
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
