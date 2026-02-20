import type * as React from 'react'

import { NavMain } from '@/components/admin-sidebar/nav-main'
import { NavProjects } from '@/components/admin-sidebar/nav-projects'
import { NavSecondary } from '@/components/admin-sidebar/nav-secondary'
import { NavUser } from '@/components/admin-sidebar/nav-user'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import { FitByWsysLogo } from '@/components/wsysIcon'

import {
	ChartPieIcon,
	CropIcon,
	GearIcon,
	LifebuoyIcon,
	MapTrifoldIcon,
	PaperPlaneTiltIcon,
	RobotIcon,
	TerminalIcon,
} from '@phosphor-icons/react'

const data = {
	user: {
		name: 'shadcn',
		email: 'm@example.com',
		avatar: '/avatars/shadcn.jpg',
	},
	navMain: [
		{
			title: 'Nutrition',
			url: '#',
			icon: <TerminalIcon />,
			isActive: true,
			items: [
				{
					title: 'Recipes',
					url: '/$orgSlug/recipes',
				},
				{
					title: 'Ingredients',
					url: '/$orgSlug/ingredients',
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
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar
			className='top-(--header-height) h-[calc(100svh-var(--header-height))]!'
			{...props}
		>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<img alt='Fit by wsys' src='/logo.webp' width='40' height='40' />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				<NavProjects projects={data.projects} />
				<NavSecondary items={data.navSecondary} className='mt-auto' />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={data.user} />
			</SidebarFooter>
		</Sidebar>
	)
}
