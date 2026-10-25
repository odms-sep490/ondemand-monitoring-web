import type { MissionStaffRole } from '../../../mission/types/mission'
import { SIMULATION_MAP_DEFAULT_CROP } from '../../../../shared/lib/simulationMapProjection'
import type { DispatchStep } from './liveDispatchTypes'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'

export const missionRoles: MissionStaffRole[] = [
  'PILOT',
  'OPERATOR',
  'MAINTAINER',
  'INSPECTOR',
]

export const SIMULATION_MAP_TOP_IMAGE =
  '/simulation-viewer/simulation_map_top.png'

export const SIMULATION_MAP_VERSION = '20260925113000'

export const SIMULATION_MAP_BOUNDS = {
  minX: -417.15933531249993,
  maxX: 415.15933531249993,
  minY: -414.65578218749977,
  maxY: 417.66288843749993,
}

export const SIMULATION_MAP_IMAGE_CROP = SIMULATION_MAP_DEFAULT_CROP

export const dispatchSteps: DispatchStep[] = [
  'order',
  'mission',
  'staff',
  'device',
  'confirm',
]

export const stepSubtitles: Record<
  DispatchStep,
  keyof (typeof liveDispatchPageMessages)['vi']
> = {
  order: 'orderStepHint',
  mission: 'missionStepHint',
  staff: 'staffStepHint',
  device: 'deviceStepHint',
  confirm: 'confirmStepHint',
}

/** Resource-assignment sub-steps only; Order and Mission context come from the parent workflow. */
export const resourceSteps: DispatchStep[] = ['staff', 'device', 'confirm']
