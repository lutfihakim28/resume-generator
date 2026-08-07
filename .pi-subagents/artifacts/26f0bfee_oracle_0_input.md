# Task for oracle

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, not a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below and return a focused result for that task using your tools.

Task:
PLAN THE JSON IMPORT/EXPORT feature for the resume-editor project at /home/capsvelte/Projects/resume-editor.

CONTEXT — read these first:
1. README.md — spec: "Export resume to pdf as a product, and json as a data for editing"; "Import resume json from previous created resume to edit — when user import their json, it will automatically fill the form and ready to edit"; right panel (preview) "also contain import and export buttons".
2. docs/plan/form-section-review-and-plan.md — Part 2 prior decisions: export language chosen at export time (PDF later); JSON always contains BOTH languages (state is language-complete); import is lenient warn-and-fill (no hard gate); mergeResume drops unknown JSON keys; schema version 1. Part 4: live preview now implemented (ResumePreview.vue is pure HTML on purpose — jsdom-testable and printable later).
3. src/composables/useResumeStore.ts — ALREADY has: importJson(raw: string): ImportResult {ok, errors[]} (JSON.parse + isValidResumeJson check + Object.assign merge), exportJson(): string (pretty JSON incl. version), resetStore(). No file I/O, no UI.
4. src/types/resume.ts — isValidResumeJson (version 1, requires personal.name string + 6 arrays), mergeResume (lenient sanitizers).
5. src/components/resume-preview/ResumePreview.vue — pure HTML sheet; src/App.vue — grid h-screen two panels. nuxt/ui composables (useToast) are auto-imported; src/composables/useRemoveNotify.ts shows the existing toast pattern. Tests: vitest + VTU (real nuxt/ui components in jsdom, no stubs except local components), e2e Playwright chromium (3 tests, data-testid usage).
6. NOTE: pi-lens reformatted resume-utils.ts / ResumePreview.vue / e2e/vue.spec.ts / docs/plan file — formatting only, read fresh.

SCOPE: JSON ONLY. PDF export and print-CSS are explicitly OUT of scope (future workstream). Plan how "Export JSON" and "Import JSON" will be delivered now.

The plan MUST decide and specify:
1. UI placement: where the Import/Export buttons live (README says right/preview panel). Decide: inside ResumePreview (breaking its pure-HTML property) vs a separate toolbar component (e.g. src/components/resume-preview/ImportExportBar.vue) above the sheet, or in App.vue. Recommend one; justify with the jsdom-testability + future print-CSS constraints.
2. Export JSON UX: file download mechanics (Blob + URL.createObjectURL + anchor click, cleanup with revokeObjectURL), filename convention (e.g. resume-<slugified-name>.json vs resume.json — decide), success feedback (toast? which copy), no-content edge case (allow exporting an empty resume? decide).
3. Import JSON UX: how the file picker works (hidden <input type="file" accept="application/json,.json"> + UButton trigger, or UInput type=file), reading (FileReader.text()), calling store.importJson, error feedback per failure mode (invalid JSON / unsupported version / invalid structure — map to distinct toasts or one generic + detail), success feedback, same-file-reimport (reset input value so choosing the same file again re-triggers change), file-size guard (decide limit, e.g. 1MB).
4. Component/file structure: exact files to create/modify (paths), props/emits if any, how useToast is used (following useRemoveNotify pattern), testid conventions.
5. Test plan: unit tests (what to mock — URL.createObjectURL/revokeObjectURL, FileReader vs input change; how to simulate file selection in jsdom; assert store state after import, error toasts for bad payloads, filename formatting) and e2e additions (Playwright setInputFiles + expectDownload for export; import flow). Which existing tests must stay green.
6. Implementation order for the worker (concrete steps, including running bun run test:unit / type-check / lint / playwright chromium).
7. Risks/gotchas: jsdom FileReader/Blob quirks, Vue rc + nuxt/ui v4 button/input behavior, toast timing in tests, input value reset.

Deliver the plan as plain text, decisive (no open questions; pick options). Keep under ~250 lines. Do NOT modify files — plan only.

## Acceptance Contract
Acceptance level: attested
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Return concrete findings with file paths and severity when applicable

Required evidence: review-findings, residual-risks

Finish with a fenced JSON block tagged `acceptance-report` in this shape:
Use empty arrays when no items apply; array fields contain strings unless object entries are shown.
`criteriaSatisfied[].status` must be exactly one of: satisfied, not-satisfied, not-applicable.
`commandsRun[].result` must be exactly one of: passed, failed, not-run.
`manualNotes` and `notes` are optional strings; an empty string means no note and does not satisfy `manual-notes` evidence.
```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "specific proof"
    }
  ],
  "changedFiles": [
    "src/file.ts"
  ],
  "testsAddedOrUpdated": [
    "test/file.test.ts"
  ],
  "commandsRun": [
    {
      "command": "command",
      "result": "passed",
      "summary": "short result"
    }
  ],
  "validationOutput": [
    "validation output or concise summary"
  ],
  "residualRisks": [
    "none"
  ],
  "noStagedFiles": true,
  "diffSummary": "short description of the diff",
  "reviewFindings": [
    "blocker: file.ts:12 - issue found, or no blockers"
  ],
  "manualNotes": "anything else the parent should know"
}
```