# Form Section — Review & Delivery Plan

> Chain: reviewer (README review) → oracle (delivery plan) → worker (implementation).
> Status: implemented and verified (unit 18/18, type-check, lint, e2e chromium all green).
> Date: 2026-08-07

---

## Part 1 — Reviewer findings (README as spec)

All inspection complete. Here is the review.

## Review

### 1. README as a spec — verdict

**Correct/good:**

- Clear feature inventory: one-page UI, two panels (left form + navigation, right preview + import/export), import-json-to-fill, export pdf+json, EN/ID dual language (README.md:8–26).
- Explicitly defers the field set ("will be provided later", README.md:15) — and that gap is now resolved by `docs/research/software-developer-template.md`, so the deferred decision exists as an artifact.

**Ambiguities (need oracle resolution):**

- **Export mechanics unspecified** (README.md:19–21): "the export will include the `resume.json`" — is export one PDF, two downloads, or an archive? Is language chosen at export time (one PDF in EN _or_ ID) or exported for both?
- **Dual-language input UX unspecified** (README.md:23–24): "User need fill both form" — side-by-side EN/ID fields, per-language toggle, or per-section switch? Is ID content required or best-effort?
- **Navigation mechanism unspecified** (README.md:12): tabs, accordion, or anchor menu for "jump into specific information"?
- **Import contract unspecified**: schema/version of `resume.json`, behavior on invalid/missing data (reject vs. warn-and-fill).

**Gaps/contradictions:**

- README doesn't reference the template doc that defines the fields; the spec is split across two files and the template doc's `preset config sketch` (§3.6) implies a _template system_, while README says "opiniated preset" (singular) — scope ambiguity on single-preset vs. multi-preset.
- No mention of the template's photo toggle / `educationPosition` options (template §2.3, §3.6) — must the v1 form expose them?
- Trivial: "opiniated" typo (README.md:4).

### 2. What "the form section" must deliver (per `dev-hybrid-id-no-photo` template)

From `docs/research/software-developer-template.md` §3.3–3.5, the form must collect:

- **Header**: full name; role title + top-3 stack keywords; phone, email, city; GitHub/LinkedIn/portfolio links (individually optional). (→ template §3.5 Header; sample §4.1 lines 1–4)
- **Professional Summary**: 2–3 lines. (→ §3.5 Summary)
- **Core Skills**: up to 4 groups, each group label + comma-separated skills (ATS-parseable, no skill bars). (→ §3.5 Core Skills)
- **Work Experience** (repeatable, reverse-chronological): role title, company, city, start/end `MM/YYYY`, 3–5 bullets, per-role stack line. (→ §3.5 Work Experience)
- **Projects** (repeatable): name + URL, one-line description, stack tags, one impact bullet. (→ §3.5 Projects)
- **Education**: degree, major, university, city, year (GPA only fresh grads). (→ §3.5 Education)
- **Certifications** (optional, repeatable): name, issuer, year. (→ §3.5)
- **Languages** (optional): language + proficiency. (→ §3.5)
- **EN+ID dual input**: every user-authored text field needs both variants — headings come from the template's EN/ID map (§3.3), but all content (summary, bullets, skill group labels, project descriptions) is translated per the sample ske

---

## Part 2 — Oracle plan (how the form is delivered)

# Plan: Form Section Delivery — resume-editor (left panel)

**Inherited context honored:** reviewer output (7 open decisions), `docs/research/software-developer-template.md` ("dev-hybrid-id-no-photo" field set), README one-page/two-panel spec. Verified myself: `App.vue` stub, `App.spec.ts` (UApp+RouterView stubs), `vite.config.ts` (`@nuxt/ui/vite` plugin, `@` alias), `components.d.ts` (own components NOT auto-registered → explicit imports), nuxt/ui composables auto-imported (`useScrollspy`, `useToast`), no Pinia/no validation lib in `package.json`.

## 0. Decisions resolving the reviewer's 7 open questions

1. **Export mechanism → print-CSS.** `window.print()` + `@media print` stylesheet on the preview. Rationale: client-only app, no PDF lib installed; jsPDF/html2canvas rasterizes text and violates the template's ATS checklist (§5). PDF = browser "Save as PDF"; JSON = separate `.json` download. v1 only; revisit if a text-preserving lib (pdfmake) is needed later.
2. **Export language → chosen at export time.** PDF is EN _or_ ID (user picks); JSON always contains both languages (state is language-complete).
3. **Navigation UX → sticky anchor scrollspy sidebar.** One scrollable page (README "one page UI"), nav list jumps via `scrollIntoView({ behavior: 'smooth' })`, active highlight via nuxt/ui's auto-imported `useScrollspy`. No tabs/accordion.
4. **EN/ID input → global segmented toggle** (`USegmented` EN|ID at form top) + amber "ID incomplete" dot per nav item + non-blocking alert. Rationale: compact (side-by-side doubles width), and the dots answer "what's missing in the other language".
5. **ID requiredness → warn-only.** README "need fill both" is enforced as guidance, not a hard gate: ID-empty fields get a warning badge and a one-line alert; export never blocks on ID. EN-only hard-required: `name`.
6. **Template options in v1 → both included.** `showPhoto` (default off) and `educationPosition` (default `bottom`) as an "Options" section in the form — cheap, store-backed, feeds future preview preset.
7. **Preset scope → single fixed preset** (`dev-hybrid-id-no-photo`), no switcher. Matches README's "opiniated preset" (singular); the template doc's preset _system_ is future work.

