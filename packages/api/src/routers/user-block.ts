import { db } from '@fit/db'
import {
	userBlock,
	userExercise,
	userWarmup,
	userWorkout,
} from '@fit/db/schema/user-block'

import { ORPCError } from '@orpc/server'
import { eq } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	UserBlockBatchCreateInput,
	UserBlockBatchUpdateInput,
	UserBlockDeleteInput,
	UserBlockGetByUserInput,
	UserBlockGetInput,
	UserBlockGetTemplatesOrgInput,
	UserBlockUpdateInput,
} from '../schemas/user-block'

function getMetaTags(metaTags: string | null | undefined): string[] {
	return (metaTags ?? '')
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean)
}

function normalizeTags(tags: string[]): string[] {
	return Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean)))
}

function joinTags(tags: string[]): string {
	return normalizeTags(tags).join(',')
}

function parseTags(tags: string | null | undefined): string[] {
	return normalizeTags((tags ?? '').split(','))
}

function normalizeRestDayIndexes(restDayIndexes: number[]): number[] {
	return Array.from(
		new Set(
			restDayIndexes.filter(
				(dayIndex) => Number.isInteger(dayIndex) && dayIndex >= 0,
			),
		),
	).sort((a, b) => a - b)
}

function serializeRestDayIndexes(restDayIndexes: number[]): string {
	return JSON.stringify(normalizeRestDayIndexes(restDayIndexes))
}

function parseRestDayIndexes(value: string | null | undefined): number[] {
	if (!value) return []

	try {
		const parsed = JSON.parse(value)
		return Array.isArray(parsed)
			? normalizeRestDayIndexes(parsed.filter((item) => Number.isInteger(item)))
			: []
	} catch {
		return []
	}
}

function normalizeWorkouts<
	T extends {
		workouts: Array<{
			dayIndex: number
			workoutIndex: number
			sourceWorkoutId?: string | null
			sourceWarmupGroupId?: string | null
			name: string
			description?: string | null
			category?: string | null
			warmups: Array<{
				warmupIndex: number
				sourceWarmupId?: string | null
				name: string
				description?: string | null
				images?: string | null
				link?: string | null
			}>
			exercises: Array<{
				exerciseIndex: number
				sourceExerciseId?: string | null
				movementId?: string | null
				superSetGroup?: string | null
				superSetOrder?: number | null
				label?: string | null
				sets?: number | null
				reps?: number | null
				repUnit?: string | null
				ormPercent?: number | null
				targetRpe?: number | null
				restTime?: number | null
				restUnit?: string | null
				tempoDown?: number | null
				tempoPause?: number | null
				tempoUp?: number | null
				notes?: string | null
			}>
		}>
	},
>(input: T) {
	const sortedWorkouts = [...input.workouts].sort(
		(left, right) =>
			left.dayIndex - right.dayIndex || left.workoutIndex - right.workoutIndex,
	)
	const workoutOrderByDay = new Map<number, number>()

	return sortedWorkouts.map((workoutItem) => {
		const nextWorkoutIndex = workoutOrderByDay.get(workoutItem.dayIndex) ?? 0
		workoutOrderByDay.set(workoutItem.dayIndex, nextWorkoutIndex + 1)

		const normalizedWarmups = [...workoutItem.warmups]
			.sort((left, right) => left.warmupIndex - right.warmupIndex)
			.map((warmupItem, warmupIndex) => ({
				...warmupItem,
				warmupIndex,
			}))

		const superSetOrderByGroup = new Map<string, number>()
		const normalizedExercises = [...workoutItem.exercises]
			.sort((left, right) => left.exerciseIndex - right.exerciseIndex)
			.map((exerciseItem, exerciseIndex) => {
				const normalizedGroup = exerciseItem.superSetGroup?.trim() || null
				const nextSuperSetOrder = normalizedGroup
					? (superSetOrderByGroup.get(normalizedGroup) ?? 0)
					: null

				if (normalizedGroup) {
					superSetOrderByGroup.set(normalizedGroup, nextSuperSetOrder! + 1)
				}

				return {
					...exerciseItem,
					exerciseIndex,
					superSetGroup: normalizedGroup,
					superSetOrder: normalizedGroup ? nextSuperSetOrder : null,
				}
			})

		return {
			...workoutItem,
			workoutIndex: nextWorkoutIndex,
			name: workoutItem.name.trim(),
			description: workoutItem.description?.trim() || null,
			category: workoutItem.category?.trim() || null,
			warmups: normalizedWarmups.map((warmupItem) => ({
				...warmupItem,
				name: warmupItem.name.trim(),
				description: warmupItem.description?.trim() || null,
				images: warmupItem.images?.trim() || null,
				link: warmupItem.link?.trim() || null,
			})),
			exercises: normalizedExercises.map((exerciseItem) => ({
				...exerciseItem,
				label: exerciseItem.label?.trim() || null,
				repUnit: exerciseItem.repUnit?.trim() || null,
				restUnit: exerciseItem.restUnit?.trim() || null,
				notes: exerciseItem.notes?.trim() || null,
			})),
		}
	})
}

