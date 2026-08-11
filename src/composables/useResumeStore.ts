import { reactive } from 'vue'
import type { Lang, Resume } from '@/types/resume'
import {
  createEmptyResume,
  createLangText,
  isValidResumeJson,
  MAX_BULLETS_PER_ROLE,
  MAX_SKILL_GROUPS,
  mergeResume,
  uid,
} from '@/types/resume'

/**
 * Plain reactive singleton — no Pinia (not installed; overkill for a one-page
 * app). The right panel (preview/export) will read `resume` + `activeLang`
 * from here.
 */
const state = reactive<{ resume: Resume; activeLang: Lang }>({
  resume: createEmptyResume(),
  activeLang: 'en',
})

/**
 * localStorage key for the manual "save to browser" action. App name +
 * `resume` + envelope/schema version: a future schema bump changes the key
 * so stale blobs are naturally abandoned (and would be rejected by
 * `isValidResumeJson` anyway).
 */
export const RESUME_STORAGE_KEY = 'resume-editor:resume:v1'

export interface ImportResult {
  ok: boolean
  errors: string[]
}

export function useResumeStore() {
  function setActiveLang(lang: Lang): void {
    state.activeLang = lang
  }

  function importJson(raw: string): ImportResult {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return { ok: false, errors: ['Invalid JSON'] }
    }
    if (!isValidResumeJson(parsed)) {
      const version = (parsed as { version?: unknown } | null)?.version
      if (version !== undefined && version !== 1) {
        return { ok: false, errors: ['Unsupported resume.json version'] }
      }
      return { ok: false, errors: ['Invalid resume.json structure'] }
    }
    // Mutate in place (Object.assign) so references captured earlier by
    // components/tests stay live — replacing `state.resume` would orphan them.
    Object.assign(state.resume, mergeResume(state.resume, parsed))
    return { ok: true, errors: [] }
  }

  /** Pretty-printed JSON including `version` — round-trips through `importJson`. */
  function exportJson(): string {
    return JSON.stringify(state.resume, null, 2)
  }

  /**
   * Persist the current resume snapshot to localStorage. Explicit user action
   * only — no auto-save. Serializes the resume (not `activeLang`) so the blob
   * stays byte-identical in shape to an exported resume.json and can be
   * re-imported with the same semantics. Snapshot at call time, not a live
   * reference: later edits drift the stored value only on the next save.
   */
  function saveToLocalStorage(): { ok: boolean; errors: string[] } {
    if (typeof localStorage === 'undefined') {
      return { ok: false, errors: ['Storage unavailable'] }
    }
    try {
      localStorage.setItem(RESUME_STORAGE_KEY, exportJson())
      return { ok: true, errors: [] }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        return { ok: false, errors: ['Storage quota exceeded'] }
      }
      return { ok: false, errors: ['Storage unavailable'] }
    }
  }

  function addSkillGroup(): void {
    if (state.resume.skills.length >= MAX_SKILL_GROUPS) return
    state.resume.skills.push({ id: uid(), label: createLangText(), items: createLangText() })
  }

  function removeSkillGroup(id: string): void {
    state.resume.skills = state.resume.skills.filter((g) => g.id !== id)
  }

  function addExperience(): void {
    state.resume.experience.push({
      id: uid(),
      role: createLangText(),
      company: '',
      city: '',
      start: '',
      end: '',
      bullets: [createLangText()],
      stack: '',
    })
  }

  function removeExperience(id: string): void {
    state.resume.experience = state.resume.experience.filter((e) => e.id !== id)
  }

  function addExperienceBullet(entryId: string): void {
    const entry = state.resume.experience.find((e) => e.id === entryId)
    if (!entry || entry.bullets.length >= MAX_BULLETS_PER_ROLE) return
    entry.bullets.push(createLangText())
  }

  function removeExperienceBullet(entryId: string, index: number): void {
    const entry = state.resume.experience.find((e) => e.id === entryId)
    if (!entry) return
    entry.bullets = entry.bullets.filter((_, i) => i !== index)
  }

  function addProject(): void {
    state.resume.projects.push({
      id: uid(),
      name: '',
      url: '',
      description: createLangText(),
      stack: '',
      impact: createLangText(),
    })
  }

  function removeProject(id: string): void {
    state.resume.projects = state.resume.projects.filter((p) => p.id !== id)
  }

  function addEducation(): void {
    state.resume.education.push({
      id: uid(),
      level: 'university',
      degree: createLangText(),
      major: createLangText(),
      institution: '',
      city: '',
      year: '',
    })
  }

  function removeEducation(id: string): void {
    state.resume.education = state.resume.education.filter((e) => e.id !== id)
  }

  function addCertification(): void {
    state.resume.certifications.push({ id: uid(), name: '', issuer: '', year: '' })
  }

  function removeCertification(id: string): void {
    state.resume.certifications = state.resume.certifications.filter((c) => c.id !== id)
  }

  function addLanguage(): void {
    state.resume.languages.push({ id: uid(), name: '', proficiency: createLangText() })
  }

  function removeLanguage(id: string): void {
    state.resume.languages = state.resume.languages.filter((l) => l.id !== id)
  }

  /** Test/UX reset back to a blank resume (in-place, see importJson). */
  function resetStore(): void {
    Object.assign(state.resume, createEmptyResume())
    state.activeLang = 'en'
  }

  return {
    // Getter/setter so reads/writes always hit the reactive `state` — a plain
    // property would snapshot the primitive at call time and break v-model
    // (the EN/ID toggle silently not updating `state.activeLang`).
    get activeLang(): Lang {
      return state.activeLang
    },
    set activeLang(lang: Lang) {
      state.activeLang = lang
    },
    get resume(): Resume {
      return state.resume
    },
    setActiveLang,
    importJson,
    exportJson,
    saveToLocalStorage,
    addSkillGroup,
    removeSkillGroup,
    addExperience,
    removeExperience,
    addExperienceBullet,
    removeExperienceBullet,
    addProject,
    removeProject,
    addEducation,
    removeEducation,
    addCertification,
    removeCertification,
    addLanguage,
    removeLanguage,
    resetStore,
  }
}
