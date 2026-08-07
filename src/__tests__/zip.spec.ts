// @vitest-environment node
/**
 * Bundle zip tests — run in Node (no DOM needed). Round-trips through the
 * REAL JSZip loader so the archive is proven readable, and checks the raw
 * bytes start with the zip local-file magic `PK\x03\x04`.
 */
import { describe, expect, it } from 'vitest'

import JSZip from 'jszip'
import { createBundleZip } from '@/utils/zip'

describe('createBundleZip', () => {
  it('produces a real zip whose raw bytes start with the PK magic', async () => {
    const blob = await createBundleZip([{ name: 'a.txt', content: 'hello' }])

    const bytes = new Uint8Array(await blob.arrayBuffer())
    // 'PK\x03\x04' — zip local file header signature.
    expect(String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!)).toBe('PK\u0003\u0004')
  })

  it('round-trips binary and text entries with their exact names', async () => {
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37])
    const json = JSON.stringify({ version: 1, personal: { name: 'Budi' } })

    const blob = await createBundleZip([
      { name: 'resume-budi-en.pdf', content: pdfBytes },
      { name: 'resume-budi.json', content: json },
    ])

    const zip = await JSZip.loadAsync(new Uint8Array(await blob.arrayBuffer()))
    expect(Object.keys(zip.files)).toContain('resume-budi-en.pdf')
    expect(Object.keys(zip.files)).toContain('resume-budi.json')

    const pdfBack = await zip.file('resume-budi-en.pdf')!.async('uint8array')
    expect(Array.from(pdfBack)).toEqual(Array.from(pdfBytes))

    const jsonBack = await zip.file('resume-budi.json')!.async('string')
    expect(JSON.parse(jsonBack)).toEqual({ version: 1, personal: { name: 'Budi' } })
  })
})
