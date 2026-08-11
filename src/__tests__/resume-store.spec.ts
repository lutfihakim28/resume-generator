import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RESUME_STORAGE_KEY, useResumeStore } from '@/composables/useResumeStore'
import type { Resume } from '@/types/resume'

describe('useResumeStore', () => {
  beforeEach(() => {
    useResumeStore().resetStore()
    localStorage.clear()
  })

  it('starts from a blank resume with template defaults', () => {
    const store = useResumeStore()
    expect(store.activeLang).toBe('en')
    expect(store.resume.version).toBe(1)
    expect(store.resume.personal.name).toBe('')
    expect(store.resume.summary).toEqual({ en: '', id: '' })
    expect(store.resume.skills).toEqual([])
    expect(store.resume.experience).toEqual([])
    expect(store.resume.projects).toEqual([])
    expect(store.resume.education).toEqual([])
    expect(store.resume.certifications).toEqual([])
    expect(store.resume.languages).toEqual([])
    expect(store.resume.options).toEqual({ showPhoto: false, educationPosition: 'bottom' })
  })

  it('caps skill groups at 4', () => {
    const store = useResumeStore()
    for (let i = 0; i < 6; i += 1) {
      store.addSkillGroup()
    }
    expect(store.resume.skills).toHaveLength(4)
    store.removeSkillGroup(store.resume.skills[0]!.id)
    store.addSkillGroup()
    expect(store.resume.skills).toHaveLength(4)
  })

  it('adds and removes list entries', () => {
    const store = useResumeStore()

    store.addExperience()
    expect(store.resume.experience).toHaveLength(1)
    const entry = store.resume.experience[0]!
    store.addExperienceBullet(entry.id)
    expect(entry.bullets).toHaveLength(2)
    store.removeExperienceBullet(entry.id, 0)
    expect(entry.bullets).toHaveLength(1)
    store.removeExperience(entry.id)
    expect(store.resume.experience).toHaveLength(0)

    store.addProject()
    store.addEducation()
    store.addCertification()
    store.addLanguage()
    expect(store.resume.projects).toHaveLength(1)
    expect(store.resume.education).toHaveLength(1)
    expect(store.resume.certifications).toHaveLength(1)
    expect(store.resume.languages).toHaveLength(1)
  })

  it('creates education entries with university level by default', () => {
    const store = useResumeStore()
    store.addEducation()
    expect(store.resume.education[0]!.level).toBe('university')
    expect(store.resume.education[0]!.institution).toBe('')
  })

  it('imports a legacy v1 resume.json using the university key into institution', () => {
    const store = useResumeStore()
    const result = store.importJson(
      JSON.stringify({
        version: 1,
        personal: { name: 'Budi' },
        skills: [],
        experience: [],
        projects: [],
        education: [
          {
            degree: { en: 'S.Kom.', id: '' },
            major: { en: 'Informatics', id: '' },
            university: 'Universitas Indonesia',
            city: 'Depok',
            year: '2020',
          },
        ],
        certifications: [],
        languages: [],
      }),
    )
    expect(result.ok).toBe(true)
    const entry = store.resume.education[0]!
    expect(entry.institution).toBe('Universitas Indonesia')
    expect(entry.level).toBe('university')
    expect('university' in entry).toBe(false)
  })

  it('preserves sma level and institution on import', () => {
    const store = useResumeStore()
    const result = store.importJson(
      JSON.stringify({
        version: 1,
        personal: { name: 'Siti' },
        skills: [],
        experience: [],
        projects: [],
        education: [
          {
            level: 'sma',
            degree: { en: 'SMA', id: 'SMA' },
            major: { en: 'IPA', id: 'IPA' },
            institution: 'SMAN 1 Jakarta',
            city: 'Bandung',
            year: '2021',
          },
        ],
        certifications: [],
        languages: [],
      }),
    )
    expect(result.ok).toBe(true)
    expect(store.resume.education[0]!.level).toBe('sma')
    expect(store.resume.education[0]!.institution).toBe('SMAN 1 Jakarta')
  })

  it('coerces unknown education levels to university on import', () => {
    const store = useResumeStore()
    store.importJson(
      JSON.stringify({
        version: 1,
        personal: { name: 'Siti' },
        skills: [],
        experience: [],
        projects: [],
        education: [
          {
            level: 'diploma',
            degree: { en: 'D3', id: '' },
            institution: 'Politeknik Negeri Bandung',
          },
        ],
        certifications: [],
        languages: [],
      }),
    )
    expect(store.resume.education[0]!.level).toBe('university')
    expect(store.resume.education[0]!.institution).toBe('Politeknik Negeri Bandung')
  })

  it('round-trips exportJson → importJson', () => {
    const store = useResumeStore()
    store.resume.personal.name = 'Budi Santoso'
    store.resume.summary.en = 'Backend engineer.'
    store.resume.summary.id = 'Backend engineer.'
    store.addSkillGroup()
    store.resume.skills[0]!.label.en = 'Languages'
    store.addExperience()
    store.resume.experience[0]!.role.en = 'Senior Backend Engineer'

    const imported = useResumeStore().importJson(store.exportJson())
    expect(imported).toEqual({ ok: true, errors: [] })
    const after = useResumeStore()
    expect(after.resume.personal.name).toBe('Budi Santoso')
    expect(after.resume.summary).toEqual({ en: 'Backend engineer.', id: 'Backend engineer.' })
    expect(after.resume.skills[0]!.label.en).toBe('Languages')
    expect(after.resume.experience[0]!.role.en).toBe('Senior Backend Engineer')
    expect(after.resume.experience[0]!.id).toBe(store.resume.experience[0]!.id)
  })

  it('rejects invalid JSON', () => {
    const result = useResumeStore().importJson('{not json')
    expect(result.ok).toBe(false)
    expect(result.errors).toContain('Invalid JSON')
  })

  it('rejects unsupported versions', () => {
    const result = useResumeStore().importJson(
      JSON.stringify({
        version: 2,
        personal: { name: 'X' },
        skills: [],
        experience: [],
        projects: [],
        education: [],
        certifications: [],
        languages: [],
      }),
    )
    expect(result.ok).toBe(false)
    expect(result.errors).toContain('Unsupported resume.json version')
  })

  it('rejects structurally invalid resume json', () => {
    const result = useResumeStore().importJson(
      JSON.stringify({ version: 1, personal: { name: 42 } }),
    )
    expect(result.ok).toBe(false)
    expect(result.errors).toContain('Invalid resume.json structure')
  })

  it('drops unknown keys on import and keeps base values for missing keys', () => {
    const store = useResumeStore()
    store.resume.personal.name = 'Base Name'
    store.resume.personal.phone = '0812-0000'
    const result = store.importJson(
      JSON.stringify({
        version: 1,
        personal: { name: 'Imported', phone: 123, futureField: 'x' },
        skills: [],
        experience: [],
        projects: [],
        education: [],
        certifications: [],
        languages: [],
      }),
    )
    expect(result.ok).toBe(true)
    expect(store.resume.personal.name).toBe('Imported')
    // non-string phone is dropped → base value survives (lenient import)
    expect(store.resume.personal.phone).toBe('0812-0000')
    expect('futureField' in store.resume.personal).toBe(false)
  })

  it('resetStore restores defaults', () => {
    const store = useResumeStore()
    store.resume.personal.name = 'Budi'
    store.setActiveLang('id')
    store.resetStore()
    expect(store.resume.personal.name).toBe('')
    expect(store.activeLang).toBe('en')
  })
})

