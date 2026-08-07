All inspection complete. Here is the review.

## Review

### 1. README as a spec — verdict

**Correct/good:**
- Clear feature inventory: one-page UI, two panels (left form + navigation, right preview + import/export), import-json-to-fill, export pdf+json, EN/ID dual language (README.md:8–26).
- Explicitly defers the field set ("will be provided later", README.md:15) — and that gap is now resolved by `docs/research/software-developer-template.md`, so the deferred decision exists as an artifact.

**Ambiguities (need oracle resolution):**
- **Export mechanics unspecified** (README.md:19–21): "the export will include the `resume.json`" — is export one PDF, two downloads, or an archive? Is language chosen at export time (one PDF in EN *or* ID) or exported for both?
- **Dual-language input UX unspecified** (README.md:23–24): "User need fill both form" — side-by-side EN/ID fields, per-language toggle, or per-section switch? Is ID content required or best-effort?
- **Navigation mechanism unspecified** (README.md:12): tabs, accordion, or anchor menu for "jump into specific information"?
- **Import contract unspecified**: schema/version of `resume.json`, behavior on invalid/missing data (reject vs. warn-and-fill).

**Gaps/contradictions:**
- README doesn't reference the template doc that defines the fields; the spec is split across two files and the template doc's `preset config sketch` (§3.6) implies a *template system*, while README says "opiniated preset" (singular) — scope ambiguity on single-preset vs. multi-preset.
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
- **EN+ID dual input**: every user-authored text field needs both variants — headings come from the template's EN/ID map (§3.3), but all content (summary, bullets, skill group labels, project descriptions) is translated per the sample skeletons (§4.1/§4.2).
- **Import-to-fill**: importing `resume.json` must populate all of the above and be editable (README.md:16–17).
- **Photo toggle** (default off) + `educationPosition` per §3.6 if options are in scope.

### 3. Current code state (verified)

- `src/App.vue`: stub as described — `<UApp><span>Halo</span></UApp>`, empty `<script setup lang="ts">`. Fine as a smoke placeholder.
- `src/main.ts`: correct wiring — `@nuxt/ui/vue-plugin` registered, mounts `#app`. Installed: Vue **3.6.0-rc.2**, @nuxt/ui **4.10.0**, Tailwind **4.3.3**, Vite **8.2.1**, Vitest **4.1.10**. `components.d.ts` resolves `UApp` correctly.
- `src/__tests__/App.spec.ts`: one smoke test (stubs `UApp`, asserts existence) — **passes** (`vitest run`: 1/1). `vue-tsc --build` passes (exit 0).
- **note, medium: `e2e/vue.spec.ts:6–8` is a stale Vue-scaffold test** expecting `h1` "You did it!" — the app renders "Halo"; this e2e will fail against the real app and must be rewritten.
- **note, low: `vitest.config.ts:3`** imports `./vite.config` extensionless; Vite 8 warns this breaks under the upcoming native config loader.
- **info**: directory is **not a git repository** — no history/diff to review.

### 4. Feasibility / risk notes for the stack

- **nuxt/ui v4 + Vue rc**: plugin setup, `UApp`, and type-check all work today. Risk: Vue `rc` overrides + nuxt/ui 4.x are moving targets; pin lockfile (`bun.lock`) and re-verify after upgrades. No validation library is installed — Nuxt UI v4's `UForm` schema validation (valibot/zod) must be verified or custom validation added.
- **PDF export is the biggest open risk**: no PDF library in `package.json`, and "client only webapp" rules out server-side generation. Options: browser print (`window.print` + `@media print` CSS — preserves text/ATS safety, matches template's ATS requirements) vs. canvas-based (jsPDF/html2canvas — rasterizes text, breaks the template's ATS checklist §5). Needs an oracle decision.
- **Dual-language doubles form complexity**: data model should nest variants (e.g., `{ en, id }` per field); decide required-vs-optional for ID early.
- **Testing**: Vitest+jsdom+test-utils work; keep nuxt/ui components stubbed in unit tests (jsdom + teleports are flaky). Playwright config is ready (3 browsers, webServer on 5173/4173) but the one spec is stale.

### 5. Missing decisions the oracle must make before implementation

1. PDF export mechanism (print-CSS vs. library) and export packaging/filenames (README.md:19–21).
2. Export-time language: single selected-language PDF, or both languages always produced?
3. Form navigation UX (tabs/accordion/menu) and the EN+ID input presentation (side-by-side vs. toggle).
4. `resume.json` schema: field naming, versioning, lang nesting; import validation strictness.
5. Requiredness of ID content (README says "need fill both" — enforce or warn?).
6. Scope of template options in v1: photo toggle / `educationPosition` included, or fixed preset defaults only.
7. Single preset vs. template switcher (README "opiniated preset" vs. template doc's preset system).

**No blockers found in the current stub state** — it is a clean, small base; the risks are pre-implementation decisions, not existing defects. I modified no files.