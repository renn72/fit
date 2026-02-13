import { defineRelations } from 'drizzle-orm'
import * as auth from './schema/auth'
import * as exercise from './schema/exercise'
import * as org from './schema/org'

const schema = { ...org, ...auth, ...exercise }

export const relations = defineRelations(schema, (r) => ({
	// ***************** User *******************
	user: {
		sessions: r.many.session(),
		accounts: r.many.account(),
		settings: r.one.userSettings({
			from: r.user.id,
			to: r.userSettings.userId,
		}),
		toggles: r.one.userToggles({
			from: r.user.id,
			to: r.userToggles.userId,
		}),
		organisationCreator: r.one.organisation({
			from: r.user.organisationCreatorId,
			to: r.organisation.id,
			alias: 'creator',
		}),
		organisationMember: r.one.organisation({
			from: r.user.organisationId,
			to: r.organisation.id,
			alias: 'member',
		}),
	},

	// ***************** User Settings *******************
	userSettings: {
		user: r.one.user({
			from: r.userSettings.userId,
			to: r.user.id,
		}),
	},

	// ***************** User Toggles *******************
	userToggles: {
		user: r.one.user({
			from: r.userToggles.userId,
			to: r.user.id,
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
	organisation: {
		creator: r.one.user({
			from: r.organisation.creatorId,
			to: r.user.id,
			alias: 'creator',
		}),
		members: r.many.user({
			from: r.organisation.id,
			to: r.user.organisationId,
			alias: 'member',
		}),
		subscriptions: r.many.subscription({
			from: r.organisation.id,
			to: r.subscription.organisationId,
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
		codes: r.many.planCode({
			from: r.plan.id,
			to: r.planCode.planId,
		}),
	},

	// ***************** Plan Code *******************
	planCode: {
		plan: r.one.plan({
			from: r.planCode.planId,
			to: r.plan.id,
		}),
	},
}))