describe('saveToLocalStorage', () => {
  beforeEach(() => {
    useResumeStore().resetStore()
    localStorage.clear()
  })

  it('persists the current resume JSON snapshot at RESUME_STORAGE_KEY', () => {
    const store = useResumeStore()
    store.resume.personal.name = 'Budi Santoso'
    store.resume.personal.phone = '0812-0000'
    store.addSkillGroup()
    store.resume.skills[0]!.label.en = 'Languages'

    const result = store.saveToLocalStorage()
    expect(result).toEqual({ ok: true, errors: [] })

    const raw = localStorage.getItem(RESUME_STORAGE_KEY)
    expect(raw).toBe(store.exportJson())
    const parsed = JSON.parse(raw!) as Resume
    expect(parsed.version).toBe(1)
    expect(parsed.personal.name).toBe('Budi Santoso')
    expect(parsed.skills[0]!.label.en).toBe('Languages')
  })

  it('stores a snapshot, not a live reference (later edits need another save)', () => {
    const store = useResumeStore()
    store.resume.personal.name = 'Siti Rahma'
    const before = store.exportJson()

    const result = store.saveToLocalStorage()
    expect(result.ok).toBe(true)

    store.resume.personal.name = 'Budi Santoso'
    expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBe(before)
  })

  it('stores a blob that round-trips through importJson unchanged', () => {
    const store = useResumeStore()
    store.resume.personal.name = 'Budi Santoso'
    store.resume.summary.en = 'Backend engineer.'
    store.addExperience()
    store.resume.experience[0]!.role.en = 'Senior Backend Engineer'
    const before = JSON.parse(store.exportJson()) as Resume

    const result = store.saveToLocalStorage()
    expect(result.ok).toBe(true)

    const imported = useResumeStore().importJson(localStorage.getItem(RESUME_STORAGE_KEY)!)
    expect(imported).toEqual({ ok: true, errors: [] })
    expect(useResumeStore().resume).toEqual(before)
  })

  it('reports a quota error when setItem throws QuotaExceededError', () => {
    const store = useResumeStore()
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    try {
      const result = store.saveToLocalStorage()
      expect(result).toEqual({ ok: false, errors: ['Storage quota exceeded'] })
      expect(spy).toHaveBeenCalledWith(RESUME_STORAGE_KEY, store.exportJson())
    } finally {
      spy.mockRestore()
    }
  })

  it('reports storage unavailable when setItem throws any other error', () => {
    const store = useResumeStore()
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    try {
      const result = store.saveToLocalStorage()
      expect(result).toEqual({ ok: false, errors: ['Storage unavailable'] })
      expect(spy).toHaveBeenCalledTimes(1)
    } finally {
      spy.mockRestore()
    }
  })

  it('reports storage unavailable when localStorage is undefined', () => {
    const store = useResumeStore()
    vi.stubGlobal('localStorage', undefined)
    try {
      const result = store.saveToLocalStorage()
      expect(result).toEqual({ ok: false, errors: ['Storage unavailable'] })
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('restoreFromLocalStorage', () => {
  beforeEach(() => {
    useResumeStore().resetStore()
    localStorage.clear()
  })

  it('is a silent no-op when nothing is saved', () => {
    const store = useResumeStore()
    expect(localStorage.getItem(RESUME_STORAGE_KEY)).toBeNull()

    const result = store.restoreFromLocalStorage()

    expect(result).toEqual({ ok: true, errors: [] })
    expect(store.resume.personal.name).toBe('')
    expect(store.resume.skills).toEqual([])
  })

  it('restores a saved snapshot byte-faithfully including ids', () => {
    const store = useResumeStore()
    store.resume.personal.name = 'Budi Santoso'
    store.resume.summary.en = 'Backend engineer.'
    store.addSkillGroup()
    store.resume.skills[0]!.label.en = 'Languages'
    store.addExperience()
    store.resume.experience[0]!.role.en = 'Senior Backend Engineer'
    const saved = JSON.parse(store.exportJson()) as Resume

    store.saveToLocalStorage()
    store.resume.personal.name = 'Mutated'
    useResumeStore().resetStore()
    expect(useResumeStore().resume.personal.name).toBe('')

    const result = store.restoreFromLocalStorage()

    expect(result).toEqual({ ok: true, errors: [] })
    expect(useResumeStore().resume).toEqual(saved)
  })

  it('replaces the store instead of merging with in-flight state', () => {
    const store = useResumeStore()
    // Prefill with values that must NOT survive the restore.
    store.resume.personal.name = 'Base Name'
    store.resume.personal.phone = '0812-BASE'
    store.addSkillGroup()
    store.resume.skills[0]!.label.en = 'Base Skill'

    localStorage.setItem(
      RESUME_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        personal: { name: 'Seeded Name', phone: '0812-SEED' },
        skills: [
          { id: 'seed-skill', label: { en: 'Seed Skill', id: '' }, items: { en: '', id: '' } },
        ],
        experience: [],
        projects: [],
        education: [],
        certifications: [],
        languages: [],
      }),
    )

    const result = store.restoreFromLocalStorage()

    expect(result).toEqual({ ok: true, errors: [] })
    expect(store.resume.personal.name).toBe('Seeded Name')
    expect(store.resume.personal.phone).toBe('0812-SEED')
    expect(store.resume.skills).toHaveLength(1)
    expect(store.resume.skills[0]!.id).toBe('seed-skill')
    expect(store.resume.skills[0]!.label.en).toBe('Seed Skill')
    // None of the prefilled base values survive.
    expect(store.resume.skills.some((g) => g.label.en === 'Base Skill')).toBe(false)
  })

  it('reports invalid JSON stored under the key', () => {
    localStorage.setItem(RESUME_STORAGE_KEY, '{not json')

    const result = useResumeStore().restoreFromLocalStorage()

    expect(result.ok).toBe(false)
    expect(result.errors).toContain('Invalid JSON')
  })

  it('reports an unsupported version stored under the v1 key', () => {
    localStorage.setItem(
      RESUME_STORAGE_KEY,
      JSON.stringify({
        version: 2,
        personal: { name: 'X' },
        skills: [],
        experience: [],
        projects: [],
        education: [],
        certifications: [],
        languages: [],
      }),
    )

    const result = useResumeStore().restoreFromLocalStorage()

    expect(result.ok).toBe(false)
    expect(result.errors).toContain('Unsupported resume.json version')
  })

  it('reports structurally invalid resume json', () => {
    localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify({ version: 1, personal: { name: 42 } }))

    const result = useResumeStore().restoreFromLocalStorage()

    expect(result.ok).toBe(false)
    expect(result.errors).toContain('Invalid resume.json structure')
  })

  it('reports storage unavailable when localStorage is undefined', () => {
    const store = useResumeStore()
    vi.stubGlobal('localStorage', undefined)
    try {
      const result = store.restoreFromLocalStorage()
      expect(result).toEqual({ ok: false, errors: ['Storage unavailable'] })
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('reports storage unavailable when getItem throws', () => {
    const store = useResumeStore()
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    try {
      const result = store.restoreFromLocalStorage()
      expect(result).toEqual({ ok: false, errors: ['Storage unavailable'] })
      expect(spy).toHaveBeenCalledWith(RESUME_STORAGE_KEY)
    } finally {
      spy.mockRestore()
    }
  })

  it('restores the resume but keeps activeLang reset to en', () => {
    const store = useResumeStore()
    store.resume.personal.name = 'Budi'
    store.setActiveLang('id')

    store.saveToLocalStorage()
    useResumeStore().resetStore()
    expect(useResumeStore().activeLang).toBe('en')

    const result = store.restoreFromLocalStorage()

    expect(result).toEqual({ ok: true, errors: [] })
    expect(useResumeStore().resume.personal.name).toBe('Budi')
    expect(useResumeStore().activeLang).toBe('en')
  })
})
