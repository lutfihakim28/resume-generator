# Task for oracle

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, not a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below and return a focused result for that task using your tools.

Task:
Decision task: choose the most suitable resume template/layout for a SOFTWARE DEVELOPER in Indonesia, with the constraint NO PHOTO.

Context (from prior research, stored at /home/capsvelte/Projects/resume-editor/docs/research/indonesia-resume-layout.md):
- Reverse-chronological is dominant in Indonesia; combination/hybrid second; functional discouraged.
- Photo (3x4) is the biggest local differentiator, but the user's product use-case here explicitly excludes a photo.
- ATS-friendly single-column, conservative design (white/black/navy + one accent), 1-2 pages, standard section headings.
- Local section order: Data Pribadi → Ringkasan/Profil → Pendidikan → Pengalaman Kerja → Keahlian → optional (Organisasi, Sertifikasi, Referensi).
- For software developer roles: tech companies (startups, MNCs) in Indonesia commonly use English CVs, ATS screening, and value skills/tech stack visibility.

Your tasks:
1. Decide which template type fits a software developer best WITHOUT a photo: compare reverse-chronological vs combination/hybrid vs a skills-first variant; consider ATS, recruiter scanning habits for dev roles, and the no-photo constraint (does omitting the photo hurt in Indonesia? how to mitigate — e.g., profile summary line, GitHub/portfolio links).
2. Design the concrete layout: exact section order, section headings (EN + ID), what content goes in each section, typography suggestions (fonts, sizes, margins), color suggestion, and one-page target for a mid-level developer.
3. Write the result as a Markdown file at /home/capsvelte/Projects/resume-editor/docs/research/software-developer-template.md — include: decision + reasoning (why this template), the full layout spec (in a way a developer could later implement as a template/preset in the resume-editor app), a sample content skeleton with placeholder text (EN and ID variants of the section headings), and ATS/photo-mitigation notes.

Read the research file first for context. Deliver the file path and a concise summary of the decision in your final response.

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