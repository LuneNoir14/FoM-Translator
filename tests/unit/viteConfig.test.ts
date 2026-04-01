import { expect, test } from 'vitest'
import viteConfig from '../../vite.config'

test('uses relative asset paths so the packaged renderer can load over file protocol', () => {
  expect(viteConfig.base).toBe('./')
})
