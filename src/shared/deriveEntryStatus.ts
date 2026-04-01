import type { EntryStatus } from './contracts.js'
import { validateEntry } from '../main/project/validateEntry.js'

interface DeriveEntryStatusInput {
  sourceText: string
  translatedText: string
}

export function deriveEntryStatus(
  input: DeriveEntryStatusInput,
): EntryStatus {
  if (!input.translatedText.trim()) {
    return 'untranslated'
  }

  const validation = validateEntry(input)

  if (validation.errors.length > 0 || validation.warnings.length > 0) {
    return 'warning'
  }

  return 'reviewed'
}
