import type * as React from 'react'

import { NavMain } from '@/components/dictator-sidebar/nav-main'
import { NavSecondary } from '@/components/dictator-sidebar/nav-secondary'
import { NavUser } from '@/components/dictator-sidebar/nav-user'
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuItem,
} from '@/components/ui/sidebar'

import {
	DatabaseIcon,
	GearIcon,
	LifebuoyIcon,
	PaperPlaneTiltIcon,
	RobotIcon,
	TerminalIcon,
} from '@phosphor-icons/react'

const data = {
	user: {
		name: 'Dictator',
		email: 'root@fit.com',
		avatar: '/avatars/dictator.jpg',
	},
	navMain: [
		{
			title: 'Base Data',
			url: '#',
			icon: <DatabaseIcon weight='duotone' />,
			isActive: true,
			items: [
				{
					title: 'Base Ingredients',
					url: '/dictator/base-ingredients',
				},
				{
					title: 'Base Exercises',
					url: '/dictator/base-exercises',
				},
			],
		},
		{
			title: 'Org Data',
			url: '#',
			icon: <RobotIcon weight='duotone' />,
			items: [
				{
					title: 'Org Ingredients',
					url: '/dictator/org-ingredients',
				},
				{
					title: 'Org Exercises',
					url: '/dictator/org-exercises',
				},
			],
		},
		{
			title: 'System',
			url: '#',
			icon: <GearIcon weight='duotone' />,
			items: [
				{
					title: 'Generation',
					url: '/dictator/generation',
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
}

export function DictatorSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
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
				<NavSecondary items={data.navSecondary} className='mt-auto' />
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	)
}
