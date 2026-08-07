# Research: Client-Side PDF Library for resume-editor

## Summary

**Pick jsPDF (text-only API; never `doc.html()`)** as the export library. At roughly **95–100 KB gzip** it is 4–5× lighter than pdfmake, emits real selectable/ATS-safe text, and its imperative API gives full deterministic control over the fixed A4 template (wrapping, right-aligned dates, page breaks). pdfmake is the runner-up if the team prefers a declarative doc-definition and accepts ~430–470 KB gzip. html2canvas-based tools (html2pdf.js, vue-html2pdf, jsPDF's `html()` plugin) are **disqualified** by the ATS constraint in `docs/research/software-developer-template.md` §5. The zero-cost incumbent `window.print()` remains viable at 0 KB if the print-dialog UX is acceptable — adopt jsPDF when one-click `.pdf` download and cross-browser pagination determinism become requirements (they are the product goal per README).

## Provenance — read this first

This run had **NO web tools** (no web_search/web_fetch) and no shell access. All sizes, versions, and license facts below are **from model knowledge, unverified this run** and flagged `[MEM]`. Re-verify with the §4 checklist before committing. Context actually read from disk: `README.md`, `docs/plan/form-section-review-and-plan.md` (Parts 1–5), `docs/research/software-developer-template.md` (§1–6), `package.json`, `src/components/resume-preview/ResumePreview.vue`.

## 1. Comparison table

| Library                        | Min / gzip approx `[MEM]`                                                        | Text-preserving         | Layout model                                                                              | Vue/Vite fit                                  | Maintenance / license                                    | Verdict for THIS project                                         |
| ------------------------------ | -------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| **jsPDF** (text-only)          | ~330 KB / **~98 KB**; `jspdf-autotable` +~18 KB optional                         | ✅ real text            | Imperative low-level; `splitTextToSize()` wraps; you own y-cursor + pagination            | ESM + official TS types; framework-agnostic   | Active; MIT                                              | ✅ **WINNER**                                                    |
| **pdfmake** 0.2.x/0.3.x        | ~1.9 MB / ~430–470 KB (embeds Roboto; no standard-14 option)                     | ✅ real text            | Declarative JSON doc-definition; `pageBreak: 'before'/'avoid'`, column tables             | ESM (0.3.x modular), Vite OK; bundled typings | Active; MIT                                              | Runner-up — best layout ergonomics, fails criterion 1            |
| **pdf-lib**                    | ~350 KB / **~90 KB**; zero deps (+~100 KB fontkit only if embedding custom TTFs) | ✅ real text            | Low-level primitives; **no wrap helper** — hand-roll text measuring/wrapping              | TS-first; Vite OK                             | Maintained, slow cadence (1.17.1, Nov 2021) `[MEM]`; MIT | Close 2nd on size; most layout effort/risk                       |
| **html2pdf.js**                | html2canvas+jsPDF ≈ 200 KB gzip `[MEM]`                                          | ❌ rasterizes           | n/a                                                                                       | n/a                                           | Active; MIT                                              | ❌ DISQUALIFIED (template §5)                                    |
| **vue-html2pdf**               | html2canvas wrapper                                                              | ❌ rasterizes           | n/a                                                                                       | Vue wrapper                                   | Low activity                                             | ❌ DISQUALIFIED                                                  |
| **print-js**                   | ~28 KB / ~8 KB `[MEM]`                                                           | ✅ via browser print    | window.print() sugar; no pagination control beyond CSS                                    | n/a                                           | Low activity (1.6.x) `[MEM]`; MIT                        | Redundant — current approach already is print-CSS                |
| **paged.js**                   | ~380 KB / ~120 KB `[MEM, less certain]`                                          | ✅                      | CSS Paged Media polyfill; keeps HTML as layout source; still ends in browser print dialog | Vite OK                                       | Active; MIT                                              | Complement, not a replacement                                    |
| **window.print()** (incumbent) | **0 KB**                                                                         | ✅ Chromium Save-as-PDF | CSS break rules; browser-dependent; filename from page title                              | built-in                                      | n/a                                                      | Keep only if dialog + no filename/metadata control is acceptable |

## 2. Recommendation

**jsPDF, text-only API** (`import { jsPDF } from 'jspdf'`). Rationale against the ranked criteria:

1. **Lightweight (user priority)** — ~98 KB gzip core vs ~430–470 KB for pdfmake; only pdf-lib is smaller (~90 KB) but it lacks a text-wrap helper, so jsPDF is the smallest option that keeps layout effort sane.
2. **Text-preserving / ATS** — `doc.text()` draws real text; selectable/searchable; satisfies template §5. **Never use `doc.html()`** — that path rasterizes via html2canvas and is disqualified. Verification hook: extract text from the exported PDF in e2e (pdfjs-dist) and assert the name/section headings are present.
3. **Client-side only** — pure browser, no server/Puppeteer. For a 1–2 page doc, synchronous main-thread generation (<~50 ms) is fine; no worker needed.
4. **Deterministic A4 layout** — fixed geometry maps 1:1 to template §3: A4 210×297 mm, 14 mm margins → content width ≈ 182 mm ≈ 516 pt, content height ≈ 269 mm ≈ 762 pt. A single layout pass with `splitTextToSize()` for wrapping, `getTextWidth()` for right-aligned dates (`Mar 2022 – Present`), manual overflow check → `doc.addPage()`, keep heading + first line together, hard cap 2 pages. Identical output across browsers (rendering happens in the lib, not the engine) — more deterministic than print-CSS.
5. **Maintenance/Vite/TS** — actively maintained, MIT, official TypeScript types, clean ESM for Vite 8; no SSR concerns.

**Fonts:** default Helvetica (PDF standard-14, WinAnsi encoding) covers EN + ID (Latin script) including `· – —`; no embedding → lightest possible, Arial ≈ Helvetica metrics preserve preview parity. Embed a subset TTF (e.g., Inter) only if visual parity with the preview font becomes a requirement — that adds bytes and fontkit-style loading.

**Structure:** keep the preview untouched (`ResumePreview.vue` stays pure HTML for jsdom tests). Add a new module, e.g. `src/utils/pdf-export.ts`, consuming `useResumeStore` + the template §3 spec directly (same computed strings/helpers as the preview, not duplicating layout HTML). Unit-test coordinate/page-break decisions; e2e-test the downloaded `.pdf` (name `resume-<lang>.pdf`, text extraction).

**Runner-up:** pdfmake — the declarative doc-definition (`pageBreak: 'avoid'`, table columns for date alignment) is the least code, and it is the canonical resume-generator lib; but ~340 KB extra gzip violates the ranked #1 criterion. Revisit only if the imperative layout module grows past ~300 lines.

**When to keep `window.print()` instead:** if a print-dialog UX is acceptable, print-CSS stays 0 KB and ATS-safe in Chromium. Adopt jsPDF when the product requires: one-click `.pdf` download, controlled filename/metadata, pagination independent of browser print settings, and font consistency across devices. Export-PDF is the stated product goal (README), and the plan (Part 2, Decision 1) explicitly deferred this choice — so adopt jsPDF at the export workstream.

## 3. Bundle-size evidence `[MEM — unverified]`

- jsPDF 2.5.x: ~330 KB min, **~95–100 KB gzip** (bundlephobia); runtime deps (dompurify, fflate, core-js, canvg) exist but tree-shake down for text-only usage; verify on 3.x.
- pdfmake: ~1.9–2.1 MB min, **~430–470 KB gzip** including embedded Roboto fonts; 0.3.x modular ESM tree-shaking reduces this but it stays the heaviest.
- pdf-lib 1.17.1: ~341–350 KB min, **~90–92 KB gzip**, zero dependencies.
- html2canvas 1.4.1: ~291 KB min, ~96 KB gzip (disqualified anyway).
- print-js 1.6.x: ~28 KB min, ~8 KB gzip.
- paged.js: ~380 KB min, ~120 KB gzip (least certain figure).

## 4. Verification checklist (run before committing — I could not run these)

```bash
# Sizes + latest versions (exact, authoritative)
npm view jspdf version dist.unpackedSize dependencies license
npm view jspdf-autotable version dist.unpackedSize
npm view pdfmake version dist.unpackedSize
npm view pdf-lib version dist.unpackedSize license
npm view html2pdf.js version
# gzip figures
curl -s https://bundlephobia.com/api/size?package=jspdf
curl -s https://bundlephobia.com/api/size?package=pdfmake
curl -s https://bundlephobia.com/api/size?package=pdf-lib
# ATS smoke test after integration (e2e)
# - Playwright: click export -> resume-en.pdf downloads with correct filename
# - pdfjs-dist in Node: extractText() contains name + "Professional Summary" + "·"
# - Confirm "Select all" in a PDF viewer selects real text (manual)
```

Also verify: jsPDF latest major (2.5.x vs 3.x) ESM entry works with Vite 8 + Vue rc; pdfmake 0.3.x stable status if it becomes a candidate; whether the team's target ATS (Jobstreet/Glints/LinkedIn) extracts jsPDF standard-font text (should, but one manual upload test is cheap).

## 5. Findings with file paths and severity

1. **HIGH — ATS constraint is a hard gate.** `docs/research/software-developer-template.md` §5: single column, real text only, no text-in-images. This disqualifies html2pdf.js, vue-html2pdf, and jsPDF's `html()` plugin before any other criterion.
2. **MEDIUM — Decision point is documented.** `docs/plan/form-section-review-and-plan.md` Part 2, Decision 1: print-CSS chosen with explicit "revisit if a text-preserving lib (pdfmake) is needed later". This research resolves that revisit → jsPDF, with the trigger conditions in §2.
3. **MEDIUM — Current print support is minimal.** `src/components/resume-preview/ResumePreview.vue` renders a single unpaginated A4-width sheet; print CSS so far is only `print:hidden` on `ImportExportBar.vue`. No `@media print` break rules exist → today's print output has uncontrolled pagination. jsPDF removes this risk entirely.
4. **LOW — Layout duplication risk.** The template spec (§3) is the single source of truth; the preview already computes `roleLine`/`educationLine`/`dateRange` in `ResumePreview.vue`. The PDF builder must reuse the same spec + store (`src/types/resume.ts`, `src/composables/useResumeStore.ts`) rather than re-deriving rules, or preview and PDF will drift.
5. **LOW — Bundle impact is small relative to the app.** `package.json` deps are `@nuxt/ui` + Tailwind + Vue; adding ~98 KB gzip jsPDF is a minor delta next to @nuxt/ui, and 5× smaller than pdfmake would be.

## Sources

- Kept (authoritative references to verify in §4): parallax/jsPDF GitHub + npm/bundlephobia (`https://github.com/parallax/jsPDF`, `https://bundlephobia.com/package/jspdf`); pdfmake GitHub (`https://github.com/bpampuch/pdfmake`); pdf-lib GitHub (`https://github.com/Hopding/pdf-lib`); paged.js (`https://pagedjs.org`). All unverified this run.
- Dropped: html2pdf.js and vue-html2pdf (rasterize → fail §5); print-js (redundant with the incumbent print-CSS); jsPDF `html()` plugin (raster trap); @react-pdf/renderer (React-only, wrong stack); pdfjs-dist (viewer, not generator).

## Gaps

- Exact gzip numbers and latest versions are unverified (no web tools this run); §4 commands must be run.
- jsPDF 3.x maintenance cadence and ESM tree-shaking behavior unverified.
- Visual parity of standard-14 Helvetica vs the preview's font stack is assumed acceptable (template §3.1 lists Arial/Calibri/Inter — Helvetica metrics ≈ Arial); confirm by eyeball on one export.

## Acceptance report

```acceptance-report
{
  "criteriaSatisfied": [
    {
      "id": "criterion-1",
      "status": "satisfied",
      "evidence": "Concrete findings with file paths and severity in brief §5 (e.g., HIGH: docs/research/software-developer-template.md §5 ATS gate disqualifies rasterizers; MEDIUM: docs/plan/form-section-review-and-plan.md Part 2 Decision 1 is the resolved decision point; MEDIUM: src/components/resume-preview/ResumePreview.vue has no pagination/print-break rules; LOW: layout-drift risk between ResumePreview.vue and the proposed src/utils/pdf-export.ts). Recommendation: jsPDF text-only API (~98 KB gzip, [MEM] estimate) with pdfmake runner-up and explicit disqualification rationale."
    }
  ],
  "changedFiles": [
    ".pi-subagents/artifacts/outputs/e0c02202/research.md"
  ],
  "testsAddedOrUpdated": [],
  "commandsRun": [
    {
      "command": "npm view jspdf version dist.unpackedSize (et al. — §4 checklist)",
      "result": "not-run",
      "summary": "No web or shell tools available this run; sizes are model-knowledge estimates flagged [MEM] and must be verified before committing"
    }
  ],
  "validationOutput": [
    "Read and grounded in: README.md, docs/plan/form-section-review-and-plan.md (Parts 1-5), docs/research/software-developer-template.md, package.json, src/components/resume-preview/ResumePreview.vue"
  ],
  "residualRisks": [
    "All bundle sizes/versions unverified (no web tools this run) — run §4 checklist first",
    "jsPDF 3.x ESM behavior with Vite 8 unverified",
    "Helvetica (standard-14) vs preview font visual parity assumed acceptable; needs one eyeball check",
    "No files modified besides the required artifact — implementation is a separate workstream"
  ],
  "noStagedFiles": true,
  "diffSummary": "Research artifact only: comparative evaluation of 8 PDF approaches, recommendation (jsPDF text-only), memory-flagged size evidence, verification checklist, findings with paths/severity",
  "reviewFindings": [
    "no blockers — recommendation jsPDF text-only API; blocker-level constraint documented: never use doc.html()/html2canvas paths (template §5)"
  ],
  "manualNotes": "Tooling note for parent: this runtime had no web_search/web_fetch/shell; the brief flags [MEM] on every estimate and ships an exact verification command list (§4) — run it before the export workstream commits."
}
```
