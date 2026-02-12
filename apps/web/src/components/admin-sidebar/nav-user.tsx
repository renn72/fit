'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from '@/components/ui/sidebar'

import {
	BellIcon,
	CaretUpDownIcon,
	CheckCircleIcon,
	CreditCardIcon,
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
							<AvatarFallback>CN</AvatarFallback>
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
										<AvatarFallback>CN</AvatarFallback>
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
								Upgrade to Pro
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<CheckCircleIcon />
								Account
							</DropdownMenuItem>
							<DropdownMenuItem>
								<CreditCardIcon />
								Billing
							</DropdownMenuItem>
							<DropdownMenuItem>
								<BellIcon />
								Notifications
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuGroup>
							<DropdownMenuItem>
								<SignOutIcon />
								Log out
							</DropdownMenuItem>
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
