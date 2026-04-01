import { cn } from '@fit/components'

type BrandMarkProps = {
	className?: string
}

export function BrandMark({ className }: BrandMarkProps) {
	return (
		<span
			aria-hidden='true'
			className={cn(
				'inline-grid size-11 place-items-center rounded-2xl bg-primary font-black text-primary-foreground',
				'font-[Outfit,sans-serif] text-xl',
				className,
			)}
		>
			T
		</span>
	)
}
