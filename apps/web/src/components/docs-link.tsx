import { buttonVariants } from '@fit/components/ui/button'
import { cn } from '@/lib/utils'
import { getDocsUrl, type DocsPathKey } from '@/utils/docs'

import { BookOpenIcon } from '@phosphor-icons/react'

interface DocsLinkProps {
	doc: DocsPathKey
	label?: string
	className?: string
}

export function DocsLink({
	doc,
	label = 'Open Docs',
	className,
}: DocsLinkProps) {
	return (
		<a
			href={getDocsUrl(doc)}
			target='_blank'
			rel='noreferrer noopener'
			className={cn(
				buttonVariants({ variant: 'outline', size: 'sm' }),
				'gap-2',
				className,
			)}
		>
			<BookOpenIcon className='size-4' />
			{label}
		</a>
	)
}
