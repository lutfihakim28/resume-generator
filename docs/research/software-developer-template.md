# Template Decision: Software Developer Resume — Indonesia, No Photo

> Derived from `docs/research/indonesia-resume-layout.md` (parent research brief). This document narrows that research to a single role (software developer) and a single constraint (no photo), and produces an implementable layout spec.

## TL;DR decision

- **Template: Combination/Hybrid — "Tech Stack First"** — a compact profile summary + grouped core-skills block at the top, followed by reverse-chronological work experience, then Projects, then Education. Not pure reverse-chronological, and explicitly not functional/skills-only.
- **Photo: excluded by default.** For developer roles in Indonesia (startups, MNCs, tech teams), the photo is the least important of all roles, hiring is ATS- and link-driven, and the no-photo version is designed to look complete on its own (no empty placeholder, no visual hole).
- **One page** target for a mid-level developer (3–5 years), hard cap at 2 pages.

---

## 1. Decision: which template type

### 1.1 Candidate comparison

| Template                                                                          | ATS safety                                                      | Dev-recruiter fit                                                            | No-photo fit                                                                          | Verdict                                                 |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Reverse-chronological                                                             | Best                                                            | Good — progression visible, but tech stack sits below the fold               | Good                                                                                  | Solid general default, wastes the top of page for a dev |
| **Combination / hybrid** (summary + skills top, experience reverse-chronological) | Good (single column, standard headings)                         | **Best** — stack visible in the first screen; experience still chronological | **Best** — profile + skills block substitutes for the photo's "instant identity" role | ✅ **Chosen**                                           |
| Functional / skills-first                                                         | Weakest — poorly parsed, discouraged by every major ID platform | Mixed — niche senior/consultant use only                                     | Medium                                                                                | ❌ Rejected                                             |

### 1.2 Reasoning

1. **Role-specific screening habits.** Dev recruiters and technical screeners in Indonesia (and globally) scan for the tech stack, years of experience, and proof of delivery — not for narrative career history. The top third of the page must contain: name → title → one-line positioning → tech stack. A pure reverse-chronological layout delays the stack until after Education, costing the recruiter's first ~6-second scan.
2. **The research already endorses hybrid as the runner-up**, specifically "for career-changers, fresh graduates with little experience, and senior roles" (research §1). Developer hiring skews exactly toward these populations (bootcamp/fresh graduates in Indonesian tech; senior ICs where depth of stack matters). Hybrid is therefore the role-scoped best fit, not a contradiction of the general default.
3. **ATS stays intact.** Single column, standard headings, comma-separated skills, real text only — a "Core Skills" section is a standard, reliably-parsed ATS section. All the research's ATS rules (§5) are preserved; only the _order_ changes.
4. **Fresh-grad fit.** The optional Projects section compensates for thin experience — directly aligned with the research's note that hybrid is recommended for fresh graduates.

### 1.3 Deliberate deviation from the general ID section order — explicit

The parent research's general local order is: Data Pribadi → Ringkasan → Pendidikan → Pengalaman → Keahlian (research §2).

This template revises that order for dev roles:

- **Skills moves up** (above Experience) — stack-first scanning for technical roles.
- **Education moves down** (after Experience/Projects) — for a mid-level dev, the track record outweighs the degree; research §1 already places the hybrid format second overall, so this is a _narrowing_, not an overturn.
- **Education returns to the top** (after Summary) only for fresh graduates — implement as a preset toggle (`educationPosition: "top" | "bottom"`).

Everything else (Data Pribadi → Ringkasan first, reverse-chronological experience, conservative design, 1–2 pages) honors the research unchanged.

---

## 2. No-photo decision & mitigation

### 2.1 Does omitting the photo hurt in Indonesia?

- The photo is "the single biggest local differentiator" in _general_ Indonesian CV guidance (research §4) — but that is a cross-role average. For **developer roles specifically**, the photo is the least expected: tech startups and MNCs hire via ATS pipelines and online profiles; Jobstreet/Glints guidance explicitly frames the photo as "optional for ATS"; English-language CVs for MNCs routinely omit it; LinkedIn guidance (heavily used by ID tech recruiters) says the photo belongs on the profile, not the document.
- Residual risk is real but narrow: **traditional SMEs / old-school HRD** may still expect a photo. Mitigation is a user-level toggle, not a layout compromise (see §2.3).

### 2.2 How the template compensates (design-level)

