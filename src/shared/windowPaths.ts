import path from 'node:path'

export function getRendererEntryPath(currentDir: string) {
  return path.join(currentDir, '../../dist/index.html')
}
