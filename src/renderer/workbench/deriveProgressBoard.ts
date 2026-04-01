import { validateEntry } from '../../main/project/validateEntry'
import type { LocalizationEntry } from '../../shared/contracts'

const ISSUE_LABELS: Record<string, string> = {
  'missing-placeholder': 'Missing placeholder',
  'line-break-mismatch': 'Line break mismatch',
  'length-drift': 'Length drift',
}

export interface ProgressSnapshot {
  label: string
  totalCount: number
  completeCount: number
  remainingCount: number
  warningCount: number
  completionPercent: number
}

export interface CategoryProgressSnapshot extends ProgressSnapshot {
  path: string
}

export interface IssueDigestItem {
  code: string
  label: string
  count: number
}

interface DeriveProgressBoardInput {
  entries: LocalizationEntry[]
  selectedCategoryPath: string | null
}

interface ProgressBoardData {
  overall: ProgressSnapshot
  selectedScope: ProgressSnapshot
  categoryProgressByPath: Record<string, CategoryProgressSnapshot>
  issueDigest: IssueDigestItem[]
}

function matchesCategoryPath(key: string, selectedCategoryPath: string | null) {
  if (!selectedCategoryPath) {
    return true
  }

  return key === selectedCategoryPath || key.startsWith(`${selectedCategoryPath}/`)
}

function buildProgressSnapshot(
  label: string,
  entries: LocalizationEntry[],
): ProgressSnapshot {
  const completeCount = entries.filter(
    (entry) => entry.status === 'reviewed' || entry.status === 'warning',
  ).length
  const remainingCount = entries.filter(
    (entry) => entry.status === 'untranslated' || entry.status === 'draft',
  ).length
  const warningCount = entries.filter((entry) => entry.status === 'warning').length
  const totalCount = entries.length

  return {
    label,
    totalCount,
    completeCount,
    remainingCount,
    warningCount,
    completionPercent: totalCount === 0 ? 0 : completeCount / totalCount,
  }
}

function buildCategoryProgressByPath(
  entries: LocalizationEntry[],
): Record<string, CategoryProgressSnapshot> {
  const entriesByPath = new Map<string, LocalizationEntry[]>()

  for (const entry of entries) {
    const segments = entry.key.split('/').filter(Boolean)
    const pathSegments: string[] = []

    for (const segment of segments) {
      pathSegments.push(segment)
      const path = pathSegments.join('/')
      const scopedEntries = entriesByPath.get(path) ?? []

      scopedEntries.push(entry)
      entriesByPath.set(path, scopedEntries)
    }
  }

  return Object.fromEntries(
    [...entriesByPath.entries()].map(([path, scopedEntries]) => {
      const label = path.split('/').pop() ?? path

      return [
        path,
        {
          path,
          ...buildProgressSnapshot(label, scopedEntries),
        },
      ]
    }),
  )
}

function buildIssueDigest(entries: LocalizationEntry[]): IssueDigestItem[] {
  const issueCounts = new Map<string, number>()

  for (const entry of entries) {
    if (entry.status !== 'warning') {
      continue
    }

    const validation = validateEntry({
      sourceText: entry.sourceText,
      translatedText: entry.translatedText,
    })

    for (const issue of [...validation.errors, ...validation.warnings]) {
      issueCounts.set(issue.code, (issueCounts.get(issue.code) ?? 0) + 1)
    }
  }

  return [...issueCounts.entries()]
    .map(([code, count]) => ({
      code,
      count,
      label: ISSUE_LABELS[code] ?? code,
    }))
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count
      }

      return left.label.localeCompare(right.label, 'en')
    })
}

export function deriveProgressBoard({
  entries,
  selectedCategoryPath,
}: DeriveProgressBoardInput): ProgressBoardData {
  const scopedEntries = entries.filter((entry) =>
    matchesCategoryPath(entry.key, selectedCategoryPath),
  )

  return {
    overall: buildProgressSnapshot('All categories', entries),
    selectedScope: buildProgressSnapshot(
      selectedCategoryPath ?? 'All categories',
      scopedEntries,
    ),
    categoryProgressByPath: buildCategoryProgressByPath(entries),
    issueDigest: buildIssueDigest(scopedEntries),
  }
}
