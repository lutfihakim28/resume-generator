Research complete. Brief written to `/home/capsvelte/Projects/resume-editor/.pi-subagents/artifacts/outputs/e0c02202/research.md` (markdownlint auto-fix applied — table formatting only; content verified on re-read).

# Research: Client-Side PDF Library for resume-editor

## Summary
**Recommendation: jsPDF (text-only API, never `doc.html()`)** — ~98 KB gzip, real selectable/ATS-safe text, fully deterministic control over the fixed A4 template. pdfmake is the runner-up (declarative doc-definition but ~430–470 KB gzip, failing the #1 lightweight criterion). html2canvas-based tools (html2pdf.js, vue-html2pdf, jsPDF `html()`) are disqualified by the ATS gate in `docs/research/software-developer-template.md` §5. `window.print()` stays the 0 KB incumbent if the print-dialog UX is acceptable.

## Key findings
- **jsPDF wins on the ranked criteria**: lightest option that includes a text-wrap helper (`splitTextToSize`); active maintenance, MIT, official TS types, clean ESM for Vite 8; standard-14 Helvetica covers EN/ID Latin incl. `· – —` with zero font embedding.
- **pdf-lib is lighter (~90 KB gzip, zero deps)** but has no wrap helper — hand-rolled measuring/wrapping adds effort and bug risk; slow release cadence (1.17.1, Nov 2021).
- **Deterministic geometry maps 1:1** to template §3: A4, 14 mm margins → 516 pt content width, ~762 pt height; manual overflow check → `addPage()`, heading+first-line kept together, 2-page cap. More deterministic than print-CSS since rendering happens in the lib.
- **Tool limitation honored**: this runtime had no web/shell tools — all sizes/versions are flagged `[MEM]` (unverified) with an exact §4 verification checklist (`npm view jspdf version dist.unpackedSize`, bundlephobia API, pdfjs-dist e2e text-extraction smoke test).

## Acceptance report