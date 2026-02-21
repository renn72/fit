import path from 'node:path'
import { defineConfig } from 'vitest/config'

const dbRoot = path.resolve(__dirname, '../db/src')

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		setupFiles: ['./tests/setup.ts'],
		pool: 'threads',
		poolOptions: {
			threads: {
				minThreads: 1,
				maxThreads: 4,
			},
		},
		isolate: true,
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.*'],
		},
	},
	resolve: {
		alias: [
			{
				find: /^@fit\/db$/,
				replacement: path.resolve(__dirname, './tests/mocks/db.ts'),
			},
			{
				find: /^@fit\/db\/schema\/auth$/,
				replacement: path.resolve(dbRoot, 'schema/auth.ts'),
			},
			{
				find: /^@fit\/db\/schema\/org$/,
				replacement: path.resolve(dbRoot, 'schema/org.ts'),
			},
			{
				find: /^@fit\/db\/schema\/exercise$/,
				replacement: path.resolve(dbRoot, 'schema/exercise.ts'),
			},
			{
				find: /^@fit\/db\/schema\/movement$/,
				replacement: path.resolve(dbRoot, 'schema/movement.ts'),
			},
			{
				find: /^@fit\/db\/schema\/ingredient$/,
				replacement: path.resolve(dbRoot, 'schema/ingredient.ts'),
			},
			{
				find: /^@fit\/db\/schema\/recipe$/,
				replacement: path.resolve(dbRoot, 'schema/recipe.ts'),
			},
			{
				find: /^@fit\/db\/schema\/workout$/,
				replacement: path.resolve(dbRoot, 'schema/workout.ts'),
			},
			{
				find: /^@fit\/db\/schema\/warmup$/,
				replacement: path.resolve(dbRoot, 'schema/warmup.ts'),
			},
			{
				find: /^@fit\/db\/schema\/block-template$/,
				replacement: path.resolve(dbRoot, 'schema/block-template.ts'),
			},
			{
				find: /^@fit\/db\/schema\/menu-template$/,
				replacement: path.resolve(dbRoot, 'schema/menu-template.ts'),
			},
			{
				find: /^@fit\/auth$/,
				replacement: path.resolve(__dirname, '../auth/src'),
			},
			{
				find: /^@fit\/env$/,
				replacement: path.resolve(__dirname, '../env/src'),
			},
		],
	},
})
