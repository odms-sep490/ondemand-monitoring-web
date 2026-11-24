import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Alert, Button, Input, Modal, Space } from 'antd'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ApiError, apiRequest } from '../../../../../shared/api/httpClient'
import type {
  ServiceDeliverableOption,
  ServiceOption,
} from '../../../api/customerApi'
import {
  applyConfirmedAgentChanges,
  type OrderAgentSession,
} from '../../../lib/createOrder/orderAgent'
import type { ChecklistInput } from '../../../lib/checklist/types'
import { FLIGHT_PURPOSES, type FlightPurpose, type FormState, type Step } from '../../../lib/createOrder/types'
import { clearStoredDraft, createDefaultForm } from '../../../lib/createOrder/draftStorage'
import { isValidCoverageArea } from '../../../lib/createOrder/coverageGeometry'
import './OrderConversation.css'
import { OrderAssistantLauncher } from './OrderAssistantLauncher'
import { requestInfoPanelMessages } from './RequestInfoPanel.messages'
import { MissionDescriptionAssistant } from './MissionDescriptionAssistant'
import { AIAnimatedMascot, type AIMascotState } from './AIAnimatedMascot'
import {
  MASCOT_STATUS_LABEL,
  mascotStateForEvent,
  resolveMascotState,
  type AIMascotPointDirection,
  type AIRobotEvent,
  type RobotGazeVector,
} from './AIRobotAnimationController'
import { AI_MOTION } from './aiMotionTokens'
import { AIOrderDraftSummary } from './AIOrderDraftSummary'
import { AIPortalTransition } from './AIPortalTransition'
import { AnimatedServiceCard } from './AnimatedServiceCard'
import { AIThinkingBubble } from './AIThinkingBubble'
import { FlyingDataChipLayer, type FlyingChipPayload } from './FlyingDataChip'
import { MiniatureDroneIllustration } from './MiniatureDroneIllustration'
import { useRobotTargetRegistry, type RobotTargetId } from './RobotTargetRegistry'
import {
  ServiceMicroWorld,
  resolveServiceMicroWorldTheme,
} from './ServiceMicroWorld'
import { resolveSeedAudioUrl } from './aiSeedAudio'


const labels: Record<Step, string> = {
  1: 'Dịch vụ và mục đích bay',
  2: 'Chọn khu vực trên bản đồ',
  3: 'Chọn checklist, số ảnh và video',
  4: 'Điều kiện ra vào và quyền giám sát',
  5: 'Chọn ngày và khung giờ',
  6: 'Bàn giao và xem lại',
}
const guidance: Record<Step,string> = {
  1:'Chọn dịch vụ và mục đích chuyến bay phù hợp. Mô tả việc cần làm, khu vực và vị trí cần chú ý.',
  2:'Tìm địa chỉ hoặc chọn điểm trên bản đồ. Khoanh vùng bằng hình chữ nhật, hình tròn hoặc tự vẽ. Kiểm tra đúng vị trí và xác nhận để tiếp tục.',
  3:'Chọn từng công việc cần làm. Mở chi tiết, kiểm tra số ảnh và video, xem lại chi phí rồi xác nhận lựa chọn.',
  4:'Điền người liên hệ, số điện thoại và cách vào khu vực. Chọn quan hệ thực tế với khu vực, xác nhận quyền giám sát và khai giấy phép đúng thực tế.',
  5:'Chọn ngày bắt đầu, ngày kết thúc và khung giờ mong muốn.',
  6:'Kiểm tra dịch vụ, vị trí, checklist, liên hệ và lịch. Chọn sản phẩm bàn giao, thời hạn lưu trữ và đọc điều khoản. Bấm Xác nhận và tạo yêu cầu để gửi đơn.'
}
const base = '/api/customer/order-conversations'
const guidedPromptMarker = '\n\n[ONDEMAND_GUIDED_PROMPT]\n'

/** Module-level TTS audio cache so prepared/repeated prompts play instantaneously (0ms). */
const MAX_SPEECH_CACHE = 48
const speechBlobCache = new Map<string, Blob>()
const speechInFlight = new Map<string, Promise<Blob>>()

function rememberSpeechBlob(key: string, blob: Blob) {
  if (speechBlobCache.size >= MAX_SPEECH_CACHE) {
    const oldestKey = speechBlobCache.keys().next().value
    if (oldestKey !== undefined) speechBlobCache.delete(oldestKey)
  }
  speechBlobCache.set(key, blob)
}

function fetchCachedSpeechBlob(
  activeSessionId: string,
  chunkText: string,
  signal?: AbortSignal,
): Promise<Blob> {
  const key = chunkText.trim()
  const cached = speechBlobCache.get(key)
  if (cached) return Promise.resolve(cached)

  const existing = speechInFlight.get(key)
  if (existing && !signal) return existing

  const promise = apiRequest<Blob>(`${base}/${activeSessionId}/speech`, {
    method: 'POST',
    body: { text: chunkText },
    responseType: 'blob',
    signal,
  }).then((blob) => {
    if (!blob.size) throw new Error('Máy chủ chưa trả về nội dung âm thanh.')
    rememberSpeechBlob(key, blob)
    return blob
  }).finally(() => {
    if (speechInFlight.get(key) === promise) speechInFlight.delete(key)
  })

  if (!signal) speechInFlight.set(key, promise)
  return promise
}

function visibleConversationMessage(content: string) {
  const markerIndex = content.indexOf(guidedPromptMarker)
  return markerIndex < 0 ? content : content.slice(0, markerIndex).trimEnd()
}

function visibleAssistantMessage(content: string) {
  return content
    .replace(
      /\s*(?:Bạn|Anh\/chị) (?:có )?muốn (?:tôi )?(?:biết|tìm hiểu) thêm về dịch vụ[^?!.]*[?!.]?/gi,
      '',
    )
    .replace(
      /\s*(?:Bạn|Anh\/chị) (?:có )?muốn (?:tôi )?hướng dẫn thêm(?: về bước sau)? không[?!.]?/gi,
      '',
    )
    .trim()
}

/** Keep the assistant's visible shortcut in the same order as the request wizard. */
function nextGuidedStep(
  form: FormState,
  checklist: ChecklistInput[],
  checklistValid: boolean | undefined,
  checklistReviewed: boolean,
): Step {
  if (
    !form.serviceId ||
    !form.flightPurpose ||
    (form.flightPurpose === 'OTHER' && !form.otherFlightPurpose.trim()) ||
    !form.description.trim()
  )
    return 1
  if (
    form.locationStatus !== 'confirmed' ||
    !form.locationConfirmedAt ||
    !isValidCoverageArea(form.coverageArea)
  )
    return 2
  if (!(checklistValid ?? checklist.length > 0) || !checklistReviewed) return 3

  const phone = form.siteContactPhone.trim()
  const siteDetailsComplete =
    Boolean(form.siteContactName.trim()) &&
    /^[+0-9 ().-]{8,20}$/.test(phone) &&
    Boolean(form.accessNotes.trim()) &&
    Boolean(form.monitoringRelationship) &&
    (form.monitoringRelationship !== 'OTHER' ||
      Boolean(form.otherMonitoringRelationship.trim())) &&
    form.monitoringAuthorizationConfirmed &&
    form.altitudeM >= 10 &&
    form.altitudeM <= 120 &&
    (form.permitStatus !== 'HAVE_PERMIT' ||
      (Boolean(form.permitNumber.trim()) &&
        form.permitDocuments.length > 0 &&
        Boolean(form.permitExpiresOn)))
  if (!siteDetailsComplete) return 4
  if (
    !form.preferredDateFrom ||
    !form.preferredDateTo ||
    !form.preferredTimeId
  )
    return 5
  if (!form.deliverableTypeId || !form.termsAccepted) return 6
  return 6
}

function guidedInstruction(step: Step, instruction: string) {
  return `[ONDEMAND_GUIDED_STEP:${step}]\n${instruction}`
}

function guidedReply(choice: string, instruction: string) {
  if (choice.startsWith('Tôi chọn dịch vụ '))
    return 'Chọn mục đích chuyến bay trong biểu mẫu bên dưới. Nếu không có mục phù hợp, chọn “Mục đích khác” rồi nhập mục đích cụ thể. Sau đó bấm Xác nhận mục đích.'
  if (choice.startsWith('Mục đích chuyến bay của tôi:'))
    return 'Anh/chị nhập khu vực cần giám sát và việc muốn thực hiện nhé. Em sẽ đọc mô tả rồi hỏi thêm từng ý để làm rõ nhiệm vụ.'
  const step = Number(instruction.match(/ONDEMAND_GUIDED_STEP:([1-6])/)?.[1])
  const replies: Record<number, string> = {
    1: 'Bổ sung mục đích chuyến bay và mô tả yêu cầu trong biểu mẫu bên dưới.',
    2: 'Chọn vị trí trên bản đồ, khoanh vùng cần giám sát rồi bấm Xác nhận và tiếp tục.',
    3: 'Chọn các hạng mục cần thực hiện, kiểm tra số ảnh và video rồi bấm Xác nhận và tiếp tục.',
    4: 'Nhập người liên hệ, số điện thoại và điều kiện ra vào. Chọn quan hệ với khu vực và xác nhận quyền giám sát.',
    5: 'Chọn ngày bắt đầu, ngày kết thúc và khung giờ mong muốn rồi bấm Xác nhận và tiếp tục.',
    6: 'Kiểm tra lại thông tin, chọn sản phẩm bàn giao và thời hạn lưu trữ. Đọc điều khoản trước khi bấm Xác nhận và tạo yêu cầu.',
  }
  return replies[step]
}

