import { beforeEach, describe, expect, it } from 'vitest'

import { useResumeStore } from '@/composables/useResumeStore'

describe('useResumeStore', () => {
  beforeEach(() => {
    useResumeStore().resetStore()
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
