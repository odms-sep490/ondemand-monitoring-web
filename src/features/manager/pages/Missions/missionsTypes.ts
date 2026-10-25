import type { MissionStatus } from '../../../../shared/types/domain'
import type { DeliveryStatus as WorkflowDeliveryStatus } from '../../../delivery/types'
import type { MissionResultApprovalStatus } from '../../types/missions'
import { missionsPageMessages } from './MissionsPage.messages'

export type StatusChip = 'ALL' | MissionStatus

export type DeliveryStatus =
  | WorkflowDeliveryStatus
  | MissionResultApprovalStatus
  | 'NO_RESULT'
  | 'NOT_READY'
  | 'LOADING'

export type PageMessages = (typeof missionsPageMessages)['vi']
