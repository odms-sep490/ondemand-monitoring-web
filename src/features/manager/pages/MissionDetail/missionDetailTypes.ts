export type MissionDetailTab =
  | 'result'
  | 'media'
  | 'checklist'
  | 'route'
  | 'plan'
  | 'resources'
  | 'checks'
  | 'finance'

export type NextStep = {
  tone: 'wait' | 'go' | 'done' | 'bad'
  title: string
  detail: string
}
