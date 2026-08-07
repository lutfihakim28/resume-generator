import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { downloadTextFile } from '@/utils/download'

describe('downloadTextFile', () => {
  const createObjectURL = vi.fn<() => string>(() => 'blob:mock-url')
  const revokeObjectURL = vi.fn<() => void>()
  const originalCreateElement = document.createElement.bind(document)
  const createdAnchors: HTMLAnchorElement[] = []
  let clickSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // jsdom has no URL.createObjectURL — stub it, plus Blob to capture args.
    vi.stubGlobal('URL', { createObjectURL, revokeObjectURL })
    vi.stubGlobal(
      'Blob',
      class MockBlob extends Blob {
        constructor(...args: ConstructorParameters<typeof Blob>) {
          super(...args)
          ;(globalThis as Record<string, unknown>).__lastBlobArgs = args
        }
      },
    )
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag)
      if (tag === 'a') createdAnchors.push(el as HTMLAnchorElement)
      return el
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    createdAnchors.length = 0
    delete (globalThis as Record<string, unknown>).__lastBlobArgs
  })

  it('creates a blob with the content and mime type', () => {
    downloadTextFile('resume.json', '{"a":1}', 'application/json')

    const args = (globalThis as Record<string, unknown>).__lastBlobArgs as [
      BlobPart[],
      BlobPropertyBag,
    ]
    expect(args[0]).toEqual(['{"a":1}'])
    expect(args[1]).toEqual({ type: 'application/json' })
  })

  it('sets the anchor download name and blob URL, clicks it, then revokes', () => {
    downloadTextFile('resume-budi.json', '{}', 'application/json')

    const anchor = createdAnchors[0]!
    expect(anchor.download).toBe('resume-budi.json')
    expect(anchor.href).toBe('blob:mock-url')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    // The anchor is never appended to the document.
    expect(document.body.contains(anchor)).toBe(false)
  })

  it('revokes the URL even when click() throws', () => {
    clickSpy.mockImplementationOnce(() => {
      throw new Error('download blocked')
    })

    expect(() => downloadTextFile('resume.json', '{}', 'application/json')).toThrow(
      'download blocked',
    )
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
