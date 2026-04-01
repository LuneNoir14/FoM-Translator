import path from 'node:path'
import { expect, test } from 'vitest'
import { getRendererEntryPath } from '../../src/shared/windowPaths'

test('resolves packaged renderer entry from the compiled electron folder', () => {
  const currentDir = path.normalize(
    'C:/Program Files/Localization Workbench/resources/app.asar/dist-electron/electron',
  )

  expect(getRendererEntryPath(currentDir)).toBe(
    path.normalize(
      'C:/Program Files/Localization Workbench/resources/app.asar/dist/index.html',
    ),
  )
})
