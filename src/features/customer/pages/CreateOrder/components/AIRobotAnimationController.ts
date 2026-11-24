export type AIMascotState =
  | 'idle'
  | 'welcome'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'explaining'
  | 'pointing'
  | 'confirming'
  | 'success'
  | 'error'
  | 'goodbye'

export type AIRobotExpression =
  | 'happy'
  | 'curious'
  | 'focused'
  | 'excited'
  | 'confused'
  | 'calm'
  | 'encouraging'

export type AIRobotGesture =
  | 'none'
  | 'wave'
  | 'nod'
  | 'head_tilt'
  | 'look_at_target'
  | 'present_card'
  | 'point_left'
  | 'point_right'
  | 'open_hands'
  | 'celebrate'
  | 'small_bounce'
  | 'aerial_spin'
  | 'hand_flourish'
  | 'inspect_holo'

export type AIMascotPointDirection = 'left' | 'right' | 'down'

export type AIRobotEvent =
  | 'SESSION_STARTED'
  | 'MICROPHONE_STARTED'
  | 'MICROPHONE_STOPPED'
  | 'MESSAGE_SENT'
  | 'AGENT_REQUEST_STARTED'
  | 'AGENT_RESPONSE_RECEIVED'
  | 'TTS_PLAYBACK_STARTED'
  | 'TTS_PLAYBACK_ENDED'
  | 'SERVICE_RECOMMENDED'
  | 'SERVICE_SELECTED'
  | 'REQUIREMENT_CONFIRMED'
  | 'DESCRIPTION_READY'
  | 'REVIEW_READY'
  | 'VALIDATION_FAILED'
  | 'SESSION_CLOSED'

/** Priority tiers enforced by the central RobotAnimationDirector. */
export const ROBOT_ANIMATION_PRIORITY = {
  USER_INTERACTION: 50,
  REAL_AUDIO_STATE: 40,
  ACTIVE_CONSULTATION: 30,
  SHORT_SUCCESS_FEEDBACK: 20,
  DECORATIVE_IDLE: 10,
} as const

export type RobotAnimationPriorityTier = keyof typeof ROBOT_ANIMATION_PRIORITY

/** Controlled procedural idle micro-behaviors (never run while user is typing/reading). */
export type RobotIdleAction =
  | 'none'
  | 'look_left'
  | 'look_right'
  | 'double_blink'
  | 'head_tilt'
  | 'hover_adjust'
  | 'inspect_holo_hand'
  | 'gentle_wave'
  | 'pointer_smile'

export const PROCEDURAL_IDLE_POOL: readonly RobotIdleAction[] = [
  'look_left',
  'look_right',
  'double_blink',
  'head_tilt',
  'hover_adjust',
  'inspect_holo_hand',
  'gentle_wave',
] as const

/** Controlled variations for success/confirmation milestones (deterministic for visual tests). */
export type RobotSuccessVariation =
  | 'nod'
  | 'small_wave'
  | 'smile_tilt'
  | 'hand_flourish'
  | 'celebrate_pop'

const SUCCESS_VARIATIONS: readonly RobotSuccessVariation[] = [
  'nod',
  'small_wave',
  'smile_tilt',
  'hand_flourish',
  'celebrate_pop',
] as const

export function pickSuccessVariation(counter: number): RobotSuccessVariation {
  const safeIndex = Math.abs(Math.floor(counter)) % SUCCESS_VARIATIONS.length
  return SUCCESS_VARIATIONS[safeIndex]
}

/** Deterministic next idle action that avoids repeating the previous noticeable action. */
export function pickNextIdleAction(
  previous: RobotIdleAction,
  seed: number,
): RobotIdleAction {
  const candidates = PROCEDURAL_IDLE_POOL.filter((item) => item !== previous)
  const index = Math.abs(Math.floor(seed)) % candidates.length
  return candidates[index] ?? 'double_blink'
}

export type MascotStateSignals = {
  hasError: boolean
  recording: boolean
  thinking: boolean
  speaking: boolean
  pointing: boolean
  reaction: AIMascotState
  pointDirection?: AIMascotPointDirection
  userInteracting?: boolean
}

