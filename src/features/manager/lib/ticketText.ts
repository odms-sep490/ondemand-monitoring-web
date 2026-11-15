import { getLanguage } from '../../../shared/i18n'
import { managerLibMessages } from './lib.messages'

/** Localised label for a backend issue-type code; unknown codes fall back to a generic label, never the raw code. */
export function formatIssueType(code: string): string {
  const t = managerLibMessages[getLanguage()].ticket
  return t.issueTypes[code] ?? t.unknownIssue
}

/** Swaps raw status enums that leak into free text for readable words. */
function localizeStatusWords(text: string): string {
  const words = managerLibMessages[getLanguage()].ticket.statusWords
  return text.replace(/\b(MAINTENANCE|OUT_OF_SERVICE|AVAILABLE|OFFLINE)\b/g, (m) => words[m] ?? m)
}

/** Short localised title for auto-generated post-flight maintenance tickets. */
export function formatTicketTitle(title: string, deviceCode?: string): string {
  const match = title.match(/post-?flight\b[^.]*?\bfor device\s+([^\s.]+)/i)
  if (match) return managerLibMessages[getLanguage()].ticket.title(deviceCode || match[1])
  return localizeStatusWords(title)
}

/** Turns the raw backend text into short, readable lines in the active language. */
export function formatTicketDescription(
  text: string,
  deviceCode?: string,
): string {
  const t = managerLibMessages[getLanguage()].ticket
  const parsedDevice = text.match(/post-?flight\b[^.]*?\bfor device\s+([^\s.]+)/i)?.[1]
  const device = parsedDevice ? deviceCode || parsedDevice : undefined
  const results = [...text.matchAll(/\b([ape]\d|d\d)\s*=\s*(PASS|FAIL)\b/gi)]
  const failed: string[] = []
  const passed: string[] = []
  for (const [, key, result] of results) {
    const label = t.inspection[key.toLowerCase()] ?? t.unknownInspection(key)
    const bucket = result.toUpperCase() === 'FAIL' ? failed : passed
    if (!bucket.includes(label)) bucket.push(label)
  }
  const note = text
    .replace(/^.*?Notes:\s*/is, '')
    .replace(/Inspection:.*$/is, '')
    .trim()
  const hasNote = /Notes:/i.test(text) && note && !/^post-?flight/i.test(note)

  if (!device && results.length === 0) return localizeStatusWords(text)

  const lines: string[] = []
  lines.push(device ? t.deviceNeeds(device) : t.needs)
  if (failed.length) lines.push(t.failed(failed.join(', ')))
  if (passed.length) lines.push(t.passed(passed.join(', ')))
  if (hasNote) lines.push(t.note(note))
  return lines.join('\n')
}
