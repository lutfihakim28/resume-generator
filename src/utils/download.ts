/**
 * Trigger a browser file download of text content without appending the
 * anchor to the DOM. Extracted to a util so export is unit-testable without
 * DOM hacking. The object URL is revoked immediately after click() — the
 * download starts synchronously.
 */
export function downloadTextFile(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  try {
    anchor.click()
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Same detached-anchor download for binary payloads (e.g. the generated PDF). */
export function downloadBlobFile(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  try {
    anchor.click()
  } finally {
    URL.revokeObjectURL(url)
  }
}