function mapUserBlockOutput(block: any) {
	return {
		...block,
		tags: parseTags(block.tags),
		restDayIndexes: parseRestDayIndexes(block.restDayIndexes),
		creatorName: block.user?.name ?? null,
		creatorEmail: block.user?.email ?? null,
		workouts: (block.workouts ?? []).map((workoutItem: any) => ({
			...workoutItem,
			warmups: (workoutItem.warmups ?? []).map((warmupItem: any) => ({
				...warmupItem,
			})),
			exercises: (workoutItem.exercises ?? []).map((exerciseItem: any) => ({
				...exerciseItem,
				movementName: exerciseItem.movement?.name ?? null,
			})),
		})),
	}
}

async function assertViewAccess(block: any, context: any) {
	const sessionUser = context.session.user
	const metaTags = getMetaTags(sessionUser.metaTags)
	const isDictator = metaTags.includes('dictator')

	if (block.userId === sessionUser.id || isDictator) {
		return
	}

	if (
		!sessionUser.organisationId ||
		block.user?.organisationId !== sessionUser.organisationId
	) {
		throw new ORPCError('FORBIDDEN', {
			message: 'You do not have permission to view this block',
		})
	}
}

async function assertManageAccess(block: any, context: any) {
	const sessionUser = context.session.user
	const metaTags = getMetaTags(sessionUser.metaTags)
	const isDictator = metaTags.includes('dictator')
	const canManageOrgUsers = isDictator || metaTags.includes('itemUpdater')

	if (block.userId === sessionUser.id || isDictator) {
		return
	}

	if (
		!canManageOrgUsers ||
		!sessionUser.organisationId ||
		block.user?.organisationId !== sessionUser.organisationId
	) {
		throw new ORPCError('FORBIDDEN', {
			message: 'You do not have permission to modify this block',
		})
	}
}

async function assertTargetUserAccess({
	targetUserId,
	context,
	requireManager,
}: {
	targetUserId: string
	context: any
	requireManager: boolean
}) {
	const sessionUser = context.session.user
	const metaTags = getMetaTags(sessionUser.metaTags)
	const isDictator = metaTags.includes('dictator')
	const canManageOrgUsers = isDictator || metaTags.includes('itemUpdater')

	if (targetUserId === sessionUser.id) {
		if (requireManager && !canManageOrgUsers) {
			throw new ORPCError('FORBIDDEN', {
				message: 'You do not have permission to create templates',
			})
		}

		if (!sessionUser.organisationId) {
			throw new ORPCError('BAD_REQUEST', {
				message: 'User is not associated with an organisation',
			})
		}

		return {
			targetUserId,
			organisationId: sessionUser.organisationId,
		}
	}

	if (!canManageOrgUsers) {
		throw new ORPCError('FORBIDDEN', {
			message: 'You do not have permission to assign blocks for this user',
		})
	}

	const targetUser = await db.query.user.findFirst({
		where: { id: targetUserId },
		columns: {
			id: true,
			organisationId: true,
		},
	})

	if (!targetUser) {
		throw new ORPCError('NOT_FOUND', {
			message: 'Target user not found',
		})
	}

	if (
		!isDictator &&
		targetUser.organisationId !== context.session.user.organisationId
	) {
		throw new ORPCError('FORBIDDEN', {
			message: 'You do not have permission to assign blocks for this user',
		})
	}

	if (!targetUser.organisationId) {
		throw new ORPCError('BAD_REQUEST', {
			message: 'Target user is not associated with an organisation',
		})
	}

	return {
		targetUserId: targetUser.id,
		organisationId: targetUser.organisationId,
	}
}

