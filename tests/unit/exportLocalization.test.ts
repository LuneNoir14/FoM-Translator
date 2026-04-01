import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, test } from 'vitest'
import { exportLocalization } from '../../src/main/project/exportLocalization'

test('writes localization.tr.json only when no critical validation errors remain', async () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'fomceviri-export-'))
  const outputPath = path.join(tempDir, 'localization.tr.json')

  const result = await exportLocalization({
    sourceEntries: [{ key: 'misc_local/sleep', sourceText: 'Sleep' }],
    workspaceEntries: [
      { key: 'misc_local/sleep', translatedText: 'Uyu', status: 'reviewed' },
    ],
    outputPath,
  })

  expect(result.outputPath).toMatch(/localization\.tr\.json$/)
  expect(JSON.parse(readFileSync(outputPath, 'utf8'))).toEqual({
    tr: {
      'misc_local/sleep': 'Uyu',
    },
  })
})

test('blocks export when placeholders are missing', async () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'fomceviri-export-'))
  const outputPath = path.join(tempDir, 'localization.tr.json')

  await expect(
    exportLocalization({
      sourceEntries: [{ key: 'letters/sample', sourceText: '[Ari], hello' }],
      workspaceEntries: [
        { key: 'letters/sample', translatedText: 'Merhaba', status: 'draft' },
      ],
      outputPath,
    }),
  ).rejects.toThrow(/critical validation/i)
})
