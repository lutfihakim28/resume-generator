# Task for worker

You are a delegated subagent running from a fork of the parent session. Treat the inherited conversation as reference-only context, not a live thread to continue. Do not continue or answer prior messages as if they are waiting for a reply. Your sole job is to execute the task below and return a focused result for that task using your tools.

Task:
IMPLEMENT THE FORM SECTION in /home/capsvelte/Projects/resume-editor following the oracle plan exactly.

PLAN:
# Plan: Form Section Delivery — resume-editor (left panel)

**Inherited context honored:** reviewer output (7 open decisions), `docs/research/software-developer-template.md` ("dev-hybrid-id-no-photo" field set), README one-page/two-panel spec. Verified myself: `App.vue` stub, `App.spec.ts` (UApp+RouterView stubs), `vite.config.ts` (`@nuxt/ui/vite` plugin, `@` alias), `components.d.ts` (own components NOT auto-registered → explicit imports), nuxt/ui composables auto-imported (`useScrollspy`, `useToast`), no Pinia/no validation lib in `package.json`.

## 0. Decisions resolving the reviewer's 7 open questions

1. **Export mechanism → print-CSS.** `window.print()` + `@media print` stylesheet on the preview. Rationale: client-only app, no PDF lib installed; jsPDF/html2canvas rasterizes text and violates the template's ATS checklist (§5). PDF = browser "Save as PDF"; JSON = separate `.json` download. v1 only; revisit if a text-preserving lib (pdfmake) is needed later.
2. **Export language → chosen at export time.** PDF is EN *or* ID (user picks); JSON always contains both languages (state is language-complete).
3. **Navigation UX → sticky anchor scrollspy sidebar.** One scrollable page (README "one page UI"), nav list jumps via `scrollIntoView({ behavior: 'smooth' })`, active highlight via nuxt/ui's auto-imported `useScrollspy`. No tabs/accordion.
4. **EN/ID input → global segmented toggle** (`USegmented` EN|ID at form top) + amber "ID incomplete" dot per nav item + non-blocking alert. Rationale: compact (side-by-side doubles width), and the dots answer "what's missing in the other language".
5. **ID requiredness → warn-only.** README "need fill both" is enforced as guidance, not a hard gate: ID-empty fields get a warning badge and a one-line alert; export never blocks on ID. EN-only hard-required: `name`.
6. **Template options in v1 → both included.** `showPhoto` (default off) and `educationPosition` (default `bottom`) as an "Options" section in the form — cheap, store-backed, feeds future preview preset.
7. **Preset scope → single fixed preset** (`dev-hybrid-id-no-photo`), no switcher. Matches README's "opiniated preset" (singular); the template doc's preset *system* is future work.

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
  start: string; end: string | null          // "MM/YYYY"; null = Present/Sekarang
  bullets: LangText[]; stack: string         // 3–5 bullets; stack = shared tags
}
export interface ProjectEntry { id: string; name: string; url: string; description: LangText; stack: string; impact: LangText }
export interface EducationEntry { id: string; degree: LangText; major: LangText; university: string; city: string; year: string; gpa?: string }
export interface CertificationEntry { id: string; name: string; issuer: string; year: string }
export interface LanguageEntry { id: string; name: string; proficiency: LangText }

