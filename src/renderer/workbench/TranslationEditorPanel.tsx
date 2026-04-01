import { useMemo, useState } from 'react'
import { validateEntry } from '../../main/project/validateEntry'
import { ErrorBanner } from './ErrorBanner'
import { ValidationSummary } from './ValidationSummary'
import { useWorkbenchStore } from './useWorkbenchStore'

interface TranslationEditorPanelProps {
  initialError?: string
}

export function TranslationEditorPanel({
  initialError,
}: TranslationEditorPanelProps) {
  const entries = useWorkbenchStore((state) => state.entries)
  const selectedKey = useWorkbenchStore((state) => state.selectedKey)
  const updateSelectedTranslation = useWorkbenchStore(
    (state) => state.updateSelectedTranslation,
  )
  const selectedEntry = entries.find((entry) => entry.key === selectedKey)
  const errorMessage = useWorkbenchStore((state) => state.errorMessage)
  const [savedLabel, setSavedLabel] = useState('Not saved yet')

  const validation = useMemo(
    () =>
      validateEntry({
        sourceText: selectedEntry?.sourceText ?? '',
        translatedText: selectedEntry?.translatedText ?? '',
      }),
    [selectedEntry?.sourceText, selectedEntry?.translatedText],
  )

  return (
    <section
      className="panel translation-panel"
      data-testid="translation-editor-panel"
    >
      <h2>Translation</h2>
      <p>Draft translation, validation summary, and quick actions live here.</p>
      <ErrorBanner message={initialError ?? errorMessage} />
      <textarea
        aria-label="Translation"
        className="translation-textarea"
        value={selectedEntry?.translatedText ?? ''}
        onChange={async (event) => {
          await updateSelectedTranslation(event.target.value)
          setSavedLabel(
            window.workbenchApi ? 'Saved' : 'Saved in session',
          )
        }}
      />
      <ValidationSummary validation={validation} savedLabel={savedLabel} />
    </section>
  )
}