function flowInstruction(
  step: Step,
  completedStep?: Step,
  form?: FormState,
) {
  const orderedSteps =
    'dịch vụ → mục đích chuyến bay → mô tả yêu cầu giám sát → vị trí trên bản đồ → checklist → điều kiện ra vào và quyền giám sát → ngày và khung giờ → bàn giao và xem lại'
  if (step === 1 && form?.serviceId) {
    if (!form.flightPurpose ||
        (form.flightPurpose === 'OTHER' && !form.otherFlightPurpose.trim())) {
      return guidedInstruction(step, 'Dịch vụ đã được chọn. Chỉ hỏi khách mục đích chuyến bay; không giới thiệu thêm dịch vụ, không hỏi khách có muốn biết thêm về dịch vụ không. Sau khi có mục đích, hỏi mô tả yêu cầu giám sát rồi chuyển sang bản đồ.')
    }
    if (!form.description.trim()) {
      return guidedInstruction(step, 'Dịch vụ và mục đích đã được ghi nhận. Chỉ hỏi khách muốn giám sát khu vực nào và cần ghi nhận những gì; không hỏi thêm về dịch vụ. Chờ mô tả rồi chuyển sang bản đồ.')
    }
  }
  if (step === 2) {
    return guidedInstruction(step, 'Thông tin trước đã được ghi nhận. Hãy hướng dẫn khách chuyển ngay sang bước chọn khu vực trên bản đồ và chọn vùng cần giám sát. Không hỏi khách có muốn nghe hướng dẫn thêm hay có muốn tiếp tục không; đưa ra chỉ dẫn trực tiếp, ngắn gọn rồi dừng để khách thao tác trên bản đồ.')
  }
  if (completedStep && step === completedStep) {
    return guidedInstruction(step, 'Tôi vừa xác nhận ' + labels[completedStep] + '. Hãy chỉ hỏi thông tin còn thiếu của bước này, chưa chuyển sang bước khác. Quy trình theo thứ tự: ' + orderedSteps + '.')
  }
  if (step === 6) {
    return guidedInstruction(step, 'Các thông tin trước đã đầy đủ. Hướng dẫn khách kiểm tra lại yêu cầu, chọn sản phẩm bàn giao và thời hạn lưu trữ, đọc điều khoản rồi bấm Xác nhận và tạo yêu cầu. Chỉ báo tạo thành công sau khi hệ thống thực sự trả về mã đơn. Không hỏi khách có muốn biết thêm về dịch vụ hoặc có muốn nghe hướng dẫn thêm không.')
  }
  return guidedInstruction(step, 'Hãy hướng dẫn từng bước và hỏi tối đa một thông tin còn thiếu mỗi lượt. Chỉ hướng dẫn bước ' + labels[step] + '; không giới thiệu thêm dịch vụ, không hỏi khách có muốn biết thêm về dịch vụ hoặc có muốn nghe hướng dẫn thêm không, và chưa hỏi thông tin thuộc các bước sau. Quy trình theo thứ tự: ' + orderedSteps + '.')
}

function buildServiceWelcomeSpeech(services: ServiceOption[]) {
  const activeServices = services.filter((service) => service.isActive !== false && Boolean(service.name?.trim()))
  if (!activeServices.length) {
    return 'Xin chào anh chị, em là trợ lý tư vấn của OnDemand Monitor. Anh chị hãy chia sẻ nhu cầu giám sát để em tư vấn giải pháp và hỗ trợ tạo yêu cầu nhé.'
  }

  const ordinals = ['Thứ nhất là', 'Thứ hai là', 'Thứ ba là', 'Thứ tư là', 'Tiếp theo là']
  const details = activeServices.map((service, index) => {
    const lead = ordinals[index] ?? `Dịch vụ số ${index + 1} là`
    const desc = service.description?.trim().replace(/[.!?]+$/, '')
    const price =
      typeof service.defaultPrice === 'number'
        ? `, với mức giá tham khảo khoảng ${service.defaultPrice.toLocaleString('vi-VN')} đồng`
        : ''
    if (desc) {
      return `${lead} dịch vụ ${service.name}, chuyên ${desc.charAt(0).toLowerCase()}${desc.slice(1)}${price}.`
    }
    return `${lead} dịch vụ ${service.name}${price}.`
  })

  return (
    `Xin chào anh chị, em là trợ lý tư vấn của OnDemand Monitor. ` +
    `Hôm nay em xin giới thiệu chi tiết ${activeServices.length} dịch vụ giám sát bằng drone đang hoạt động để anh chị dễ dàng lựa chọn. ` +
    `${details.join(' ')} ` +
    `Anh chị có thể bấm chọn trực tiếp dịch vụ phù hợp ngay bên dưới, hoặc nói cho em biết khu vực và mục tiêu cần theo dõi để em tư vấn chi tiết hơn nhé.`
  )
}
type Props = {
  renderStep?: (step: Step) => ReactNode
  form: FormState
  setForm: (updater: (current: FormState) => FormState) => void
  services: ServiceOption[]
  deliverables: ServiceDeliverableOption[]
  serializeChecklist: () => ChecklistInput[]
  checklistValid?: boolean
  mediaTotals: { images: number; videos: number }
  onApply: (session: OrderAgentSession, expected: FormState) => void
  onSubmitFinal?: () => Promise<boolean>
  onOpenStep: (step: Step) => void
  onManualStepChange?: (step: Step | undefined) => void
  preferredTimes?: Array<{ id: string; name: string }>
  serviceSelectionStep?: boolean
}

