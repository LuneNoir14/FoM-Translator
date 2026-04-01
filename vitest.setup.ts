import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { resetWorkbenchStore } from './src/renderer/workbench/useWorkbenchStore'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  resetWorkbenchStore()
})
