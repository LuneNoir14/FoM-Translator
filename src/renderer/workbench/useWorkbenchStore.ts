import { create } from 'zustand'
import type {
  CategoryNode,
  ExportProjectResult,
  LocalizationEntry,
  OpenProjectResult,
  ProjectSummary,
} from '../../shared/contracts'
import { buildCategoryTree } from '../../shared/buildCategoryTree'
import { deriveEntryStatus } from '../../shared/deriveEntryStatus'
import { prepareLocalizationExport } from '../../shared/prepareLocalizationExport'
import { parseLocalizationFile } from '../../main/project/parseLocalizationFile'

type StatusFilter = 'all' | 'untranslated' | 'reviewed'

interface ImportProjectFromRawInput {
  filePath: string
  rawText: string
}

function applyOpenedProjectState(
  entries: LocalizationEntry[],
  filePath: string,
  categoryTree?: CategoryNode[],
  summary?: ProjectSummary,
) {
  return {
    entries,
    categoryTree:
      categoryTree ?? buildCategoryTree(entries.map((entry) => entry.key)),
    selectedCategoryPath: null,
    summary: summary ?? buildSummary(entries),
    selectedKey: entries[0]?.key ?? null,
    currentFilePath: filePath,
    query: '',
    statusFilter: 'all' as StatusFilter,
    errorMessage: undefined,
  }
}

function buildBrowserExportFilename(currentFilePath?: string) {
  const fileName =
    currentFilePath?.split(/[/\\]/).pop()?.trim() || 'translation-export.json'

  if (fileName.toLowerCase().endsWith('.en.json')) {
    return fileName.replace(/\.en\.json$/i, '.translation.json')
  }

  if (fileName.toLowerCase().endsWith('.json')) {
    return fileName.replace(/\.json$/i, '.translation.json')
  }

  return `${fileName}.translation.json`
}

function buildSummary(entries: LocalizationEntry[]): ProjectSummary {
  return entries.reduce<ProjectSummary>(
    (summary, entry) => ({
      ...summary,
      [entry.status]: summary[entry.status] + 1,
    }),
    {
      untranslated: 0,
      draft: 0,
      reviewed: 0,
      warning: 0,
    },
  )
}

interface WorkbenchState {
  entries: LocalizationEntry[]
  categoryTree: CategoryNode[]
  selectedCategoryPath: string | null
  summary: ProjectSummary
  query: string
  statusFilter: StatusFilter
  selectedKey: string | null
  currentFilePath?: string
  errorMessage?: string
  setQuery: (query: string) => void
  setCategoryPath: (categoryPath: string | null) => void
  setStatusFilter: (statusFilter: StatusFilter) => void
  selectKey: (key: string) => void
  selectNextUntranslated: () => void
  updateSelectedTranslation: (translatedText: string) => Promise<void>
  importProjectFromRaw: (input: ImportProjectFromRawInput) => Promise<void>
  openProject: () => Promise<OpenProjectResult | undefined>
  exportProject: () => Promise<ExportProjectResult | undefined>
  exportProjectInBrowser: () => Promise<ExportProjectResult | undefined>
  clearError: () => void
}

const demoEntries: LocalizationEntry[] = [
  {
    key: 'misc_local/sleep',
    sourceText: 'Sleep',
    translatedText: '',
    status: 'untranslated',
  },
  {
    key: 'misc_local/talk',
    sourceText: 'Talk',
    translatedText: '',
    status: 'untranslated',
  },
  {
    key: 'letters/example',
    sourceText: '[Ari], hello',
    translatedText: 'Bonjour [Ari]',
    status: 'reviewed',
  },
]

const initialState = {
  entries: demoEntries,
  categoryTree: buildCategoryTree(demoEntries.map((entry) => entry.key)),
  selectedCategoryPath: null,
  summary: buildSummary(demoEntries),
  query: '',
  statusFilter: 'all' as StatusFilter,
  selectedKey: 'misc_local/sleep',
  currentFilePath: undefined,
  errorMessage: undefined,
}

