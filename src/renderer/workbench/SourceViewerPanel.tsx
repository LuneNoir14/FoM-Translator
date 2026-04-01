import { useWorkbenchStore } from './useWorkbenchStore'

export function SourceViewerPanel() {
  const entries = useWorkbenchStore((state) => state.entries)
  const selectedKey = useWorkbenchStore((state) => state.selectedKey)
  const selectedEntry = entries.find((entry) => entry.key === selectedKey)

  return (
    <section
      className="panel source-panel"
      data-testid="source-viewer-panel"
    >
      <h2>Source Text</h2>
      <p>Selected source text appears here with placeholders preserved.</p>
      <div className="editor-surface">
        {selectedEntry?.sourceText ?? 'No entry selected yet.'}
      </div>
    </section>
  )
}