## 1. Data model — `src/types/resume.ts` (new)

**Nesting rule (decisive):** free-text prose → `LangText { en, id }`; proper nouns/facts (name, company, city, dates, URLs, university, cert names, stack tags) → single string. Sample skeletons §4.1/§4.2 confirm degree/major differ by language → `LangText`.

```ts
export type Lang = 'en' | 'id'
export interface LangText { en: string; id: string }

export interface PersonalInfo {
  name: string; title: LangText; phone: string; email: string; city: string
  github: string; linkedin: string; portfolio: string
}
export interface SkillGroup { id: string; label: LangText; items: LangText }      // items = comma-separated, ATS-safe
export interface ExperienceEntry {
  id: string; role: LangText; company: string; city: string
  sta

---

## Part 3 — Implementation result (worker)

Summary: **Everything green.** Form section delivered per oracle plan:
- Data model: src/types/resume.ts (LangText dual-language nesting rule)
- State: src/composables/useResumeStore.ts (plain composable, no Pinia)
- 13 form components under src/components/resume-form/ + FormNav scrollspy navigation
- App.vue: two-panel layout — left ResumeFormPanel, right placeholder for preview/export (next workstream)
- EN/ID global segmented toggle + amber incomplete-language dots in nav
- Options section: showPhoto (default off), educationPosition (default bottom)
- Tests: src/__tests__/resume-store.spec.ts (8), resume-form.spec.ts (8), App.spec.ts updated, e2e vue.spec.ts updated
- Commands: test:unit 18/18 pass, vue-tsc --build clean, oxlint+eslint clean, playwright chromium 2/2 pass

Known residuals:
- Benign nuxt/ui Vue warnings: "injection Symbol(route location) not found" (ULink inside UButton in router-less app — cosmetic)
- E2E verified chromium-only (firefox/webkit not installed)
- mergeResume intentionally drops unknown JSON keys (lenient import)

---

## Part 4 — Follow-up: LIVE PREVIEW implemented (2026-08-07)

The placeholder right panel was replaced by a real-time preview per template §3:
- src/components/resume-preview/ResumePreview.vue — A4 sheet (210mm, 14mm padding), header (19pt name, 11.5pt accent title, contact · links lines), sections hidden when empty, dates formatted "Mar 2022 – Present/Sekarang", education position option honored (top for fresh grads), photo rendered only when showPhoto + photoUrl (28×36mm top-right)
- src/components/resume-preview/PreviewSection.vue — 12pt bold heading + 0.6pt accent rule
- src/types/resume.ts — added PersonalInfo.photoUrl (string, sanitized on import)
- src/utils/resume-utils.ts — pickLang, formatMonthYear (EN/ID month names), presentLabel
- src/components/resume-form/PersonalSection.vue — Photo URL input (visible when showPhoto on)
- src/App.vue — two-panel grid h-screen, both sides scroll independently
- Headings reuse FORM_SECTIONS from resume-form (single source of truth)
- Tests: src/__tests__/resume-preview.spec.ts (11 tests), e2e live-preview test added
- Verified: 29/29 unit, vue-tsc clean, lint clean, chromium e2e 3/3

Gotcha fixed during dev: Vue whitespace condensing produced double spaces between
interpolation + v-if template fragments → headline lines (roleLine/educationLine)
are computed strings joined programmatically, not multi-node template whitespace.
```

---

## Part 5 — Follow-up: JSON IMPORT/EXPORT implemented (2026-08-07)

JSON-only import/export (PDF/print export remains a later workstream), per the oracle plan (oracle → worker chain):

Decisions executed:

- UI: `ImportExportBar.vue` inside `ResumePreview.vue` root, above the sheet (`mb-4 print:hidden`); the sheet stays pure HTML
- Export: `downloadTextFile` util (Blob → objectURL → detached anchor click → revoke in finally); filename `resume-<slug>.json` (40-char slug, blank → `resume.json`); JSON always contains EN+ID (language-complete state); export allowed on empty resume (blank version-1 JSON is valid and re-imports)
- Import: hidden native file input (`.json,application/json`); 1 MB size guard BEFORE FileReader; error-toast mapping 1:1 from store error strings; input reset on BOTH success and error paths (same-file re-pick works)

Files:

