'use client'

import { SearchForm } from '@/components/admin-sidebar/search-forms'
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSidebar } from '@/components/ui/sidebar'

import { SidebarIcon } from 'lucide-react'

export function SidebarHeader() {
	const { toggleSidebar } = useSidebar()

	return (
		<header className='flex sticky top-0 z-50 items-center w-full border-b bg-background'>
			<div className='flex gap-2 items-center px-4 w-full h-(--header-height)'>
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
							<BreadcrumbLink href='#'>Build Your Application</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Data Fetching</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<SearchForm className='w-full sm:ml-auto sm:w-auto' />
			</div>
		</header>
	)
}
