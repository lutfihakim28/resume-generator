# Task for researcher

RESEARCH: choose the best client-side PDF library for the resume-editor project at /home/capsvelte/Projects/resume-editor.

CONTEXT — read these first:
- README.md (client-only webapp; exports resume PDF as the product goal; EN or ID language chosen at export time).
- docs/research/software-developer-template.md §5 ATS checklist — CRITICAL constraint: PDF must keep TEXT selectable/searchable (no rasterization), single column, real text only.
- docs/plan/form-section-review-and-plan.md Parts 2+5: earlier decision was print-CSS/window.print() with a note "revisit if a text-preserving lib (pdfmake) is needed later". The live preview (ResumePreview.vue) renders the exact template layout in HTML; the form state (src/types/resume.ts) is the source of truth. JSON import/export already done.
- Stack: Vue 3 rc, Vite 8, @nuxt/ui v4, TypeScript, Tailwind 4, bun as package manager. No SSR — pure browser app.

EVALUATION CRITERIA (ranked):
1. LIGHTWEIGHT (user priority): bundle size (min+gzip), dependency footprint, no heavy transitive deps.
2. Text-preserving output (selectable text, ATS-safe) — rasterizing HTML (html2canvas-style) is DISQUALIFIED unless no alternative.
3. Client-side only, no server/Puppeteer.
4. Deterministic layout of a fixed A4 resume template (sections, wrapping, page breaks) — the app already knows the exact layout (template spec §3).
5. Maintenance status, license, Vue/Vite compatibility (SSR not needed; worker threads OK), TypeScript types.

CANDIDATES to evaluate (add others you know): pdfmake, jsPDF (text-only API, no html2canvas), pdf-lib, html2pdf.js, print-js, vue-html2pdf, others.

IMPORTANT — TOOL LIMITATION (from a previous run): your runtime may have NO web tools (web_search/web_fetch absent). If that happens, DO NOT block asking for a decision — PROCEED from model knowledge immediately and clearly flag in the brief: "sources from model knowledge, unverified this run" + include exact verification queries (e.g. npm size checks, "npm view <pkg> dist.unpackedSize", bundlephobia URLs) at the end. Keep the brief concise and decisive.

DELIVER a research brief (plain text, under ~200 lines):
1. Comparison table: lib | min+gzip approx size | text-preserving? | layout model (declarative/imperative/low-level) | Vue/Vite fit | maintenance/license | verdict for THIS project.
2. Clear RECOMMENDATION with rationale against the ranked criteria — the winner must be the best lightweight+text-preserving+low-effort fit for a deterministic A4 template.
3. Bundle-size evidence or best-known estimates (flag if from memory).
4. Verification checklist (commands/queries) to confirm sizes/latest versions.
5. Do NOT modify files.

---
**Output:**
Write your findings to exactly this path: /home/capsvelte/Projects/resume-editor/.pi-subagents/artifacts/outputs/e0c02202/research.md
This path is authoritative for this run.
Ignore any other output filename or output path mentioned elsewhere, including output destinations in the base agent prompt, system prompt, or task instructions.

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