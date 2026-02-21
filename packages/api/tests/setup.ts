// Set up test environment variables before any imports
process.env.RESEND_API_KEY = 'test-resend-key'
process.env.DATABASE_URL = 'file::memory:'
process.env.DATABASE_SERVER_LOG_URL = 'file::memory:'
process.env.BETTER_AUTH_SECRET =
	'test-secret-key-that-is-long-enough-for-testing-purposes-only'
process.env.BETTER_AUTH_URL = 'http://localhost:3000'
process.env.CORS_ORIGIN = 'http://localhost:3000'
process.env.NODE_ENV = 'test'

import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read and combine all migration files
async function getMigrationSQL(): Promise<string> {
	const migrationsDir = path.resolve(__dirname, '../../db/src/migrations')
	const entries = fs.readdirSync(migrationsDir)
	const migrationDirs = entries
		.filter((entry) =>
			fs.statSync(path.join(migrationsDir, entry)).isDirectory(),
		)
		.sort() // Ensure consistent order

	let combinedSQL = ''

	for (const dir of migrationDirs) {
		const migrationFile = path.join(migrationsDir, dir, 'migration.sql')
		if (fs.existsSync(migrationFile)) {
			const sql = fs.readFileSync(migrationFile, 'utf-8')
			// Remove statement-breakpoint comments as they're drizzle-kit artifacts
			combinedSQL += sql.replace(/--> statement-breakpoint\n/g, '\n') + '\n'
		}
	}

	return combinedSQL
}

// Store database per worker
declare global {
	var __TEST_DB__: ReturnType<typeof drizzle> | undefined
}

export async function setup() {
	// Create in-memory database
	const client = createClient({
		url: ':memory:',
	})

	// Run migrations
	const migrationSQL = await getMigrationSQL()
	const statements = migrationSQL
		.split(';')
		.map((s) => s.trim())
		.filter((s) => s.length > 0)

	for (const statement of statements) {
		try {
			await client.execute(statement)
		} catch (error) {
			// Some CREATE INDEX statements may fail if table doesn't exist yet
			// This is expected for some migrations
			console.warn(
				`Migration statement failed (may be expected): ${statement.slice(0, 100)}...`,
			)
		}
	}

	// Import schema modules
	const schema = await import('@fit/db/schema/auth')
	const orgSchema = await import('@fit/db/schema/org')
	const exerciseSchema = await import('@fit/db/schema/exercise')
	const movementSchema = await import('@fit/db/schema/movement')
	const ingredientSchema = await import('@fit/db/schema/ingredient')
	const recipeSchema = await import('@fit/db/schema/recipe')
	const workoutSchema = await import('@fit/db/schema/workout')
	const warmupSchema = await import('@fit/db/schema/warmup')
	const blockTemplateSchema = await import('@fit/db/schema/block-template')
	const menuTemplateSchema = await import('@fit/db/schema/menu-template')

	const fullSchema = {
		...schema,
		...orgSchema,
		...exerciseSchema,
		...movementSchema,
		...ingredientSchema,
		...recipeSchema,
		...workoutSchema,
		...warmupSchema,
		...blockTemplateSchema,
		...menuTemplateSchema,
	}

	// Create drizzle instance with schema
	const db = drizzle({ client, schema: fullSchema })

	// Store globally for this worker
	globalThis.__TEST_DB__ = db

	return { db, client }
}

export function getTestDB() {
	if (!globalThis.__TEST_DB__) {
		throw new Error(
			'Test database not initialized. Call setup() in beforeAll or use the vitest setup file.',
		)
	}
	return globalThis.__TEST_DB__
}

// Vitest setup hook
export default async function () {
	await setup()
}
