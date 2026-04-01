# UI Copy English Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Turkish and language-specific UI copy with general English wording so FoMTranslator can be shared for any localization workflow.

**Architecture:** Keep the change limited to renderer-facing copy and related tests. Preserve project behavior, validation logic, and data flow while updating labels, status text, panel headings, and saved/error messaging to English and language-neutral terms.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest, Testing Library

---

### Task 1: Update UI expectations with failing tests

**Files:**
- Modify: `C:\Users\ANIL\Desktop\fomçeviri\tests\ui\AppShell.test.tsx`
- Modify: `C:\Users\ANIL\Desktop\fomçeviri\tests\ui\EntryListPanel.test.tsx`
- Modify: `C:\Users\ANIL\Desktop\fomçeviri\tests\ui\TranslationEditorPanel.test.tsx`

- [ ] **Step 1: Write the failing tests**

Add assertions for English copy such as `Open Project`, `Remaining`, `Completed`, `Translation`, and language-neutral status labels.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- AppShell EntryListPanel TranslationEditorPanel`
Expected: FAIL because the renderer still shows Turkish or target-language-specific wording.

- [ ] **Step 3: Write minimal implementation**

Update renderer copy constants and component labels to satisfy the new assertions without changing behavior.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- AppShell EntryListPanel TranslationEditorPanel`
Expected: PASS

### Task 2: Convert runtime copy to English and keep it generic

**Files:**
- Modify: `C:\Users\ANIL\Desktop\fomçeviri\src\renderer\workbench\AppShell.tsx`
- Modify: `C:\Users\ANIL\Desktop\fomçeviri\src\renderer\workbench\EntryListPanel.tsx`
- Modify: `C:\Users\ANIL\Desktop\fomçeviri\src\renderer\workbench\SourceViewerPanel.tsx`
- Modify: `C:\Users\ANIL\Desktop\fomçeviri\src\renderer\workbench\TranslationEditorPanel.tsx`
- Modify: `C:\Users\ANIL\Desktop\fomçeviri\src\renderer\workbench\ValidationSummary.tsx`
- Modify: `C:\Users\ANIL\Desktop\fomçeviri\src\renderer\workbench\useWorkbenchStore.ts`

- [ ] **Step 1: Update visible strings**

Change labels, headings, status badges, saved state text, and generic error text to English and remove hard-coded references to Turkish as the target language.

- [ ] **Step 2: Keep behavior untouched**

Do not alter validation semantics, status derivation rules, or persistence flow while updating wording.

- [ ] **Step 3: Re-run focused UI tests**

Run: `npm.cmd test -- AppShell EntryListPanel TranslationEditorPanel`
Expected: PASS

### Task 3: Verify full app health and package outputs

**Files:**
- Verify only: `C:\Users\ANIL\Desktop\fomçeviri\dist-app\`

- [ ] **Step 1: Run full test suite**

Run: `npm.cmd test`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm.cmd run build`
Expected: PASS

- [ ] **Step 3: Rebuild and package distributables**

Run: `npm.cmd run dist`
Expected: PASS and refreshed installer/portable artifacts in `dist-app`

- [ ] **Step 4: Restore node-native dependencies for local tests**

Run: `npm.cmd run rebuild:node`
Expected: PASS

- [ ] **Step 5: Re-run full test suite**

Run: `npm.cmd test`
Expected: PASS
