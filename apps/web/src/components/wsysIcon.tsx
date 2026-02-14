const FitByWsysLogo = ({ size = 100, className = '' }) => {
	// Palette mapping from your OKLCH values:
	const colors = {
		primary: '#B68D40', // oklch(0.67 0.16 58) - Muted Gold
		bg: '#FDFCF0', // oklch(0.99 0.02 95) - Off White
		dark: '#8B7355', // oklch(0.553 0.013 58.071) - Deep Bronze
	}

	return (
		<svg
			width={size}
			height={size}
			viewBox='0 0 100 100'
			fill='none'
			xmlns='http://www.w3.org/2000/svg'
			className={className}
			shapeRendering='geometricPrecision'
		>
			{/* High-contrast Background Circle */}
			<circle cx='50' cy='50' r='48' fill={colors.primary} />

			{/* Simplified "WS" Monogram 
         Designed with thick strokes to remain visible at 10px 
      */}
			<path
				d='M20 35L32.5 70L45 45L57.5 70L70 35'
				stroke='white'
				strokeWidth='12'
				strokeLinecap='round'
				strokeLinejoin='round'
			/>

			{/* Dynamic "Under-swipe" for energy/fitness feel */}
			<path
				d='M25 80C40 75 60 75 75 80'
				stroke={colors.bg}
				strokeWidth='6'
				strokeLinecap='round'
			/>
		</svg>
	)
}

export { FitByWsysLogo }
