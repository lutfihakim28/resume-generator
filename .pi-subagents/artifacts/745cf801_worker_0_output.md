Implemented JSON import/export per the oracle plan, fully verified.

**Changed files (4 modified, 4 new):**
- **new** `src/utils/download.ts` — `downloadTextFile` (Blob → objectURL → detached anchor click → revoke in `finally`)
- **new** `src/components/resume-preview/ImportExportBar.vue` — Export/Import buttons + hidden file input (`accept=".json,application/json"`), 1 MB size guard before FileReader, error-toast mapping 1:1 from store error strings, input reset on success AND error paths
- **mod** `src/components/resume-preview/ResumePreview.vue` — renders `<ImportExportBar class="mb-4 print:hidden" />` above the sheet; the sheet itself stays pure HTML
- **new** `src/__tests__/download.spec.ts` (3 tests) + **new** `src/__tests__/import-export-bar.spec.ts` (9 tests)
- **mod** `e2e/vue.spec.ts` — 3 new e2e: export download (filename + content), import fills form+preview, invalid-JSON error toast
- **mod** `tsconfig.node.json` — `e2e/**/*` added to include (e2e was previously outside every TS project; Node types now resolve)
- **mod** `docs/plan/form-section-review-and-plan.md` — Part 5 implementation record

**Validation:** unit **41/41** (was 29) · `vue-tsc --build` clean (now incl. e2e project) · oxlint+eslint clean · e2e chromium **6/6** (was 3)

**Deviation from plan:** none material — only required additions: tsconfig change for e2e Node types, triple-slash `node` reference (LSP inferred-project), typed `vi.fn` signatures (oxlint rule).

**Residual risks:** e2e chromium-only (firefox/webkit not installed, known); toast DOM asserted only in real-browser e2e (unit mocks `useToast`); PDF/print export remains the next workstream.