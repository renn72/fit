import type * as React from 'react'

import { BrandMark } from '@/components/brand-mark'
import { NavMain } from '@/components/dictator-sidebar/nav-main'
import { NavSecondary } from '@/components/dictator-sidebar/nav-secondary'
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
	RobotIcon,
} from '@phosphor-icons/react'

const data = {
	user: {
		name: 'Dictator',
		email: 'root@fit.com',
		avatar: '/avatars/dictator.jpg',
	},
	navMain: [
		{
			title: 'System',
			icon: <GearIcon weight='duotone' />,
			isActive: true,
			items: [
				{
					title: 'All Users',
					url: '/dictator/users',
				},
				{
					title: 'All Organisations',
					url: '/dictator/orgs',
				},
				{
					title: 'Plans',
					url: '/dictator/plans',
				},
				{
					title: 'App Features',
					url: '/dictator/app-features',
				},
				{
					title: 'Org Features',
					url: '/dictator/org-features',
				},
				{
					title: 'Generation',
					url: '/dictator/generation',
				},
			],
		},
		{
			title: 'Base Data',
			icon: <DatabaseIcon weight='duotone' />,
			items: [
				{
					title: 'Base Ingredients',
					url: '/dictator/base-ingredients',
				},
				{
					title: 'Base Movements',
					url: '/dictator/base-movements',
				},
			],
		},
		{
			title: 'Org Data',
			icon: <RobotIcon weight='duotone' />,
			items: [
				{
					title: 'Org Ingredients',
					url: '/dictator/org-ingredients',
				},
				{
					title: 'Org Movements',
					url: '/dictator/org-movements',
				},
				{
					title: 'Exercises',
					url: '/dictator/exercises',
				},
			],
		},
	],
	navSecondary: [],
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
						<BrandMark className='size-10 text-xl' />
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={data.navMain} />
				{data.navSecondary.length > 0 ? (
					<NavSecondary items={data.navSecondary} className='mt-auto' />
				) : null}
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	)
}
