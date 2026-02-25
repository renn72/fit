'use client'

import { useState } from 'react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '@/components/ui/command'
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover'
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'

import { CaretUpDownIcon, CheckIcon, UserIcon } from '@phosphor-icons/react'

interface User {
	id: string
	name: string
	email: string
	image: string | null
}

interface NavUserProps {
	users: User[] | undefined
	selectedUserId: string
	onUserSelect: (userId: string) => void
}

export function NavUserSelect({
	users,
	selectedUserId,
	onUserSelect,
}: NavUserProps) {
	const [open, setOpen] = useState(false)

	const selectedUser = users?.find((u) => u.id === selectedUserId)

	return (
		<SidebarMenu>
			<SidebarMenuItem className='p-1'>
				<Popover open={open} onOpenChange={setOpen}>
					<PopoverTrigger
						render={
							<SidebarMenuButton
								size='lg'
								variant='outline'
								className='border aria-expanded:bg-muted aria-expanded:text-foreground'
							/>
						}
					>
						<Avatar className='w-7 h-7'>
							<AvatarImage
								src={selectedUser?.image || undefined}
								alt={selectedUser?.name || 'User'}
							/>
							<AvatarFallback>
								<UserIcon className='w-4 h-4' />
							</AvatarFallback>
						</Avatar>
						<div className='grid flex-1 text-left'>
							<span className='text-sm font-medium truncate'>
								{selectedUser?.name || 'Select User'}
							</span>
							<span className='text-xs text-muted-foreground truncate'>
								{selectedUser?.email || 'Choose a user'}
							</span>
						</div>
						<CaretUpDownIcon className='ml-auto w-4 h-4 text-muted-foreground' />
					</PopoverTrigger>
					<PopoverContent className='p-0 w-84' align='start' side='right'>
						<Command>
							<CommandInput placeholder='Search users...' />
							<CommandList>
								<CommandEmpty>No users found.</CommandEmpty>
								<CommandGroup>
									{users?.map((user) => (
										<CommandItem
											key={user.id}
											onSelect={() => {
												onUserSelect(user.id)
												setOpen(false)
											}}
											className='flex gap-2 items-center'
										>
											<Avatar className='w-6 h-6'>
												<AvatarImage
													src={user.image || undefined}
													alt={user.name}
												/>
												<AvatarFallback>
													<UserIcon className='w-3 h-3' />
												</AvatarFallback>
											</Avatar>
											<div className='grid flex-1 text-left'>
												<span className='text-sm'>{user.name}</span>
												<span className='text-xs text-muted-foreground'>
													{user.email}
												</span>
											</div>
											{selectedUserId === user.id && (
												<CheckIcon className='ml-auto w-4 h-4' />
											)}
										</CommandItem>
									))}
								</CommandGroup>
							</CommandList>
						</Command>
					</PopoverContent>
				</Popover>
			</SidebarMenuItem>
		</SidebarMenu>
	)
}
