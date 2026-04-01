import { useRef } from 'react'
import { EntryListPanel } from './EntryListPanel'
import { SourceViewerPanel } from './SourceViewerPanel'
import { TranslationEditorPanel } from './TranslationEditorPanel'
import { useWorkbenchStore } from './useWorkbenchStore'

function getHeaderFileLabel(currentFilePath: string | null | undefined) {
  if (!currentFilePath) {
    return 'Demo workspace loaded'
  }

  const segments = currentFilePath.split(/[/\\]/)
  return segments[segments.length - 1] || currentFilePath
}

export function AppShell() {
  const fallbackProjectInputRef = useRef<HTMLInputElement | null>(null)
  const openProject = useWorkbenchStore((state) => state.openProject)
  const exportProject = useWorkbenchStore((state) => state.exportProject)
  const importProjectFromRaw = useWorkbenchStore(
    (state) => state.importProjectFromRaw,
  )
  const exportProjectInBrowser = useWorkbenchStore(
    (state) => state.exportProjectInBrowser,
  )
  const currentFilePath = useWorkbenchStore((state) => state.currentFilePath)
  const fileLabel = getHeaderFileLabel(currentFilePath)
  const hasDesktopBridge = typeof window.workbenchApi !== 'undefined'

  const handleOpenProject = () => {
    if (hasDesktopBridge) {
      void openProject()
      return
    }

    fallbackProjectInputRef.current?.click()
  }

  const handleExportProject = () => {
    if (hasDesktopBridge) {
      void exportProject()
      return
    }

    void exportProjectInBrowser()
  }

  return (
    <div className="workbench-shell">
      <input
        ref={fallbackProjectInputRef}
        data-testid="fallback-project-input"
        type="file"
        accept=".json,application/json"
        hidden
        onChange={(event) => {
          const input = event.currentTarget
          const file = event.currentTarget.files?.[0]

          if (!file) {
            return
          }

          void file.text().then(async (rawText) => {
            await importProjectFromRaw({
              filePath: file.name,
              rawText,
            })
            input.value = ''
          })
        }}
      />

      <header className="topbar" role="banner">
        <div className="topbar-brand">
          <img
            className="topbar-logo"
            src="./applogo.png"
            alt="Fields of Mistria Translator logo"
          />
          <div className="topbar-meta">
            <p>Work session</p>
            <small title={currentFilePath ?? fileLabel}>{fileLabel}</small>
          </div>
        </div>

        <div className="topbar-actions">
          <button type="button" onClick={handleOpenProject}>
            Open Project
          </button>
          <button type="button" onClick={handleExportProject}>
            Export JSON
          </button>
        </div>
      </header>

      <main className="workspace-grid">
        {!hasDesktopBridge && (
          <div className="web-warning-banner" style={{ gridColumn: '1 / -1', padding: '10px 15px', background: '#ffcc00', color: '#333', textAlign: 'center', borderRadius: '4px', margin: '15px' }}>
            <strong>Web Mode Active:</strong> You are using the browser preview. Translations will <strong>not</strong> be saved to disk across restarts. Please run the desktop application to persist translations.
          </div>
        )}
        <EntryListPanel />
        <SourceViewerPanel />
        <TranslationEditorPanel />
      </main>
    </div>
  )
}
