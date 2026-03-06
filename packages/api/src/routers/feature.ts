import { db } from '@fit/db'
import { features } from '@fit/db/schema/org'

import { ORPCError } from '@orpc/server'
import { desc } from 'drizzle-orm'
import { protectedProcedure } from '../index'
import {
	FeatureGetAiAccessInput,
	FeatureUpdateAppInput,
} from '../schemas/feature'

const AI_ENABLED_TAG = 'aiEnabled'
const AI_NUTRITION_ENABLED_TAG = 'aiNutritionEnabled'

function parseMetaTags(metaTags: string | null | undefined): string[] {
	return (metaTags ?? '')
		.split(',')
		.map((tag) => tag.trim())
		.filter(Boolean)
}

function normalizeMetaTagsCsv(metaTags: string | null | undefined): string {
	return Array.from(new Set(parseMetaTags(metaTags))).join(',')
}

async function getOrCreateAppFeatures() {
	const existing = await db.query.features.findFirst()
	if (existing) {
		return existing
	}

	const [created] = await db
		.insert(features)
		.values({
			aiEnabled: false,
			aiNutritionEnabled: false,
		})
		.returning()

	if (!created) {
		throw new ORPCError('INTERNAL_SERVER_ERROR', {
			message: 'Failed to initialize app features',
		})
	}

	return created
}

export async function getAiFeatureAccessForOrganisation(
	organisationId: string,
) {
	const [appFeatures, org, currentSubscription] = await Promise.all([
		getOrCreateAppFeatures(),
		db.query.organisation.findFirst({
			where: {
				id: organisationId,
			},
			columns: {
				id: true,
				name: true,
				metaTags: true,
			},
		}),
		db.query.subscription.findFirst({
			where: {
				organisationId,
			},
			with: {
				plan: {
					columns: {
						id: true,
						name: true,
						metaTags: true,
					},
				},
			},
			orderBy: (sub) => [desc(sub.createdAt)],
		}),
	])

	if (!org) {
		throw new ORPCError('NOT_FOUND', {
			message: 'Organisation not found',
		})
	}

	const orgMetaTags = parseMetaTags(org.metaTags)
	const planMetaTags = parseMetaTags(currentSubscription?.plan?.metaTags)

	const hasAiEnabledMetaTag =
		orgMetaTags.includes(AI_ENABLED_TAG) ||
		planMetaTags.includes(AI_ENABLED_TAG)
	const hasAiNutritionEnabledMetaTag =
		orgMetaTags.includes(AI_NUTRITION_ENABLED_TAG) ||
		planMetaTags.includes(AI_NUTRITION_ENABLED_TAG)

	const effectiveAiEnabled = appFeatures.aiEnabled && hasAiEnabledMetaTag
	const effectiveAiNutritionEnabled =
		appFeatures.aiNutritionEnabled && hasAiNutritionEnabledMetaTag

	return {
		app: appFeatures,
		organisation: {
			id: org.id,
			name: org.name,
			metaTags: orgMetaTags,
		},
		plan: currentSubscription?.plan
			? {
					id: currentSubscription.plan.id,
					name: currentSubscription.plan.name,
					metaTags: planMetaTags,
				}
			: null,
		effective: {
			aiEnabled: effectiveAiEnabled,
			aiNutritionEnabled: effectiveAiNutritionEnabled,
			allEnabled: effectiveAiEnabled && effectiveAiNutritionEnabled,
		},
	}
}

export const featureRouter = {
	getAppFeatures: protectedProcedure
		.route({
			method: 'GET',
			path: '/feature/app',
			summary: 'Get app-level features',
			tags: ['Feature'],
		})
		.handler(async () => {
			return getOrCreateAppFeatures()
		}),

	updateAppFeatures: protectedProcedure
		.route({
			method: 'PATCH',
			path: '/feature/app',
			summary: 'Update app-level features (Dictator only)',
			tags: ['Feature'],
		})
		.input(FeatureUpdateAppInput)
		.handler(async ({ input, context }) => {
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			if (!metaTags.includes('dictator')) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to update app features',
				})
			}

			const [updated] = await db.transaction(async (tx) => {
				await tx.delete(features)
				return tx
					.insert(features)
					.values({
						aiEnabled: input.aiEnabled,
						aiNutritionEnabled: input.aiNutritionEnabled,
					})
					.returning()
			})

			if (!updated) {
				throw new ORPCError('INTERNAL_SERVER_ERROR', {
					message: 'Failed to update app features',
				})
			}

			return updated
		}),

	getAiAccess: protectedProcedure
		.route({
			method: 'GET',
			path: '/feature/ai-access',
			summary: 'Get effective AI access for an organisation',
			tags: ['Feature'],
		})
		.input(FeatureGetAiAccessInput)
		.handler(async ({ input, context }) => {
			const userOrgId = context.session.user.organisationId
			const metaTags = context.session.user.metaTags?.split(',') ?? []
			const isDictator = metaTags.includes('dictator')

			if (input.organisationId !== userOrgId && !isDictator) {
				throw new ORPCError('FORBIDDEN', {
					message: 'You do not have permission to view feature access',
				})
			}

			return getAiFeatureAccessForOrganisation(input.organisationId)
		}),
}

export { normalizeMetaTagsCsv }
