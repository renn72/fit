import { cn } from '@/lib/utils'

type BrandMarkProps = {
	className?: string
	label?: string
}

export function BrandMark({
	className,
	label = 'Forma by WSYS',
}: BrandMarkProps) {
	return (
		<span
			role='img'
			aria-label={label}
			className={cn(
				'inline-grid place-items-center rounded-[0.7rem] [background:linear-gradient(135deg,#f7d58a_0%,#e0a64b_48%,#9e6420_100%)]',
				' text-[#2c200f] font-black leading-none select-none font-[Outfit,sans-serif]',
				className,
			)}
		>
			F
		</span>
	)
}
