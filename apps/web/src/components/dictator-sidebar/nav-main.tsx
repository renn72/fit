'use client'

import { useState } from 'react'

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem,
} from '@/components/ui/sidebar'

import { CaretRightIcon } from '@phosphor-icons/react'

export function NavMain({
	items,
}: {
	items: {
		title: string
		url: string
		icon: React.ReactNode
		isActive?: boolean
		items?: {
			title: string
			url: string
		}[]
	}[]
}) {
	return (
		<SidebarGroup>
			<SidebarGroupLabel>Dictator Platform</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<NavMainItem key={item.title} item={item} />
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}

function NavMainItem({
	item,
}: {
	item: {
		title: string
		url: string
		icon: React.ReactNode
		isActive?: boolean
		items?: {
			title: string
			url: string
		}[]
	}
}) {
	const [isOpen, setIsOpen] = useState(true)

	return (
		<Collapsible
			open={isOpen}
			onOpenChange={setIsOpen}
			render={<SidebarMenuItem />}
		>
			<SidebarMenuButton tooltip={item.title} render={<a href={item.url} />}>
				{item.icon}
				<span>{item.title}</span>
			</SidebarMenuButton>
			{item.items?.length ? (
				<>
					<SidebarMenuAction
						render={<CollapsibleTrigger />}
						className='aria-expanded:rotate-90'
					>
						<CaretRightIcon />
						<span className='sr-only'>Toggle</span>
					</SidebarMenuAction>
					<CollapsibleContent keepMounted>
						<SidebarMenuSub>
							{item.items?.map((subItem) => (
								<SidebarMenuSubItem key={subItem.title}>
									<SidebarMenuSubButton render={<a href={subItem.url} />}>
										<span>{subItem.title}</span>
									</SidebarMenuSubButton>
								</SidebarMenuSubItem>
							))}
						</SidebarMenuSub>
					</CollapsibleContent>
				</>
			) : null}
		</Collapsible>
	)
}