- new `src/utils/download.ts` — downloadTextFile
- new `src/components/resume-preview/ImportExportBar.vue` — buttons + input + FileReader + toasts (useToast from '@nuxt/ui/composables')
- mod `src/components/resume-preview/ResumePreview.vue` — renders ImportExportBar above the sheet; doc comment updated (sheet stays pure HTML)
- new `src/__tests__/download.spec.ts` (3 tests — blob args, anchor attrs, revoke-on-throw)
- new `src/__tests__/import-export-bar.spec.ts` (9 tests — render, export filename/slug, empty-name fallback, import success + store fill + input reset, invalid JSON, unsupported version, invalid structure, 1 MB guard, same-file re-import)
- mod `e2e/vue.spec.ts` — +3 e2e: export download (filename + content), import fills form+preview, invalid JSON error toast + preview untouched
- mod `tsconfig.node.json` — added `e2e/**/*` to include (e2e files were previously outside every tsconfig project; node types now resolve; comments stripped to keep the file strict-JSON like the other tsconfigs)

Verified: 41/41 unit, vue-tsc --build clean (incl. e2e project), oxlint+eslint clean, chromium e2e 6/6.

Gotchas fixed during dev:

- `pickFile` test helper raced the async FileReader onload → wait for the toast call count instead (every path ends in a toast)
- oxlint `vitest/require-mock-type-parameters` → typed vi.fn signatures (which then required real tuple shapes for mock.calls assertions)
- playwright eslint rule prefers locator `.setInputFiles()` over `page.setInputFiles(selector, ...)`

---

## Part 6 — Follow-up: PDF EXPORT implemented (2026-08-07)

Chain: researcher (library search; brief at `.pi-subagents/artifacts/outputs/e0c02202/research.md`) → oracle (plan, this part's source) → worker. **Decision: jsPDF text-only API** — ~98 KB gzip core, real selectable/ATS-safe text, deterministic A4 layout. pdfmake runner-up (declarative but ~430–470 KB gzip) rejected on the lightweight criterion; html2canvas-based tools disqualified (rasterizes text, violates template §5). Deps: `jspdf@4.2.1` (runtime), `pdfjs-dist@6.2.108` (devDep — text extraction proof only, never shipped).

Implementation:

- new `src/utils/pdf-export.ts` — `buildPdf(resume, lang) → { data: Uint8Array<ArrayBuffer>, pages, truncated }`: A4/14 mm geometry in pt, Helvetica (standard-14, no embedding), template §3 colors/typography, section renderers with `splitTextToSize` wrapping, right-aligned dates, atomic entries (never split across pages), 2-page hard cap → `truncated`, PDF metadata (`setProperties`), `textWithLink` for project URLs (try/catch → plain text). NEVER `doc.html()` / `doc.save()`; photo DEFERRED (CORS/fetch complexity; no-photo preset has no hole)
- mod `src/utils/resume-utils.ts` — shared string builders moved here (single source of truth): `dateRange`, `roleLine`, `educationLine`, `languageLabel` (all `(entry, lang)`), `slugifyName`
- mod `src/components/resume-preview/ResumePreview.vue` — local copies deleted, imports shared builders (behavior identical — its 11 tests stayed green)
- mod `src/utils/download.ts` — `downloadBlobFile(filename, blob)` (detached anchor; blob carries its own type)
- mod `src/components/resume-preview/ImportExportBar.vue` — "Export PDF (EN|ID)" dynamic-label button (`btn-export-pdf`) before Export JSON; `resume-<slug>-<lang>.pdf` filename; toasts: success / truncated-warning / error (try/catch)
- new `src/__tests__/pdf-export.spec.ts` (node env, 5 tests) — real jsPDF + real pdfjs-dist legacy text extraction proves selectable text: EN content/headings/dates/stack, ID headings + Sekarang, educationPosition top ordering, 2-page truncation cap, empty resume
- mod `src/__tests__/import-export-bar.spec.ts` — +4 tests (label follows activeLang, download args + filenames per lang, truncated warning toast, throw → error toast)
- mod `e2e/vue.spec.ts` — +2 e2e: EN PDF download (filename, %PDF magic bytes, extracted text has name + heading), ID PDF (filename, Ringkasan Profil + ID summary text)

Verified: **49/49 unit** (was 41) · `vue-tsc --build` clean · oxlint+eslint clean · chromium e2e **8/8** (was 6) · `build-only` succeeds — jsPDF's html2canvas/dompurify/canvg are lazy `import()` chunks, only fetched if `doc.html()` is ever called (never in text-only export).

Gotchas fixed during dev:

- pdfjs-dist 6.x removed `PDFDocumentProxy.destroy()` → cleanup via `loadingTask.destroy()`; `isEvalSupported` option removed from types
- TS 5.7+ generic typed arrays: `Uint8Array<ArrayBufferLike>` not assignable to `BlobPart` → `PdfExportResult.data: Uint8Array<ArrayBuffer>`
- eslint no-unused-vars: `downloadBlobFile`'s `mime` param was redundant (Blob carries type) → dropped from signature

Residual risks: WinAnsi charset (CJK/emoji garble — accepted, template is EN/ID Latin); photo not in PDF v1 (deferred, documented in pdf-export.ts); e2e chromium-only (firefox/webkit not installed); one eyeball font-parity check preview vs PDF recommended (Helvetica ≈ Arial).
