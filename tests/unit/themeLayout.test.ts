import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'

const themeCss = readFileSync(
  'C:/Users/ANIL/Desktop/fomçeviri/src/renderer/styles/theme.css',
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
    /\.topbar-logo\s*{[\s\S]*width:\s*clamp\(220px,\s*28vw,\s*300px\);/,
  )
})
