import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, test } from 'vitest'
import { createWorkspaceDb } from '../../src/main/project/workspaceDb'
import { createProjectController } from '../../src/main/project/projectController'

test('opens a project and returns initial counts', async () => {
  const controller = createProjectController({
    workspaceDbPath: ':memory:',
    defaultExportPath: 'C:/temp/localization.tr.json',
  })
  const result = await controller.openProject(
    'tests/fixtures/localization-sample.json',
  )

  expect(result.summary.untranslated).toBeGreaterThan(0)
})

test('returns the next untranslated key for fast navigation', async () => {
  const controller = createProjectController({
    workspaceDbPath: ':memory:',
    defaultExportPath: 'C:/temp/localization.tr.json',
  })

  await controller.openProject('tests/fixtures/localization-sample.json')

  expect(await controller.getNextUntranslated('misc_local/sleep')).toBe(
    'misc_local/talk',
  )
})

test('normalizes legacy draft entries to reviewed when the translation is valid', async () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), 'fomceviri-controller-'))
  const workspaceDbPath = path.join(tempDir, 'workspace.sqlite')
  const workspaceDb = createWorkspaceDb(workspaceDbPath)

  workspaceDb.saveEntry({
    key: 'misc_local/sleep',
    translatedText: 'Uyu',
    status: 'draft',
  })

  const controller = createProjectController({
    workspaceDbPath,
    defaultExportPath: path.join(tempDir, 'localization.tr.json'),
  })
  const result = await controller.openProject(
    'tests/fixtures/localization-sample.json',
  )

  expect(
    result.entries?.find((entry) => entry.key === 'misc_local/sleep')?.status,
  ).toBe('reviewed')
  expect(result.summary?.reviewed).toBe(1)
})
