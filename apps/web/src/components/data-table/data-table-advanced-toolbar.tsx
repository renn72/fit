'use client'

import type * as React from 'react'

import { DataTableViewOptions } from '@/components/data-table/data-table-view-options'
import { cn } from '@/lib/utils'

import type { Table } from '@tanstack/react-table'

interface DataTableAdvancedToolbarProps<TData>
	extends React.ComponentProps<'div'> {
	table: Table<TData>
}

export function DataTableAdvancedToolbar<TData>({
	table,
	children,
	className,
	...props
}: DataTableAdvancedToolbarProps<TData>) {
	return (
		<div
			role='toolbar'
			aria-orientation='horizontal'
			className={cn(
				'flex w-full items-start justify-between gap-2 p-1',
				className,
			)}
			{...props}
		>
			<div className='flex flex-wrap flex-1 gap-2 items-center'>{children}</div>
			<div className='flex gap-2 items-center'>
				<DataTableViewOptions table={table} align='end' />
			</div>
		</div>
	)
}
