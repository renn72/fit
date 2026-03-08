export const DEFAULT_INGREDIENT_PRECISION = 0.1

function getPrecisionDecimals(value: number): number {
	const normalized = value.toString().toLowerCase()

	if (normalized.includes('e-')) {
		const [, exponent = '0'] = normalized.split('e-')
		return Number.parseInt(exponent, 10)
	}

	const [, decimal = ''] = normalized.split('.')
	return decimal.length
}

export function normalizeIngredientPrecision(value: number | null | undefined) {
	if (!Number.isFinite(value) || !value || value <= 0) {
		return DEFAULT_INGREDIENT_PRECISION
	}

	const decimals = Math.min(Math.max(getPrecisionDecimals(value), 1), 6)
	return Number(value.toFixed(decimals))
}

export function roundToIngredientPrecision(
	value: number,
	precision: number | null | undefined,
) {
	if (!Number.isFinite(value)) {
		return 0
	}

	const normalizedPrecision = normalizeIngredientPrecision(precision)
	const decimals = Math.min(
		Math.max(getPrecisionDecimals(normalizedPrecision), 1),
		6,
	)
	const normalizedValue = Math.max(0, value)
	const rounded =
		Math.round(normalizedValue / normalizedPrecision) * normalizedPrecision

	return Number(rounded.toFixed(decimals))
}
