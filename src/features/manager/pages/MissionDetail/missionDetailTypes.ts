export type MissionDetailTab =
  | 'result'
  | 'media'
  | 'checklist'
  | 'route'
  | 'order'
  | 'resources'
  | 'checks'
  | 'finance'

export type NextStep = {
  tone: 'wait' | 'go' | 'done' | 'bad'
  title: string
  detail: string
}
