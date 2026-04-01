# Workbench Progress Board Design

## Goal

Improve the left side of the FoMTranslator workbench so translators can understand progress faster without disrupting the current entry editing flow.

The updated panel should show:

- overall completion progress
- selected-category completion progress
- category-by-category completion percentages
- a compact validation issue digest
- a wider, less cramped left column

## User Intent

The current UI already works, but the progress feedback is too thin for large localization files. The user wants the left side to answer three questions at a glance:

1. How much of the project is finished?
2. Which categories are further along, and by what percentage?
3. What kinds of validation problems are present?

## Scope

This change is limited to the renderer workbench layout and the derived data needed to support the new left-panel summaries.

In scope:

- redesign the left panel into a progress-board layout
- widen the left workbench column on desktop
- show overall completion metrics
- show selected-category metrics
- show category row percentages and issue counts
- show an issue digest grouped by validation issue type
- preserve the current category selection, search, status filtering, and next-untranslated flow
- add or update tests for the new summaries and layout-facing behavior

Out of scope:

- changing validation rules
- changing export behavior
- adding new persistence fields to the workspace database
- making the issue digest interactive in the first version
- changing the middle or right editor workflows beyond layout rebalancing

## Current State

The left panel currently contains:

- four compact status counters: remaining, draft, done, warning
- a category tree with counts
- search and status actions
- virtualized entry rows

What is missing:

- completion percentage at project level
- completion percentage at category level
- per-category issue visibility
- grouped issue types for warning entries
- enough horizontal room for richer progress summaries

## Recommended Design

Use a stacked "Progress Board" above the existing category/search/list workflow.

Top-to-bottom order:

1. Session Progress
2. Selected Category
3. Issue Digest
4. Category Tree with richer rows
5. Search and entry actions
6. Virtualized entry list

This keeps the current workbench mental model intact while making the left side meaningfully more informative.

## Layout

### Left Column Width

Increase the desktop width of the first workspace column from its current narrow range to a wider responsive range.

Design target:

- current feel: roughly 280px to 320px
- new feel: roughly 340px to 400px

The exact CSS does not need to hardcode a single width, but the left column should visibly relax the spacing for:

- progress cards
- category labels
- done/total counts
- percentage labels
- issue counts

Small-screen behavior should remain responsive so the widened left panel does not collapse the source and translation editors into unusable widths.

## Progress Definitions

### Overall Completion

Overall completion should treat these entries as complete:

- `reviewed`
- `warning`

Overall completion should treat these entries as not complete:

- `untranslated`
- `draft`

Formula:

`completeCount = reviewed + warning`

`remainingCount = untranslated + draft`

`completionPercent = completeCount / totalEntries`

### Selected Category Completion

The selected-category card uses the same rules, but only over entries whose keys belong to the selected category path.

If no category is selected:

- show `All categories`
- use project-wide totals

### Category Row Completion

Each visible category row should show:

- `done / total`
- `% complete`
- `issue count`

For category rows:

- `done` means `reviewed + warning`
- `issue count` means the number of entries in `warning` status inside that category subtree

## Issue Digest

The issue digest summarizes warning-entry validation problems by issue type.

Initial issue groups are based on the current validator output:

- `missing-placeholder`
- `line-break-mismatch`
- `length-drift`

Presentation rules:

- show issue label and count
- show only the relevant groups for the current scope
- when there are no issues, show a calm empty state such as `No validation issues in this scope`

Scope rules:

- if a category is selected, digest counts only that category subtree
- if no category is selected, digest counts the whole project
- query text and status-filter UI do not change digest totals in the first version

First-release non-goals:

- no click-to-filter issue chips
- no jump-to-next-issue action

## Category Tree Behavior

Keep the current expandable category tree and selection behavior.

Enhance each category row so the user can scan both workload and risk:

- category name
- done/total count
- completion percentage
- issue count

The row should remain readable in dense lists and should not turn into a multi-line analytics card unless the existing tree spacing already allows it cleanly.

## Data and Architecture

Follow the existing codebase pattern: keep the workbench behavior simple, derive view data close to the renderer, and avoid new persistence complexity.

Recommended units:

### 1. Progress-Derivation Helper

