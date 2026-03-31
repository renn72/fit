import { cn } from '@fit/components'

type BrandMarkProps = {
	className?: string
}

export function BrandMark({ className }: BrandMarkProps) {
	return (
		<span
			aria-hidden='true'
			className={cn(
				'inline-grid size-11 place-items-center rounded-2xl font-black text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_18px_40px_rgba(54,126,84,0.18)]',
				'[background:linear-gradient(145deg,#f9f7d0_0%,#d9f0b7_38%,#71d18d_100%)]',
				'font-[Outfit,sans-serif] text-xl',
				className,
			)}
		>
			N
		</span>
	)
}
