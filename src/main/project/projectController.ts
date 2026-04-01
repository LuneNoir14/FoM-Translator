import { readFile } from 'node:fs/promises'
import type {
  LocalizationEntry,
  ProjectSummary,
  WorkspaceEntry,
} from '../../shared/contracts.js'
import { buildCategoryTree } from '../../shared/buildCategoryTree.js'
import { deriveEntryStatus } from '../../shared/deriveEntryStatus.js'
import { buildSearchIndex } from './buildSearchIndex.js'
import { exportLocalization } from './exportLocalization.js'
import { parseLocalizationFile } from './parseLocalizationFile.js'
import { createWorkspaceDb } from './workspaceDb.js'

interface ControllerOptions {
  workspaceDbPath: string
  defaultExportPath: string
}

export function createProjectController(options: ControllerOptions) {
  const workspaceDb = createWorkspaceDb(options.workspaceDbPath)
  let sourceEntries: LocalizationEntry[] = []

  function buildSummary(entries: LocalizationEntry[]): ProjectSummary {
    const counts: ProjectSummary = {
      untranslated: 0,
      draft: 0,
      reviewed: 0,
      warning: 0,
    }

    for (const entry of entries) {
      counts[entry.status] += 1
    }

    return counts
  }

  function mergeWorkspaceEntry(entry: LocalizationEntry): LocalizationEntry {
    const workspaceEntry = workspaceDb.getEntry(entry.key)

    if (!workspaceEntry) {
      return entry
    }

    return {
      ...entry,
      translatedText: workspaceEntry.translatedText,
      status: deriveEntryStatus({
        sourceText: entry.sourceText,
        translatedText: workspaceEntry.translatedText,
      }),
    }
  }

  return {
    async openProject(filePath: string) {
      const raw = await readFile(filePath, 'utf8')
      const parsed = parseLocalizationFile(raw)
      sourceEntries = parsed.entries.map(mergeWorkspaceEntry)

      return {
        entries: sourceEntries,
        summary: buildSummary(sourceEntries),
        categoryTree: buildCategoryTree(parsed.entries.map((entry) => entry.key)),
      }
    },
    async saveTranslation(input: WorkspaceEntry) {
      const sourceEntry = sourceEntries.find((entry) => entry.key === input.key)
      const normalizedStatus =
        sourceEntry === undefined
          ? input.status
          : deriveEntryStatus({
              sourceText: sourceEntry.sourceText,
              translatedText: input.translatedText,
            })

      workspaceDb.saveEntry({
        ...input,
        status: normalizedStatus,
      })
      sourceEntries = sourceEntries.map((entry) =>
        entry.key === input.key
          ? {
              ...entry,
              translatedText: input.translatedText,
              status: normalizedStatus,
            }
          : entry,
      )
    },
    async exportProject(outputPath = options.defaultExportPath) {
      return exportLocalization({
        sourceEntries: sourceEntries.map(({ key, sourceText }) => ({
          key,
          sourceText,
        })),
        workspaceEntries: sourceEntries.map(({ key, translatedText, status }) => ({
          key,
          translatedText,
          status,
        })),
        outputPath,
      })
    },
    getDefaultExportPath() {
      return options.defaultExportPath
    },
    async getNextUntranslated(currentKey: string) {
      const index = buildSearchIndex(sourceEntries)
      const untranslatedKeys = index.search({
        query: '',
        status: 'untranslated',
      })
      const currentIndex = untranslatedKeys.indexOf(currentKey)

      if (currentIndex === -1) {
        return untranslatedKeys[0]
      }

      return untranslatedKeys[currentIndex + 1]
    },
  }
}