Add a focused helper that derives progress-board data from the current entry list and selected category path.

Responsibilities:

- compute project-wide completion totals
- compute selected-scope totals
- compute category row metrics
- compute grouped issue counts for the active scope

Suggested output shape:

- `overallProgress`
- `selectedScopeProgress`
- `categoryProgressByPath`
- `issueDigest`

This helper should be independently testable.

### 2. EntryListPanel Rendering Sections

Keep `EntryListPanel` as the left-panel container, but split its rendering into clearer sections or small presentational helpers so the main component does not become harder to reason about.

Suggested render sections:

- progress summary card
- selected category card
- issue digest block
- enhanced category tree
- existing toolbar
- existing entry list

These can remain in the same file if the implementation stays readable; extracting tiny files is optional, not mandatory.

### 3. Existing Store Stays the Source of Truth

Do not add new persisted store state for this feature unless implementation proves it is necessary.

Use existing state:

- `entries`
- `selectedCategoryPath`
- `summary`
- `query`
- `statusFilter`

The new analytics layer should be derived from the existing entries rather than stored separately.

## Data Flow

1. The store remains responsible for entry selection, category selection, filtering, and edits.
2. The left panel derives progress-board metrics from the current `entries` and `selectedCategoryPath`.
3. Category selection updates both:
   - the filtered entry list
   - the selected-category progress and issue digest
4. Editing a translation updates entry status as it already does today.
5. The progress board re-renders to reflect the new counts.

Progress-board numbers should follow category scope only, not transient query or status filters, so the analytics remain stable while the user searches or focuses the entry list.

## Performance Considerations

The project size shown in the UI is large enough that full-list derived calculations need deliberate boundaries.

Requirements:

- keep the existing virtualized entry list behavior unchanged
- derive summary data with memoized calculations
- avoid validating every entry when it is unnecessary

Recommended approach:

- compute category progress from entry statuses, which are already available
- compute issue digest by validating only entries in `warning` status within the active scope

This keeps the first version simple while avoiding the heaviest unnecessary validation work.

If live typing reveals performance problems later, a follow-up optimization can cache validation metadata, but that is out of scope for this change.

## Error Handling and Edge Cases

Handle these cases explicitly:

- no project open or demo workspace loaded
- no category selected
- selected category with zero warning entries
- issue digest with zero results
- zero-entry safeguards when dividing percentages
- long category names in the widened but still constrained left column
- category subtrees that are large but mostly untranslated

UI behavior guidelines:

- empty issue state should be informative, not alarming
- percentage formatting should not produce noisy precision
- counts should remain visible even when percentages are very small

## Testing Strategy

Add or update tests around derived behavior rather than relying only on screenshots.

Coverage should include:

- overall completion uses `reviewed + warning`
- remaining count uses `untranslated + draft`
- selected category card updates when category selection changes
- category rows render percentage and issue count
- issue digest groups known validator issue types correctly
- issue digest respects category scope
- empty issue state renders when there are no warning issues
- existing filtering and next-untranslated behavior still works

Prefer focused unit coverage for the derivation helper plus targeted UI assertions in the existing workbench tests.

## Acceptance Criteria

- the left workbench column is visibly wider on desktop
- the top of the left panel shows overall completion progress
- the left panel shows selected-category progress, or all-categories progress when none is selected
- category rows show done/total, completion percentage, and issue count
- the left panel shows grouped validation issue counts for the active scope
- existing search, filter, category selection, and entry virtualization still behave correctly
- no new persistence model is introduced

## Risks and Mitigations

### Risk: Left panel becomes visually crowded

Mitigation:

- use stacked sections with clear visual hierarchy
- keep issue digest compact
- widen the left column responsively

### Risk: Summary calculations become expensive on large projects

Mitigation:

- derive from existing statuses where possible
- validate only warning entries for digest counts
- keep calculations memoized

### Risk: Richer category rows become noisy

Mitigation:

- keep row copy short
- prioritize count, percent, and issue count over secondary styling

## Implementation Direction

This design is intentionally incremental:

- preserve the existing workbench structure
- enrich the left panel instead of replacing the app layout
- derive analytics from current data rather than expanding persistence

That keeps the change focused, testable, and suitable for a single implementation plan.
