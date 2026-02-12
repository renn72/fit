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
			title: 'Playground',
			url: '#',
			icon: <TerminalIcon />,
			isActive: true,
			items: [
				{
					title: 'History',
					url: '#',
				},
				{
					title: 'Starred',
					url: '#',
				},
				{
					title: 'Settings',
					url: '#',
				},
			],
		},
		{
			title: 'Models',
			url: '#',
			icon: <RobotIcon />,
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
					title: 'Quantum',
					url: '#',
				},
			],
		},
		{
			title: 'Documentation',
			url: '#',
			icon: <BookOpenIcon />,
			items: [
				{
					title: 'Introduction',
					url: '#',
				},
				{
					title: 'Get Started',
					url: '#',
				},
				{
					title: 'Tutorials',
					url: '#',
				},
				{
					title: 'Changelog',
					url: '#',
				},
			],
		},
		{
			title: 'Settings',
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
						<SidebarMenuButton size='lg' render={<a href='#' />}>
							<div className='flex justify-center items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground aspect-square size-8'>
								<CommandIcon className='size-4' />
							</div>
							<div className='grid flex-1 text-sm leading-tight text-left'>
								<span className='font-medium truncate'>Acme Inc</span>
								<span className='text-xs truncate'>Enterprise</span>
							</div>
						</SidebarMenuButton>
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