export type RobotPersonalitySnapshot = {
  state: AIMascotState
  expression: AIRobotExpression
  gesture: AIRobotGesture
  statusLabel: string
  priorityTier: RobotAnimationPriorityTier
}

export type RobotGazeVector = {
  /** Horizontal look offset in [-1, 1]. */
  x: number
  /** Vertical look offset in [-1, 1]. */
  y: number
}

export type RobotDirectorSnapshot = RobotPersonalitySnapshot & {
  idleAction: RobotIdleAction
  successVariation: RobotSuccessVariation
  gaze: RobotGazeVector
  pointDirection: AIMascotPointDirection
  calmFocus: boolean
}

export function resolvePriorityTier(state: AIMascotState): RobotAnimationPriorityTier {
  switch (state) {
    case 'error':
    case 'goodbye':
      return 'USER_INTERACTION'
    case 'listening':
    case 'speaking':
      return 'REAL_AUDIO_STATE'
    case 'thinking':
    case 'pointing':
    case 'explaining':
      return 'ACTIVE_CONSULTATION'
    case 'welcome':
    case 'confirming':
    case 'success':
      return 'SHORT_SUCCESS_FEEDBACK'
    case 'idle':
    default:
      return 'DECORATIVE_IDLE'
  }
}

/**
 * Single-state priority resolver ensuring only one primary animation state is active at a time.
 * Priority: error > listening > thinking > speaking > pointing > transient reaction > idle.
 */
export function resolveMascotState(signals: MascotStateSignals): AIMascotState {
  if (signals.hasError) return 'error'
  if (signals.recording) return 'listening'
  if (signals.thinking) return 'thinking'
  if (signals.speaking) return 'speaking'
  if (signals.pointing) return 'pointing'
  if (signals.reaction !== 'idle') return signals.reaction
  return 'idle'
}

export function resolveRobotExpression(state: AIMascotState): AIRobotExpression {
  switch (state) {
    case 'welcome':
      return 'happy'
    case 'listening':
      return 'focused'
    case 'thinking':
      return 'curious'
    case 'speaking':
    case 'explaining':
      return 'encouraging'
    case 'pointing':
      return 'focused'
    case 'confirming':
      return 'happy'
    case 'success':
      return 'excited'
    case 'error':
      return 'confused'
    case 'goodbye':
    case 'idle':
    default:
      return 'calm'
  }
}

export function resolveRobotGesture(
  state: AIMascotState,
  pointDirection: AIMascotPointDirection = 'down',
  successVariation?: RobotSuccessVariation,
): AIRobotGesture {
  switch (state) {
    case 'welcome':
    case 'goodbye':
      return 'wave'
    case 'thinking':
      return 'head_tilt'
    case 'speaking':
    case 'explaining':
      return 'open_hands'
    case 'pointing':
      if (pointDirection === 'left') return 'point_left'
      if (pointDirection === 'right') return 'point_right'
      return 'present_card'
    case 'confirming':
      if (successVariation === 'small_wave') return 'wave'
      if (successVariation === 'hand_flourish') return 'hand_flourish'
      if (successVariation === 'smile_tilt') return 'head_tilt'
      return 'nod'
    case 'success':
      if (successVariation === 'hand_flourish') return 'hand_flourish'
      if (successVariation === 'small_wave') return 'wave'
      return 'celebrate'
    case 'listening':
      return 'look_at_target'
    case 'error':
      return 'head_tilt'
    case 'idle':
    default:
      return 'none'
  }
}

export function resolveRobotPersonality(
  signals: MascotStateSignals,
): RobotPersonalitySnapshot {
  const state = resolveMascotState(signals)
  return {
    state,
    expression: resolveRobotExpression(state),
    gesture: resolveRobotGesture(state, signals.pointDirection),
    statusLabel: MASCOT_STATUS_LABEL[state],
    priorityTier: resolvePriorityTier(state),
  }
}