export const useWorkbenchStore = create<WorkbenchState>((set, get) => ({
  ...initialState,
  setQuery: (query) => set({ query }),
  setCategoryPath: (selectedCategoryPath) => set({ selectedCategoryPath }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  selectKey: (key) => set({ selectedKey: key }),
  clearError: () => set({ errorMessage: undefined }),
  selectNextUntranslated: () => {
    const { entries, selectedKey } = get()
    const untranslated = entries.filter((entry) => entry.status === 'untranslated')
    const currentIndex = untranslated.findIndex((entry) => entry.key === selectedKey)
    const nextEntry =
      currentIndex >= 0 ? untranslated[currentIndex + 1] : untranslated[0]

    if (nextEntry) {
      set({ selectedKey: nextEntry.key, statusFilter: 'untranslated' })
    }
  },
  updateSelectedTranslation: async (translatedText) => {
    const { selectedKey } = get()

    if (!selectedKey) {
      return
    }

    let workspaceEntry: LocalizationEntry | undefined
    let nextStatus: LocalizationEntry['status'] = 'untranslated'
    let previousStatus: LocalizationEntry['status'] = 'untranslated'

    set((state) => {
      workspaceEntry = state.entries.find((entry) => entry.key === selectedKey)
      previousStatus = workspaceEntry?.status ?? 'untranslated'
      nextStatus = deriveEntryStatus({
        sourceText: workspaceEntry?.sourceText ?? '',
        translatedText,
      })
      return {
        entries: state.entries.map((entry) =>
          entry.key === selectedKey
            ? {
                ...entry,
                translatedText,
                status: nextStatus,
              }
            : entry,
        ),
        summary:
          previousStatus === nextStatus
            ? state.summary
            : {
                ...state.summary,
                [previousStatus]: state.summary[previousStatus] - 1,
                [nextStatus]: state.summary[nextStatus] + 1,
              },
      }
    })

    if (window.workbenchApi && workspaceEntry) {
      try {
        await window.workbenchApi.saveTranslation({
          key: workspaceEntry.key,
          translatedText,
          status: nextStatus,
        })
      } catch (error) {
        set({
          errorMessage:
            error instanceof Error ? error.message : 'Failed to save translation.',
        })
      }
    }
  },
  importProjectFromRaw: async ({ filePath, rawText }) => {
    try {
      const parsed = parseLocalizationFile(rawText)
      set(applyOpenedProjectState(parsed.entries, filePath))
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : 'Failed to open project.',
      })
    }
  },
  openProject: async () => {
    if (!window.workbenchApi) {
      return undefined
    }

    try {
      const result = await window.workbenchApi.openProject()

      if (!result.canceled && result.entries && result.entries.length > 0) {
        set(
          applyOpenedProjectState(
            result.entries,
            result.filePath ?? '',
            result.categoryTree,
            result.summary,
          ),
        )
      }

      return result
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : 'Failed to open project.',
      })
      return undefined
    }
  },
  exportProjectInBrowser: async () => {
    try {
      const { entries, currentFilePath } = get()
      const prepared = prepareLocalizationExport(entries)
      const downloadName = buildBrowserExportFilename(currentFilePath)
      const blob = new Blob([prepared.jsonText], {
        type: 'application/json;charset=utf-8',
      })
      const downloadUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')

      anchor.href = downloadUrl
      anchor.download = downloadName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(downloadUrl)

      set({ errorMessage: undefined })

      return {
        canceled: false,
        outputPath: downloadName,
        warningCount: prepared.warningCount,
      }
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : 'Failed to export project.',
      })
      return undefined
    }
  },
  exportProject: async () => {
    if (!window.workbenchApi) {
      return undefined
    }

    try {
      const result = await window.workbenchApi.exportProject()

      if (!result.canceled) {
        set({ errorMessage: undefined })
      }

      return result
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : 'Failed to export project.',
      })
      return undefined
    }
  },
}))

export function resetWorkbenchStore() {
  useWorkbenchStore.setState(initialState)
}
