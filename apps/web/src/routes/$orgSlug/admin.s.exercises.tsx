import { DataTable } from '@/components/data-table/data-table'
import { DataTableAdvancedToolbar } from '@/components/data-table/data-table-advanced-toolbar'
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header'
import { DataTableFilterList } from '@/components/data-table/data-table-filter-list'
import { Checkbox } from '@/components/ui/checkbox'
import { getUserForce } from '@/functions/get-user-force'
import { useDataTable } from '@/hooks/use-data-table'
import { orpc } from '@/utils/orpc'

import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
	createColumnHelper,
	getCoreRowModel,
	getFacetedRowModel,
	getFacetedUniqueValues,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from '@tanstack/react-table'

export const Route = createFileRoute('/$orgSlug/admin/s/exercises')({
	component: RouteComponent,
	beforeLoad: async () => {
		const session = await getUserForce()
		return { session }
	},
})

// Define the shape of our data
interface Exercise {
	id: string
	name: string
	level: string | null
	category: string
	force: string | null
	mechanic: string | null
	equipment: string | null
	primaryMuscles: string
	secondaryMuscles: string
	createdAt: Date
	isBase: boolean
	isOverwriteBase: boolean
}

const columnHelper = createColumnHelper<Exercise>()

const columns = [
	columnHelper.display({
		id: 'select',
		header: ({ table }) => (
			<Checkbox
				checked={
					table.getIsAllPageRowsSelected() ||
					(table.getIsSomePageRowsSelected() && 'indeterminate')
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label='Select all'
				className='translate-y-0.5'
			/>
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getIsSelected()}
				onCheckedChange={(value) => row.toggleSelected(!!value)}
				aria-label='Select row'
				className='translate-y-0.5'
			/>
		),
		enableSorting: false,
		enableHiding: false,
	}),
	columnHelper.accessor('name', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Name' />
		),
		meta: {
			label: 'Name',
			variant: 'text',
		},
		enableSorting: true,
		enableHiding: false,
	}),
	columnHelper.accessor('level', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Level' />
		),
		meta: {
			label: 'Level',
			variant: 'select',
			options: [
				{ label: 'Beginner', value: 'beginner' },
				{ label: 'Intermediate', value: 'intermediate' },
				{ label: 'Expert', value: 'expert' },
			],
		},
	}),
	columnHelper.accessor('category', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Category' />
		),
		meta: {
			label: 'Category',
			variant: 'select',
			options: [
				{ label: 'Strength', value: 'strength' },
				{ label: 'Stretching', value: 'stretching' },
				{ label: 'Plyometrics', value: 'plyometrics' },
				{ label: 'Strongman', value: 'strongman' },
				{ label: 'Powerlifting', value: 'powerlifting' },
				{ label: 'Cardio', value: 'cardio' },
				{ label: 'Olympic Weightlifting', value: 'olympic weightlifting' },
			],
		},
	}),
	columnHelper.accessor('force', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Force' />
		),
		meta: {
			label: 'Force',
			variant: 'select',
			options: [
				{ label: 'Push', value: 'push' },
				{ label: 'Pull', value: 'pull' },
				{ label: 'Static', value: 'static' },
			],
		},
	}),
	columnHelper.accessor('mechanic', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Mechanic' />
		),
		meta: {
			label: 'Mechanic',
			variant: 'select',
			options: [
				{ label: 'Compound', value: 'compound' },
				{ label: 'Isolation', value: 'isolation' },
			],
		},
	}),
	columnHelper.accessor('equipment', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Equipment' />
		),
		meta: {
			label: 'Equipment',
			variant: 'text', // Could be select if we have a finite list
		},
	}),
	columnHelper.accessor('primaryMuscles', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Primary Muscles' />
		),
		meta: {
			label: 'Primary Muscles',
			variant: 'text',
		},
	}),
	columnHelper.accessor('secondaryMuscles', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Secondary Muscles' />
		),
		meta: {
			label: 'Secondary Muscles',
			variant: 'text',
		},
	}),
	columnHelper.accessor('createdAt', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Created At' />
		),
		cell: ({ row }) => new Date(row.getValue('createdAt')).toLocaleDateString(),
		meta: {
			label: 'Created At',
			variant: 'date',
		},
	}),
	columnHelper.accessor('isBase', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Is Base' />
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getValue('isBase')}
				disabled
				aria-label='Is Base'
			/>
		),
		meta: {
			label: 'Is Base',
			variant: 'boolean',
		},
	}),
	columnHelper.accessor('isOverwriteBase', {
		header: ({ column }) => (
			<DataTableColumnHeader column={column} label='Overwrite Base' />
		),
		cell: ({ row }) => (
			<Checkbox
				checked={row.getValue('isOverwriteBase')}
				disabled
				aria-label='Overwrite Base'
			/>
		),
		meta: {
			label: 'Overwrite Base',
			variant: 'boolean',
		},
	}),
]

function RouteComponent() {
	const { orgSlug } = Route.useParams()
	const { session } = Route.useRouteContext()

	// We need to resolve the orgId from the session based on the slug.
	// Assuming user can only access their own org for now or we check if slug matches.
	// The session user object has organisationSlug and organisationId.

	const userOrgId =
		session?.user?.organisationSlug === orgSlug
			? session?.user?.organisationId
			: undefined

	const { data: exercises, isLoading: isExercisesLoading } = useQuery(
		orpc.exercise.getAllOrg.queryOptions({
			input: { organisationId: userOrgId! },
			enabled: userOrgId !== undefined,
		}),
	)

	const { table } = useDataTable({
		data: (exercises as Exercise[]) ?? [],
		columns,
		pageCount: 1, // Client-side pagination for now
		getRowId: (originalRow, index) => originalRow.id,
		initialState: {
			sorting: [{ id: 'createdAt', desc: true }],
			columnPinning: { right: ['actions'] },
		},
	})

	if (userOrgId && isExercisesLoading) {
		return <div className='p-4'>Loading...</div>
	}

	if (!userOrgId) {
		return <div className='p-4'>Organisation not found or access denied.</div>
	}

	return (
		<div className='flex flex-col gap-4 p-4 w-full h-full'>
			<div className='flex justify-between items-center'>
				<h1 className='text-2xl font-bold tracking-tight'>Exercises</h1>
			</div>
			<DataTable table={table}>
				<DataTableAdvancedToolbar table={table} className='border-b'>
					<DataTableFilterList table={table} />
				</DataTableAdvancedToolbar>
			</DataTable>
		</div>
	)
}