export function resolveDirectorSnapshot(
  signals: MascotStateSignals,
  options?: {
    idleAction?: RobotIdleAction
    successCounter?: number
    gaze?: RobotGazeVector
    calmFocus?: boolean
  },
): RobotDirectorSnapshot {
  const state = resolveMascotState(signals)
  const calmFocus = Boolean(options?.calmFocus)
  const successVariation = pickSuccessVariation(options?.successCounter ?? 0)
  const pointDirection = signals.pointDirection ?? 'down'
  const allowIdle = state === 'idle' && !calmFocus
  const idleAction: RobotIdleAction = allowIdle ? (options?.idleAction ?? 'none') : 'none'

  let gesture = resolveRobotGesture(state, pointDirection, successVariation)
  if (state === 'idle' && idleAction === 'gentle_wave') gesture = 'wave'
  else if (state === 'idle' && idleAction === 'inspect_holo_hand') gesture = 'inspect_holo'
  else if (state === 'idle' && idleAction === 'head_tilt') gesture = 'head_tilt'

  let expression = resolveRobotExpression(state)
  if (state === 'idle' && (idleAction === 'pointer_smile' || idleAction === 'gentle_wave')) {
    expression = 'happy'
  } else if (state === 'idle' && idleAction === 'inspect_holo_hand') {
    expression = 'curious'
  }

  let gaze: RobotGazeVector = options?.gaze ?? { x: 0, y: 0 }
  if (state === 'idle' && gaze.x === 0 && gaze.y === 0) {
    if (idleAction === 'look_left') gaze = { x: -0.75, y: -0.08 }
    else if (idleAction === 'look_right') gaze = { x: 0.75, y: -0.08 }
    else if (idleAction === 'inspect_holo_hand') gaze = { x: 0.55, y: 0.35 }
  } else if (state === 'pointing' && gaze.x === 0 && gaze.y === 0) {
    if (pointDirection === 'left') gaze = { x: -0.8, y: 0.15 }
    else if (pointDirection === 'right') gaze = { x: 0.8, y: 0.15 }
    else gaze = { x: 0, y: 0.65 }
  }

  return {
    state,
    expression,
    gesture,
    statusLabel: MASCOT_STATUS_LABEL[state],
    priorityTier: resolvePriorityTier(state),
    idleAction,
    successVariation,
    gaze,
    pointDirection,
    calmFocus,
  }
}

/** Maps a typed backend/UI event to its corresponding transient mascot state. */
export function mascotStateForEvent(event: AIRobotEvent): AIMascotState {
  switch (event) {
    case 'SESSION_STARTED':
      return 'welcome'
    case 'MICROPHONE_STARTED':
      return 'listening'
    case 'MESSAGE_SENT':
    case 'AGENT_REQUEST_STARTED':
      return 'thinking'
    case 'TTS_PLAYBACK_STARTED':
      return 'speaking'
    case 'SERVICE_RECOMMENDED':
      return 'pointing'
    case 'SERVICE_SELECTED':
    case 'REQUIREMENT_CONFIRMED':
      return 'confirming'
    case 'DESCRIPTION_READY':
    case 'REVIEW_READY':
      return 'success'
    case 'VALIDATION_FAILED':
      return 'error'
    case 'SESSION_CLOSED':
      return 'goodbye'
    case 'MICROPHONE_STOPPED':
    case 'AGENT_RESPONSE_RECEIVED':
    case 'TTS_PLAYBACK_ENDED':
    default:
      return 'idle'
  }
}

export const MASCOT_STATUS_LABEL: Record<AIMascotState, string> = {
  idle: 'Sẵn sàng hỗ trợ',
  welcome: 'Chào mừng anh/chị',
  listening: 'Đang lắng nghe…',
  thinking: 'Đang phân tích…',
  speaking: 'Đang trao đổi…',
  explaining: 'Đang giải thích…',
  pointing: 'Đang gợi ý nội dung',
  confirming: 'Đã ghi nhận thông tin',
  success: 'Hoàn tất bước này',
  error: 'Cần kiểm tra lại',
  goodbye: 'Hẹn gặp lại anh/chị',
}