1. **Text-only header designed without a placeholder.** The header is a self-contained block: name (large, bold) + role title (accent color) + one-line positioning. No empty photo frame — a no-photo template that renders with a hole _looks_ broken; this one doesn't.
2. **Links as identity.** GitHub + LinkedIn + portfolio in the header — Indonesian tech recruiters verify candidates online instead of by photo; this is the strongest substitute.
3. **Profile summary (2–3 lines)** right under the header gives the "who is this person" answer a photo would otherwise provide.
4. **Complete contact block** (phone, email, city, availability if desired).

### 2.3 App-level policy

- Preset default: `showPhoto: false`, but keep a **photo toggle** in the editor. When enabled, photo renders top-right (≈28×36mm, 3x4 ratio hint) _outside_ the text flow, with no text inside the image — ATS-safe per research §5.
- Tooltip when disabled: "Photo is optional for tech roles; many Indonesian startups and MNCs do not require it. Enable if applying to companies that ask for it."
- ATS bonus of no-photo: no parser ambiguity, smaller file, faster upload, and full compliance with Western/global ATS norms.

---

## 3. Full layout spec (implementable as a preset in resume-editor)

### 3.1 Page setup

| Property    | Value                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------- |
| Page size   | A4 (210×297mm) — Indonesian standard                                                            |
| Margins     | 14mm uniform (12–15mm acceptable)                                                               |
| Columns     | 1 (no tables; skills as comma-separated lists, not bars)                                        |
| Length      | 1 page target (mid-level); auto-flow to 2 max; font ≥ 10pt                                      |
| Font family | One family throughout: Arial (max compatibility) or Calibri; Inter acceptable for a modern look |
| Background  | White (#FFFFFF)                                                                                 |

### 3.2 Color tokens (one accent only — conservative per research §4)

| Token              | Value     | Use                                            |
| ------------------ | --------- | ---------------------------------------------- |
| `--bg`             | `#FFFFFF` | page background                                |
| `--text-primary`   | `#1F2430` | name, headings, body                           |
| `--text-secondary` | `#4A5568` | contact line, dates, metadata                  |
| `--accent`         | `#1E5AA8` | title line, section-rule under headings, links |
| `--rule`           | `#D0D7DE` | thin rules under section headings              |

Contrast: `#1E5AA8` on white ≈ 6.5:1 (WCAG AA pass). No other colors.

### 3.3 Section order & headings (EN primary, ID via language toggle)

| #   | Section              | EN heading             | ID heading         | Default        | Notes                                                  |
| --- | -------------------- | ---------------------- | ------------------ | -------------- | ------------------------------------------------------ |
| 1   | Header               | _(no heading)_         | Data Pribadi       | always         | name, title, contact, links                            |
| 2   | Professional Summary | `Professional Summary` | `Ringkasan Profil` | always         | 2–3 lines                                              |
| 3   | Core Skills          | `Core Skills`          | `Keahlian Inti`    | always         | 3–4 groups, comma lists                                |
| 4   | Work Experience      | `Work Experience`      | `Pengalaman Kerja` | always         | reverse-chronological                                  |
| 5   | Projects             | `Projects`             | `Proyek`           | on (dev roles) | 2–3 items; off if space is tight                       |
| 6   | Education            | `Education`            | `Pendidikan`       | always         | bottom for mid-level; top for fresh grads              |
| 7   | Certifications       | `Certifications`       | `Sertifikasi`      | optional       | only relevant certs                                    |
| 8   | Languages            | `Languages`            | `Bahasa`           | optional       | e.g. Bahasa Indonesia (native), English (professional) |

ATS note: English headings parse most reliably across the platforms in research §3; if the job ad is in Indonesian, ID headings are acceptable, but EN is safer. The app's existing EN/ID export feature maps 1:1 onto this.

### 3.4 Typography spec

| Element         | Font / size / weight                                                      | Style                                                                      |
| --------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Name            | 19pt bold, `--text-primary`                                               | single line, no middle name clutter                                        |
| Title line      | 11.5pt, `--accent`                                                        | e.g. `Backend Software Engineer · Node.js · TypeScript`                    |
| Contact / links | 9.5–10pt, `--text-secondary`                                              | one line: phone · email · city; second line: GitHub · LinkedIn · portfolio |
| Section heading | 12pt bold, `--text-primary`                                               | 0.6pt bottom rule in `--accent`; margin-top 10pt, margin-bottom 4pt        |
| Body            | 10–10.5pt, line-height 1.35                                               | bullets 3–5 per role, max one nesting level                                |
| Dates           | 9.5pt, `--text-secondary`, right-aligned on the same line as role/company | format `Mar 2022 – Present` / `Mar 2022 – Sekarang`                        |

### 3.5 Section content specs

**Header (no heading):**

- Line 1: full name.
- Line 2: role title + top-3 stack keywords.
- Line 3: `+62 812-XXXX-XXXX · email@domain.com · Jakarta, Indonesia`.
- Line 4: `github.com/username · linkedin.com/in/username · portfolio-url` (only real links; omit if absent).

**Professional Summary (2–3 lines):** line 1 = years + role + industry; line 2 = stack breadth + one strength; line 3 = one measurable outcome. Example EN: "Backend engineer with 4+ years building APIs and microservices for fintech products. Strong in Node.js/TypeScript with PostgreSQL and AWS. Reduced API p95 latency by 40% at PT Teknologi Maju."

**Core Skills:** max 4 groups, comma-separated (ATS-parses as keywords; no skill bars):

- `Languages: TypeScript, JavaScript, Go, SQL`
- `Frameworks: Node.js, NestJS, Express, React (basic)`
- `Data & Infra: PostgreSQL, Redis, Docker, AWS (EC2, S3, Lambda)`
- `Tools: Git, GitHub Actions, Jest, Kubernetes (basic)`

**Work Experience:** per role — role title, company, city, dates (MM/YYYY). 3–5 bullets, strong verb + action + metric; mention the stack used per role (ATS keywords live here too). Example bullet ID: "Mengurangi response time API sebesar 40% dengan optimasi query PostgreSQL dan caching Redis." Dates: newest first; `Present`/`Sekarang` for current role.

**Projects (dev-specific, default on):** name (hyperlinked), one-line description, stack tags, one impact bullet max. 2–3 items. This section is the fresh-grad equalizer.

**Education:** degree, major, university, city, year. GPA + relevant coursework only for fresh grads (<1 year experience).

**Certifications / Languages (optional):** cert = name, issuer, year; languages = `Bahasa Indonesia (native) · English (professional)`. Only include certs relevant to the target stack.

### 3.6 Preset config sketch (for the app's template system)

```ts
{
  id: "dev-hybrid-id-no-photo",
  name: "Developer — Hybrid (No Photo)",
  description: "Tech-stack-first layout for software developers; photo optional (default off).",
  pageSize: "A4",
  language: "en", // toggle: "id"
  defaultOptions: { showPhoto: false, educationPosition: "bottom" },
  sections: [
    { key: "header", required: true, heading: { en: null, id: "Data Pribadi" } },
    { key: "summary", required: true, heading: { en: "Professional Summary", id: "Ringkasan Profil" } },
    { key: "skills", required: true, heading: { en: "Core Skills", id: "Keahlian Inti" } },
    { key: "experience", required: true, heading: { en: "Work Experience", id: "Pengalaman Kerja" } },
    { key: "projects", required: false, defaultOn: true, heading: { en: "Projects", id: "Proyek" } },
    { key: "education", required: true, heading: { en: "Education", id: "Pendidikan" } },
    { key: "certifications", required: false, defaultOn: false, heading: { en: "Certifications", id: "Sertifikasi" } },
    { key: "languages", required: false, defaultOn: false, heading: { en: "Languages", id: "Bahasa" } }
  ],
  style: {
    fontFamily: "Arial",
    baseFontSize: 10,
    nameSize: 19,
    accent: "#1E5AA8",
    margins: "14mm"
  }
}
```

---

## 4. Sample content skeleton (placeholder)

### 4.1 EN variant (typical for startups/MNCs — the default for this template)

```md
# Budi Santoso

Backend Software Engineer · Node.js · TypeScript
+62 812-XXXX-XXXX · budi.santoso@email.com · Jakarta, Indonesia
github.com/budisantoso · linkedin.com/in/budisantoso

## Professional Summary

Backend engineer with 4+ years building APIs and microservices for fintech
products. Strong in Node.js/TypeScript, PostgreSQL, and AWS. Reduced API p95
latency by 40% at PT Teknologi Maju.

## Core Skills

Languages: TypeScript, JavaScript, Go, SQL
Frameworks: Node.js, NestJS, Express, React (basic)
Data & Infra: PostgreSQL, Redis, Docker, AWS (EC2, S3, Lambda)
Tools: Git, GitHub Actions, Jest, Kubernetes (basic)

## Work Experience

**Senior Backend Engineer — PT Teknologi Maju, Jakarta** | Mar 2022 – Present

- Led migration of monolith to 12 microservices; cut deployment time by 70%.
- Reduced API p95 latency by 40% via query optimization and Redis caching.
- Mentored 3 junior engineers; introduced CI/CD with GitHub Actions.
- Stack: TypeScript, NestJS, PostgreSQL, AWS.

**Backend Engineer — PT Startup Digital, Bandung** | Jun 2020 – Feb 2022

- Built order and payment APIs handling 50k requests/day.
- Integrated 3 payment gateways (Midtrans, Xendit, GoPay).
- Stack: Node.js, Express, MongoDB, Docker.

## Projects

**E-Commerce API** — order/payment/stock service with webhook support.
github.com/budisantoso/ecommerce-api · Stack: NestJS, PostgreSQL, Redis

## Education

S.Kom., Informatics Engineering — Universitas Indonesia, Depok | 2020

## Certifications

AWS Certified Developer – Associate | 2023

## Languages

Bahasa Indonesia (native) · English (professional)
```

### 4.2 ID heading variant (local companies) — same structure, swapped headings

```md
# Budi Santoso

Backend Software Engineer · Node.js · TypeScript
+62 812-XXXX-XXXX · budi.santoso@email.com · Jakarta, Indonesia
github.com/budisantoso · linkedin.com/in/budisantoso

## Ringkasan Profil

Backend engineer dengan pengalaman 4+ tahun membangun API dan microservices
untuk produk fintech. Kuat di Node.js/TypeScript, PostgreSQL, dan AWS.
Mengurangi latency p95 API sebesar 40% di PT Teknologi Maju.

## Keahlian Inti

Bahasa: TypeScript, JavaScript, Go, SQL
Framework: Node.js, NestJS, Express, React (dasar)
Data & Infra: PostgreSQL, Redis, Docker, AWS (EC2, S3, Lambda)
Tools: Git, GitHub Actions, Jest, Kubernetes (dasar)

## Pengalaman Kerja

**Senior Backend Engineer — PT Teknologi Maju, Jakarta** | Mar 2022 – Sekarang

- Memimpin migrasi monolith ke 12 microservices; memangkas waktu deploy 70%.
- Mengurangi latency p95 API 40% lewat optimasi query dan caching Redis.
- Membimbing 3 engineer junior; menerapkan CI/CD dengan GitHub Actions.
- Stack: TypeScript, NestJS, PostgreSQL, AWS.

## Proyek

**E-Commerce API** — layanan order/pembayaran/stok dengan dukungan webhook.
github.com/budisantoso/ecommerce-api · Stack: NestJS, PostgreSQL, Redis

## Pendidikan

S.Kom., Teknik Informatika — Universitas Indonesia, Depok | 2020

## Sertifikasi

AWS Certified Developer – Associate | 2023

## Bahasa

Bahasa Indonesia (penutur asli) · Inggris (profesional)
```

---

## 5. ATS & photo-mitigation checklist

- [ ] Single column; no tables, no skill bars, no text-in-images (research §5).
- [ ] Standard section headings; English headings preferred for parse safety.
- [ ] Keywords from the job description repeated in Core Skills **and** Experience bullets.
- [ ] No critical info in page header/footer (name/contact live in the body only).
- [ ] Export: PDF default; DOCX offered for maximum parse safety (research §5).
- [ ] Photo toggle: default off; when on, top-right, ≈28×36mm, no text inside image.
- [ ] Font ≥ 10pt; length guard warns beyond 2 pages (research §7).
- [ ] Real links only in the header (GitHub/LinkedIn/portfolio) — the photo substitute.

---

## 6. Risks / residual uncertainty

| Risk                                                                      | Severity | Mitigation                                                                                      |
| ------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- |
| Traditional SME/old-school HRD still expects a photo                      | Medium   | Photo toggle in the editor; tooltip explains tech-role norms                                    |
| No primary survey data ranks ID recruiter layout preference (research §6) | Medium   | Decision rests on platform-guidance consensus + role-specific norms; validate with user testing |
| Research sources unverified (no live web this run, research caveat)       | Medium   | Re-run verification queries in the parent research doc before shipping product copy             |
| Education-after-Experience may surprise readers of general ID CV advice   | Low      | Documented deviation (§1.3); fresh-grad preset restores Education to top                        |
| Stack keyword list grows stale                                            | Low      | Keep skills as user-editable groups, not hardcoded presets                                      |

---

## References

- Parent research: `docs/research/indonesia-resume-layout.md` (canonical domains: Jobstreet Indonesia, Indeed ID, Glints Blog, Kalibrr, KitaLulus, CakeResume ID, LinkedIn Resume Builder).
- Verification queries for live re-check: see "How to verify this brief" section of the parent research doc.
