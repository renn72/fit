import { Label } from '@fit/components/ui/label'
import { SidebarInput } from '@fit/components/ui/sidebar'

import { Search } from 'lucide-react'

export function SearchForm({ ...props }: React.ComponentProps<'form'>) {
	return (
		<form {...props}>
			<div className='relative'>
				<Label htmlFor='search' className='sr-only'>
					Search
				</Label>
				<SidebarInput
					id='search'
					placeholder='Type to search...'
					className='pl-7 h-8'
				/>
				<Search className='absolute left-2 top-1/2 opacity-50 -translate-y-1/2 pointer-events-none select-none size-4' />
			</div>
		</form>
	)
}
