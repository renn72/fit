import { ModeToggle } from '@/components/mode-toggle'
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
import { UserMenu } from '@/components/user-menu'

import { SidebarIcon } from 'lucide-react'

export function DictatorSidebarHeader() {
	const { toggleSidebar } = useSidebar()

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
								<BreadcrumbLink href='/dictator'>Dictator</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator />
							<BreadcrumbItem>
								<BreadcrumbPage>System Control</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
				<div className='flex gap-2 items-center'>
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
		</header>
	)
}