export interface Resume {
  version: 1
  personal: PersonalInfo
  summary: LangText
  skills: SkillGroup[]          // UI caps at 4
  experience: ExperienceEntry[]
  projects: ProjectEntry[]
  education: EducationEntry[]
  certifications: CertificationEntry[]
  languages: LanguageEntry[]
  options: { showPhoto: boolean; educationPosition: 'top' | 'bottom' }
}
```

Same file exports:
- `createEmptyResume(): Resume` — defaults (`showPhoto: false`, `educationPosition: 'bottom'`, empty arrays).
- `mergeResume(base: Resume, raw: unknown): Resume` — deep-merge for import: known arrays replaced wholesale when valid, missing keys fall back to base, **unknown keys dropped** (avoids stale-UI bugs; comment this).
- `isValidResumeJson(raw: unknown): boolean` — `version === 1` + structural shape checks (personal object, arrays, string fields).
- `uid(): string` — `crypto.randomUUID()` with counter fallback.

## 2. State store — `src/composables/useResumeStore.ts` (new)

**Decision: plain composable singleton, NOT Pinia.** `package.json` has no Pinia; adding a dep for a one-page app against Vue rc + nuxt/ui v4 churn is unjustified. Idiomatic and testable:

```ts
const state = reactive({ resume: createEmptyResume(), activeLang: 'en' as Lang })
export function useResumeStore() {
  // returns: resume, activeLang (readonly), setActiveLang(lang),
  // importJson(raw: unknown): { ok: true } | { ok: false; errors: string[] },
  // exportJson(): string (pretty, 2-space, includes version),
  // addSkillGroup/removeSkillGroup (cap 4), addExperience/removeExperience,
  // addProject/removeProject, addEducation/removeEducation,
  // addCertification/removeCertification, addLanguage/removeLanguage,
  // resetStore()  ← for tests
}
```

`importJson`: `JSON.parse` (catch → `{ok:false, errors:['Invalid JSON']}`) → `isValidResumeJson` → `mergeResume` → assign. Version ≠ 1 → `'Unsupported resume.json version'`. Store is the single hook for the future preview/export (right panel reads `resume` + `activeLang` — already sufficient for print-CSS export).

## 3. Component structure — `src/components/resume-form/` (new)

Own components are **not** auto-registered (verified `components.d.ts`) → explicit imports with `@/` alias everywhere.

| File | Role |
|---|---|
| `ResumeFormPanel.vue` | Left panel: global `USegmented` EN\|ID, incomplete-ID `UAlert`, layout `flex` = `FormNav` (sticky, w-48) + scrollable sections column |
| `FormNav.vue` | Anchor list from `FORM_SECTIONS`; `useScrollspy` (auto-imported) for active state; click → smooth scroll; amber dot per incomplete section |
| `sections.ts` | `FORM_SECTIONS: { id, key, headingEn, headingId }[]` (template §3.3 order) + `SECTION_FIELDS: Record<string, (r: Resume) => LangText[]>` (drives incomplete-dots) |
| `PersonalSection.vue` | name, title (LangText), phone, email, city, github, linkedin, portfolio |
| `SummarySection.vue` | `UTextarea` summary (LangText) |
| `SkillsSection.vue` | SkillGroup list; add disabled at 4; remove per group; label + items textareas (LangText) |
| `ExperienceSection.vue` + `ExperienceEntryForm.vue` | role (LangText), company, city, start/end `MM/YYYY` + `UCheckbox` "Present" (end→null, disabled), 3–5 bullets (LangText) with add/remove, stack line |
| `ProjectsSection.vue` + `ProjectEntryForm.vue` | name, url, description (LangText), stack, impact (LangText) |
| `EducationSection.vue` + `EducationEntryForm.vue` | degree/major (LangText), university, city, year, gpa (optional) |
| `CertificationsSection.vue` + `CertificationEntryForm.vue` | name, issuer, year |
| `LanguagesSection.vue` + `LanguageEntryForm.vue` | name, proficiency (LangText) |
| `OptionsSection.vue` | `USwitch` photo (off default) + `URadioGroup`/`USegmented` educationPosition |

**One binding rule:** every LangText input binds `v-model="value[store.activeLang]"` — no per-field wrapper components. Add/remove pattern everywhere: `UButton variant="soft" icon="i-lucide-plus"` appends `uid()` entry; ghost icon button removes immediately (v1, no undo; `useToast` "removed" confirm).

**`App.vue` (edit):** `<UApp><div class="grid min-h-screen grid-cols-2"><ResumeFormPanel /><div class="border-l">Preview placeholder</div></div></UApp>` — right panel stays a labeled placeholder (preview/export is the next workstream, not this task).

## 4. Form UX details

- **Validation** (`src/utils/validation.ts`, new — hand-rolled, no new dep): required = `name` non-empty (shown via `UField` error); soft warnings (non-blocking): email regex when filled, date regex `/^(0[1-9]|1[0-2])\/\d{4}$/` when filled, `end < start` warning, "no phone AND no email" hint.
- **Incomplete-ID detection** (`src/utils/resume-utils.ts`, new): `isIncomplete(lt: LangText)` → `lt.id.trim() === ''`; `SECTION_FIELDS` maps sections → fields; `FormNav` dots + top alert "N ID fields still empty — switch to ID to fill".
- Nav order = template §3.3: Personal → Summary → Skills → Experience → Projects → Education → Certifications → Languages → Options.

## 5. Implementation order (worker steps, all green at the end)

1. `src/types/resume.ts` — types + factory + merge + validator + `uid`.
2. `src/utils/resume-utils.ts`, `src/utils/validation.ts`.
3. `src/composables/useResumeStore.ts`.
4. `src/components/resume-form/sections.ts`.
5. Section components bottom-up (Personal → Summary → Skills → Experience → Projects → Education → Certifications → Languages → Options).
6. `FormNav.vue`, `ResumeFormPanel.vue`; wire `App.vue` with right placeholder.
7. **Tests:** extend `src/__tests__/App.spec.ts` — keep the existing assertion, add `ResumeFormPanel: true` stub (jsdom + real nuxt/ui inputs are flaky per review; UApp stub stays). New: `src/__tests__/resume-store.spec.ts` (factory defaults, `importJson` ok/invalid-json/unsupported-version, add/remove capping at 4 skill groups, `resetStore`); `src/__tests__/resume-form.spec.ts` (mount panel with nuxt/ui stubs; add/remove experience entry; `activeLang` switch binds the right variant; name-required error shows).
8. Fix stale `e2e/vue.spec.ts` (reviewer: medium) — replace "You did it!" `h1` assertion with form presence (e.g. heading "Personal" / nav item "Work Experience").
9. Verify: `bun run type-check`, `bun run test:unit`, `bun run lint` all pass. Do NOT bump any dependency.

## 6. Risks & test plan

- **nuxt/ui v4 prop names unverified by me** — worker must check component APIs in `node_modules/@nuxt/ui` before heavy use; `vue-tsc` catches prop errors; tests keep nuxt/ui stubbed so prop churn won't break them.
- **Vue rc + nuxt/ui moving targets** — lockfile pinned; no dep bumps this task.
- **jsdom gaps** (ResizeObserver/matchMedia in nuxt/ui) — if needed, add `test.setupFiles` in `vitest.config.ts` with minimal polyfills; keep vitest config edit minimal (reviewer's extensionless-import note is low/out-of-scope — leave, note as residual).
- **Reactive singleton leaks across tests** — `resetStore()` in `beforeEach`.
- **Import leniency tradeoff** — unknown keys dropped by design; documented in `mergeResume` comment.
- **Print-CSS export** decisions are preview-panel concerns — form unaffected; worker must NOT build preview/export.

Also read README.md and the research docs in docs/research/ for context.

Requirements for the implementation:
1. Create the data model (types) and state (as the plan decides), all form components under src/components/, and wire them into src/App.vue's left panel. The right panel preview/export is OUT OF SCOPE — but structure the state so preview/export can consume it later.
2. Follow the plan's section order and EN/ID dual-input pattern from docs/research/software-developer-template.md.
3. Keep existing tests green (read src/__tests__/App.spec.ts first; adjust/extend tests if the plan requires it, and ADD tests for new form behavior — at minimum: form renders, fields update state, add/remove list item works, EN/ID toggling).
4. Respect project conventions: Vue 3 script setup + TS, @nuxt/ui v4 components (UInput, UTextarea, USelect, UButton, etc.), Tailwind 4. Run the project's tooling to verify: pnpm type-check, pnpm test:unit, pnpm lint (eslint/oxlint) — fix everything you introduce. Do not add new dependencies unless the plan explicitly requires it (prefer Pinia only if the plan says so; a plain composable may suffice).
5. Final response: concise summary of what was implemented (files created/changed), test results, and any deviations from the plan.

## Acceptance Contract
Acceptance level: checked
Completion is not accepted from prose alone. End with a structured acceptance report.

Criteria:
- criterion-1: Implement the requested change without widening scope

Required evidence: changed-files, tests-added, commands-run, residual-risks, no-staged-files

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