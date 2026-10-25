export const journeyStages = [
  'request',
  'scope',
  'inspection',
  'report',
] as const

export type JourneyStageId = (typeof journeyStages)[number]

export const journeyDuration: Record<JourneyStageId, number> = {
  request: 5600,
  scope: 5600,
  inspection: 5600,
  report: 5600,
}

export function nextJourneyStage(stage: JourneyStageId): JourneyStageId {
  const index = journeyStages.indexOf(stage)
  return journeyStages[(index + 1) % journeyStages.length]
}
