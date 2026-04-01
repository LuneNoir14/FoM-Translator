import type { LocalizationEntry } from './contracts.js'
import { validateEntry } from '../main/project/validateEntry.js'

export interface PreparedLocalizationExport {
  jsonText: string
  warningCount: number
}

export function prepareLocalizationExport(
  entries: Array<
    Pick<LocalizationEntry, 'key' | 'sourceText' | 'translatedText' | 'status'>
  >,
): PreparedLocalizationExport {
  let warningCount = 0
  const tr = Object.fromEntries(
    entries.map((entry) => {
      const validation = validateEntry({
        sourceText: entry.sourceText,
        translatedText: entry.translatedText,
      })

      warningCount += validation.warnings.length

      if (validation.errors.length > 0) {
        throw new Error('Cannot export while critical validation errors remain.')
      }

      return [entry.key, entry.translatedText]
    }),
  )

  return {
    jsonText: JSON.stringify({ tr }, null, 2),
    warningCount,
  }
}
