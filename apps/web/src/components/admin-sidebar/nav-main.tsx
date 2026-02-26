'use client'

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

import { getRouteApi, Link } from '@tanstack/react-router'

const route = getRouteApi('/$orgSlug')

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
	const { orgSlug } = route.useParams()
	return (
		<SidebarGroup>
			<SidebarGroupLabel>Platform</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						key={item.title}
						defaultOpen={item.isActive}
						render={<SidebarMenuItem />}
					>
						<SidebarMenuButton
							tooltip={item.title}
							size='lg'
							className='flex gap-2 items-center'
						>
							{item.icon}
							<span>{item.title}</span>
						</SidebarMenuButton>
						{item.items?.length ? (
							<>
								<SidebarMenuAction
									render={<CollapsibleTrigger />}
									className='mt-1 aria-expanded:rotate-90'
								>
									<CaretRightIcon />
									<span className='sr-only'>Toggle</span>
								</SidebarMenuAction>
								<CollapsibleContent>
									<SidebarMenuSub>
										{item.items?.map((subItem) => (
											<SidebarMenuSubItem key={subItem.title}>
												<SidebarMenuSubButton
													render={
														<Link to={subItem.url} params={{ orgSlug }} />
													}
												>
													<span>{subItem.title}</span>
												</SidebarMenuSubButton>
											</SidebarMenuSubItem>
										))}
									</SidebarMenuSub>
								</CollapsibleContent>
							</>
						) : null}
					</Collapsible>
				))}
			</SidebarMenu>
		</SidebarGroup>
	)
}
