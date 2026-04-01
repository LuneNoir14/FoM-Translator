# Workbench Progress Board Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a wider, more informative left-side progress board that shows overall progress, selected-category progress, category completion percentages, and grouped validation issues without disrupting the current translation workflow.

**Architecture:** Keep the current workbench structure intact and enrich `EntryListPanel` with derived analytics computed from existing entry data. Add one focused derivation helper for progress-board metrics, keep the Zustand store as the source of truth, and update CSS only where needed to widen the left column and support the new summary blocks.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest, Testing Library

---

## File Map

- Create: `src/renderer/workbench/deriveProgressBoard.ts`
  Responsibility: derive overall progress, selected-scope progress, category metrics, and grouped issue counts from `entries` plus `selectedCategoryPath`.
- Create: `tests/unit/deriveProgressBoard.test.ts`
  Responsibility: prove the new derivation helper handles completion rules, category scope, and issue grouping correctly.
- Modify: `src/renderer/workbench/EntryListPanel.tsx`
  Responsibility: render the new progress-board sections above the existing category/search/list flow and keep current entry filtering behavior intact.
- Modify: `src/renderer/styles/theme.css`
  Responsibility: widen the left column and style the new progress cards, digest rows, and richer category labels without breaking the current three-panel shell.
- Modify: `tests/ui/EntryListPanel.test.tsx`
  Responsibility: assert the new progress board, selected-category summary, and enriched category rows render correctly.
- Modify: `tests/unit/themeLayout.test.ts`
  Responsibility: lock in the widened left column and preserve layout constraints that already matter for the workbench.

## Implementation Notes

- Treat `reviewed + warning` as complete.
- Treat `untranslated + draft` as remaining.
- Progress-board metrics must follow category scope only, not query text or status-filter state.
- Issue digest should group only current validator issue codes from warning entries:
  - `missing-placeholder`
  - `line-break-mismatch`
  - `length-drift`
- Keep first release non-interactive:
  - no issue-chip filtering
  - no jump-to-next-issue button
- Do not introduce new persisted store fields or workspace DB changes.

## Chunk 1: Derived Analytics

### Task 1: Add failing unit coverage for progress-board derivation

**Files:**
- Create: `tests/unit/deriveProgressBoard.test.ts`
- Reference: `src/main/project/validateEntry.ts`
- Reference: `src/shared/buildCategoryTree.ts`
- Reference: `src/shared/contracts.ts`

- [ ] **Step 1: Write the failing test for overall completion rules**

```ts
test('treats reviewed and warning entries as complete', () => {
  const result = deriveProgressBoard({
    entries: [
      { key: 'a/one', sourceText: 'A', translatedText: '', status: 'untranslated' },
      { key: 'a/two', sourceText: 'B', translatedText: 'Taslak', status: 'draft' },
      { key: 'a/three', sourceText: 'C', translatedText: 'Tamam', status: 'reviewed' },
      { key: 'a/four', sourceText: '[Ari]', translatedText: 'Merhaba', status: 'warning' },
    ],
    selectedCategoryPath: null,
  })

  expect(result.overall.completeCount).toBe(2)
  expect(result.overall.remainingCount).toBe(2)
})
```

- [ ] **Step 2: Write the failing test for selected-category scope**

```ts
test('limits selected scope metrics to the active category subtree', () => {
  const result = deriveProgressBoard({
    entries: [
      { key: 'Conversations/a', sourceText: 'A', translatedText: 'Tamam', status: 'reviewed' },
      { key: 'Conversations/b', sourceText: '[Ari]', translatedText: 'Merhaba', status: 'warning' },
      { key: 'items/a', sourceText: 'Item', translatedText: '', status: 'untranslated' },
    ],
    selectedCategoryPath: 'Conversations',
  })

  expect(result.selectedScope.label).toBe('Conversations')
  expect(result.selectedScope.totalCount).toBe(2)
  expect(result.selectedScope.completeCount).toBe(2)
})
```

- [ ] **Step 3: Write the failing test for grouped issue counts**

```ts
test('groups validator issue counts for warning entries in scope', () => {
  const result = deriveProgressBoard({
    entries: [
      {
        key: 'letters/missing',
        sourceText: '[Ari], hello',
        translatedText: 'Merhaba',
        status: 'warning',
      },
      {
        key: 'letters/linebreak',
        sourceText: 'Line 1\\n\\nLine 2',
        translatedText: 'Satir 1\\nSatir 2',
        status: 'warning',
      },
    ],
    selectedCategoryPath: 'letters',
  })

  expect(result.issueDigest).toContainEqual(
    expect.objectContaining({ code: 'missing-placeholder', count: 1 }),
  )
  expect(result.issueDigest).toContainEqual(
    expect.objectContaining({ code: 'line-break-mismatch', count: 1 }),
  )
})
```

- [ ] **Step 4: Run the unit test file and verify it fails**

Run: `npm.cmd test -- tests/unit/deriveProgressBoard.test.ts`

Expected: FAIL because `deriveProgressBoard` does not exist yet.

