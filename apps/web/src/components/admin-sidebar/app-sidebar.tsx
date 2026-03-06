'use client'

import type * as React from 'react'

import { BrandMark } from '@/components/brand-mark'
import { NavMain } from '@/components/admin-sidebar/nav-main'
import { NavUser } from '@/components/admin-sidebar/nav-user'
import { NavUserSelect } from '@/components/admin-sidebar/nav-user-select'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarMenu,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import { orpc } from '@/utils/orpc'

import { useQuery } from '@tanstack/react-query'

import {
	BarbellIcon,
	CarrotIcon,
	ChartPieIcon,
	CookingPotIcon,
	CropIcon,
	MapTrifoldIcon,
} from '@phosphor-icons/react'

const data = {
	navMain: [
		{
			title: 'Nutrition',
			url: '#',
			icon: <CarrotIcon />,
			isActive: true,
			items: [
				{
					title: 'Ingredients',
					url: '/$orgSlug/ingredients',
				},
				{
					title: 'Recipes',
					url: '/$orgSlug/recipes',
				},
				{
					title: 'Menu Templates',
					url: '/$orgSlug/menu-templates',
				},
			],
		},
		{
			title: 'Fitness',
			url: '#',
			icon: <BarbellIcon />,
			isActive: true,
			items: [
				{
					title: 'Movements',
					url: '/$orgSlug/movements',
				},
				{
					title: 'Exercises',
					url: '/$orgSlug/exercises',
				},
				{
					title: 'Warmups',
					url: '/$orgSlug/warmups',
				},
				{
					title: 'Workouts',
					url: '/$orgSlug/workouts',
				},
				{
					title: 'Block Templates',
					url: '/$orgSlug/block-templates',
				},
			],
		},
	],
	projects: [
		{
			name: 'Design Engineering',
			url: '#',
			icon: <CropIcon />,
		},
		{
			name: 'Sales & Marketing',
			url: '#',
			icon: <ChartPieIcon />,
		},
		{
			name: 'Travel',
			url: '#',
			icon: <MapTrifoldIcon />,
		},
	],
	navUser: [
		{
			title: 'Nutrition',
			url: '#',
			icon: <CookingPotIcon />,
			isActive: true,
			items: [
				{
					title: 'User Menus',
					url: '/$orgSlug/user-menus',
				},
				{
					title: 'Create Menu',
					url: '/$orgSlug/user-menu-create',
				},
			],
		},
	],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	selectedUserId: string | null
	onUserSelect: (userId: string) => void
}

export function AppSidebar({
	selectedUserId,
	onUserSelect,
	...props
}: AppSidebarProps) {
	const { data: usersData } = useQuery(orpc.user.getAllByOrg.queryOptions())
	const users = usersData ?? []
	return (
		<Sidebar className='h-100svh' {...props}>
			<SidebarContent>
				<SidebarMenu>
					<NavUserSelect
						users={users}
						selectedUserId={selectedUserId}
						onUserSelect={onUserSelect}
					/>
				</SidebarMenu>
				<NavMain items={data.navMain} />
				<NavUser items={data.navUser} />
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenuItem>
					<BrandMark className='size-10 text-xl' />
				</SidebarMenuItem>
			</SidebarFooter>
		</Sidebar>
	)
}
