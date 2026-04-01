import { z } from 'zod'
import type { ParsedProject } from '../../shared/contracts.js'

const localizationSchema = z.object({
  eng: z.record(z.string(), z.string()),
})

export function parseLocalizationFile(raw: string): ParsedProject {
  const parsed = localizationSchema.parse(JSON.parse(raw))
  const entries = Object.entries(parsed.eng).map(([key, sourceText]) => ({
    key,
    sourceText,
    translatedText: '',
    status: 'untranslated' as const,
  }))

  return {
    locale: 'eng',
    entryCount: entries.length,
    entries,
  }
}
