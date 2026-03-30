export const trainingHighlights = [
	{
		label: 'Sessions completed',
		value: '3 of 4',
		note: 'The block is on pace and the missed slot still has room to shift.',
	},
	{
		label: 'Readiness score',
		value: '82%',
		note: 'You are trending stable after lowering late-week volume.',
	},
	{
		label: 'Skill focus',
		value: 'Pulling strength',
		note: 'This week emphasizes clean reps over top-end fatigue.',
	},
] as const

export const trainingPlan = [
	{
		day: 'Monday',
		focus: 'Lower body strength',
		duration: '68 min',
		blocks: ['Primer warm-up', 'Front squat build', 'Split squat finisher'],
	},
	{
		day: 'Wednesday',
		focus: 'Upper pull volume',
		duration: '62 min',
		blocks: ['Scap prep', 'Weighted pull-ups', 'Chest-supported rows'],
	},
	{
		day: 'Friday',
		focus: 'Athletic capacity',
		duration: '54 min',
		blocks: ['Power skips', 'Sled pushes', 'Tempo carries'],
	},
	{
		day: 'Saturday',
		focus: 'Optional recovery flush',
		duration: '28 min',
		blocks: ['Bike flush', 'Mobility flow', 'Core resets'],
	},
] as const

export const upcomingSessions = [
	{
		title: 'Front squat + split squat',
		time: 'Tomorrow, 6:30 AM',
		note: 'Target clean triples and stop two reps before grind.',
	},
	{
		title: 'Weighted pull-up density',
		time: 'Wednesday, 5:45 PM',
		note: 'Hold tempo strict and cap the final set early if elbows flare.',
	},
	{
		title: 'Sled + carry circuit',
		time: 'Friday, 7:15 AM',
		note: 'Treat this as capacity work, not a race against the clock.',
	},
] as const

export const recoveryMetrics = [
	{
		label: 'Sleep debt',
		value: 74,
		caption: 'Average duration improved after moving caffeine earlier.',
	},
	{
		label: 'Soreness',
		value: 58,
		caption: 'Leg soreness is acceptable but no extra lower-body work today.',
	},
	{
		label: 'Joint feel',
		value: 88,
		caption: 'Shoulders and elbows are responding well to the new warm-up.',
	},
] as const

export const coachPrompts = [
	'Keep the first working set conservative and let speed set the tone.',
	'Use the optional Saturday flush only if Thursday sleep is solid.',
	'Film one pull-up set this week so the next progression is based on mechanics, not guesses.',
] as const
