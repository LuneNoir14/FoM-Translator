/// <reference types="vite/client" />

import type { WorkbenchApi } from './shared/contracts'

declare global {
  interface Window {
    workbenchApi?: WorkbenchApi
  }
}

export {}
