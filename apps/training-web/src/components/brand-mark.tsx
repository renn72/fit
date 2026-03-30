import { cn } from '@fit/components'

type BrandMarkProps = {
	className?: string
}

export function BrandMark({ className }: BrandMarkProps) {
	return (
		<span
			aria-hidden='true'
			className={cn(
				'inline-grid size-11 place-items-center rounded-2xl font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_18px_44px_rgba(71,92,173,0.2)]',
				'[background:linear-gradient(145deg,#9fb6ff_0%,#5068d8_46%,#f06b34_100%)]',
				'font-[Outfit,sans-serif] text-xl',
				className,
			)}
		>
			T
		</span>
	)
}
