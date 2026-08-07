<script setup lang="ts">
/**
 * Live resume preview — renders the store state as an A4 sheet following
 * docs/research/software-developer-template.md §3 (dev-hybrid-id-no-photo).
 * The SHEET is pure HTML/Tailwind (no nuxt/ui components) so it stays
 * jsdom-testable and later printable; the ImportExportBar above it is the
 * only nuxt/ui surface and is hidden from print output.
 */
import { computed } from 'vue'
import { useResumeStore } from '@/composables/useResumeStore'
import {
  dateRange,
  educationLine,
  languageLabel,
  pickLang,
  roleLine,
} from '@/utils/resume-utils'
import { FORM_SECTIONS } from '@/components/resume-form/sections'
import type { ExperienceEntry, LangText } from '@/types/resume'
import ImportExportBar from './ImportExportBar.vue'
import PreviewSection from './PreviewSection.vue'

const store = useResumeStore()
const resume = computed(() => store.resume)
const lang = computed(() => store.activeLang)

// Single source of truth for EN/ID headings — reused from the form's section table.
const HEADINGS = new Map<string, { en: string; id: string }>()
for (const section of FORM_SECTIONS) {
  HEADINGS.set(section.key, { en: section.headingEn, id: section.headingId })
}

function heading(key: string): string {
  const pair = HEADINGS.get(key)
  return lang.value === 'id' ? (pair?.id ?? '') : (pair?.en ?? '')
}

function lt(lt: LangText | undefined | null): string {
  return pickLang(lt, lang.value)
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

const title = computed(() => lt(resume.value.personal.title))
const contact = computed(() =>
  [resume.value.personal.phone, resume.value.personal.email, resume.value.personal.city]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' · '),
)
const links = computed(() =>
  [resume.value.personal.github, resume.value.personal.linkedin, resume.value.personal.portfolio]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(' · '),
)
const photoSrc = computed(() => {
  const url = resume.value.personal.photoUrl.trim()
  return resume.value.options.showPhoto && url ? url : ''
})

// ---------------------------------------------------------------------------
// Sections — only rendered when the active language has real content
// ---------------------------------------------------------------------------

const summary = computed(() => lt(resume.value.summary))
const skills = computed(() =>
  resume.value.skills.filter((group) => lt(group.label) !== '' || lt(group.items) !== ''),
)
const experience = computed(() => resume.value.experience.filter(entryVisible))
const projects = computed(() =>
  resume.value.projects.filter((p) => p.name.trim() !== '' || lt(p.description) !== ''),
)
const education = computed(() =>
  resume.value.education.filter((e) => lt(e.degree) !== '' || e.institution.trim() !== ''),
)
const certifications = computed(() =>
  resume.value.certifications.filter((c) => c.name.trim() !== ''),
)
const languages = computed(() => resume.value.languages.filter((l) => l.name.trim() !== ''))

function entryVisible(entry: ExperienceEntry): boolean {
  return (
    lt(entry.role) !== '' ||
    entry.company.trim() !== '' ||
    entry.start.trim() !== '' ||
    entry.stack.trim() !== '' ||
    entry.bullets.some((bullet) => lt(bullet) !== '')
  )
}

const isEmpty = computed(() => {
  const r = resume.value
  return (
    r.personal.name.trim() === '' &&
    lt(r.summary) === '' &&
    r.skills.length === 0 &&
    r.experience.length === 0 &&
    r.projects.length === 0 &&
    r.education.length === 0 &&
    r.certifications.length === 0 &&
    r.languages.length === 0
  )
})

const educationTop = computed(() => resume.value.options.educationPosition === 'top')
</script>

