# Task for oracle

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, not a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below and return a focused result for that task using your tools.

Task:
PLAN the PDF EXPORT implementation for /home/capsvelte/Projects/resume-editor.

CONTEXT — read these files first:
- /home/capsvelte/Projects/resume-editor/.pi-subagents/artifacts/outputs/e0c02202/research.md (researcher brief: pick = jsPDF text-only API, ~98KB gzip; layout geometry: A4 210×297mm, 14mm margins → 516pt content width, 762pt height; Helvetica standard-14 fonts; e2e text-extraction via pdfjs-dist suggested)
- README.md (export PDF is the product goal; EN or ID chosen at export time)
- docs/research/software-developer-template.md (template spec §3 layout tokens + §5 ATS rules)
- docs/plan/form-section-review-and-plan.md Parts 2, 4, 5 (prior decisions; live preview; JSON import/export done; ImportExportBar.vue holds the export buttons)
- src/types/resume.ts, src/composables/useResumeStore.ts (activeLang, exportJson), src/components/resume-preview/ResumePreview.vue + PreviewSection.vue (HTML layout to mirror), src/components/resume-preview/ImportExportBar.vue (where Export PDF button goes), src/utils/download.ts, src/utils/resume-utils.ts (pickLang/formatMonthYear/presentLabel), src/utils/validation.ts
- Existing tests (41 unit: resume-store/resume-form/resume-preview/import-export-bar/download; 6 e2e chromium). bun package manager. pi-lens reformatted some files — read fresh.

PLAN MUST DECIDE (decisive, no open questions, under ~300 lines):
1. Library + version + install (bun add jspdf@<ver> or latest — decide). License note. Explicitly note: NEVER doc.html() (rasterizes).
2. Architecture: pure TS module src/utils/pdf-export.ts (buildPdf(resume, lang) → Uint8Array/blob) separate from UI; which helpers it reuses (resume-utils, or its own copy of headline-string builders — decide; avoid duplicating layout logic in HTML preview, but keep the module UI-free and jsdom-safe).
3. UI: Export PDF button in ImportExportBar (data-testid), export-time language selection (README requires EN or ID chosen at export time — decide the UX: segmented control in the bar vs export-activeLang vs dialog; pick one and justify), toast copy for success/error, filename (e.g. resume-<slug>-en.pdf — decide), loading state if generation is async (it is sync for 1-2 pages — decide if a loading state is still warranted).
4. Layout mapping: every section from template §3 → jsPDF calls (header name 19pt bold / title 11.5pt accent / contact+links 10pt secondary; section heading 12pt bold + 1pt accent rule; body 10.5pt leading 1.35 → 14.2pt line height; A4, 14mm margins; right-aligned dates; bullets; skills groups; projects; education position option; certifications; languages; photo: decide now or defer — justify; accent #1E5AA8 → jsPDF RGB). Page-break strategy: keep heading+first line together, avoid splitting an entry mid-bullet, 2-page hard cap (template §3.1) — overflow policy: truncate or allow 2nd page (decide).
5. Empty/incomplete resume: export allowed or blocked (align with JSON export decision — allowed) — toast copy.
6. Tests: unit strategy for pdf-export (assert page count / text presence — practical approach without pdfjs in jsdom: stub jsPDF? or use pdfjs-dist in vitest node? decide; keep tests fast and non-flaky; filename + language variant tests) and e2e (click Export PDF → expectDownload; pdfjs-dist text extraction in Playwright to assert selectable text contains name/sections — decide whether pdfjs-dist is added as devDependency for e2e, size/scope). Keep existing 41 unit + 6 e2e green.
7. Implementation steps for worker (ordered; bun add; paths; verification commands).
8. Risks/gotchas: jsPDF + Vite 8 ESM, dompurify/canvg side effects, jsdom missing canvas (unit tests must not touch doc.html()), PDF metadata (title/author — nice touch, decide), EN/ID month labels.

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