- [ ] **Step 5: Commit the failing test**

```bash
git add tests/unit/deriveProgressBoard.test.ts
git commit -m "test: define progress board analytics expectations"
```

### Task 2: Implement the derivation helper with minimal logic

**Files:**
- Create: `src/renderer/workbench/deriveProgressBoard.ts`
- Reference: `src/main/project/validateEntry.ts`
- Reference: `src/shared/contracts.ts`

- [ ] **Step 1: Create minimal types for the helper output**

```ts
interface ProgressSnapshot {
  label: string
  totalCount: number
  completeCount: number
  remainingCount: number
  warningCount: number
  completionPercent: number
}
```

- [ ] **Step 2: Implement scope filtering that matches category-path behavior**

```ts
function matchesCategoryPath(key: string, selectedCategoryPath: string | null) {
  if (!selectedCategoryPath) return true
  return key === selectedCategoryPath || key.startsWith(`${selectedCategoryPath}/`)
}
```

- [ ] **Step 3: Implement progress calculation from entry status only**

```ts
function buildProgressSnapshot(label: string, entries: LocalizationEntry[]): ProgressSnapshot {
  const completeCount = entries.filter((entry) => entry.status === 'reviewed' || entry.status === 'warning').length
  const remainingCount = entries.filter((entry) => entry.status === 'untranslated' || entry.status === 'draft').length
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
```

- [ ] **Step 4: Implement grouped issue counting for warning entries only**

```ts
const issueCounts = new Map<string, number>()
for (const entry of scopedEntries) {
  if (entry.status !== 'warning') continue
  const validation = validateEntry({
    sourceText: entry.sourceText,
    translatedText: entry.translatedText,
  })
  for (const issue of [...validation.errors, ...validation.warnings]) {
    issueCounts.set(issue.code, (issueCounts.get(issue.code) ?? 0) + 1)
  }
}
```

- [ ] **Step 5: Return category metrics keyed by category path**

Build per-category summaries for every node path so `EntryListPanel` can enrich each row without recomputing counts inline.

- [ ] **Step 6: Run the unit test file and verify it passes**

Run: `npm.cmd test -- tests/unit/deriveProgressBoard.test.ts`

Expected: PASS

- [ ] **Step 7: Commit the helper**

```bash
git add src/renderer/workbench/deriveProgressBoard.ts tests/unit/deriveProgressBoard.test.ts
git commit -m "feat: derive progress board analytics"
```

## Chunk 2: Render the Progress Board

### Task 3: Add failing UI tests for the new left-panel summaries

**Files:**
- Modify: `tests/ui/EntryListPanel.test.tsx`
- Reference: `src/renderer/workbench/EntryListPanel.tsx`

- [ ] **Step 1: Add a failing test for overall and selected-scope summaries**

```ts
test('shows project and selected-category progress summaries', async () => {
  useWorkbenchStore.setState({
    entries: [
      { key: 'Conversations/one', sourceText: 'A', translatedText: 'Tamam', status: 'reviewed' },
      { key: 'Conversations/two', sourceText: '[Ari]', translatedText: 'Merhaba', status: 'warning' },
      { key: 'items/one', sourceText: 'Item', translatedText: '', status: 'untranslated' },
    ],
    selectedCategoryPath: 'Conversations',
    selectedKey: 'Conversations/one',
    summary: { untranslated: 1, draft: 0, reviewed: 1, warning: 1 },
  })

  render(<EntryListPanel />)

  expect(screen.getByText(/session progress/i)).toBeInTheDocument()
  expect(screen.getByText(/selected category/i)).toBeInTheDocument()
  expect(screen.getByText(/conversations/i)).toBeInTheDocument()
})
```

- [ ] **Step 2: Add a failing test for category rows and issue digest**

```ts
expect(screen.getByText(/issue digest/i)).toBeInTheDocument()
expect(screen.getByText(/missing placeholder/i)).toBeInTheDocument()
expect(screen.getByText(/%/i)).toBeInTheDocument()
```

Use scoped assertions if needed so the percent match is tied to a category/progress section rather than any unrelated text.

- [ ] **Step 3: Run the UI test file and verify it fails**

Run: `npm.cmd test -- tests/ui/EntryListPanel.test.tsx`

Expected: FAIL because the new summary sections are not rendered yet.

- [ ] **Step 4: Commit the failing UI expectations**

```bash
git add tests/ui/EntryListPanel.test.tsx
git commit -m "test: cover progress board rendering"
```

### Task 4: Implement the left-panel summaries in `EntryListPanel`

**Files:**
- Modify: `src/renderer/workbench/EntryListPanel.tsx`
- Reference: `src/renderer/workbench/deriveProgressBoard.ts`

- [ ] **Step 1: Import and memoize the derived progress-board data**

```ts
const progressBoard = useMemo(
  () => deriveProgressBoard({ entries, selectedCategoryPath, categoryTree: effectiveCategoryTree }),
  [entries, selectedCategoryPath, effectiveCategoryTree],
)
```

