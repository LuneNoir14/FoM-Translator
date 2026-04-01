import path from 'node:path'

export const APP_DISPLAY_NAME = 'FoMTranslator'
export const APP_USER_MODEL_ID = 'com.fom.fomtranslator'

interface RuntimeIconPathInput {
  isPackaged: boolean
  appPath: string
  resourcesPath: string
}

export function getRuntimeIconPath(input: RuntimeIconPathInput) {
  if (input.isPackaged) {
    return path.join(input.resourcesPath, 'icon.ico')
  }

  return path.join(input.appPath, 'build', 'icon.ico')
}
