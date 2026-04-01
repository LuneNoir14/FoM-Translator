import { contextBridge } from 'electron'
import type { WorkbenchApi } from '../src/shared/contracts.js'
import { ipcRenderer } from 'electron'

const workbenchApi: WorkbenchApi = {
  appName: 'FoMTranslator',
  openProject: (filePath?: string) => ipcRenderer.invoke('project:open', filePath),
  saveTranslation: (input) => ipcRenderer.invoke('project:saveTranslation', input),
  exportProject: (outputPath?: string) =>
    ipcRenderer.invoke('project:export', outputPath),
}

contextBridge.exposeInMainWorld('workbenchApi', workbenchApi)
