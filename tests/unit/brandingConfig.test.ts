import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

const packageJson = JSON.parse(
  readFileSync(resolve(rootDir, 'package.json'), 'utf8'),
)
const electronBuilder = JSON.parse(
  readFileSync(resolve(rootDir, 'electron-builder.json'), 'utf8'),
)
const indexHtml = readFileSync(resolve(rootDir, 'index.html'), 'utf8')
const iconIco = readFileSync(resolve(rootDir, 'build/icon.ico'))

function readIconSizes(buffer: Buffer) {
  const imageCount = buffer.readUInt16LE(4)

  return Array.from({ length: imageCount }, (_value, index) => {
    const entryOffset = 6 + index * 16
    const widthByte = buffer.readUInt8(entryOffset)
    const heightByte = buffer.readUInt8(entryOffset + 1)

    return {
      width: widthByte === 0 ? 256 : widthByte,
      height: heightByte === 0 ? 256 : heightByte,
    }
  })
}

test('uses FoMTranslator branding for the packaged desktop app', () => {
  expect(packageJson.name).toBe('fom-translator')
  expect(electronBuilder.productName).toBe('FoMTranslator')
  expect(electronBuilder.appId).toBe('com.fom.fomtranslator')
  expect(electronBuilder.win.icon).toBe('build/icon.ico')
  expect(packageJson.scripts.dist).not.toContain('--win portable')
  expect(electronBuilder.extraResources).toContainEqual({
    from: 'build/icon.ico',
    to: 'icon.ico',
  })
  expect(electronBuilder.win.target).toContainEqual({
    target: 'nsis',
    arch: ['x64'],
  })
})

test('uses the chicken sprite as a png favicon with the FoMTranslator page title', () => {
  expect(indexHtml).toContain('<title>FoMTranslator</title>')
  expect(indexHtml).toContain('type="image/png"')
  expect(indexHtml).toContain('href="/favicon.png"')
})

test('ships a Windows app icon with a 256x256 entry for installer packaging', () => {
  expect(readIconSizes(iconIco)).toContainEqual({ width: 256, height: 256 })
  expect(readIconSizes(iconIco).length).toBeGreaterThanOrEqual(1)
})
