import { newEventId } from '../api/uploadFailureJournal'

// An API retry with the same File object reuses its intent. Explicit file selection
// supplies a new intent, even when the content/checksum is identical.
const intents = new WeakMap<File, string>()
export function createStaffUploadIntent(): string {
  return newEventId()
}
export function resolveStaffUploadIntent(
  file: File,
  selectedIntent?: string,
): string {
  if (selectedIntent) return selectedIntent
  let intent = intents.get(file)
  if (!intent) {
    intent = createStaffUploadIntent()
    intents.set(file, intent)
  }
  return intent
}
