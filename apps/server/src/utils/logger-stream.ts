import { dbServerLog } from '@fit/db-server-log'

import { log } from '@fit/db-server-log/schema/log'

const loggerStream = {
	// @ts-ignore
	write: (msg) => {
		try {
			const parsed = JSON.parse(msg)
			const { level, msg: message, time, ...rest } = parsed

			const context = Object.keys(rest).length > 0 ? JSON.stringify(rest) : null

			dbServerLog.insert(log).values({
				level: level,
				message: message,
				timestamp: new Date(time).toISOString(),
				context: context,
			})
		} catch (err) {
			console.error('Failed to log to database:', err)
		}
	},
}

export { loggerStream }
