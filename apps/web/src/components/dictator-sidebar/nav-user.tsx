'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@fit/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@fit/components/ui/dropdown-menu'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@fit/components/ui/sidebar'

import {
	BellIcon,
	CaretUpDownIcon,
	CheckCircleIcon,
	SignOutIcon,
	SparkleIcon,
} from '@phosphor-icons/react'

export function NavUser({
	user,
}: {
	user: {
		name: string
		email: string
		avatar: string
	}
}) {
	const { isMobile } = useSidebar()
	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger
						render={
							<SidebarMenuButton
								size='lg'
								className='aria-expanded:bg-muted aria-expanded:text-foreground'
							/>
						}
					>
						<Avatar>
							<AvatarFallback>DT</AvatarFallback>
						</Avatar>
						<div className='grid flex-1 text-sm leading-tight text-left'>
							<span className='font-medium truncate'>{user.name}</span>
							<span className='text-xs truncate'>{user.email}</span>
						</div>
						<CaretUpDownIcon className='ml-auto size-4' />
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className='rounded-lg min-w-56'
						side={isMobile ? 'bottom' : 'right'}
						align='end'
						sideOffset={4}
					>
						<DropdownMenuGroup>
							<DropdownMenuLabel className='p-0 font-normal'>
								<div className='flex gap-2 items-center py-1.5 px-1 text-sm text-left'>
									<Avatar>
										<AvatarImage src={user.avatar} alt={user.name} />
										<AvatarFallback>DT</AvatarFallback>
									</Avatar>
									<div className='grid flex-1 text-sm leading-tight text-left'>
										<span className='font-medium truncate'>{user.name}</span>
										<span className='text-xs truncate'>{user.email}</span>
									</div>
								</div>
							</DropdownMenuLabel>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<SparkleIcon />
								System Health
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<CheckCircleIcon />
								Admin Profile
							</DropdownMenuItem>
							<DropdownMenuItem>
								<BellIcon />
								System Alerts
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<SignOutIcon />
								Exit Dictator Mode
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
