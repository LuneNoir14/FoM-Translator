import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
const themeCss = readFileSync(
  resolve(rootDir, 'src/renderer/styles/theme.css'),
  'utf8',
)

test('wraps long entry keys instead of letting them spill into adjacent panels', () => {
  expect(themeCss).toMatch(
    /\.entry-row strong\s*{[\s\S]*overflow-wrap:\s*anywhere;/,
  )
})

test('keeps the left sidebar controls in an outer scroll region', () => {
  expect(themeCss).toMatch(
    /\.entry-list-panel-scroll\s*{[\s\S]*overflow-y:\s*auto;/,
  )
  expect(themeCss).toMatch(/\.entry-list\s*{[\s\S]*overflow-y:\s*auto;/)
  expect(themeCss).toMatch(/\.panel\s*{[\s\S]*min-height:\s*0;/)
  const categoryTreeBlock = themeCss.match(/\.category-tree\s*{[\s\S]*?}/)?.[0] ?? ''

  expect(categoryTreeBlock).not.toContain('overflow-y: auto')
  expect(categoryTreeBlock).not.toContain('max-height')
})

test('uses a flat gray-black app background instead of gradients', () => {
  expect(themeCss).toMatch(/:root\s*{[\s\S]*background:\s*#14181d;/)
  expect(themeCss).not.toContain('radial-gradient')
  expect(themeCss).not.toContain('linear-gradient(180deg')
})

test('uses a slightly larger header logo for the packaged desktop shell', () => {
  expect(themeCss).toMatch(
    /\.topbar-logo\s*{[\s\S]*width:\s*clamp\(220px,\s*24vw,\s*300px\);/,
  )
})

test('widens the left workspace column for the progress board layout', () => {
  expect(themeCss).toMatch(
    /\.workspace-grid\s*{[\s\S]*grid-template-columns:\s*minmax\(340px,\s*400px\)\s+minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\);/,
  )
})

test('defines dedicated progress board summary styles', () => {
  expect(themeCss).toMatch(/\.progress-board\s*{/)
  expect(themeCss).toMatch(/\.progress-card\s*{/)
  expect(themeCss).toMatch(/\.issue-digest-row\s*{/)
})

test('uses a compact multi-column progress board to preserve sidebar viewport height', () => {
  expect(themeCss).toMatch(
    /\.progress-board\s*{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);/,
  )
  expect(themeCss).toMatch(
    /\.issue-digest\s*{[\s\S]*grid-column:\s*1\s*\/\s*-1;/,
  )
})

test('tightens progress board spacing so the lower list gets more vertical room', () => {
  expect(themeCss).toMatch(
    /\.progress-card\s*{[\s\S]*padding:\s*8px 10px;/,
  )
  expect(themeCss).toMatch(
    /\.progress-primary\s*{[\s\S]*margin-top:\s*6px;[\s\S]*font-size:\s*15px;/,
  )
  expect(themeCss).toMatch(
    /\.issue-digest-empty\s*{[\s\S]*margin-top:\s*0;/,
  )
})
