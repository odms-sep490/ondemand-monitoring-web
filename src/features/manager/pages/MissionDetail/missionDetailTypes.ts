export type MissionDetailTab =
  | 'result'
  | 'reports'
  | 'media'
  | 'checklist'
  | 'route'
  | 'plan'
  | 'permit'
  | 'contract'
  | 'resources'
  | 'checks'
  | 'finance'

export type NextStep = {
  tone: 'wait' | 'go' | 'done' | 'bad'
  title: string
  detail: string
}
