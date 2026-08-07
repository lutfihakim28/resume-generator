Memory tool isn't available in this runtime — not a blocker; the MD file itself is the durable artifact (parent can persist a memory if desired).

---

## Oracle decision & deliverable

**File written:** `/home/capsvelte/Projects/resume-editor/docs/research/software-developer-template.md` (290 lines, ~17 KB)

### Decision summary

**Template chosen: Combination/Hybrid — "Tech Stack First"** (not pure reverse-chronological, not functional).

- **Layout:** Header (name, role title, contact, GitHub/LinkedIn/portfolio links) → Professional Summary (2–3 lines) → Core Skills (grouped tech stack) → Work Experience (reverse-chronological) → Projects (dev-specific, default on) → Education → optional Certifications/Languages.
- **Why hybrid over chronological:** dev recruiters screen for stack keywords in the first scan; the research already endorses hybrid for fresh grads/senior roles, which is exactly where dev hiring skews. ATS safety is preserved (single column, standard headings, comma-list skills).
- **Explicit deviation flagged:** general ID order puts Pendidikan before Pengalaman; this template moves Skills above Experience and Education to the bottom for mid-level devs (fresh-grad toggle restores Education to top).
- **No-photo:** costs the least in dev roles (startups/MNCs hire ATS- and link-driven; guidance frames photo as optional-for-ATS). Mitigations: text-only header with **no empty photo placeholder**, GitHub/LinkedIn links as identity substitute, strong profile summary, photo toggle (default off; top-right 28×36mm, ATS-safe) for traditional SME applications.
- **Spec is implementable:** A4, 14mm margins, single column, Arial/Calibri ≥10pt, one accent `#1E5AA8`, EN/ID heading table, a TypeScript preset-config sketch (`id: "dev-hybrid-id-no-photo"`), plus EN and ID sample skeletons.