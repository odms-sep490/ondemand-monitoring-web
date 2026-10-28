export type MissionDetailTab =
  'result' | 'media' | 'checklist' | 'route' | 'order' | 'checks'

export type NextStep = {
  tone: 'wait' | 'go' | 'done' | 'bad'
  title: string
  detail: string
}
