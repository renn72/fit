import { join } from 'node:path'
import { readFileSync } from 'node:fs'

import { describe, expect, test } from 'vitest'

const indexHtml = readFileSync(join(process.cwd(), 'index.html'), 'utf8')
const stylesCss = readFileSync(join(process.cwd(), 'src/styles.css'), 'utf8')

describe('training app metadata', () => {
	test('uses the Forma app title and favicon links', () => {
		expect(indexHtml).toContain('<title>Forma | Training</title>')
		expect(indexHtml).toContain('/favicon.svg')
		expect(indexHtml).toContain('/apple-touch-icon.png')
	})

	test('leans on shared component tokens instead of app-local color guides', () => {
		expect(stylesCss).toContain('@source "../../../packages/components/src";')
		expect(stylesCss).not.toContain(':root {')
		expect(stylesCss).not.toContain('.dark {')
	})
})
