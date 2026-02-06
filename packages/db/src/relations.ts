import { defineRelations } from 'drizzle-orm'
import * as schema from './schema'

export const relations = defineRelations(schema, (r) => ({
	// ***************** User *******************
	user: {
		sessions: r.many.session(),
		accounts: r.many.account(),
		settings: r.one.userSettings(),
		toggles: r.one.userToggles(),
		organisationCreator: r.one.organisation({
			from: r.user.organisationCreatorId,
			to: r.organisation.id,
			alias: 'creator',
		}),
		organisationMember: r.many.organisation({
			from: r.user.organisationId,
			to: r.organisation.id,
			alias: 'member',
		}),
	},

	// ***************** Session *******************
	session: {
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id,
		}),
	},

	// ***************** Account *******************
	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id,
		}),
	},

	// ***************** Organisation *******************
	organization: {
		creator: r.one.user({
			from: r.organisation.creatorId,
			to: r.user.id,
			alias: 'creator',
		}),
		members: r.many.user({
			from: r.organisation.id,
			to: r.user.id,
			alias: 'member',
		}),
	},

	// ***************** Subscription *******************
	subscription: {
		organisation: r.one.organisation({
			from: r.subscription.organisationId,
			to: r.organisation.id,
		}),
		plan: r.one.plan({
			from: r.subscription.planId,
			to: r.plan.id,
		}),
	},

	// ***************** Plan *******************
	plan: {
		subscriptions: r.many.subscription({
			from: r.plan.id,
			to: r.subscription.planId,
		}),
		limits: r.many.planLimit({
			from: r.plan.id,
			to: r.planLimit.planId,
		}),
	},

	// ***************** PlanLimit *******************
	planLimit: {
		plan: r.one.plan({
			from: r.planLimit.planId,
			to: r.plan.id,
		}),
	},
}))
