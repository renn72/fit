'use client'

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { authClient } from '@/lib/auth-client'

import { Link, useNavigate } from '@tanstack/react-router'

import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'

export function UserMenu() {
	const navigate = useNavigate()
	const { data: session, isPending } = authClient.useSession()

	if (isPending) {
		return <Skeleton className='w-24 h-9' />
	}

	if (!session) {
		return (
			<Link to='/login'>
				<Button variant='outline'>Sign In</Button>
			</Link>
		)
	}

	const metaTags = session.user.metaTags?.split(',') ?? []
	const isDictator = metaTags.includes('dictator')

	return (
		<DropdownMenu>
			<DropdownMenuTrigger render={<Button variant='outline' />}>
				{session.user.name}
			</DropdownMenuTrigger>
			<DropdownMenuContent className='bg-card'>
				<DropdownMenuGroup>
					<DropdownMenuLabel>My Account</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuItem>{session.user.email}</DropdownMenuItem>
					{session.user.organisationSlug && (
						<DropdownMenuItem
							render={
								<Link
									to='/$orgSlug/admin/s'
									params={{ orgSlug: session.user.organisationSlug }}
								/>
							}
						>
							Admin Panel
						</DropdownMenuItem>
					)}
					{isDictator && (
						<DropdownMenuItem render={<Link to='/dictator' />}>
							Dictator Mode
						</DropdownMenuItem>
					)}
					<DropdownMenuSeparator />
					<DropdownMenuItem
						variant='destructive'
						onClick={() => {
							authClient.signOut({
								fetchOptions: {
									onSuccess: () => {
										navigate({
											to: '/',
										})
									},
								},
							})
						}}
					>
						Sign Out
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
