import path from 'node:path'
import { expect, test } from 'vitest'
import {
  APP_DISPLAY_NAME,
  APP_USER_MODEL_ID,
  getRuntimeIconPath,
} from '../../src/shared/desktopRuntime'

test('resolves the development icon path from the app root', () => {
  expect(
    getRuntimeIconPath({
      isPackaged: false,
      appPath: 'C:/Users/ANIL/Desktop/fomçeviri',
      resourcesPath: 'C:/Users/ANIL/Desktop/fomçeviri/resources',
    }),
  ).toBe(path.normalize('C:/Users/ANIL/Desktop/fomçeviri/build/icon.ico'))
})

test('resolves the packaged icon path from the resources folder', () => {
  expect(
    getRuntimeIconPath({
      isPackaged: true,
      appPath: 'C:/Program Files/FoMTranslator/resources/app.asar',
      resourcesPath: 'C:/Program Files/FoMTranslator/resources',
    }),
  ).toBe(path.normalize('C:/Program Files/FoMTranslator/resources/icon.ico'))
  expect(APP_DISPLAY_NAME).toBe('FoMTranslator')
  expect(APP_USER_MODEL_ID).toBe('com.fom.fomtranslator')
})
