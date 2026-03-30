import type * as React from 'react'

import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@fit/components/ui/collapsible'
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
} from '@fit/components/ui/sidebar'

import { getRouteApi, Link } from '@tanstack/react-router'

import { CaretRightIcon } from '@phosphor-icons/react'

const route = getRouteApi('/$orgSlug')

export function NavUser({
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
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
	const { orgSlug } = route.useParams()
	return (
		<SidebarGroup>
			<SidebarGroupLabel>User</SidebarGroupLabel>
			<SidebarMenu>
				{items.map((item) => (
					<Collapsible
						key={item.title}
						defaultOpen={item.isActive}
						render={<SidebarMenuItem />}
					>
						<SidebarMenuButton
							tooltip={item.title}
							render={<a href={item.url} />}
						>
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
								<CollapsibleContent>
									<SidebarMenuSub>
										{item.items?.map((subItem) => (
											<SidebarMenuSubItem key={subItem.title}>
												<SidebarMenuSubButton
													render={
														<Link
															to={subItem.url}
															params={{ orgSlug }}
															search={(prev) => ({ ...prev })}
														/>
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
