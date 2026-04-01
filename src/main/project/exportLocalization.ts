import { writeFile } from 'node:fs/promises'
import type {
  ExportInput,
  ExportResult,
} from '../../shared/contracts.js'
import { prepareLocalizationExport } from '../../shared/prepareLocalizationExport.js'

export async function exportLocalization(
  input: ExportInput,
): Promise<ExportResult> {
  const prepared = prepareLocalizationExport(
    input.sourceEntries.map((entry) => {
      const workspaceEntry = input.workspaceEntries.find(
        (candidate) => candidate.key === entry.key,
      )

      return {
        ...entry,
        translatedText: workspaceEntry?.translatedText ?? '',
        status: workspaceEntry?.status ?? 'untranslated',
      }
    }),
  )

  await writeFile(input.outputPath, prepared.jsonText, 'utf8')

  return {
    outputPath: input.outputPath,
    warningCount: prepared.warningCount,
  }
}
