'use client'

import { ModeToggle } from '@/components/mode-toggle'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSidebar } from '@/components/ui/sidebar'
import { UserMenu } from '@/components/user-menu'

import { useLocation } from '@tanstack/react-router'

import { SidebarIcon } from 'lucide-react'

// @ts-ignore TODO: fix any
export function SidebarHeader({ session }: { session: any }) {
	const { toggleSidebar } = useSidebar()

	const location = useLocation()
	const bc = location.pathname
		.split('/')
		.slice(-1)
		.join('')
		.replaceAll('-', ' ')

	return (
		<header className='flex sticky top-0 z-50 items-center w-full border-b bg-background'>
			<div className='flex gap-2 justify-between items-center px-4 w-full h-(--header-height)'>
				<div className='flex gap-2 items-center'>
					<Button
						className='w-8 h-8'
						variant='ghost'
						size='icon'
						onClick={toggleSidebar}
					>
						<SidebarIcon />
					</Button>
					<Separator orientation='vertical' className='mr-2 h-4' />
					<Breadcrumb className='hidden sm:block'>
						<BreadcrumbList>
							<BreadcrumbItem>
								<img
									alt='Fit by wsys'
									src='/logo.webp'
									width='32'
									height='32'
								/>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage className='capitalize'>{bc}</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
				<div className='flex gap-2 items-center'>
					<ModeToggle />
					<UserMenu session={session} />
				</div>
			</div>
		</header>
	)
}
