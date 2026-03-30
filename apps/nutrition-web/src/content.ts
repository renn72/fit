export const nutritionHighlights = [
	{
		label: 'Meals locked in',
		value: '5 of 6',
		note: 'Friday dinner is still waiting for coach approval.',
	},
	{
		label: 'Hydration pace',
		value: '2.4L',
		note: 'You are ahead of your midday target by 300ml.',
	},
	{
		label: 'Protein target',
		value: '162g',
		note: 'A small yogurt add-on closes the final gap tonight.',
	},
] as const

export const weeklyMenu = [
	{
		day: 'Monday',
		focus: 'High-protein reset',
		calories: '2,180 kcal',
		meals: ['Lemon oats', 'Chicken rice bowl', 'Salmon soba'],
	},
	{
		day: 'Tuesday',
		focus: 'Travel-friendly prep',
		calories: '2,040 kcal',
		meals: ['Overnight chia', 'Turkey wrap', 'Steak couscous'],
	},
	{
		day: 'Wednesday',
		focus: 'Recovery carbs',
		calories: '2,260 kcal',
		meals: ['Berry bagel stack', 'Teriyaki chicken', 'Pumpkin pasta'],
	},
	{
		day: 'Thursday',
		focus: 'Lower-fuss day',
		calories: '2,000 kcal',
		meals: ['Egg toast plate', 'Tuna potato salad', 'Coconut curry'],
	},
	{
		day: 'Friday',
		focus: 'Social flex meal',
		calories: '2,150 kcal',
		meals: ['Greek yogurt pot', 'Chicken burrito bowl', 'Open slot'],
	},
] as const

export const recipeLibrary = [
	{
		name: 'Coconut chicken curry',
		macros: '42P / 68C / 17F',
		timing: 'Dinner',
		note: 'Built for recovery nights and easy batch prep.',
	},
	{
		name: 'Greek yogurt crunch pot',
		macros: '28P / 34C / 9F',
		timing: 'Breakfast',
		note: 'Fast assembly, high satiety, portable for early starts.',
	},
	{
		name: 'Teriyaki beef rice bowl',
		macros: '39P / 74C / 14F',
		timing: 'Lunch',
		note: 'Best used on higher-output days before afternoon sessions.',
	},
	{
		name: 'Lemon herb salmon soba',
		macros: '37P / 58C / 18F',
		timing: 'Dinner',
		note: 'A cleaner option when appetite is low but volume matters.',
	},
] as const

export const checkInMetrics = [
	{
		label: 'Consistency',
		value: 86,
		caption: 'You hit plan structure on six of the last seven days.',
	},
	{
		label: 'Energy',
		value: 78,
		caption: 'Morning sessions improved after your carb increase.',
	},
	{
		label: 'Digestion',
		value: 91,
		caption: 'The current fiber split looks sustainable.',
	},
] as const

export const coachNotes = [
	'Keep Friday dinner flexible, but anchor protein first.',
	'Pre-log your grocery order before Wednesday to avoid substitution drift.',
	'Use the yogurt pot as your default backup when work runs late.',
] as const
