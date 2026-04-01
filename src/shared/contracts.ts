export type EntryStatus = 'untranslated' | 'draft' | 'reviewed' | 'warning'

export interface CategoryNode {
  path: string
  label: string
  count: number
  children: CategoryNode[]
}

export interface LocalizationEntry {
  key: string
  sourceText: string
  translatedText: string
  status: EntryStatus
}

export interface WorkspaceEntry {
  key: string
  translatedText: string
  status: EntryStatus
  updatedAt?: string
}

export interface ParsedProject {
  locale: 'eng'
  entryCount: number
  entries: LocalizationEntry[]
}

export interface SearchFilters {
  query: string
  status?: EntryStatus | 'all'
}

export interface ValidationIssue {
  code: string
  message: string
  token?: string
}

export interface ValidationResult {
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
}

export interface ValidateEntryInput {
  sourceText: string
  translatedText: string
}

export interface ExportInput {
  sourceEntries: Array<Pick<LocalizationEntry, 'key' | 'sourceText'>>
  workspaceEntries: Array<Pick<WorkspaceEntry, 'key' | 'translatedText' | 'status'>>
  outputPath: string
}

export interface ExportResult {
  outputPath: string
  warningCount: number
}

export interface ProjectSummary {
  untranslated: number
  draft: number
  reviewed: number
  warning: number
}

export interface OpenProjectResult {
  canceled: boolean
  filePath?: string
  entries?: LocalizationEntry[]
  summary?: ProjectSummary
  categoryTree?: CategoryNode[]
}

export interface ExportProjectResult extends ExportResult {
  canceled?: boolean
}

export interface WorkbenchApi {
  appName: string
  openProject: (filePath?: string) => Promise<OpenProjectResult>
  saveTranslation: (input: WorkspaceEntry) => Promise<{ ok: true }>
  exportProject: (
    outputPath?: string,
  ) => Promise<ExportProjectResult>
}
