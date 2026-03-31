import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

const repoRoot = process.cwd()

const guideFiles = [
	'guides/apps/docs.md',
	'guides/apps/marketing.md',
	'guides/apps/native.md',
	'guides/apps/nutrition-web.md',
	'guides/apps/server.md',
	'guides/apps/training-web.md',
	'guides/apps/web.md',
	'guides/packages/api.md',
	'guides/packages/auth.md',
	'guides/packages/components.md',
	'guides/packages/config.md',
	'guides/packages/data.md',
	'guides/packages/db.md',
	'guides/packages/docs.md',
	'guides/packages/env.md',
]

const clientFacingGuides = [
	'guides/apps/docs.md',
	'guides/apps/marketing.md',
	'guides/apps/native.md',
	'guides/apps/nutrition-web.md',
	'guides/apps/training-web.md',
	'guides/apps/web.md',
	'guides/packages/components.md',
]

test('every app and package guide exists with the expected baseline sections', () => {
	for (const guideFile of guideFiles) {
		const absolutePath = path.join(repoRoot, guideFile)
		assert.ok(fs.existsSync(absolutePath), `missing guide: ${guideFile}`)

		const content = fs.readFileSync(absolutePath, 'utf8')
		assert.match(content, /^# .+/m, `${guideFile} should start with a heading`)
		assert.match(
			content,
			/^## Purpose$/m,
			`${guideFile} should document its purpose`,
		)
		assert.match(
			content,
			/^## Key Paths$/m,
			`${guideFile} should document key paths`,
		)
		assert.match(
			content,
			/^## Change Rules$/m,
			`${guideFile} should document change rules for future agents`,
		)
	}
})

test('client-facing guides include a style section', () => {
	for (const guideFile of clientFacingGuides) {
		const content = fs.readFileSync(path.join(repoRoot, guideFile), 'utf8')
		assert.match(
			content,
			/^## Style$/m,
			`${guideFile} should include a style section`,
		)
	}
})

test('AGENTS_LOOP references the guide inventory and the guide review/update steps', () => {
	const content = fs.readFileSync(path.join(repoRoot, 'AGENTS_LOOP.md'), 'utf8')

	for (const guideFile of guideFiles) {
		assert.match(
			content,
			new RegExp(guideFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
			`AGENTS_LOOP.md should list ${guideFile}`,
		)
	}

	assert.match(
		content,
		/review the relevant app\/package guide/i,
		'AGENTS_LOOP.md should instruct agents to review the relevant guide before editing a workspace',
	)
	assert.match(
		content,
		/update the relevant guide if the task expands scope or understanding/i,
		'AGENTS_LOOP.md should instruct agents to refresh the guide after scope or understanding changes',
	)
})
