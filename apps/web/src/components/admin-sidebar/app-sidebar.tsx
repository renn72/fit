import type * as React from 'react'

import { NavMain } from '@/components/admin-sidebar/nav-main'
import { NavUser } from '@/components/admin-sidebar/nav-user'
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
	ChartPieIcon,
	CropIcon,
	LifebuoyIcon,
	MapTrifoldIcon,
	PaperPlaneTiltIcon,
	RobotIcon,
	TerminalIcon,
	UserIcon,
} from '@phosphor-icons/react'

const data = {
	navMain: [
		{
			title: 'User',
			url: '#',
			icon: <UserIcon />,
			isActive: true,
			items: [
				{
					title: 'Create Menu',
					url: '/$orgSlug/user-menu-create',
				},
			],
		},
		{
			title: 'Nutrition',
			url: '#',
			icon: <TerminalIcon />,
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
			icon: <RobotIcon weight='duotone' />,
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
	navSecondary: [
		{
			title: 'Support',
			url: '#',
			icon: <LifebuoyIcon />,
		},
		{
			title: 'Feedback',
			url: '#',
			icon: <PaperPlaneTiltIcon />,
		},
	],
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	selectedUserId: string
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
		<Sidebar
			className='top-(--header-height) h-[calc(100svh-var(--header-height))]!'
			{...props}
		>
			<SidebarContent>
				<SidebarMenu>
					<NavUser
						users={users}
						selectedUserId={selectedUserId}
						onUserSelect={onUserSelect}
					/>
				</SidebarMenu>
				<NavMain items={data.navMain} />
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenuItem>
					<img alt='Fit by wsys' src='/logo.webp' width='40' height='40' />
				</SidebarMenuItem>
			</SidebarFooter>
		</Sidebar>
	)
}
