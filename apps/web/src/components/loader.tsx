import { Loader2 } from 'lucide-react'

export function Loader() {
	return (
		<div className='flex justify-center items-center pt-8 h-full'>
			<Loader2 className='animate-spin' />
		</div>
	)
}
