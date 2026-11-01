import { clamp } from './format'
import type { ReadinessScore, FormState } from './types'

export type ScoreNotes = {
  missingAddress: string
  missingService: string
  missingDeliverable: string
  missingSchedule: string
  largeRadius: string
  allGood: string
}

/** Simulated readiness score: starts at 92 and loses points per missing field. */
export function scoreRequest(form: FormState, notesT: ScoreNotes): ReadinessScore {
  const notes: string[] = []
  let score = 92

  if (!form.address.trim()) {
    score -= 18
    notes.push(notesT.missingAddress)
  }
  if (!form.serviceId) {
    score -= 20
    notes.push(notesT.missingService)
  }
  if (!form.deliverableTypeId) {
    score -= 14
    notes.push(notesT.missingDeliverable)
  }
  if (!form.preferredDateFrom || !form.preferredDateTo || !form.preferredTimeId) {
    score -= 18
    notes.push(notesT.missingSchedule)
  }
  if (form.radiusM > 900) {
    score -= 12
    notes.push(notesT.largeRadius)
  }
  if (notes.length === 0) notes.push(notesT.allGood)

  return {
    score: clamp(score, 0, 100),
    level: score >= 80 ? 'good' : score >= 55 ? 'warn' : 'bad',
    notes,
  }
}
