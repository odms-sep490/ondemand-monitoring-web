import type { ChecklistEvidenceInput } from '../api/checklistsApi'

export const MAX_MEDIA_COUNT = 500
export const MAX_VIDEO_SECONDS = 7200

/** Raw evidence form state keeps input strings intact while the user is typing. */
export type ChecklistEvidenceForm = {
  includedImageCount: string
  includedVideoCount: string
  standardVideoDurationSeconds: string
}

export type ChecklistEvidenceErrors = Partial<
  Record<keyof ChecklistEvidenceForm, 'invalid'>
>

export const emptyEvidenceForm = (): ChecklistEvidenceForm => ({
  includedImageCount: '0',
  includedVideoCount: '0',
  standardVideoDurationSeconds: '',
})

export function evidenceToForm(row: {
  includedImageCount?: number
  includedVideoCount?: number
  standardVideoDurationSeconds?: number | null
}): ChecklistEvidenceForm {
  return {
    includedImageCount: String(row.includedImageCount ?? 0),
    includedVideoCount: String(row.includedVideoCount ?? 0),
    standardVideoDurationSeconds:
      row.standardVideoDurationSeconds == null
        ? ''
        : String(row.standardVideoDurationSeconds),
  }
}

const wholeNumber = (value: string, min: number, max: number) => {
  if (!/^\d+$/.test(value.trim())) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max
    ? parsed
    : null
}

/** Validates only evidence allowances; Base Checklist prices use their own Admin screen. */
export function validateEvidenceForm(
  form: ChecklistEvidenceForm,
):
  | { ok: true; value: ChecklistEvidenceInput }
  | { ok: false; errors: ChecklistEvidenceErrors } {
  const errors: ChecklistEvidenceErrors = {}
  const images = wholeNumber(form.includedImageCount, 0, MAX_MEDIA_COUNT)
  const videos = wholeNumber(form.includedVideoCount, 0, MAX_MEDIA_COUNT)
  const duration = form.standardVideoDurationSeconds.trim()
    ? wholeNumber(form.standardVideoDurationSeconds, 1, MAX_VIDEO_SECONDS)
    : undefined

  if (images === null) errors.includedImageCount = 'invalid'
  if (videos === null) errors.includedVideoCount = 'invalid'
  if (duration === null) errors.standardVideoDurationSeconds = 'invalid'
  if (Object.keys(errors).length) return { ok: false, errors }

  return {
    ok: true,
    value: {
      includedImageCount: images!,
      includedVideoCount: videos!,
      ...(duration === undefined ? {} : { standardVideoDurationSeconds: duration }),
    },
  }
}
