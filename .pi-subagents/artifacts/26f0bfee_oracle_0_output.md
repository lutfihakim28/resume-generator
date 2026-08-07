I have all the context I need. Here is the plan.

# Plan: JSON Import/Export — resume-editor (preview panel)

**Inherited context honored:** README spec (preview panel "also contain import and export buttons"; import fills the form; export json as data-for-editing), Part 2 decisions (JSON always contains both languages, no language choice; import = lenient warn-and-fill, version 1, unknown keys dropped), Part 4 (live preview landed; sheet is pure HTML; nuxt/ui composables auto-imported, `useRemoveNotify` shows the explicit-import toast pattern). **Store already provides the pure logic** — `importJson(raw): ImportResult {ok, errors[]}` (distinct messages per failure mode) and `exportJson(): string`. This plan adds only file I/O + UI + tests.

## 1. UI placement — DECISION: `ImportExportBar.vue` rendered inside `ResumePreview.vue` root, above the sheet

- New component `src/components/resume-preview/ImportExportBar.vue`; `ResumePreview.vue` renders `<ImportExportBar class="mb-4 print:hidden" />` between the panel root and the sheet div.
- Rationale: README says the *preview panel* holds the buttons; `App.vue` stays a dumb two-column grid (unchanged); the toolbar is testable by mounting `ResumePreview` or the bar alone; `print:hidden` keeps it out of the future print output. The **sheet itself** (`[data-testid="preview-sheet"]`) remains pure HTML — the bar is the only nuxt/ui surface and sits outside the printable area.
- Bar contents: `UButton` "Export JSON" (`data-testid="btn-export-json"`), `UButton` "Import JSON" (`data-testid="btn-import-json"`) → triggers hidden native `<input type="file" accept=".json,application/json" data-testid="import-input" class="hidden">`. No props/emits — talks to the store directly (project-wide convention).

## 2. Export JSON UX