const userBlockDetailQuery = {
	user: {
		columns: {
			id: true,
			name: true,
			email: true,
			organisationId: true,
		},
	},
	workouts: {
		orderBy: (workoutItem: any, { asc }: any) => [
			asc(workoutItem.dayIndex),
			asc(workoutItem.workoutIndex),
		],
		with: {
			warmups: {
				orderBy: (warmupItem: any, { asc }: any) => [
					asc(warmupItem.warmupIndex),
				],
			},
			exercises: {
				orderBy: (exerciseItem: any, { asc }: any) => [
					asc(exerciseItem.exerciseIndex),
				],
				with: {
					movement: {
						columns: {
							name: true,
						},
					},
				},
			},
		},
	},
}

export const userBlockRouter = {
	getByUser: protectedProcedure
		.route({
			method: 'GET',
			path: '/user-block/by-user',
			summary: 'Get all assigned blocks for a specific user',
			tags: ['User Block'],
		})
		.input(UserBlockGetByUserInput)
		.handler(async ({ input, context }) => {
			const sessionUser = context.session.user
			const metaTags = getMetaTags(sessionUser.metaTags)
			const isDictator = metaTags.includes('dictator')

			if (input.userId !== sessionUser.id && !isDictator) {
				const targetUser = await db.query.user.findFirst({
					where: { id: input.userId },
					columns: { organisationId: true },
				})

				if (
					!targetUser ||
					targetUser.organisationId !== sessionUser.organisationId
				) {
					throw new ORPCError('FORBIDDEN', {
						message: 'You do not have permission to view blocks for this user',
					})
				}
			}

			const blocks = await db.query.userBlock.findMany({
				where: {
					userId: input.userId,
					isTemplate: false,
				},
				with: userBlockDetailQuery,
				orderBy: (block, operators) => [operators.desc(block.createdAt)],
			})

			return blocks.map(mapUserBlockOutput)
		}),

	getTemplatesOrg: protectedProcedure
		.route({
			method: 'GET',
			path: '/user-block/templates/org',
			summary: 'Get all block templates for an organisation',
			tags: ['User Block'],
		})
		.input(UserBlockGetTemplatesOrgInput)
		.handler(async ({ input, context }) => {
			const sessionUser = context.session.user
			const metaTags = getMetaTags(sessionUser.metaTags)
			const isDictator = metaTags.includes('dictator')

			if (input.organisationId !== sessionUser.organisationId && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message:
						'You do not have permission to view templates for this organisation',
				})
			}

			const orgUsers = await db.query.user.findMany({
				where: { organisationId: input.organisationId },
				columns: { id: true },
			})
			const orgUserIds = new Set(orgUsers.map((orgUser) => orgUser.id))

			if (orgUserIds.size === 0) {
				return []
			}

			const templates = await db.query.userBlock.findMany({
				where: { isTemplate: true },
				with: userBlockDetailQuery,
				orderBy: (block, operators) => [operators.desc(block.createdAt)],
			})

			return templates
				.filter((template) => orgUserIds.has(template.userId))
				.map(mapUserBlockOutput)
		}),

	get: protectedProcedure
		.route({
			method: 'GET',
			path: '/user-block/:id',
			summary: 'Get a user block by ID with all nested data',
			tags: ['User Block'],
		})
		.input(UserBlockGetInput)
		.handler(async ({ input, context }) => {
			const block = await db.query.userBlock.findFirst({
				where: { id: input.id },
				with: userBlockDetailQuery,
			})

			if (!block) {
				throw new ORPCError('NOT_FOUND', {
					message: 'User block not found',
				})
			}

			await assertViewAccess(block, context)

			return mapUserBlockOutput(block)
		}),

	batchCreate: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-block/batch',
			summary:
				'Create a user block or template with workouts, warmups, and exercises in a single transaction',
			tags: ['User Block'],
		})
		.input(UserBlockBatchCreateInput)
		.handler(async ({ input, context }) => {
			const isTemplate = input.isTemplate === true

			await assertTargetUserAccess({
				targetUserId: input.userId,
				context,
				requireManager: isTemplate,
			})

			const normalizedWorkouts = normalizeWorkouts(input)
			const occupiedDayIndexes = new Set(
				normalizedWorkouts.map((workoutItem) => workoutItem.dayIndex),
			)
			const restDayIndexes = normalizeRestDayIndexes(
				input.restDayIndexes,
			).filter((dayIndex) => !occupiedDayIndexes.has(dayIndex))

			const createdBlock = await db.transaction(async (tx) => {
				const [newBlock] = await tx
					.insert(userBlock)
					.values({
						userId: input.userId,
						name: input.name.trim(),
						description: input.description?.trim() || null,
						category: input.category?.trim() || null,
						tags: joinTags(input.tags),
						restDayIndexes: serializeRestDayIndexes(restDayIndexes),
						startDate: isTemplate ? null : input.startDate || new Date(),
						endDate: isTemplate ? null : input.endDate,
						isTemplate,
						isActive: !isTemplate,
					})
					.returning()

				if (!newBlock) {
					throw new ORPCError('INTERNAL_SERVER_ERROR', {
						message: 'Failed to create user block',
					})
				}

				for (const workoutItem of normalizedWorkouts) {
					const [newWorkout] = await tx
						.insert(userWorkout)
						.values({
							userBlockId: newBlock.id,
							sourceWorkoutId: workoutItem.sourceWorkoutId || null,
							sourceWarmupGroupId: workoutItem.sourceWarmupGroupId || null,
							dayIndex: workoutItem.dayIndex,
							workoutIndex: workoutItem.workoutIndex,
							name: workoutItem.name,
							description: workoutItem.description,
							category: workoutItem.category,
						})
						.returning()

					if (!newWorkout) {
						throw new ORPCError('INTERNAL_SERVER_ERROR', {
							message: 'Failed to create user workout',
						})
					}

					if (workoutItem.warmups.length > 0) {
						await tx.insert(userWarmup).values(
							workoutItem.warmups.map((warmupItem) => ({
								userWorkoutId: newWorkout.id,
								sourceWarmupId: warmupItem.sourceWarmupId || null,
								warmupIndex: warmupItem.warmupIndex,
								name: warmupItem.name,
								description: warmupItem.description,
								images: warmupItem.images,
								link: warmupItem.link,
							})),
						)
					}

					if (workoutItem.exercises.length > 0) {
						await tx.insert(userExercise).values(
							workoutItem.exercises.map((exerciseItem) => ({
								userWorkoutId: newWorkout.id,
								sourceExerciseId: exerciseItem.sourceExerciseId || null,
								movementId: exerciseItem.movementId || null,
								exerciseIndex: exerciseItem.exerciseIndex,
								superSetGroup: exerciseItem.superSetGroup,
								superSetOrder: exerciseItem.superSetOrder,
								label: exerciseItem.label,
								sets: exerciseItem.sets ?? null,
								reps: exerciseItem.reps ?? null,
								repUnit: exerciseItem.repUnit,
								ormPercent: exerciseItem.ormPercent ?? null,
								targetRpe: exerciseItem.targetRpe ?? null,
								restTime: exerciseItem.restTime ?? null,
								restUnit: exerciseItem.restUnit,
								tempoDown: exerciseItem.tempoDown ?? null,
								tempoPause: exerciseItem.tempoPause ?? null,
								tempoUp: exerciseItem.tempoUp ?? null,
								notes: exerciseItem.notes,
							})),
						)
					}
				}

				return newBlock
			})

			return createdBlock
		}),

	batchUpdate: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-block/batch-update',
			summary:
				'Update a user block by replacing its workouts, warmups, and exercises in one transaction',
			tags: ['User Block'],
		})
		.input(UserBlockBatchUpdateInput)
		.handler(async ({ input, context }) => {
			const existingBlock = await db.query.userBlock.findFirst({
				where: { id: input.id },
				with: {
					user: {
						columns: {
							organisationId: true,
						},
					},
				},
			})

			if (!existingBlock) {
				throw new ORPCError('NOT_FOUND', {
					message: 'User block not found',
				})
			}

			await assertManageAccess(existingBlock, context)

			const normalizedWorkouts = normalizeWorkouts(input)
			const occupiedDayIndexes = new Set(
				normalizedWorkouts.map((workoutItem) => workoutItem.dayIndex),
			)
			const restDayIndexes = normalizeRestDayIndexes(
				input.restDayIndexes,
			).filter((dayIndex) => !occupiedDayIndexes.has(dayIndex))

			const updatedBlock = await db.transaction(async (tx) => {
				await tx
					.delete(userWorkout)
					.where(eq(userWorkout.userBlockId, input.id))

				const [nextBlock] = await tx
					.update(userBlock)
					.set({
						name: input.name.trim(),
						description: input.description?.trim() || null,
						category: input.category?.trim() || null,
						tags: joinTags(input.tags),
						restDayIndexes: serializeRestDayIndexes(restDayIndexes),
						startDate: existingBlock.isTemplate
							? null
							: input.startDate || null,
						endDate: existingBlock.isTemplate ? null : input.endDate,
					})
					.where(eq(userBlock.id, input.id))
					.returning()

				if (!nextBlock) {
					throw new ORPCError('INTERNAL_SERVER_ERROR', {
						message: 'Failed to update user block',
					})
				}

				for (const workoutItem of normalizedWorkouts) {
					const [newWorkout] = await tx
						.insert(userWorkout)
						.values({
							userBlockId: input.id,
							sourceWorkoutId: workoutItem.sourceWorkoutId || null,
							sourceWarmupGroupId: workoutItem.sourceWarmupGroupId || null,
							dayIndex: workoutItem.dayIndex,
							workoutIndex: workoutItem.workoutIndex,
							name: workoutItem.name,
							description: workoutItem.description,
							category: workoutItem.category,
						})
						.returning()

					if (!newWorkout) {
						throw new ORPCError('INTERNAL_SERVER_ERROR', {
							message: 'Failed to recreate user workout',
						})
					}

					if (workoutItem.warmups.length > 0) {
						await tx.insert(userWarmup).values(
							workoutItem.warmups.map((warmupItem) => ({
								userWorkoutId: newWorkout.id,
								sourceWarmupId: warmupItem.sourceWarmupId || null,
								warmupIndex: warmupItem.warmupIndex,
								name: warmupItem.name,
								description: warmupItem.description,
								images: warmupItem.images,
								link: warmupItem.link,
							})),
						)
					}

					if (workoutItem.exercises.length > 0) {
						await tx.insert(userExercise).values(
							workoutItem.exercises.map((exerciseItem) => ({
								userWorkoutId: newWorkout.id,
								sourceExerciseId: exerciseItem.sourceExerciseId || null,
								movementId: exerciseItem.movementId || null,
								exerciseIndex: exerciseItem.exerciseIndex,
								superSetGroup: exerciseItem.superSetGroup,
								superSetOrder: exerciseItem.superSetOrder,
								label: exerciseItem.label,
								sets: exerciseItem.sets ?? null,
								reps: exerciseItem.reps ?? null,
								repUnit: exerciseItem.repUnit,
								ormPercent: exerciseItem.ormPercent ?? null,
								targetRpe: exerciseItem.targetRpe ?? null,
								restTime: exerciseItem.restTime ?? null,
								restUnit: exerciseItem.restUnit,
								tempoDown: exerciseItem.tempoDown ?? null,
								tempoPause: exerciseItem.tempoPause ?? null,
								tempoUp: exerciseItem.tempoUp ?? null,
								notes: exerciseItem.notes,
							})),
						)
					}
				}

				return nextBlock
			})

			return updatedBlock
		}),

	update: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-block/update',
			summary: 'Update user block metadata',
			tags: ['User Block'],
		})
		.input(UserBlockUpdateInput)
		.handler(async ({ input, context }) => {
			const existingBlock = await db.query.userBlock.findFirst({
				where: { id: input.id },
				with: {
					user: {
						columns: {
							organisationId: true,
						},
					},
				},
			})

			if (!existingBlock) {
				throw new ORPCError('NOT_FOUND', {
					message: 'User block not found',
				})
			}

			await assertManageAccess(existingBlock, context)

			const { id, tags, restDayIndexes, ...rest } = input
			const [updatedBlock] = await db
				.update(userBlock)
				.set({
					...rest,
					description: rest.description?.trim() || null,
					category: rest.category?.trim() || null,
					tags: tags ? joinTags(tags) : undefined,
					restDayIndexes: restDayIndexes
						? serializeRestDayIndexes(restDayIndexes)
						: undefined,
				})
				.where(eq(userBlock.id, id))
				.returning()

			return updatedBlock
		}),

	delete: protectedProcedure
		.route({
			method: 'POST',
			path: '/user-block/delete',
			summary: 'Delete a user block',
			tags: ['User Block'],
		})
		.input(UserBlockDeleteInput)
		.handler(async ({ input, context }) => {
			const existingBlock = await db.query.userBlock.findFirst({
				where: { id: input.id },
				with: {
					user: {
						columns: {
							organisationId: true,
						},
					},
				},
			})

			if (!existingBlock) {
				throw new ORPCError('NOT_FOUND', {
					message: 'User block not found',
				})
			}

			await assertManageAccess(existingBlock, context)

			await db.delete(userBlock).where(eq(userBlock.id, input.id))

			return { success: true }
		}),
}
