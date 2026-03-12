import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let testDB: ReturnType<typeof drizzle> | null = null

// Read and combine all migration files
async function getMigrationSQL(): Promise<string> {
	const migrationsDir = path.resolve(__dirname, '../../../db/src/migrations')
	const entries = fs.readdirSync(migrationsDir)
	const migrationDirs = entries
		.filter((entry) =>
			fs.statSync(path.join(migrationsDir, entry)).isDirectory(),
		)
		.sort()

	let combinedSQL = ''

	for (const dir of migrationDirs) {
		const migrationFile = path.join(migrationsDir, dir, 'migration.sql')
		if (fs.existsSync(migrationFile)) {
			const sql = fs.readFileSync(migrationFile, 'utf-8')
			combinedSQL += sql.replace(/--> statement-breakpoint\n/g, '\n') + '\n'
		}
	}

	return combinedSQL
}

export async function initTestDB(): Promise<ReturnType<typeof drizzle>> {
	if (testDB) {
		return testDB
	}

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
			console.warn(
				`Migration statement failed (may be expected): ${statement.slice(0, 100)}...`,
			)
		}
	}

	// Import schema modules using relative paths
	const schema = await import('../../../db/src/schema/auth')
	const dailyLogSchema = await import('../../../db/src/schema/daily-log')
	const orgSchema = await import('../../../db/src/schema/org')
	const exerciseSchema = await import('../../../db/src/schema/exercise')
	const movementSchema = await import('../../../db/src/schema/movement')
	const ingredientSchema = await import('../../../db/src/schema/ingredient')
	const recipeSchema = await import('../../../db/src/schema/recipe')
	const workoutSchema = await import('../../../db/src/schema/workout')
	const warmupSchema = await import('../../../db/src/schema/warmup')
	const blockTemplateSchema = await import(
		'../../../db/src/schema/block-template'
	)
	const menuTemplateSchema = await import(
		'../../../db/src/schema/menu-template'
	)

	const fullSchema = {
		...schema,
		...dailyLogSchema,
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

	// Import relations
	const { relations } = await import('../../../db/src/relations')

	testDB = drizzle({ client, schema: fullSchema, relations })
	return testDB
}

export function getTestDB(): ReturnType<typeof drizzle> {
	if (!testDB) {
		throw new Error(
			'Test database not initialized. Call initTestDB() before tests.',
		)
	}
	return testDB
}

export async function resetDatabase() {
	const db = getTestDB()
	const client = db.$client

	await client.execute('PRAGMA foreign_keys = OFF')

	const tables = await client.execute(
		`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
	)

	for (const row of tables.rows) {
		const tableName = row.name as string
		if (tableName !== '__drizzle_migrations' && !tableName.startsWith('_')) {
			await client.execute(`DELETE FROM ${tableName}`)
		}
	}

	await client.execute('PRAGMA foreign_keys = ON')
}

export type TestDB = ReturnType<typeof getTestDB>
