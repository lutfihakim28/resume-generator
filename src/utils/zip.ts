import JSZip from 'jszip'

export interface BundleFile {
  name: string
  content: string | Uint8Array
}

/**
 * ZIP a set of files into a Blob (DEFLATE compressed). Generic — naming and
 * file selection live in the caller; this util only owns the archive.
 */
export async function createBundleZip(files: BundleFile[]): Promise<Blob> {
  const zip = new JSZip()
  for (const file of files) {
    zip.file(file.name, file.content)
  }
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}
