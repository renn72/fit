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
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'
import { FitByWsysLogo } from '@/components/wsysIcon'

import {
	BookOpenIcon,
	ChartPieIcon,
	CommandIcon,
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
					title: 'Meal Plans',
					url: '#',
				},
				{
					title: 'Recipes',
					url: '#',
				},
				{
					title: 'Ingredients',
					url: '#',
				},
			],
		},
		{
			title: 'Fitness',
			url: '#',
			icon: <RobotIcon weight='duotone' />,
			items: [
				{
					title: 'Genesis',
					url: '#',
				},
				{
					title: 'Explorer',
					url: '#',
				},
				{
					title: 'Exercises',
					url: '#',
				},
			],
		},
		{
			title: 'Root',
			url: '#',
			icon: <GearIcon />,
			items: [
				{
					title: 'General',
					url: '#',
				},
				{
					title: 'Team',
					url: '#',
				},
				{
					title: 'Billing',
					url: '#',
				},
				{
					title: 'Limits',
					url: '#',
				},
			],
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