export function OrderConversation(p: Props) {
  const [manualStep, setManualStep] = useState<Step>()
  const onManualStepChange = p.onManualStepChange
  useEffect(() => {
    onManualStepChange?.(manualStep)
  }, [manualStep, onManualStepChange])
  const [reviewedChecklistKey, setReviewedChecklistKey] = useState<string>()
  const [voiceError,setVoiceError] = useState('')
  const [assistantState, setAssistantState] = useState<
    'IDLE' | 'SENDING' | 'PROCESSING' | 'RESPONDING' | 'ERROR'
  >('IDLE')
  const [speaking, setSpeaking] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [voiceLoading, setVoiceLoading] = useState(false)
  const [speechAnalyser, setSpeechAnalyser] = useState<AnalyserNode | null>(null)
  const [mascotReaction, setMascotReaction] = useState<AIMascotState>('idle')
  const mascotReactionTimer = useRef<number | undefined>(undefined)
  const [responseReceived, setResponseReceived] = useState(false)
  const [pendingMessage, setPendingMessage] = useState<{
    requestId: string
    content: string
    status: 'sending' | 'failed'
  }>()
  const voiceRequest = useRef<AbortController | null>(null)
  const player = useRef<HTMLAudioElement | null>(null)
  const playerUrl = useRef('')
  const speechAudioContext = useRef<AudioContext | null>(null)
  const speechSource = useRef<MediaElementAudioSourceNode | null>(null)
  const activeBufferSource = useRef<AudioBufferSourceNode | null>(null)
  const speechAnalyserRef = useRef<AnalyserNode | null>(null)
  const voiceEnabledRef = useRef(true)
  const sessionId = useRef('')
  const resumeSpeech = useRef<(() => void) | null>(null)
  const speakingRef = useRef(false)
  const operationVersion = useRef(0)
  useEffect(() => {
    const resume = () => {
      if (!dialogOpen.current || !voiceEnabledRef.current || !resumeSpeech.current) return
      const play = resumeSpeech.current
      resumeSpeech.current = null
      setVoiceError('')
      play()
    }
    window.addEventListener('pointerdown', resume)
    window.addEventListener('keydown', resume)
    return () => {
      window.removeEventListener('pointerdown', resume)
      window.removeEventListener('keydown', resume)
    }
  }, [])
  function clearSpeechAnalyser() {
    try {
      activeBufferSource.current?.stop()
    } catch {
      /* already stopped */
    }
    activeBufferSource.current?.disconnect()
    activeBufferSource.current = null
    speechSource.current?.disconnect()
    speechSource.current = null
    speechAnalyserRef.current?.disconnect()
    speechAnalyserRef.current = null
    const context = speechAudioContext.current
    speechAudioContext.current = null
    if (context && context.state !== 'closed') void context.close().catch(() => undefined)
    setSpeechAnalyser(null)
  }
  function stopVoice() {
    resumeSpeech.current = null
    voiceRequest.current?.abort()
    voiceRequest.current = null
    window.speechSynthesis?.cancel()
    if (player.current) {
      player.current.onplaying = null
      player.current.onended = null
      player.current.onerror = null
      player.current.pause()
      player.current = null
    }
    clearSpeechAnalyser()
    if (playerUrl.current) URL.revokeObjectURL(playerUrl.current)
    playerUrl.current = ''
    speakingRef.current = false
    setSpeaking(false)
    setVoiceLoading(false)
    setAssistantState((current) => current === 'RESPONDING' ? 'IDLE' : current)
  }
  function toggleVoice() {
    const enabled = !voiceEnabledRef.current
    voiceEnabledRef.current = enabled
    setVoiceEnabled(enabled)
    if (!enabled) stopVoice()
  }
  function splitSpeechChunks(input: string): string[] {
    const cleaned = input.replace(/\s+/g, ' ').trim()
    if (!cleaned) return []
    const rawParts = cleaned.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
    if (rawParts.length <= 1) return [cleaned]
    const chunks: string[] = []
    for (const part of rawParts) {
      // Keep the first chunk short (~110 chars) for fast first-audio latency,
      // then group subsequent sentences (~190 chars) for smooth continuous playback.
      const limit = chunks.length <= 1 ? 110 : 190
      if (chunks.length > 0 && chunks[chunks.length - 1].length + part.length + 1 <= limit) {
        chunks[chunks.length - 1] = `${chunks[chunks.length - 1]} ${part}`
      } else {
        chunks.push(part)
      }
    }
    return chunks
  }

  async function speak(text: string, requestedSessionId?: string) {
    stopVoice()
    setVoiceError('')
    if (!voiceEnabledRef.current || !dialogOpen.current) return
    const activeSessionId = requestedSessionId ?? session?.id ?? sessionId.current
    if (!activeSessionId) {
      setVoiceError('Chưa sẵn sàng phiên trò chuyện để tạo giọng nói.')
      return
    }

    const seedUrl = resolveSeedAudioUrl(text)
    const chunks = seedUrl ? [text.trim()] : splitSpeechChunks(text)
    if (!chunks.length) return

    const controller = new AbortController()
    voiceRequest.current = controller
    // Never show "Đang chuẩn bị giọng nói..." for pre-seeded or cached audio!
    const firstCached = Boolean(seedUrl) || speechBlobCache.has(chunks[0].trim())
    if (!firstCached) setVoiceLoading(true)

    // Reuse ONE AudioContext + AnalyserNode across all chunks to eliminate inter-sentence gaps.
    let sharedContext: AudioContext | null = null
    let sharedAnalyser: AnalyserNode | null = null
    if (typeof AudioContext !== 'undefined') {
      try {
        sharedContext = new AudioContext()
        sharedAnalyser = sharedContext.createAnalyser()
        sharedAnalyser.fftSize = 512
        sharedAnalyser.smoothingTimeConstant = 0.82
        // Boost voice loudness cleanly (+5.3 dB) with a gentle limiter so it stays loud and clear without clipping.
        const gainNode = sharedContext.createGain()
        gainNode.gain.value = 1.85
        const limiter = sharedContext.createDynamicsCompressor()
        limiter.threshold.value = -3
        limiter.knee.value = 6
        limiter.ratio.value = 12
        limiter.attack.value = 0.003
        limiter.release.value = 0.1
        sharedAnalyser.connect(gainNode)
        gainNode.connect(limiter)
        limiter.connect(sharedContext.destination)
        speechAudioContext.current = sharedContext
        speechAnalyserRef.current = sharedAnalyser
        setSpeechAnalyser(sharedAnalyser)
      } catch {
        if (sharedContext && sharedContext.state !== 'closed')
          void sharedContext.close().catch(() => undefined)
        sharedContext = null
        sharedAnalyser = null
      }
    }

    type PreparedChunk = { blob: Blob; buffer: AudioBuffer | null }

    const fetchSeedOrLiveBlob = async (chunkText: string): Promise<Blob> => {
      if (seedUrl) {
        const cached = speechBlobCache.get(seedUrl)
        if (cached) return cached
        try {
          const res = await fetch(seedUrl, { signal: controller.signal })
          if (res.ok) {
            const contentType = res.headers.get('content-type') ?? ''
            if (contentType.includes('audio') || contentType.includes('octet-stream')) {
              const blob = await res.blob()
              if (blob.size > 1000) {
                rememberSpeechBlob(seedUrl, blob)
                return blob
              }
            }
          }
        } catch {
          // Fall back cleanly to live TTS if static file isn't available
        }
      }
      return fetchCachedSpeechBlob(activeSessionId, chunkText, controller.signal)
    }

    const fetchAndDecode = async (chunkText: string): Promise<PreparedChunk> => {
      const blob = await fetchSeedOrLiveBlob(chunkText)
      let buffer: AudioBuffer | null = null
      if (sharedContext && typeof blob.arrayBuffer === 'function' && typeof sharedContext.decodeAudioData === 'function') {
        try {
          const raw = await blob.arrayBuffer()
          if (!controller.signal.aborted && sharedContext.state !== 'closed') {
            buffer = await sharedContext.decodeAudioData(raw.slice(0))
          }
        } catch {
          buffer = null
        }
      }
      return { blob, buffer }
    }

    const playPrepared = (chunk: PreparedChunk) =>
      new Promise<void>((resolve, reject) => {
        if (controller.signal.aborted || !dialogOpen.current || !voiceEnabledRef.current) {
          resolve()
          return
        }

        // Fast gapless path via shared Web Audio API AudioBufferSourceNode
        if (sharedContext && sharedAnalyser && chunk.buffer && sharedContext.state !== 'closed') {
          const startBuffer = async () => {
            try {
              if (sharedContext.state === 'suspended') await sharedContext.resume()
              if (controller.signal.aborted || !dialogOpen.current || !voiceEnabledRef.current) {
                resolve()
                return
              }
              const source = sharedContext.createBufferSource()
              source.buffer = chunk.buffer
              source.connect(sharedAnalyser)
              activeBufferSource.current = source
              source.onended = () => {
                if (activeBufferSource.current === source) {
                  activeBufferSource.current = null
                }
                source.disconnect()
                resolve()
              }
              setVoiceLoading(false)
              speakingRef.current = true
              setSpeaking(true)
              setAssistantState('RESPONDING')
              source.start(0)
            } catch (cause) {
              if (controller.signal.aborted || !voiceEnabledRef.current) {
                resolve()
                return
              }
              setVoiceLoading(false)
              if (cause instanceof DOMException && cause.name === 'NotAllowedError') {
                resumeSpeech.current = () => { void startBuffer() }
                setVoiceError('Trình duyệt cần một thao tác của bạn để phát âm thanh. Bấm vào cửa sổ trò chuyện để nghe tiếp.')
              } else {
                reject(new Error('Chưa phát được giọng nói. Bạn vẫn có thể đọc nội dung trên màn hình.'))
              }
            }
          }
          void startBuffer()
          return
        }

        // Fallback path via HTMLAudioElement (e.g. unsupported codec or test env)
        const url = URL.createObjectURL(chunk.blob)
        playerUrl.current = url
        const audio = new Audio(url)
        player.current = audio

        const cleanupAudio = () => {
          if (player.current === audio) {
            audio.onplaying = null
            audio.onended = null
            audio.onerror = null
            player.current = null
          }
          if (playerUrl.current === url) {
            URL.revokeObjectURL(url)
            playerUrl.current = ''
          }
        }

        audio.onplaying = () => {
          if (controller.signal.aborted || !dialogOpen.current || !voiceEnabledRef.current) {
            stopVoice()
            resolve()
            return
          }
          setVoiceLoading(false)
          speakingRef.current = true
          setSpeaking(true)
          setAssistantState('RESPONDING')
        }
        audio.onended = () => {
          cleanupAudio()
          resolve()
        }
        audio.onerror = () => {
          cleanupAudio()
          reject(new Error('Chưa phát được giọng nói. Bạn vẫn có thể đọc nội dung trên màn hình.'))
        }

        const attemptPlayback = async () => {
          try {
            if (controller.signal.aborted || !voiceEnabledRef.current) {
              cleanupAudio()
              resolve()
              return
            }
            await audio.play()
          } catch (cause) {
            if (controller.signal.aborted || !voiceEnabledRef.current) {
              cleanupAudio()
              resolve()
              return
            }
            setVoiceLoading(false)
            if (cause instanceof DOMException && cause.name === 'NotAllowedError') {
              resumeSpeech.current = () => { void attemptPlayback() }
              setVoiceError('Trình duyệt cần một thao tác của bạn để phát âm thanh. Bấm vào cửa sổ trò chuyện để nghe tiếp.')
            } else {
              cleanupAudio()
              reject(new Error('Chưa phát được giọng nói. Bạn vẫn có thể đọc nội dung trên màn hình.'))
            }
          }
        }
        void attemptPlayback()
      })

    try {
      // Prefetch 1 chunk ahead so we never trigger TTS_BUSY on the single-threaded worker.
      const PREFETCH_AHEAD = 1
      const pending = new Map<number, Promise<PreparedChunk>>()
      const ensurePrefetched = (startIndex: number) => {
        for (let k = startIndex; k < Math.min(chunks.length, startIndex + PREFETCH_AHEAD + 1); k++) {
          if (!pending.has(k)) {
            pending.set(k, fetchAndDecode(chunks[k]))
          }
        }
      }

      ensurePrefetched(0)
      for (let i = 0; i < chunks.length; i++) {
        if (controller.signal.aborted || !dialogOpen.current || !voiceEnabledRef.current) break
        const prepared = await pending.get(i)!
        pending.delete(i)
        if (controller.signal.aborted || !dialogOpen.current || !voiceEnabledRef.current) break
        ensurePrefetched(i + 1)
        await playPrepared(prepared)
      }
      if (voiceRequest.current === controller) {
        voiceRequest.current = null
        clearSpeechAnalyser()
      }
      speakingRef.current = false
      setSpeaking(false)
      setVoiceLoading(false)
      setAssistantState((current) => current === 'ERROR' ? current : 'IDLE')
    } catch (cause) {
      if (controller.signal.aborted) return
      if (player.current) {
        player.current.onplaying = null
        player.current.onended = null
        player.current.onerror = null
        player.current.pause()
        player.current = null
      }
      clearSpeechAnalyser()
      if (playerUrl.current) URL.revokeObjectURL(playerUrl.current)
      playerUrl.current = ''
      if (voiceRequest.current === controller) voiceRequest.current = null
      speakingRef.current = false
      setSpeaking(false)
      setVoiceLoading(false)
      setVoiceError(
        cause instanceof Error
          ? cause.message
          : 'Chưa tạo được giọng nói. Bạn vẫn có thể đọc nội dung trên màn hình.',
      )
    } finally {
      if (voiceRequest.current === controller && !speakingRef.current && !resumeSpeech.current)
        setVoiceLoading(false)
    }
  }
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState<OrderAgentSession>()
  const [text, setText] = useState('')
  const [editingPurpose, setEditingPurpose] = useState(false)
  const [editingDescription, setEditingDescription] = useState(false)
  const [descriptionHelpOpen, setDescriptionHelpOpen] = useState(false)
  const [guidedStage, setGuidedStage] = useState<Step>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [errorKind, setErrorKind] = useState<'conversation' | 'speech' | 'reset'>(
    'conversation',
  )
  const [retry, setRetry] = useState<{
    requestId: string
    text: string
    revision: number
  }>()
  const [recording, setRecording] = useState(false)
  const [resetRetry, setResetRetry] = useState(false)
  const reduceMotion = useReducedMotion()
  const activeServices = p.services.filter((s) => s.isActive !== false)
  const selectedService = activeServices.find((s) => s.id === p.form.serviceId) ?? null
  const [hoveredService, setHoveredService] = useState<ServiceOption | null>(null)
  const [portalBurst, setPortalBurst] = useState(false)
  const [portalSpin, setPortalSpin] = useState(false)
  const [isFirstOpen, setIsFirstOpen] = useState(true)
  const openCountRef = useRef(0)
  const portalTimerRef = useRef<number | undefined>(undefined)
  const [successCounter, setSuccessCounter] = useState(0)
  const [flyingChips, setFlyingChips] = useState<FlyingChipPayload[]>([])
  const [highlightedDraftKey, setHighlightedDraftKey] = useState<string | null>(null)
  const draftHighlightTimer = useRef<number | undefined>(undefined)
  const heroRobotContainerRef = useRef<HTMLDivElement | null>(null)
  const { registerTarget, getTargetDirection } = useRobotTargetRegistry()
  const [robotGaze, setRobotGaze] = useState<RobotGazeVector>({ x: 0, y: 0 })
  const [robotPointDirection, setRobotPointDirection] = useState<AIMascotPointDirection>('down')

  const isServiceIntroActive =
    open && !session?.state.messages.length && p.serviceSelectionStep !== false && activeServices.length > 0

  const mascotState: AIMascotState = resolveMascotState({
    hasError: assistantState === 'ERROR',
    recording,
    thinking: busy || voiceLoading,
    speaking,
    pointing: Boolean(hoveredService) && isServiceIntroActive,
    reaction: mascotReaction,
    pointDirection: robotPointDirection,
  })

  function reactMascot(state: AIMascotState) {
    window.clearTimeout(mascotReactionTimer.current)
    setMascotReaction(state)
    if (
      state === 'welcome' ||
      state === 'success' ||
      state === 'confirming' ||
      state === 'goodbye'
    ) {
      mascotReactionTimer.current = window.setTimeout(
        () => setMascotReaction('idle'),
        state === 'welcome' ? 1200 : 950,
      )
    }
  }

  function dispatchRobotEvent(event: AIRobotEvent) {
    if (
      event === 'SERVICE_SELECTED' ||
      event === 'REQUIREMENT_CONFIRMED' ||
      event === 'DESCRIPTION_READY' ||
      event === 'REVIEW_READY'
    ) {
      setSuccessCounter((c) => c + 1)
    }
    reactMascot(mascotStateForEvent(event))
  }

  const launchFlyingChip = useCallback(
    (draftKey: string, label: string, sourceEl?: HTMLElement | null) => {
      if (reduceMotion || typeof document === 'undefined') return
      const targetEl = document.querySelector<HTMLElement>(`[data-draft-key="${draftKey}"]`)
      if (!targetEl) return
      const targetRect = targetEl.getBoundingClientRect()
      const targetVisible =
        targetRect.width > 0 &&
        targetRect.height > 0 &&
        targetRect.bottom > 0 &&
        targetRect.top < window.innerHeight &&
        targetRect.right > 0 &&
        targetRect.left < window.innerWidth

      if (!targetVisible) {
        // Offscreen destination (e.g., collapsed mobile draft): local highlight only
        setHighlightedDraftKey(draftKey)
        window.clearTimeout(draftHighlightTimer.current)
        draftHighlightTimer.current = window.setTimeout(() => setHighlightedDraftKey(null), 650)
        return
      }

      const sourceRect = sourceEl?.getBoundingClientRect()
      const fromX = sourceRect
        ? sourceRect.left + sourceRect.width * 0.5
        : Math.max(80, targetRect.left - 240)
      const fromY = sourceRect
        ? sourceRect.top + sourceRect.height * 0.35
        : targetRect.top + 12

      const chip: FlyingChipPayload = {
        id: `${draftKey}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label,
        draftKey,
        fromX,
        fromY,
        toX: targetRect.left + 20,
        toY: targetRect.top + targetRect.height * 0.35,
      }
      setFlyingChips((prev) => [...prev.slice(-3), chip])
    },
    [reduceMotion],
  )

  const handleChipComplete = useCallback((id: string) => {
    setFlyingChips((prev) => {
      const finished = prev.find((c) => c.id === id)
      if (finished) {
        setHighlightedDraftKey(finished.draftKey)
        window.clearTimeout(draftHighlightTimer.current)
        draftHighlightTimer.current = window.setTimeout(
          () => setHighlightedDraftKey(null),
          700,
        )
      }
      return prev.filter((c) => c.id !== id)
    })
  }, [])

  useEffect(
    () => () => {
      window.clearTimeout(mascotReactionTimer.current)
      window.clearTimeout(portalTimerRef.current)
      window.clearTimeout(draftHighlightTimer.current)
    },
    [],
  )
  const recorder = useRef<MediaRecorder | null>(null)
  const recordingTimer = useRef<number | undefined>(undefined)
  const keepRecording = useRef(false)
  const abort = useRef<AbortController | null>(null)
  const operationActive = useRef(false)
  const dialogOpen = useRef(false)
  const welcomeSpoken = useRef(false)
  const microphonePending = useRef(false)
  const live = useRef(p)
  const formSessionId = p.form.orderAgentSessionId ?? ''
  const currentFormSessionId = useRef(formSessionId)
  const restartSession = useRef<(() => void) | null>(null)
  live.current = p
  useEffect(
    () => () => {
      dialogOpen.current = false
      operationVersion.current += 1
      abort.current?.abort()
      keepRecording.current = false
      window.clearTimeout(recordingTimer.current)
      recorder.current?.stream.getTracks().forEach((t) => t.stop())
      voiceRequest.current?.abort()
      window.speechSynthesis?.cancel()
      if (player.current) {
        player.current.onplaying = null
        player.current.onended = null
        player.current.onerror = null
        player.current.pause()
        player.current = null
      }
      if (playerUrl.current) URL.revokeObjectURL(playerUrl.current)
      speechSource.current?.disconnect()
      speechAnalyserRef.current?.disconnect()
      if (speechAudioContext.current && speechAudioContext.current.state !== 'closed')
        void speechAudioContext.current.close().catch(() => undefined)
    },
    [],
  )
  useEffect(() => {
    if (currentFormSessionId.current === formSessionId) return
    currentFormSessionId.current = formSessionId
    if (sessionId.current === formSessionId) return

    operationVersion.current += 1
    operationActive.current = false
    abort.current?.abort()
    setBusy(false)
    setAssistantState('IDLE')
    setPendingMessage(undefined)
    setRetry(undefined)
    setSession(undefined)
    setGuidedStage(undefined)
    setEditingPurpose(false)
    setEditingDescription(false)
    sessionId.current = formSessionId
    if (dialogOpen.current) restartSession.current?.()
  }, [formSessionId])
  function close() {
    stopVoice()
    dialogOpen.current = false
    operationVersion.current += 1
    operationActive.current = false
    abort.current?.abort()
    keepRecording.current = false
    window.clearTimeout(recordingTimer.current)
    window.clearTimeout(portalTimerRef.current)
    if (recorder.current?.state === 'recording') recorder.current.stop()
    setRecording(false)
    setBusy(false)
    setAssistantState('IDLE')
    setPendingMessage(undefined)
    setPortalBurst(false)
    setPortalSpin(false)
    setHoveredService(null)
    setOpen(false)
    reactMascot('goodbye')
  }
  async function request(path: string, body?: unknown) {
    const controller = new AbortController()
    abort.current = controller
    const timeout = window.setTimeout(() => controller.abort(), 100_000)
    try {
      const value = await apiRequest<OrderAgentSession>(path, {
        method: body === undefined ? 'GET' : 'POST',
        body,
        signal: controller.signal,
      })
      if (controller.signal.aborted) throw new DOMException('Request aborted', 'AbortError')
      return value
    } finally {
      window.clearTimeout(timeout)
    }
  }
  async function perform(
    action: () => Promise<void>,
    kind: 'conversation' | 'speech' | 'reset' = 'conversation',
  ) {
    if (operationActive.current) return
    const operation = ++operationVersion.current
    operationActive.current = true
    setBusy(true)
    setResponseReceived(false)
    setAssistantState('PROCESSING')
    setError('')
    setErrorKind(kind)
    setResetRetry(kind === 'reset')
    try {
      await action()
    } catch (cause) {
      if (operation !== operationVersion.current || !dialogOpen.current) return
      setAssistantState('ERROR')
      setPendingMessage((current) => current ? { ...current, status: 'failed' } : current)
      if (cause instanceof DOMException && cause.name === 'AbortError') {
        setError('Yêu cầu đã hết thời gian chờ. Hãy kiểm tra kết nối rồi thử lại.')
        return
      }
      if (cause instanceof ApiError && cause.status === 409 && session) {
        // Load current revision only; do not replace the customer's form or auto-replay a mutation.
        let synchronized = false
        try {
          setSession(await request(`${base}/${session.id}`))
          synchronized = true
        } catch {
          /* retain the previous view */
        }
        if (operation !== operationVersion.current || !dialogOpen.current) return
        setRetry(undefined)
        setError(
          synchronized
            ? 'Phiên đã thay đổi ở cửa sổ khác. Đã tải hội thoại mới nhất; hãy kiểm tra trước khi tiếp tục.'
            : 'Phiên đã thay đổi nhưng chưa tải lại được. Hãy tải lại phiên trước khi tiếp tục; biểu mẫu của bạn được giữ nguyên.',
        )
      } else
        setError(
          cause instanceof Error
            ? cause.message
            : 'Chưa kết nối được trợ lý. Bạn vẫn có thể tiếp tục nhập thủ công.',
        )
    } finally {
      if (operation === operationVersion.current) {
        operationActive.current = false
        setBusy(false)
        setAssistantState((current) => current === 'ERROR'
          ? current
          : speakingRef.current ? 'RESPONDING' : 'IDLE')
      }
    }
  }
  function markWelcomeSpoken(sid: string) {
    try {
      window.sessionStorage.setItem(`odm.aiWelcomeSpoken.${sid}`, '1')
    } catch {
      /* ignore */
    }
  }
  function clearWelcomeSpoken(sid: string) {
    try {
      window.sessionStorage.removeItem(`odm.aiWelcomeSpoken.${sid}`)
    } catch {
      /* ignore */
    }
  }
  async function start() {
    const opening = !dialogOpen.current
    dialogOpen.current = true
    setOpen(true)
    if (opening) {
      openCountRef.current += 1
      const first = openCountRef.current === 1
      setIsFirstOpen(first)
      if (!reduceMotion) {
        setPortalBurst(true)
        setPortalSpin(first)
        window.clearTimeout(portalTimerRef.current)
        portalTimerRef.current = window.setTimeout(
          () => {
            setPortalBurst(false)
            setPortalSpin(false)
          },
          first ? 820 : 400,
        )
      }
      reactMascot('welcome')
    }
    let loadedSession: OrderAgentSession | null = null
    await perform(async () => {
      const value = await request(
        p.form.orderAgentSessionId
          ? `${base}/${p.form.orderAgentSessionId}`
          : base,
        p.form.orderAgentSessionId ? undefined : {},
      )
      if (!dialogOpen.current) return
      if (live.current.form.orderAgentSessionId &&
          live.current.form.orderAgentSessionId !== value.id) return
      loadedSession = value
      sessionId.current=value.id
      setSession(value)
      setResponseReceived(value.state.messages.length > 0)
      const lastUserMessage = value.state.messages.findLast(item => item.role === 'user')?.content ?? ''
      if (lastUserMessage.includes('[ONDEMAND_DESCRIPTION_REVIEW]') ||
          visibleConversationMessage(lastUserMessage).startsWith('Đánh giá mô tả nhiệm vụ:') ||
          visibleConversationMessage(lastUserMessage).startsWith('Mục đích chuyến bay của tôi:')) {
        setEditingPurpose(false)
        setEditingDescription(true)
        setGuidedStage(1)
      } else {
        const restoredStep = lastUserMessage.match(/ONDEMAND_GUIDED_STEP:([1-6])/)?.[1]
        if (restoredStep) setGuidedStage(Number(restoredStep) as Step)
      }
      if (value.id !== p.form.orderAgentSessionId)
        p.setForm((current) => ({ ...current, orderAgentSessionId: value.id }))
    })
    const activeSid = sessionId.current
    const isOnServiceSelectionScreen =
      Boolean(loadedSession) &&
      loadedSession!.state.messages.length === 0 &&
      p.serviceSelectionStep !== false
    if (
      opening &&
      activeSid &&
      dialogOpen.current &&
      isOnServiceSelectionScreen
    ) {
      welcomeSpoken.current = true
      markWelcomeSpoken(activeSid)
      void speak(buildServiceWelcomeSpeech(p.services), activeSid)
    }
    if (opening && isOnServiceSelectionScreen) reactMascot('welcome')
  }
  async function resetConversation() {
    if (!session || operationActive.current) return
    stopVoice()
    clearWelcomeSpoken(session.id)

    const shouldSpeakWelcome = p.services.some((service) => service.isActive !== false)
    if (shouldSpeakWelcome) {
      welcomeSpoken.current = true
    }
    await perform(async () => {
      try {
        await apiRequest<null>(`${base}/${session.id}`, { method: 'DELETE' })
      } catch (cause) {
        if (cause instanceof ApiError && cause.status === 405) {
          throw new Error(
            'Backend chưa nạp chức năng xóa hội thoại. Hãy khởi động lại Backend OnDemand Monitor rồi thử lại.',
            { cause },
          )
        }
        throw cause
      }
      if (!dialogOpen.current || sessionId.current !== session.id) return
      sessionId.current = ''
      setSession(undefined)
      setText('')
      setRetry(undefined)
      setPendingMessage(undefined)
      setManualStep(undefined)
      setGuidedStage(undefined)
      setEditingPurpose(false)
      setEditingDescription(false)
      setReviewedChecklistKey(undefined)
      clearStoredDraft()
      p.setForm(() => ({
        ...createDefaultForm(),
        flightPurpose: '',
        orderAgentSessionId: undefined,
      }))
      p.onOpenStep(1)

      const value = await request(base, {})
      sessionId.current = value.id
      setSession(value)
      clearStoredDraft()
      p.setForm(() => ({
        ...createDefaultForm(),
        flightPurpose: '',
        orderAgentSessionId: value.id,
      }))
      welcomeSpoken.current = true
      setResetRetry(false)
    }, 'reset')
    if (shouldSpeakWelcome && sessionId.current && dialogOpen.current) {
      markWelcomeSpoken(sessionId.current)
      void speak(buildServiceWelcomeSpeech(p.services), sessionId.current)
    }
  }
  restartSession.current = () => { void start() }
  async function send(
    resend = false,
    choice?: string,
    guidedPrompt?: string,
  ) {
    if (operationActive.current) return
    stopVoice()
    if (!session || (!resend && !(choice ?? text).trim())) return
    const message =
      resend && retry
        ? retry
        : {
            requestId: crypto.randomUUID(),
            revision: session.revision,
            text:
              (choice ?? text).trim() +
              guidedPromptMarker +
              (guidedPrompt ?? flowInstruction(nextStep, undefined, p.form)),
            customerContext: {
              locationConfirmed:
                p.form.locationStatus === 'confirmed' &&
                Boolean(p.form.locationConfirmedAt),
              ...(p.form.locationStatus === 'confirmed'
                ? { address: p.form.address }
                : {}),
              ...(p.form.preferredTimeId
                ? {
                    preferredDateFrom: p.form.preferredDateFrom,
                    preferredDateTo: p.form.preferredDateTo,
                    preferredTimeId: p.form.preferredTimeId,
                  }
                : {}),
              siteContactName: p.form.siteContactName,
              siteContactPhone: p.form.siteContactPhone,
              accessNotes: p.form.accessNotes,
              monitoringRelationship: p.form.monitoringRelationship,
              monitoringAuthorizationConfirmed:
                p.form.monitoringAuthorizationConfirmed,
              termsAccepted: p.form.termsAccepted,
            },
          }
    setRetry(message)
    setPendingMessage({
      requestId: message.requestId,
      content: visibleConversationMessage(message.text),
      status: 'sending',
    })
    setResponseReceived(false)
    setAssistantState('SENDING')
    await perform(async () => {
      const value = await request(`${base}/${session.id}/messages`, message)
      // Form actions follow the wizard copy even when an older worker returns a free-form reply.
      const descriptionReview = guidedPrompt?.includes('[ONDEMAND_DESCRIPTION_REVIEW]')
      const scriptedReply = choice && guidedPrompt && !descriptionReview ? guidedReply(choice, guidedPrompt) : undefined
      if (scriptedReply) {
        const lastAssistant = value.state.messages.findLastIndex(item => item.role === 'assistant')
        value.state.messages = value.state.messages.map((item, index) =>
          index === lastAssistant ? { ...item, content: scriptedReply } : item,
        )
      }
      if (!dialogOpen.current || sessionId.current !== session.id) return
      if (live.current.form.orderAgentSessionId &&
          live.current.form.orderAgentSessionId !== session.id) return
      sessionId.current=value.id
      setSession(value)
      setPendingMessage(undefined)
      setResponseReceived(true)
      setAssistantState('RESPONDING')
      reactMascot(choice?.startsWith('Tôi chọn dịch vụ ') ? 'success' : 'idle')
      const rawAnswer = value.state.messages.filter(item=>item.role==='assistant').at(-1)?.content
      const answer = rawAnswer ? visibleAssistantMessage(rawAnswer) : ''
      if (answer) void speak(answer, value.id)
      setRetry(undefined)
      setText('')
    })
  }
  async function validate() {
    if (!session) return
    await perform(async () => {
      if (!live.current.onSubmitFinal || !(await live.current.onSubmitFinal())) {
        setGuidedStage(undefined)
        setOpen(false)
        return
      }
      reactMascot('success')
      setOpen(false)
    })
  }
  async function microphone() {
    if (recording) {
      recorder.current?.stop()
      setRecording(false)
      return
    }
    if (microphonePending.current) return
    microphonePending.current = true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      if (!dialogOpen.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }
      keepRecording.current = true
      const chunks: BlobPart[] = []
      const media = new MediaRecorder(stream)
      recorder.current = media
      media.ondataavailable = (e) => chunks.push(e.data)
      media.onstop = async () => {
        window.clearTimeout(recordingTimer.current)
        stream.getTracks().forEach((t) => t.stop())
        if (!keepRecording.current) return
        await perform(async () => {
          const data = new FormData()
          data.append(
            'audio',
            new Blob(chunks, { type: media.mimeType }),
            'recording.webm',
          )
          const controller = new AbortController()
          abort.current = controller
          const timeout = window.setTimeout(() => controller.abort(), 230_000)
          try {
            const result = await apiRequest<{ text: string }>(
              `${base}/transcribe`,
              { method: 'POST', body: data, signal: controller.signal },
            )
            if (typeof result.text !== 'string' || !result.text.trim())
              throw new Error(
                'Chưa nghe rõ nội dung. Hãy ghi âm lại hoặc nhập bằng bàn phím.',
              )
            if (dialogOpen.current) setText(result.text) // Customer explicitly sends the editable transcript.
          } finally {
            window.clearTimeout(timeout)
          }
        }, 'speech')
      }
      media.start()
      recordingTimer.current = window.setTimeout(() => {
        if (media.state === 'recording') {
          media.stop()
          setRecording(false)
        }
      }, 60_000)
      setRecording(true)
    } catch {
      setErrorKind('speech')
      setError('Không mở được micro. Bạn có thể nhập câu hỏi bằng bàn phím.')
    } finally {
      microphonePending.current = false
    }
  }
  const lastAssistantMessageIndex = session?.state.messages.reduce(
    (last, message, index) => message.role === 'assistant' ? index : last,
    -1,
  ) ?? -1
  function openStep(step: Step) {
    setManualStep(step)
    speak(guidance[step])
  }
  const guidedChecklist =
    p.checklistValid === true ? p.serializeChecklist() : []
  const checklistReviewKey = p.form.serviceId
    ? p.form.serviceId + ':' + JSON.stringify(guidedChecklist)
    : ''
  const checklistReviewed =
    p.checklistValid === true &&
    Boolean(checklistReviewKey) &&
    reviewedChecklistKey === checklistReviewKey
  const requiredStep = nextGuidedStep(
    p.form,
    guidedChecklist,
    p.checklistValid,
    checklistReviewed,
  )
  const nextStep = guidedStage ?? requiredStep
  const purposeBeforeMap = editingPurpose || nextStep === 1 && Boolean(p.form.serviceId) &&
    (!p.form.flightPurpose || p.form.flightPurpose === 'OTHER')
  const descriptionBeforeMap = !purposeBeforeMap && (editingDescription || nextStep === 1 && Boolean(p.form.serviceId) &&
    !purposeBeforeMap && !p.form.description.trim())
  const nextStepLabel = purposeBeforeMap
    ? 'Mục đích chuyến bay'
    : descriptionBeforeMap ? 'Mô tả yêu cầu giám sát' : labels[nextStep]
  const activeTheme = resolveServiceMicroWorldTheme(hoveredService ?? selectedService)

  // Update robot gaze & pointing direction toward active registered UI target
  useEffect(() => {
    if (!open || reduceMotion) {
      setRobotGaze({ x: 0, y: 0 })
      return
    }
    const targetId: RobotTargetId | null = isServiceIntroActive
      ? 'services'
      : purposeBeforeMap
        ? 'purpose'
        : descriptionBeforeMap
          ? 'description'
          : nextStep === 2
            ? 'map'
            : nextStep === 5
              ? 'calendar'
              : nextStep === 6
                ? 'review'
                : 'draft'
    const result = getTargetDirection(heroRobotContainerRef.current, targetId)
    if (result.visible) {
      setRobotGaze(result.gaze)
      setRobotPointDirection(result.direction)
    } else {
      setRobotGaze({ x: 0, y: 0 })
    }
  }, [
    open,
    reduceMotion,
    isServiceIntroActive,
    purposeBeforeMap,
    descriptionBeforeMap,
    nextStep,
    hoveredService,
    getTargetDirection,
  ])

  function selectService(service: ServiceOption, sourceEl?: HTMLElement | null) {
    dispatchRobotEvent('SERVICE_SELECTED')
    launchFlyingChip('service', service.name, sourceEl)
    const selectedForm = { ...p.form, serviceId: service.id }
    setHoveredService(null)
    setGuidedStage(1)
    setEditingPurpose(true)
    setEditingDescription(false)
    setReviewedChecklistKey(undefined)
    p.setForm((current) =>
      applyConfirmedAgentChanges(current, { serviceId: service.id }),
    )
    void send(
      false,
      'Tôi chọn dịch vụ ' + service.name + '.',
      flowInstruction(1, undefined, { ...selectedForm, flightPurpose: '' }),
    )
  }
  const calmFocus =
    mascotState === 'idle' &&
    (Boolean(text.trim()) || descriptionBeforeMap || manualStep === 5)
  return <>
    <OrderAssistantLauncher open={open} state={mascotState} onOpen={() => void start()} />
    <FlyingDataChipLayer chips={flyingChips} onComplete={handleChipComplete} />
    <Modal title="AI hỗ trợ tạo yêu cầu" open={open} onCancel={close} footer={null} width={1060} className="order-chat-restored order-chat-workspace" destroyOnHidden>
      <div className="order-chat-topbar">
        <p className="order-chat-subtitle">
          <AIAnimatedMascot
            state={mascotState}
            speechAnalyser={speechAnalyser}
            animated={!calmFocus}
            calmFocus={calmFocus}
            successCounter={successCounter}
            size="avatar"
          />
          <span className="order-chat-subtitle-copy">
            <span>Nói hoặc nhập nhu cầu để trợ lý hỗ trợ tạo yêu cầu.</span>
            <span className={`order-chat-state-pill is-${mascotState}`} role="status">
              {MASCOT_STATUS_LABEL[mascotState]}
            </span>
          </span>
        </p>
        {selectedService && (
          <div className="order-chat-context-badge" aria-hidden="true">
            <ServiceMicroWorld service={selectedService} className="is-topbar-mini" />
            <span className="order-chat-context-badge__name">{selectedService.name}</span>
          </div>
        )}
        {session && (
          <div className="order-chat-actions">
            <Button
              danger
              size="small"
              loading={busy && errorKind === 'reset'}
              disabled={busy && errorKind !== 'reset'}
              onClick={() => void resetConversation()}
            >
              {busy && errorKind === 'reset' ? "Đang xóa…" : "Xóa và tạo lại"}
            </Button>
          </div>
        )}
      </div>
      {error && (
        <Alert
          type="warning"
          message={error}
          action={<Button onClick={() => resetRetry && session ? void resetConversation() : retry ? void send(true) : void start()}>Thử lại</Button>}
        />
      )}
      <div className="order-chat-body-grid">
        <div className="order-chat-main">
          <div className="order-chat-scroll">
            {voiceError && <Alert
              type="warning"
              message={voiceError}
              action={voiceEnabled && session && lastAssistantMessageIndex >= 0 ? (
                <Button size="small" onClick={() => {
                  const lastAssistant = session.state.messages[lastAssistantMessageIndex]
                  if (lastAssistant?.role === 'assistant')
                    void speak(visibleAssistantMessage(lastAssistant.content), session.id)
                }}>Nghe lại</Button>
              ) : undefined}
            />}
            {voiceLoading && <p className="order-chat-status" role="status">Đang chuẩn bị giọng nói…</p>}
            {!session?.state.messages.length && p.serviceSelectionStep !== false && <section className="order-chat-welcome ai-living-welcome">
              <motion.div
                className="order-chat-welcome-hero"
                initial={reduceMotion ? false : { opacity: 0, y: -14, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={AI_MOTION.ease.portalSpring}
              >
                <div ref={heroRobotContainerRef} className="ai-hero-portal-stage">
                  <AIPortalTransition active={portalBurst} firstOpen={isFirstOpen} />
                  <AIAnimatedMascot
                    state={mascotState}
                    speechAnalyser={speechAnalyser}
                    size="hero"
                    showHologram={true}
                    portalSpin={portalSpin}
                    targetGaze={robotGaze}
                    pointDirection={robotPointDirection}
                    calmFocus={calmFocus}
                    successCounter={successCounter}
                    interactivePointer={true}
                  />
                </div>
                <motion.div
                  className="order-chat-welcome-copy"
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: reduceMotion ? 0 : 0.14 }}
                >
                  <h3>Xin chào anh/chị, tôi là trợ lý AI của OnDemand Monitor</h3>
                  <p>Tôi sẽ giới thiệu chi tiết từng dịch vụ đang hoạt động. Anh/chị có thể chọn một dịch vụ bên dưới hoặc mô tả nhu cầu để được tư vấn.</p>
                  {session && (
                    <Button
                      size="small"
                      style={{ marginTop: 6 }}
                      disabled={voiceLoading || !voiceEnabled}
                      onClick={() => void speak(buildServiceWelcomeSpeech(p.services), session.id)}
                    >
                      {speaking ? 'Đang giới thiệu dịch vụ…' : 'Nghe tư vấn chi tiết dịch vụ'}
                    </Button>
                  )}
                </motion.div>
                <div className="ai-welcome-visual-stage" aria-hidden="true">
                  <ServiceMicroWorld service={hoveredService ?? selectedService} className="ai-welcome-microworld-scene" />
                  <MiniatureDroneIllustration theme={activeTheme} docked={calmFocus} className="ai-welcome-stage-drone" />
                </div>
              </motion.div>
              <div
                ref={(node) => registerTarget('services', node)}
                className="order-chat-service-grid"
              >
                {activeServices.map((service, idx) => (
                  <AnimatedServiceCard
                    key={service.id}
                    service={service}
                    index={idx}
                    selected={p.form.serviceId === service.id}
                    disabled={busy}
                    onSelect={selectService}
                    onHoverChange={setHoveredService}
                  />
                ))}
              </div>
            </section>}
            {session?.state.messages.map((m,i)=>(
              <motion.div
                key={m.requestId??i}
                layoutId={m.role === 'assistant' && i === lastAssistantMessageIndex && !busy ? 'ai-assistant-turn' : undefined}
                className={`order-agent-message is-${m.role}`}
                initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.24, ease: AI_MOTION.ease.out }}
              >
                <div className="order-agent-message-heading">
                  {m.role === 'assistant' && <AIAnimatedMascot className={`order-agent-avatar${speaking && i === lastAssistantMessageIndex ? ' is-speaking' : ''}`} state={i === lastAssistantMessageIndex ? mascotState : 'idle'} speechAnalyser={speechAnalyser} animated={i === lastAssistantMessageIndex} size="avatar" />}
                  <strong>{m.role==='user'?'Bạn':'Trợ lý'}</strong>
                </div>
                <p>{m.role === 'user' ? visibleConversationMessage(m.content) : visibleAssistantMessage(m.content)}</p>
              </motion.div>
            ))}
            {pendingMessage && <div className={`order-agent-message is-user is-optimistic${pendingMessage.status === 'failed' ? ' is-failed' : ''}`} data-request-id={pendingMessage.requestId}>
              <div className="order-agent-message-heading"><strong>Bạn</strong></div>
              <p>{pendingMessage.content}</p>
              {pendingMessage.status === 'failed' && <small className="order-agent-pending-note">Chưa gửi được. Nội dung vẫn được giữ để thử lại.</small>}
            </div>}
            <AnimatePresence mode="popLayout">
              {busy && errorKind === 'conversation' && !responseReceived && (
                <AIThinkingBubble key="ai-thinking" phase={assistantState} />
              )}
            </AnimatePresence>
            {busy && errorKind === 'speech' && <p className="order-chat-status" role="status">Đang nhận giọng nói…</p>}
            {busy && errorKind === 'reset' && <p className="order-chat-status" role="status">Đang xóa và tạo cuộc trò chuyện mới…</p>}
            {session && Boolean(session.state.messages.length) && !busy && <motion.section
              className="order-chat-welcome order-chat-active-choice"
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
            >
              <div className="order-chat-active-choice-head">
                <strong>{purposeBeforeMap ? 'Mục đích chuyến bay' : nextStepLabel}</strong>
                {descriptionBeforeMap && (
                  <Button type="link" size="small" className="order-chat-help-link" onClick={() => setDescriptionHelpOpen(true)}>
                    Xem gợi ý
                  </Button>
                )}
              </div>
              {purposeBeforeMap ? <Space direction="vertical" style={{ width: '100%', marginTop: 4 }}>
                <select className="co-input" aria-label="Mục đích chuyến bay" value={p.form.flightPurpose} disabled={busy} onChange={e => { setEditingPurpose(true); p.setForm(current => ({ ...current, flightPurpose: e.target.value as FlightPurpose, otherFlightPurpose: '' })) }}>
                  <option value="">Chọn mục đích chuyến bay</option>
                  {FLIGHT_PURPOSES.map(value => <option key={value} value={value}>{requestInfoPanelMessages.vi.flightPurposes[value]}</option>)}
                </select>
                {p.form.flightPurpose === 'OTHER' && <Input aria-label="Mục đích khác" maxLength={200} placeholder="Nhập mục đích chưa có trong danh sách" value={p.form.otherFlightPurpose} onChange={e => p.setForm(current => ({ ...current, otherFlightPurpose: e.target.value }))} />}
                <Button type="primary" disabled={busy || !p.form.flightPurpose || (p.form.flightPurpose === 'OTHER' && !p.form.otherFlightPurpose.trim())} onClick={(event) => { const purposeLabel = p.form.flightPurpose === 'OTHER' ? p.form.otherFlightPurpose : requestInfoPanelMessages.vi.flightPurposes[p.form.flightPurpose as FlightPurpose]; dispatchRobotEvent('REQUIREMENT_CONFIRMED'); launchFlyingChip('purpose', purposeLabel, event.currentTarget); setEditingPurpose(false); setEditingDescription(true); void send(false, 'Mục đích chuyến bay của tôi: ' + purposeLabel, flowInstruction(1, undefined, { ...p.form, description: '' })) }}>Xác nhận mục đích</Button>
              </Space> : !descriptionBeforeMap && <p>{guidance[nextStep]}</p>}
              {descriptionBeforeMap ? <Input.TextArea aria-label="Mô tả yêu cầu giám sát" maxLength={2000} autoSize={{ minRows: 2, maxRows: 4 }} placeholder="Nhập khu vực và việc cần làm…" value={p.form.description} onChange={e => p.setForm(current => ({ ...current, description: e.target.value }))} /> : !purposeBeforeMap && <Button type="primary" aria-label={nextStepLabel} onClick={()=>openStep(nextStep)}>{nextStepLabel}</Button>}
              {descriptionBeforeMap && session && <MissionDescriptionAssistant
                key={session.id + ':' + p.form.serviceId}
                serviceId={p.form.serviceId} description={p.form.description} session={session} busy={busy}
                onRobotEvent={dispatchRobotEvent}
                review={async body => {
                  if (operationActive.current) return
                  let failure: unknown
                  await perform(async () => {
                    try {
                      const value = await request(`${base}/${session.id}/description-review`, {
                        revision: session.revision, serviceId: p.form.serviceId, ...body,
                      })
                      if (dialogOpen.current && sessionId.current === value.id) {
                        setSession(value)
                        setResponseReceived(true)
                        const reviewData = value.state.descriptionReview
                        const spokenText = reviewData?.nextQuestion?.trim()
                          ? reviewData.nextQuestion.trim()
                          : reviewData?.generatedDescription?.trim()
                            ? 'Em đã hoàn thiện bản mô tả yêu cầu. Anh/chị xem lại và bấm Áp dụng vào đơn nếu phù hợp nhé.'
                            : ''
                        if (spokenText) void speak(spokenText, value.id)
                      }
                    } catch (cause) { failure = cause; throw cause }
                  })
                  if (failure) throw failure
                }}
                onApply={description => {
                  p.setForm(current => applyConfirmedAgentChanges(current, { description }))
                  launchFlyingChip('description', 'Mô tả nhiệm vụ')
                }}
              />}
              {descriptionBeforeMap && <div className="order-chat-active-choice-footer">
                <Space wrap>
                  <Button disabled={busy || !p.form.description.trim()} onClick={() => {
                    stopVoice()
                    setError('')
                    setRetry(undefined)
                    setPendingMessage(undefined)
                    setEditingPurpose(false)
                    setEditingDescription(false)
                    setGuidedStage(2)
                    openStep(2)
                  }}>Xác nhận và tiếp tục</Button>
                </Space>
              </div>}
            </motion.section>}
          </div>
        </div>
        <AIOrderDraftSummary
          form={p.form}
          services={p.services}
          checklist={guidedChecklist}
          checklistValid={p.checklistValid}
          preferredTimes={p.preferredTimes}
          activeStep={nextStep}
          highlightedKey={highlightedDraftKey}
          panelRef={(node) => registerTarget('draft', node)}
          onEditStep={(step) => openStep(step)}
          onReadyForReview={() => {
            dispatchRobotEvent('REVIEW_READY')
            if (sessionId.current) {
              void speak(
                'Tất cả các mục bắt buộc đã đầy đủ. Anh/chị hãy xem lại thông tin và bấm Xác nhận và tạo yêu cầu để gửi đơn nhé.',
                sessionId.current,
              )
            }
          }}
        />
      </div>
      <div className="order-chat-compose">
        <Input.TextArea id="order-chat-input" aria-label="Nội dung trao đổi" value={text} onChange={e=>setText(e.target.value)} autoSize={{minRows:1,maxRows:3}} placeholder="Nói hoặc nhập nhu cầu của bạn…"/>
        <Button className={recording ? 'is-recording' : undefined} disabled={busy} onClick={()=>void microphone()}>{recording?'Dừng nói':'Nói với trợ lý'}</Button>
        <Button aria-label={voiceEnabled ? 'Tắt giọng trợ lý' : 'Bật giọng trợ lý'} aria-pressed={voiceEnabled} onClick={toggleVoice}>{voiceEnabled ? 'Tắt giọng' : 'Bật giọng'}</Button>
        <Button type="primary" disabled={busy||!text.trim()||!session} onClick={()=>void send()}>Gửi</Button>
      </div>
    </Modal>
    <Modal
      title="Gợi ý mô tả yêu cầu"
      open={descriptionHelpOpen}
      onCancel={() => setDescriptionHelpOpen(false)}
      footer={<Button type="primary" onClick={() => setDescriptionHelpOpen(false)}>Đã hiểu</Button>}
      width={620}
      className="order-chat-description-help"
    >
      <p>Nêu những gì bạn biết; thông tin chưa rõ có thể ghi “cần tư vấn”.</p>
      <ul>
        <li><strong>Đối tượng và phạm vi:</strong> tên công trình, khu nhà, tầng, mái, tuyến đường hoặc khu vực cần giám sát.</li>
        <li><strong>Việc cần thực hiện:</strong> kiểm tra hiện trạng, theo dõi tiến độ, ghi nhận hư hỏng hoặc so sánh với lần trước.</li>
        <li><strong>Vị trí ưu tiên:</strong> khu vực nghi có vấn đề, mốc dễ nhận biết và chi tiết cần quan sát.</li>
        <li><strong>Góc ghi hình:</strong> toàn cảnh hay cận cảnh, hướng hoặc mặt cần chụp; ghi rõ công trình nếu yêu cầu nhiều hướng.</li>
        <li><strong>Kết quả và lưu ý:</strong> ảnh/video mong muốn, khu vực cần tránh hoặc tài liệu đối chiếu nếu có.</li>
      </ul>
      <strong>Ví dụ</strong>
      <p>Kiểm tra hiện trạng bên ngoài nhà xưởng A, tập trung phần mái phía Đông gần cổng số 2. Chụp toàn cảnh từ bốn hướng và cận cảnh các vị trí mái bong, rỉ sét hoặc biến dạng. Không ghi hình khu văn phòng phía sau.</p>
    </Modal>
    <Modal title={manualStep?labels[manualStep]:''} open={open&&manualStep!==undefined} onCancel={()=>setManualStep(undefined)} width={800} className="order-chat-form" destroyOnHidden footer={<Space><Button onClick={()=>setManualStep(undefined)}>Quay lại trò chuyện</Button><Button type="primary" disabled={busy || (manualStep === 3 && !p.checklistValid)} onClick={() => {
          const completedStep = manualStep
          if (!completedStep || (completedStep === 3 && !p.checklistValid)) return
          if (completedStep === 3) setReviewedChecklistKey(checklistReviewKey)
          const stepDraftKey: Partial<Record<Step, string>> = {
            2: 'location',
            3: 'checklist',
            4: 'contact',
            5: 'schedule',
          }
          const confirmedKey = stepDraftKey[completedStep]
          if (confirmedKey) {
            dispatchRobotEvent('REQUIREMENT_CONFIRMED')
            launchFlyingChip(confirmedKey, labels[completedStep])
          }
          setManualStep(undefined)
          if (completedStep === 6) void validate()
          else {
            const next = nextGuidedStep(
              p.form,
              guidedChecklist,
              p.checklistValid,
              completedStep === 3 ? true : checklistReviewed,
            )
            const guidedNext = next <= completedStep
              ? next
              : (Math.min(completedStep + 1, 6) as Step)
            setGuidedStage(guidedNext)
            void send(
              false,
              'Tôi vừa xác nhận ' + labels[completedStep] + '.',
              flowInstruction(
                guidedNext,
                guidedNext === completedStep ? completedStep : undefined,
                p.form,
              ),
            )
          }
        }}>{manualStep === 6 ? 'Xác nhận và tạo yêu cầu' : 'Xác nhận và tiếp tục'}</Button></Space>}>
      {manualStep && <>
        <motion.div
          className={`order-chat-step-guidance is-step-${manualStep}`}
          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: AI_MOTION.ease.out }}
        >
          <AIAnimatedMascot
            state={mascotState}
            speechAnalyser={speechAnalyser}
            size="companion"
            pointDirection="down"
            calmFocus={calmFocus}
          />
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', marginBottom: 2 }}>Trợ lý AI hướng dẫn</strong>
            <p style={{ margin: 0 }}>{guidance[manualStep]}</p>
          </div>
          {manualStep === 2 && <MiniatureDroneIllustration theme={activeTheme} />}
          <Button size="small" onClick={() => void speak(guidance[manualStep])}>
            Nghe lại hướng dẫn
          </Button>
        </motion.div>
        <motion.div
          key={`step-body-${manualStep}`}
          className={`order-chat-step-body is-step-${manualStep}`}
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.26, ease: AI_MOTION.ease.out }}
        >
          {p.renderStep?.(manualStep)}
        </motion.div>
      </>}
    </Modal>
  </>
}