<template>
  <div class="h-full overflow-y-auto bg-gray-100 p-6" data-testid="preview-panel">
    <ImportExportBar class="mb-4 print:hidden" />
    <div class="mx-auto w-full max-w-[210mm] bg-white shadow-md" data-testid="preview-sheet">
      <!-- Empty resume → friendly hint instead of a broken-looking sheet. -->
      <div
        v-if="isEmpty"
        class="flex h-[297mm] flex-col items-center justify-center gap-2 p-14 text-center"
        data-testid="preview-empty"
      >
        <p class="text-[14pt] text-gray-400">Your resume preview</p>
        <p class="text-[10.5pt] text-gray-300">
          Fill the form on the left — the preview updates in real time.
        </p>
      </div>

      <div v-else class="p-[14mm] text-[#1F2430]">
        <!-- Header: text-only by default; photo appears top-right only when the
             user opts in (showPhoto) and provides a URL. -->
        <header class="flex gap-4" data-testid="preview-header">
          <div class="min-w-0 flex-1">
            <h1 class="text-[19pt] font-bold leading-tight">{{ resume.personal.name }}</h1>
            <p v-if="title" class="mt-0.5 text-[11.5pt] text-[#1E5AA8]">{{ title }}</p>
            <p v-if="contact" class="mt-1 text-[10pt] text-[#4A5568]">{{ contact }}</p>
            <p v-if="links" class="text-[10pt] text-[#4A5568]">{{ links }}</p>
          </div>
          <img
            v-if="photoSrc"
            :src="photoSrc"
            alt="Profile photo"
            class="h-[36mm] w-[28mm] shrink-0 object-cover"
            data-testid="preview-photo"
          />
        </header>

        <PreviewSection v-if="summary" :heading="heading('summary')">
          <p class="text-[10.5pt] leading-[1.35]">{{ summary }}</p>
        </PreviewSection>

        <!-- Education above Skills only for fresh graduates (option). -->
        <PreviewSection v-if="educationTop && education.length" :heading="heading('education')">
          <div
            v-for="entry in education"
            :key="entry.id"
            class="flex items-baseline justify-between gap-2"
          >
            <p class="text-[10.5pt]">{{ educationLine(entry, lang) }}</p>
            <p v-if="entry.year" class="shrink-0 text-[9.5pt] text-[#4A5568]">{{ entry.year }}</p>
          </div>
        </PreviewSection>

        <PreviewSection v-if="skills.length" :heading="heading('skills')">
          <p v-for="group in skills" :key="group.id" class="text-[10.5pt]">
            <span class="font-semibold">{{ lt(group.label) }}:</span>
            {{ lt(group.items) }}
          </p>
        </PreviewSection>

        <PreviewSection v-if="experience.length" :heading="heading('experience')">
          <div v-for="entry in experience" :key="entry.id" class="space-y-0.5">
            <div class="flex items-baseline justify-between gap-2">
              <p class="text-[10.5pt] font-semibold">{{ roleLine(entry, lang) }}</p>
              <p v-if="dateRange(entry, lang)" class="shrink-0 text-[9.5pt] text-[#4A5568]">
                {{ dateRange(entry, lang) }}
              </p>
            </div>
            <ul
              v-if="entry.bullets.some((b) => lt(b) !== '')"
              class="list-disc pl-4 text-[10.5pt] leading-[1.35]"
            >
              <li v-for="(bullet, index) in entry.bullets" :key="index">
                {{ lt(bullet) }}
              </li>
            </ul>
            <p v-if="entry.stack.trim()" class="text-[9.5pt] text-[#4A5568]">
              Stack: {{ entry.stack }}
            </p>
          </div>
        </PreviewSection>

        <PreviewSection v-if="projects.length" :heading="heading('projects')">
          <div v-for="project in projects" :key="project.id" class="space-y-0.5">
            <p class="text-[10.5pt] font-semibold">
              <a
                v-if="project.url.trim()"
                :href="project.url"
                target="_blank"
                rel="noopener"
                class="text-[#1E5AA8] underline"
              >
                {{ project.name || project.url }}
              </a>
              <template v-else>{{ project.name }}</template>
            </p>
            <p v-if="lt(project.description)" class="text-[10.5pt]">
              {{ lt(project.description) }}
            </p>
            <p v-if="lt(project.impact)" class="text-[10.5pt]">{{ lt(project.impact) }}</p>
            <p v-if="project.stack.trim()" class="text-[9.5pt] text-[#4A5568]">
              Stack: {{ project.stack }}
            </p>
          </div>
        </PreviewSection>

        <!-- Education at the bottom for mid-level developers (default). -->
        <PreviewSection v-if="!educationTop && education.length" :heading="heading('education')">
          <div
            v-for="entry in education"
            :key="entry.id"
            class="flex items-baseline justify-between gap-2"
          >
            <p class="text-[10.5pt]">{{ educationLine(entry, lang) }}</p>
            <p v-if="entry.year" class="shrink-0 text-[9.5pt] text-[#4A5568]">{{ entry.year }}</p>
          </div>
        </PreviewSection>

        <PreviewSection v-if="certifications.length" :heading="heading('certifications')">
          <p v-for="cert in certifications" :key="cert.id" class="text-[10.5pt]">
            <span class="font-semibold">{{ cert.name }}</span>
            <template v-if="cert.issuer"> — {{ cert.issuer }}</template>
            <template v-if="cert.year"> | {{ cert.year }}</template>
          </p>
        </PreviewSection>

        <PreviewSection v-if="languages.length" :heading="heading('languages')">
          <p class="text-[10.5pt]">{{ languages.map((l) => languageLabel(l, lang)).join(' · ') }}</p>
        </PreviewSection>
      </div>
    </div>
  </div>
</template>