- [ ] **Step 2: Render a `Session Progress` card above the category section**

Include:

- complete count
- total count
- remaining count
- warning count
- formatted completion percent

- [ ] **Step 3: Render a `Selected Category` card that falls back to `All categories`**

Keep this tied to `selectedCategoryPath`, not to the query or status filter.

- [ ] **Step 4: Render a compact `Issue Digest` block**

Rules:

- show known grouped issue labels and counts when present
- show `No validation issues in this scope` when the digest is empty
- keep it informational only

- [ ] **Step 5: Enrich category rows with done/total, percent, and issue count**

Keep the current expandable-tree interaction unchanged while adding the extra metrics to each visible row.

- [ ] **Step 6: Preserve current toolbar and virtualized list behavior**

Do not move search, status-filter state, or next-untranslated logic into the new helper.

- [ ] **Step 7: Run the UI test file and verify it passes**

Run: `npm.cmd test -- tests/ui/EntryListPanel.test.tsx`

Expected: PASS

- [ ] **Step 8: Commit the UI implementation**

```bash
git add src/renderer/workbench/EntryListPanel.tsx tests/ui/EntryListPanel.test.tsx
git commit -m "feat: render workbench progress board"
```

## Chunk 3: Layout and Verification

### Task 5: Add failing layout tests for the wider left column

**Files:**
- Modify: `tests/unit/themeLayout.test.ts`
- Reference: `src/renderer/styles/theme.css`

- [ ] **Step 1: Add a failing assertion for the wider first workspace column**

```ts
expect(themeCss).toMatch(
  /\.workspace-grid\s*{[\s\S]*grid-template-columns:\s*minmax\(340px,\s*400px\)\s+minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\);/,
)
```

If implementation chooses a different but equivalent responsive expression, update this assertion to match the exact intended rule rather than weakening the test.

- [ ] **Step 2: Add a failing assertion for new progress-board styles**

Lock in at least one new summary block selector so the layout work is not entirely untested.

- [ ] **Step 3: Run the layout test file and verify it fails**

Run: `npm.cmd test -- tests/unit/themeLayout.test.ts`

Expected: FAIL because the widened column and new selectors are not in `theme.css` yet.

- [ ] **Step 4: Commit the failing layout test**

```bash
git add tests/unit/themeLayout.test.ts
git commit -m "test: lock in wider progress board layout"
```

### Task 6: Implement CSS for width and summary styling

**Files:**
- Modify: `src/renderer/styles/theme.css`
- Reference: `src/renderer/workbench/EntryListPanel.tsx`

- [ ] **Step 1: Widen the left column in `.workspace-grid`**

Use a responsive width range that lands in the approved 340px to 400px feel on desktop.

- [ ] **Step 2: Add styles for the new summary sections**

Expected selectors:

- `.progress-board`
- `.progress-card`
- `.progress-meter`
- `.issue-digest`
- category-row metric selectors, if needed

- [ ] **Step 3: Keep existing scroll behavior intact**

Preserve:

- outer left-panel scroll region
- virtualized entry list scroll
- long key wrapping

- [ ] **Step 4: Run layout and UI tests together**

Run: `npm.cmd test -- tests/unit/themeLayout.test.ts tests/ui/EntryListPanel.test.tsx`

Expected: PASS

- [ ] **Step 5: Commit the CSS changes**

```bash
git add src/renderer/styles/theme.css tests/unit/themeLayout.test.ts src/renderer/workbench/EntryListPanel.tsx tests/ui/EntryListPanel.test.tsx
git commit -m "style: widen workbench sidebar for progress board"
```

### Task 7: Run final verification

**Files:**
- Verify only: `src/renderer/workbench/deriveProgressBoard.ts`
- Verify only: `src/renderer/workbench/EntryListPanel.tsx`
- Verify only: `src/renderer/styles/theme.css`
- Verify only: `tests/unit/deriveProgressBoard.test.ts`
- Verify only: `tests/ui/EntryListPanel.test.tsx`
- Verify only: `tests/unit/themeLayout.test.ts`

- [ ] **Step 1: Run the focused verification suite**

Run: `npm.cmd test -- tests/unit/deriveProgressBoard.test.ts tests/ui/EntryListPanel.test.tsx tests/unit/themeLayout.test.ts`

Expected: PASS

- [ ] **Step 2: Run the full test suite**

Run: `npm.cmd test`

Expected: PASS

- [ ] **Step 3: Run the production build**

Run: `npm.cmd run build`

Expected: PASS

- [ ] **Step 4: Review the diff before handoff**

Check that the change stays within:

- derived analytics
- left-panel rendering
- CSS layout updates
- matching tests

- [ ] **Step 5: Commit the final verified state**

```bash
git add src/renderer/workbench/deriveProgressBoard.ts src/renderer/workbench/EntryListPanel.tsx src/renderer/styles/theme.css tests/unit/deriveProgressBoard.test.ts tests/ui/EntryListPanel.test.tsx tests/unit/themeLayout.test.ts
git commit -m "feat: add workbench progress board"
```
