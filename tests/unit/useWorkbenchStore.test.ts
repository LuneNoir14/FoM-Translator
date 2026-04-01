import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, vi } from 'vitest'
import {
  resetWorkbenchStore,
  useWorkbenchStore,
} from '../../src/renderer/workbench/useWorkbenchStore'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')

test('marks a valid translation as reviewed instead of leaving it as draft', async () => {
  resetWorkbenchStore()
  useWorkbenchStore.setState({
    entries: [
      {
        key: 'misc_local/sleep',
        sourceText: 'Sleep',
        translatedText: '',
        status: 'untranslated',
      },
    ],
    selectedKey: 'misc_local/sleep',
  })

  await useWorkbenchStore.getState().updateSelectedTranslation('Uyu')

  expect(useWorkbenchStore.getState().entries[0]?.status).toBe('reviewed')
})

test('marks invalid translations as warning so they stay visible in the list', async () => {
  resetWorkbenchStore()
  useWorkbenchStore.setState({
    entries: [
      {
        key: 'letters/sample',
        sourceText: '[Ari], hello',
        translatedText: '',
        status: 'untranslated',
      },
    ],
    selectedKey: 'letters/sample',
  })

  await useWorkbenchStore.getState().updateSelectedTranslation('Merhaba')

  expect(useWorkbenchStore.getState().entries[0]?.status).toBe('warning')
})

test('imports a project from raw JSON text for the browser fallback flow', async () => {
  resetWorkbenchStore()
  const rawText = readFileSync(
    resolve(rootDir, 'fixtures/localization-sample.json'),
    'utf8',
  )

  await useWorkbenchStore.getState().importProjectFromRaw({
    filePath: 'localization.en.json',
    rawText,
  })

  const state = useWorkbenchStore.getState()

  expect(state.currentFilePath).toBe('localization.en.json')
  expect(state.entries).toHaveLength(3)
  expect(state.summary).toEqual({
    untranslated: 3,
    draft: 0,
    reviewed: 0,
    warning: 0,
  })
  expect(state.selectedKey).toBe('misc_local/sleep')
})

test('downloads an export document from the browser fallback flow', async () => {
  resetWorkbenchStore()
  useWorkbenchStore.setState({
    currentFilePath: 'localization.en.json',
    entries: [
      {
        key: 'misc_local/sleep',
        sourceText: 'Sleep',
        translatedText: 'Uyku',
        status: 'reviewed',
      },
    ],
    selectedKey: 'misc_local/sleep',
  })

  const createObjectUrlSpy = vi
    .spyOn(URL, 'createObjectURL')
    .mockReturnValue('blob:translation-export')
  const revokeObjectUrlSpy = vi
    .spyOn(URL, 'revokeObjectURL')
    .mockImplementation(() => {})
  const anchor = document.createElement('a')
  const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {})
  const createElementSpy = vi
    .spyOn(document, 'createElement')
    .mockReturnValue(anchor)

  const result = await useWorkbenchStore.getState().exportProjectInBrowser()

  expect(result).toMatchObject({
    canceled: false,
    outputPath: 'localization.translation.json',
    warningCount: 0,
  })
  expect(anchor.download).toBe('localization.translation.json')
  expect(anchor.href).toBe('blob:translation-export')
  expect(clickSpy).toHaveBeenCalled()
  expect(createObjectUrlSpy).toHaveBeenCalled()
  expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:translation-export')

  createElementSpy.mockRestore()
})
