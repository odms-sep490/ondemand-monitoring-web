import type {
  ManualUploadTask,
  BadMediaItem,
  WaitingDeliveryMission,
} from '../../types/media'

// ── main page ──────────────────────────────────────────────────────────────

export type ActiveModal =
  | { kind: 'reassign'; task: ManualUploadTask }
  | { kind: 'reupload'; media: BadMediaItem }
  | { kind: 'deliver'; mission: WaitingDeliveryMission }
  | null