- **Mechanics — new util `src/utils/download.ts`:** `downloadTextFile(filename: string, content: string, mime: string): void` → `new Blob([content], { type: mime })` → `URL.createObjectURL` → detached `<a download>` → `.click()` → `URL.revokeObjectURL(url)` immediately (standard; download starts synchronously). Extract to a util so export is unit-testable without DOM-hacking (anchor never enters the document).
- **Filename:** `resume-<slug>.json`, slug = name lowercased, non-`[a-z0-9]` runs → `-`, trim dashes, truncate 40 chars; empty/blank name → `resume.json`. "Budi Santoso" → `resume-budi-santoso.json`.
- **Success feedback:** one toast — `{ title: 'Resume exported as JSON', color: 'success' }`.
- **Empty resume:** export is ALLOWED with no gate (JSON is the app's own format; a blank `resume.json` is structurally valid version-1 and re-imports cleanly; blocking adds a validation dependency with no product value).
- **Language:** no language UI — state is language-complete; JSON contains EN+ID (Part 2 decision 2).

## 3. Import JSON UX

- **Picker:** hidden native input + `UButton` calling `fileInput.click()` (avoids UInput-file styling; trivially testable in jsdom).
- **Flow:** `change` → take `files[0]` → **size guard first** (`> 1_000_000` bytes → error toast, no read) → `FileReader.readAsText(file)` → `onload`: `store.importJson(text)` → success toast or mapped error toast → finally `input.value = ''` (same-file re-pick fires `change` again). `onerror` → generic read-failure toast.
- **Error mapping** (store already returns distinct messages in `errors[0]`; UI maps 1:1 to one toast, not three):
  | Store error | Toast title (`color: 'error'`) |
  |---|---|
  | `Invalid JSON` | `Import failed: file is not valid JSON.` |
  | `Unsupported resume.json version` | `Import failed: unsupported resume.json version.` |
  | `Invalid resume.json structure` | `Import failed: file is not a resume.json.` |
  | (size guard, before store) | `Import failed: file is larger than 1 MB.` |
  | (FileReader error) | `Import failed: could not read the file.` |
  | (unknown fallback) | `Import failed.` |
- **Success:** `{ title: 'Resume imported — ready to edit.', color: 'success' }`. Form + preview update automatically (reactive store); no extra work.

## 4. Files — exact structure

| Action | Path | Content |
|---|---|---|
| **new** | `src/utils/download.ts` | `downloadTextFile` (Blob/URL/anchor/revoke) |
| **new** | `src/components/resume-preview/ImportExportBar.vue` | buttons + hidden input + FileReader + toasts; local `slugify` (≤10 lines, kept local — UI filename concern, not resume-domain) |
| **modify** | `src/components/resume-preview/ResumePreview.vue` | import + render `<ImportExportBar class="mb-4 print:hidden" />` above sheet; update the "pure HTML" doc comment to say *the sheet* stays pure |
| **new** | `src/__tests__/download.spec.ts` | util tests |
| **new** | `src/__tests__/import-export-bar.spec.ts` | component tests |
| **modify** | `e2e/vue.spec.ts` | +3 e2e tests |
| **modify** | `docs/plan/form-section-review-and-plan.md` | Part 5 (implementation record, consistent with doc pattern) |

`App.vue`, store, types, form components, existing tests: **unchanged** (verify green). `useToast` imported explicitly from `'@nuxt/ui/composables'` exactly like `useRemoveNotify.ts`.

## 5. Test plan

**`download.spec.ts`** (vi.spyOn `URL.createObjectURL`/`revokeObjectURL` + `HTMLAnchorElement.prototype.click`; jsdom lacks createObjectURL → must stub): blob content + mime correct; anchor `download`/`href` set; click called; revoke called with same URL; revoke still runs if click throws (try/finally).

**`import-export-bar.spec.ts`** — mock toast deterministically: `vi.mock('@nuxt/ui/composables', () => ({ useToast: () => ({ add: addSpy }) }))` (this test file imports only the bar + download, so the full-module mock is safe). Mount the bar standalone with `vi.mock('@/utils/download')` (export spy) for export cases, real util otherwise.
1. renders both buttons + hidden file input.
2. export → `downloadTextFile` called with `resume-budi-santoso.json` and JSON whose parse yields `version: 1` + name; toast success.
3. export with empty name → `resume.json`.
4. import success: `Object.defineProperty(input.element, 'files', { value: [new File([json], 'r.json', { type: 'application/json' })] })` → `await input.trigger('change')` → store filled (name + a section), success toast, `input.element.value === ''`.
5. import invalid JSON → store unchanged, error toast.
6. import version 2 → store unchanged, "unsupported" toast.
7. import invalid structure → store unchanged, "not a resume.json" toast.
8. import 2 MB file (size guard) → store unchanged, too-large toast.
9. same-file re-import: two consecutive changes with identical file both fire (input reset).
- File input mock technique: jsdom won't accept direct `files` assignment; `Object.defineProperty` + `trigger('change')` is the standard VTU approach. `File`/`FileReader` exist in vitest jsdom + Node ≥20.
- Toast DOM assertion is deliberately avoided (toast rendering needs the UApp provider; provider-less DOM is flaky) — hence the `useToast` mock.
- **Stay green:** resume-store (7), resume-form (8), resume-preview (11 — toolbar is additive; `text()`-contains and heading assertions unaffected), App.spec (1).

**e2e (`vue.spec.ts`, chromium):**
1. *exports JSON*: fill name → click Export → `const dl = await page.waitForEvent('download')` → `dl.suggestedFilename() === 'resume-budi-santoso.json'` → read content via `dl.path()` and assert name inside.
2. *imports JSON*: `page.setInputFiles('[data-testid="import-input"]', { name: 'resume.json', mimeType: 'application/json', buffer: Buffer.from(validResume) })` → preview header shows imported name; form input shows it too.
3. *invalid JSON error*: setInputFiles with `buffer: Buffer.from('not json')` → error toast visible (`page.getByText('Import failed', { exact: false })` — real browser renders toasts via UApp) and preview stays in empty state.

## 6. Worker implementation order

1. `src/utils/download.ts` → 2. `ImportExportBar.vue` → 3. wire into `ResumePreview.vue` → 4. `download.spec.ts` + `import-export-bar.spec.ts` → 5. e2e additions → 6. `bun run test:unit` → `bun run type-check` → `bun run lint` → `bunx playwright test --project=chromium` → 7. docs Part 5 → 8. re-read any pi-lens-autofixed files before further edits.

## 7. Risks / gotchas

- jsdom has no `URL.createObjectURL` → unit tests must stub it (vitest spy), else export tests throw.
- `input.files` is read-only in jsdom → `Object.defineProperty` before triggering `change`; don't try `setValue`.
- Toast assertions in jsdom require either UApp provider (real DOM, flaky timing) or mocking `useToast` — chosen: mock (deterministic, isolated to the bar's spec file).
- nuxt/ui v4 `UButton` without `to` renders a plain `<button>` (no ULink route warnings) — do NOT add `to` props.
- e2e downloads: `acceptDownloads` is default-true in Playwright ≥1.14; if the download event is flaky, add `acceptDownloads: true` to the chromium project's `use` block (config change only if needed).
- Firefox/webkit e2e projects will fail locally (browsers not installed) — known, chromium-only verification as before.
- `input.value = ''` reset must happen on BOTH success and error paths, else same-file re-import silently no-ops.
- Size guard must run before `FileReader` (memory).
- pi-lens reformatted files on prior turns — read fresh after any autofix.

## Acceptance

criterion-1 evidence: plan grounded in live reads of the store (`importJson`/`exportJson` confirmed at useResumeStore.ts:33/54), `ImportResult` error strings, Part 2 decisions, toast pattern (`useRemoveNotify.ts`), e2e conventions (`playwright.config.ts` chromium-only, data-testid), and the pure-HTML sheet constraint in `ResumePreview.vue`; all file paths above are exact project paths.