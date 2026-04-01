import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'node:path'
import { createProjectController } from '../src/main/project/projectController.js'
import {
  APP_DISPLAY_NAME,
  APP_USER_MODEL_ID,
  getRuntimeIconPath,
} from '../src/shared/desktopRuntime.js'
import { getRendererEntryPath } from '../src/shared/windowPaths.js'

if (process.platform === 'win32') {
  app.setAppUserModelId(APP_USER_MODEL_ID)
}

app.setName(APP_DISPLAY_NAME)
// Force userData to AppData to prevent portable builds from using volatile %TEMP% directories
app.setPath('userData', path.join(app.getPath('appData'), APP_DISPLAY_NAME))

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1520,
    height: 940,
    minWidth: 1280,
    minHeight: 800,
    backgroundColor: '#0a0d12',
    title: APP_DISPLAY_NAME,
    icon: getRuntimeIconPath({
      isPackaged: app.isPackaged,
      appPath: app.getAppPath(),
      resourcesPath: process.resourcesPath,
    }),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const devServerUrl = process.env.VITE_DEV_SERVER_URL

  if (devServerUrl) {
    void window.loadURL(devServerUrl)
  } else {
    void window.loadFile(getRendererEntryPath(__dirname))
  }

  return window
}

app.whenReady().then(() => {
  const controller = createProjectController({
    workspaceDbPath: path.join(app.getPath('userData'), 'workspace.sqlite'),
    defaultExportPath: path.join(app.getPath('desktop'), 'localization.tr.json'),
  })
  const mainWindow = createMainWindow()

  ipcMain.handle('project:open', async (_event, filePath?: string) => {
    let resolvedPath = filePath

    if (!resolvedPath) {
      const result = await dialog.showOpenDialog(mainWindow, {
        filters: [{ name: 'Localization JSON', extensions: ['json'] }],
        properties: ['openFile'],
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true }
      }

      ;[resolvedPath] = result.filePaths
    }

    const project = await controller.openProject(resolvedPath)
    
    // DEBUG START
    const dbRows = require('better-sqlite3')(path.join(app.getPath('userData'), 'workspace.sqlite'))
      .prepare('SELECT COUNT(*) as c FROM entries').get();
    console.log('--- DEBUG DB ROWS ON OPEN PROJECT ---', dbRows);
    // DEBUG END

    return {
      canceled: false,
      filePath: resolvedPath,
      ...project,
    }
  })

  ipcMain.handle('project:saveTranslation', async (_event, input) => {
    await controller.saveTranslation(input)
    return { ok: true }
  })

  ipcMain.handle('project:export', async (_event, outputPath?: string) => {
    let resolvedPath = outputPath

    if (!resolvedPath) {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: controller.getDefaultExportPath(),
        filters: [{ name: 'Localization JSON', extensions: ['json'] }],
      })

      if (result.canceled || !result.filePath) {
        return { canceled: true, outputPath: '' }
      }

      resolvedPath = result.filePath
    }

    return controller.exportProject(resolvedPath)
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
