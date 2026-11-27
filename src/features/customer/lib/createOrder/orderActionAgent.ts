/**
 * AI Action Agent V5 — Universal Voice-to-Field Engine for the Create-Order workflow.
 *
 * The assistant never executes arbitrary code, URLs or SQL. Every utterance (voice or text)
 * or backend tool proposal is compiled into schema-validated allowlisted actions, executed
 * against the single authoritative FormState & real UI handlers, and verified before replying.
 */
import {
  FLIGHT_PURPOSES,
  MONITORING_RELATIONSHIPS,
  RESULT_FORMATS,
  type FlightPurpose,
  type FormState,
  type MonitoringRelationship,
  type ResultFormat,
  type Step,
} from './types'
import { applyConfirmedAgentChanges, type AgentChanges } from './orderAgent'

export type SectionTarget =
  | 'service'
  | 'purpose'
  | 'description'
  | 'location'
  | 'checklist'
  | 'contact'
  | 'schedule'
  | 'review'

export const SECTION_TARGETS: readonly SectionTarget[] = [
  'service',
  'purpose',
  'description',
  'location',
  'checklist',
  'contact',
  'schedule',
  'review',
] as const

export type TimeSlotHint = 'MORNING' | 'AFTERNOON' | 'EVENING'

export type PreferredTimeCatalogItem = {
  id: string
  name?: string
  label?: string
  startTime?: string
  endTime?: string
}

export type AgentAction =
  | { type: 'select_service'; serviceId: string }
  | { type: 'clear_service' }
  | { type: 'reopen_selection'; target: SectionTarget }
  | { type: 'navigate_step'; step: Step }
  | { type: 'go_back' }
  | { type: 'continue_workflow' }
  | { type: 'confirm_section' }
  | { type: 'keep_previous' }
  | { type: 'set_flight_purpose'; purpose: FlightPurpose; otherText?: string }
  | { type: 'set_description'; text: string }
  | { type: 'append_description'; text: string }
  | { type: 'remove_description_content'; phrase: string }
  | { type: 'clear_description' }
  | { type: 'read_description' }
  | { type: 'evaluate_description' }
  | { type: 'clarify_description'; answer: string }
  | { type: 'improve_description'; mode?: 'professional' | 'shorten' }
  | { type: 'apply_description' }
  | { type: 'search_location'; query: string }
  | { type: 'clear_monitoring_area' }
  | { type: 'open_map' }
  | { type: 'checklist_select_all' }
  | { type: 'checklist_clear_all' }
  | { type: 'checklist_select_mandatory_only' }
  | { type: 'checklist_toggle_item'; index?: number; keyword?: string; selected: boolean }
  | { type: 'checklist_set_images'; count: number }
  | { type: 'checklist_set_videos'; count: number }
  | { type: 'set_result_formats'; formats: ResultFormat[] }
  | {
      type: 'set_contact'
      name?: string
      phone?: string
      email?: string
      accessNotes?: string
      altitudeM?: number
      relationship?: MonitoringRelationship
      authorizationConfirmed?: boolean
    }
  | { type: 'autofill_account_contact' }
  | {
      type: 'set_schedule'
      dateFrom?: string
      dateTo?: string
      preferredTimeId?: string
      timeSlotHint?: TimeSlotHint
      shiftDays?: number
    }
  | { type: 'validate_complete_draft' }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset' }
  | { type: 'submit' }
  | { type: 'confirm_submit' }

export const AGENT_ACTION_TYPES = [
  'select_service',
  'clear_service',
  'reopen_selection',
  'navigate_step',
  'go_back',
  'continue_workflow',
  'confirm_section',
  'keep_previous',
  'set_flight_purpose',
  'set_description',
  'append_description',
  'remove_description_content',
  'clear_description',
  'read_description',
  'evaluate_description',
  'clarify_description',
  'improve_description',
  'apply_description',
  'search_location',
  'clear_monitoring_area',
  'open_map',
  'checklist_select_all',
  'checklist_clear_all',
  'checklist_select_mandatory_only',
  'checklist_toggle_item',
  'checklist_set_images',
  'checklist_set_videos',
  'set_result_formats',
  'set_contact',
  'autofill_account_contact',
  'set_schedule',
  'validate_complete_draft',
  'undo',
  'redo',
  'reset',
  'submit',
  'confirm_submit',
] as const

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const PHONE = /^(?:\+?84|0)\d{9,10}$/
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

/** Schema check for actions coming from any source (local parser or backend tool call). */
export function parseAgentAction(raw: unknown): AgentAction | null {
  if (!raw || typeof raw !== 'object') return null
  const value = raw as Record<string, unknown>
  const str = (key: string) =>
    typeof value[key] === 'string' ? (value[key] as string).trim() : undefined
  switch (value.type) {
    case 'select_service': {
      const serviceId = str('serviceId')
      return serviceId ? { type: 'select_service', serviceId } : null
    }
    case 'set_flight_purpose': {
      if (!FLIGHT_PURPOSES.includes(value.purpose as FlightPurpose)) return null
      const otherText = str('otherText')
      return {
        type: 'set_flight_purpose',
        purpose: value.purpose as FlightPurpose,
        ...(otherText ? { otherText: otherText.slice(0, 200) } : {}),
      }
    }
    case 'set_description': {
      const text = str('text')
      return text && text.length <= 2000 ? { type: 'set_description', text } : null
    }
    case 'append_description': {
      const text = str('text')
      return text && text.length <= 1000 ? { type: 'append_description', text } : null
    }
    case 'remove_description_content': {
      const phrase = str('phrase')
      return phrase && phrase.length <= 200 ? { type: 'remove_description_content', phrase } : null
    }
    case 'clarify_description': {
      const answer = str('answer')
      return answer && answer.length <= 1000 ? { type: 'clarify_description', answer } : null
    }
    case 'improve_description': {
      const mode = value.mode === 'shorten' ? 'shorten' : 'professional'
      return { type: 'improve_description', mode }
    }
    case 'search_location': {
      const query = str('query')
      return query && query.length >= 2 && query.length <= 240
        ? { type: 'search_location', query }
        : null
    }
    case 'set_contact': {
      const name = str('name')
      const phone = str('phone')?.replace(/[\s.-]/g, '')
      const email = str('email')
      const accessNotes = str('accessNotes')
      const altitudeM =
        typeof value.altitudeM === 'number' &&
        Number.isFinite(value.altitudeM) &&
        value.altitudeM >= 10 &&
        value.altitudeM <= 120
          ? Math.round(value.altitudeM)
          : undefined
      const relationship = MONITORING_RELATIONSHIPS.includes(
        value.relationship as MonitoringRelationship,
      )
        ? (value.relationship as MonitoringRelationship)
        : undefined
      const authorizationConfirmed =
        typeof value.authorizationConfirmed === 'boolean'
          ? value.authorizationConfirmed
          : undefined

      if (phone && !PHONE.test(phone)) return null
      if (email && !EMAIL.test(email)) return null
      if (name && name.length > 120) return null
      if (accessNotes && accessNotes.length > 1000) return null
      if (
        !name &&
        !phone &&
        !email &&
        !accessNotes &&
        altitudeM === undefined &&
        !relationship &&
        authorizationConfirmed === undefined
      ) {
        return null
      }
      return {
        type: 'set_contact',
        ...(name ? { name } : {}),
        ...(phone ? { phone } : {}),
        ...(email ? { email } : {}),
        ...(accessNotes ? { accessNotes } : {}),
        ...(altitudeM !== undefined ? { altitudeM } : {}),
        ...(relationship ? { relationship } : {}),
        ...(authorizationConfirmed !== undefined ? { authorizationConfirmed } : {}),
      }
    }
    case 'set_schedule': {
      const dateFrom = str('dateFrom')
      const dateTo = str('dateTo')
      const preferredTimeId = str('preferredTimeId')
      const timeSlotHint =
        value.timeSlotHint === 'MORNING' ||
        value.timeSlotHint === 'AFTERNOON' ||
        value.timeSlotHint === 'EVENING'
          ? value.timeSlotHint
          : undefined
      const shiftDays =
        typeof value.shiftDays === 'number' &&
        Number.isInteger(value.shiftDays) &&
        Math.abs(value.shiftDays) >= 1 &&
        Math.abs(value.shiftDays) <= 60
          ? value.shiftDays
          : undefined
      if (dateFrom && !ISO_DATE.test(dateFrom)) return null
      if (dateTo && !ISO_DATE.test(dateTo)) return null
      if (!dateFrom && !dateTo && !preferredTimeId && !timeSlotHint && shiftDays === undefined) {
        return null
      }
      return {
        type: 'set_schedule',
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
        ...(preferredTimeId ? { preferredTimeId } : {}),
        ...(timeSlotHint ? { timeSlotHint } : {}),
        ...(shiftDays !== undefined ? { shiftDays } : {}),
      }
    }
    case 'checklist_toggle_item': {
      const index =
        typeof value.index === 'number' && Number.isInteger(value.index) && value.index >= 0
          ? value.index
          : undefined
      const keyword = str('keyword')
      if (index === undefined && !keyword) return null
      if (typeof value.selected !== 'boolean') return null
      return {
        type: 'checklist_toggle_item',
        ...(index !== undefined ? { index } : {}),
        ...(keyword ? { keyword } : {}),
        selected: value.selected,
      }
    }
    case 'checklist_set_images':
      return Number.isInteger(value.count) &&
        (value.count as number) >= 0 &&
        (value.count as number) <= 50
        ? { type: 'checklist_set_images', count: value.count as number }
        : null
    case 'checklist_set_videos':
      return Number.isInteger(value.count) &&
        (value.count as number) >= 0 &&
        (value.count as number) <= 20
        ? { type: 'checklist_set_videos', count: value.count as number }
        : null
    case 'set_result_formats': {
      if (!Array.isArray(value.formats)) return null
      const formats = value.formats.filter((f): f is ResultFormat =>
        RESULT_FORMATS.includes(f as ResultFormat),
      )
      return formats.length > 0 ? { type: 'set_result_formats', formats } : null
    }
    case 'reopen_selection':
      return SECTION_TARGETS.includes(value.target as SectionTarget)
        ? { type: 'reopen_selection', target: value.target as SectionTarget }
        : null
    case 'navigate_step':
      return Number.isInteger(value.step) &&
        (value.step as number) >= 1 &&
        (value.step as number) <= 6
        ? { type: 'navigate_step', step: value.step as Step }
        : null
    case 'clear_service':
    case 'go_back':
    case 'continue_workflow':
    case 'confirm_section':
    case 'keep_previous':
    case 'clear_description':
    case 'read_description':
    case 'evaluate_description':
    case 'apply_description':
    case 'clear_monitoring_area':
    case 'checklist_select_all':
    case 'checklist_clear_all':
    case 'checklist_select_mandatory_only':
    case 'autofill_account_contact':
    case 'validate_complete_draft':
    case 'open_map':
    case 'undo':
    case 'redo':
    case 'reset':
    case 'submit':
    case 'confirm_submit':
      return { type: value.type }
    default:
      return null
  }
}

/** Converts backend-proposed AgentChanges into schema-validated allowlisted actions. */
export function agentChangesToActions(changes: AgentChanges | undefined): AgentAction[] {
  if (!changes) return []
  const raw: unknown[] = []
  if (changes.serviceId) raw.push({ type: 'select_service', serviceId: changes.serviceId })
  if (changes.flightPurpose) {
    raw.push({
      type: 'set_flight_purpose',
      purpose: changes.flightPurpose,
      ...(changes.otherFlightPurpose ? { otherText: changes.otherFlightPurpose } : {}),
    })
  }
  if (changes.description) raw.push({ type: 'set_description', text: changes.description })
  if (
    changes.siteContactName ||
    changes.siteContactPhone ||
    changes.accessNotes ||
    changes.altitudeM !== undefined ||
    changes.monitoringRelationship
  ) {
    raw.push({
      type: 'set_contact',
      ...(changes.siteContactName ? { name: changes.siteContactName } : {}),
      ...(changes.siteContactPhone ? { phone: changes.siteContactPhone } : {}),
      ...(changes.accessNotes ? { accessNotes: changes.accessNotes } : {}),
      ...(changes.altitudeM !== undefined ? { altitudeM: changes.altitudeM } : {}),
      ...(changes.monitoringRelationship
        ? { relationship: changes.monitoringRelationship }
        : {}),
    })
  }
  if (changes.preferredDateFrom || changes.preferredDateTo || changes.preferredTimeId) {
    raw.push({
      type: 'set_schedule',
      ...(changes.preferredDateFrom ? { dateFrom: changes.preferredDateFrom } : {}),
      ...(changes.preferredDateTo
        ? { dateTo: changes.preferredDateTo }
        : changes.preferredDateFrom
          ? { dateTo: changes.preferredDateFrom }
          : {}),
      ...(changes.preferredTimeId ? { preferredTimeId: changes.preferredTimeId } : {}),
    })
  }
  return raw.map(parseAgentAction).filter((a): a is AgentAction => a !== null)
}

/* ------------------------------------------------------------------ */
/* Vietnamese understanding & spoken normalization                     */
/* ------------------------------------------------------------------ */

/** Lowercase, strip diacritics (đ → d), keep letters/digits, collapse spaces. */
export function normalizeVi(input: string): string {
  return input
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9@.+/\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Common speech-recognition slips and abbreviations, applied on normalized text. */
const SPEECH_FIXES: Array<[RegExp, string]> = [
  [/\bmua tro\b/g, 'muon chon'],
  [/\bmua chon\b/g, 'muon chon'],
  [/\bmuon tro\b/g, 'muon chon'],
  [/\bmun\b/g, 'muon'],
  [/\bchon\s+tro\b/g, 'chon'],
  [/\bdv\b/g, 'dich vu'],
  [/\bdich du\b/g, 'dich vu'],
  [/\bjam sat\b/g, 'giam sat'],
  [/\bdam sat\b/g, 'giam sat'],
  [/\bgiam sac\b/g, 'giam sat'],
  [/\bgiam xat\b/g, 'giam sat'],
  [/\bgiam sta\b/g, 'giam sat'],
  [/\bkiem cha\b/g, 'kiem tra'],
  [/\bnha suong\b/g, 'nha xuong'],
  [/\bnha xuog\b/g, 'nha xuong'],
  [/\bcong chinh\b/g, 'cong trinh'],
  [/\bcong trng\b/g, 'cong trinh'],
  [/\brungf\b/g, 'rung'],
  [/\bchec lit\b/g, 'checklist'],
  [/\bcl\b/g, 'checklist'],
  [/\bmuc dit\b/g, 'muc dich'],
  [/\bsdt\b/g, 'so dien thoai'],
  [/\bng lien he\b/g, 'nguoi lien he'],
  [/\bko\b|\bk0\b|\bkhong co\b/g, 'khong'],
  [/\bquya\b|\bquai\b/g, 'quay'],
  [/\bvid\b|\bvideo\b|\bvi deo\b/g, 'video'],
  [/\bhoan tat\b(?=\s+thao tac|\s+vua)/g, 'hoan tac'],
  [/\bquay lui\b/g, 'quay lai'],
  [/\bdoi qua\b/g, 'doi sang'],
  [/\blum\b|\bboc\b/g, 'chon'],
  [/\bcoi lai\b/g, 'xem lai'],
  [/\bcoi\s+(?=tien do)/g, 'theo doi '],
  [/\bkhoi\s+(?=quay|video)/g, 'khong can '],
  [/\bdung\s+(?=quay)/g, 'khong can '],
  [/\brao het\b/g, 'het'],
  [/\bbuoc mot\b/g, 'buoc 1'],
  [/\bbuoc hai\b/g, 'buoc 2'],
  [/\bbuoc ba\b/g, 'buoc 3'],
  [/\bbuoc bon\b/g, 'buoc 4'],
  [/\bbuoc nam\b/g, 'buoc 5'],
  [/\bbuoc sau\b/g, 'buoc 6'],
  [/\bsau muoi met\b/g, '60m'],
]

const SECURITY_RESTRICTED_RE = new RegExp(
  [
    '(?:tu dong|tu)\\s+(?:gui|tao)\\s+(?:don|yeu cau).*(?:khong can|luon|ngay)',
    'bo qua\\s+(?:validation|kiem tra|dieu khoan|xac thuc|quy trinh|bao mat)',
    '(?:tu|tu dong)\\s+(?:xac nhan|tich|phe duyet|duyet|ky)\\s+(?:giay phep|dieu khoan|thanh toan|hop dong)',
    '(?:giam gia|discount|mien tien dat coc|mien phi|tu tao ma giam gia|khoa bao gia|sua gia|doi gia)',
    '(?:khach hang khac|khach khac|don hang cua khach|xuat toan bo du lieu)',
    '(?:select\\s+\\*\\s+from|drop\\s+table|delete\\s+from|raw\\s+sql)',
    '(?:system prompt|api key|mat khau admin|tiet lo.*token|in ra.*prompt)',
    '(?:ignore\\s+(?:all\\s+)?previous\\s+instructions|system\\s+override|grant\\s+admin|act\\s+as\\s+admin)',
    '(?:dong vai|gia lam)\\s+(?:quan tri|admin|quan ly)',
    '(?:xoa tat ca don hang|tao dich vu moi|phan cong phi cong)',
    '(?:trang bi vu khi|theo doi rieng tu nha hang xom)',
  ].join('|'),
  'i',
)

export function isSecurityRestrictedRequest(raw: string): boolean {
  const norm = normalizeVi(raw).replace(/\./g, ' ')
  return SECURITY_RESTRICTED_RE.test(norm) || /select\s+\*\s+from|drop\s+table/i.test(raw)
}

export function correctTranscript(normalized: string): string {
  return SPEECH_FIXES.reduce((text, [pattern, fix]) => text.replace(pattern, fix), normalized)
}

const SPOKEN_DIGITS: Record<string, string> = {
  khong: '0',
  mot: '1',
  hai: '2',
  ba: '3',
  bon: '4',
  tu: '4',
  nam: '5',
  lam: '5',
  sau: '6',
  bay: '7',
  tam: '8',
  chin: '9',
}

/** Extracts and normalizes spoken or typed Vietnamese phone numbers. */
export function normalizeSpokenPhone(raw: string): string | undefined {
  const norm = normalizeVi(raw).replace(/\./g, '')
  const direct = norm.replace(/(\d)\s+(?=\d)/g, '$1').match(/(?:\+?84|\b0)\d{9,10}\b/)?.[0]
  if (direct) return direct

  // Convert contiguous spoken Vietnamese digits (e.g. "không chín không một hai ba bốn năm sáu bảy")
  const words = norm.split(' ')
  let run = ''
  for (const w of words) {
    if (SPOKEN_DIGITS[w] !== undefined) {
      run += SPOKEN_DIGITS[w]
    } else if (/^\d+$/.test(w)) {
      run += w
    } else {
      if (PHONE.test(run)) return run
      run = ''
    }
  }
  return PHONE.test(run) ? run : undefined
}

/** Extracts and normalizes spoken or typed email addresses (e.g. "example a cong gmail cham com"). */
export function normalizeSpokenEmail(raw: string): string | undefined {
  const direct = raw.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/)?.[0]
  if (direct) return direct.toLowerCase()

  const norm = normalizeVi(raw)
    .replace(/\s+(?:a cong|acong|at)\s+/g, '@')
    .replace(/\s+(?:cham|dot)\s+/g, '.')
    .replace(/\s*@\s*/g, '@')
    .replace(/\s*\.\s*/g, '.')
  const spoken = norm.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/)?.[0]
  return spoken && EMAIL.test(spoken) ? spoken : undefined
}

const STOP_WORDS = new Set(['dich', 'vu', 'va', 'cho', 'cua', 'cac', 'nha', 'toi'])

function tokens(value: string) {
  return normalizeVi(value).split(' ').filter((word) => word && !STOP_WORDS.has(word))
}

function distance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j++) {
      const current = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1))
      previous = current
    }
  }
  return row[b.length]
}

function wordMatches(word: string, words: string[]) {
  return words.some(
    (candidate) => candidate === word || (word.length >= 5 && distance(candidate, word) <= 1),
  )
}

export type CatalogService = { id: string; name: string; isActive?: boolean }

const GENERIC_SERVICE_WORDS = new Set(['giam', 'sat', 'kiem', 'tra', 'dich', 'vu', 'goi'])

export function matchServices(text: string, services: CatalogService[], threshold = 0.75) {
  const heard = correctTranscript(normalizeVi(text)).split(' ').filter(Boolean)
  return services
    .filter((service) => service.isActive !== false)
    .map((service) => {
      const name = tokens(service.name)
      const hits = name.filter((word) => wordMatches(word, heard)).length
      const fullScore = name.length ? hits / name.length : 0
      const distinctive = name.filter((word) => !GENERIC_SERVICE_WORDS.has(word))
      const distinctiveHits = distinctive.filter((word) => wordMatches(word, heard)).length
      const distinctiveScore =
        distinctive.length > 0 && distinctiveHits === distinctive.length ? 0.85 : 0
      return { service, score: Math.max(fullScore, distinctiveScore) }
    })
    .filter((match) => match.score >= threshold)
    .sort((a, b) => b.score - a.score)
}

const ORDINALS: Record<string, number> = {
  'thu nhat': 0,
  'dau tien': 0,
  'so 1': 0,
  'thu 1': 0,
  'thu hai': 1,
  'thu 2': 1,
  'so 2': 1,
  'thu ba': 2,
  'thu 3': 2,
  'so 3': 2,
  'thu tu': 3,
  'thu 4': 3,
  'so 4': 3,
  'thu nam': 4,
  'thu 5': 4,
  'so 5': 4,
  'cuoi cung': -1,
}

const PURPOSE_KEYWORDS: Array<[FlightPurpose, RegExp]> = [
  ['CONSTRUCTION_MONITORING', /\b(tien do|thi cong|xay dung)\b/],
  ['INDUSTRIAL_INSPECTION', /\b(kiem tra nha xuong|co so san xuat|kiem tra cong nghiep|hien trang mai)\b/],
  ['AGRICULTURE', /\b(nong nghiep|cay trong|mua mang|canh tac)\b/],
  ['FOREST_MONITORING', /\b(tai nguyen rung|giam sat rung|bao ve rung)\b/],
  ['SURVEY_MONITORING', /\b(do dac|khao sat)\b/],
  ['AREA_MONITORING', /\b(giam sat khu vuc|hien trang tu tren cao|kiem tra hien trang)\b/],
]

export type ConversationMemory = {
  activeStep?: Step
  activeSection?: SectionTarget
  lastReferencedSection?: SectionTarget
  lastAction?: AgentAction
  previousServiceId?: string
  currentServiceId?: string
  hasFlightPurpose?: boolean
  hasDescription?: boolean
  hasActiveDescriptionQuestion?: boolean
  hasGeneratedDescription?: boolean
  awaitingSubmitConfirm?: boolean
  canRedo?: boolean
}

export type ParseContext = {
  services: CatalogService[]
  displayedServices?: CatalogService[]
  preferredTimes?: PreferredTimeCatalogItem[]
  today?: string
  memory?: ConversationMemory
}

export type ParseResult = {
  actions: AgentAction[]
  clarification?: string
}

function addDays(iso: string, days: number) {
  const date = new Date(iso + 'T00:00:00Z')
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function nextWeekday(today: string, targetDow: number): string {
  const d = new Date(today + 'T00:00:00Z')
  const current = d.getUTCDay()
  let delta = (targetDow - current + 7) % 7
  if (delta === 0) delta = 7
  return addDays(today, delta)
}

function explicitDates(text: string, today: string): string[] {
  const year = Number(today.slice(0, 4))
  const found: string[] = []
  for (const match of text.matchAll(
    /\b(\d{1,2})\s*(?:\/|-|thang)\s*(\d{1,2})(?:\s*(?:\/|-|nam)\s*(\d{4}))?\b/g,
  )) {
    const day = Number(match[1])
    const month = Number(match[2])
    if (day < 1 || day > 31 || month < 1 || month > 12) continue
    let y = match[3] ? Number(match[3]) : year
    let iso = `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    if (!match[3] && iso < today) {
      y += 1
      iso = `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    }
    found.push(iso)
  }
  return found
}

function parseRelativeDateVi(text: string, today: string): string | undefined {
  if (/\b(ngay mai|sang mai|chieu mai|toi mai)\b/.test(text)) return addDays(today, 1)
  if (/\b(ngay kia|ngay mot)\b/.test(text)) return addDays(today, 2)
  if (/\btuan sau\b/.test(text)) return addDays(today, 7)
  // Never confuse ordinal item selection ("cái thứ ba", "mục thứ hai") with weekday names.
  if (/\b(?:cai|muc|the|goi|dich vu|lua chon)\s+thu\s+(?:hai|ba|tu|nam|sau|bay|2|3|4|5|6|7)\b/.test(text)) {
    return undefined
  }
  if (/\bthu\s*(?:hai|2)\b/.test(text)) return nextWeekday(today, 1)
  if (/\bthu\s*(?:ba|3)\b/.test(text)) return nextWeekday(today, 2)
  if (/\bthu\s*(?:tu|4)\b/.test(text)) return nextWeekday(today, 3)
  if (/\bthu\s*(?:nam|5)\b/.test(text)) return nextWeekday(today, 4)
  if (/\bthu\s*(?:sau|6)\b/.test(text)) return nextWeekday(today, 5)
  if (/\bthu\s*(?:bay|7)\b/.test(text)) return nextWeekday(today, 6)
  if (/\bchu nhat\b/.test(text)) return nextWeekday(today, 0)
  return undefined
}

function parseTimeSlotHint(text: string): { hint?: TimeSlotHint; hour?: number } {
  const spokenHours: Record<string, number> = {
    mot: 1, hai: 2, ba: 3, bon: 4, tu: 4, nam: 5, sau: 6,
    bay: 7, tam: 8, chin: 9, muoi: 10, 'muoi mot': 11, 'muoi hai': 12,
  }
  const normalizedHours = Object.entries(spokenHours).reduce(
    (acc, [word, num]) => acc.replace(new RegExp(`\\b${word}\\s+(?=gio\\b)`, 'g'), `${num} `),
    text,
  )
  const hourMatch = normalizedHours.match(/\b(?:luc\s+)?(\d{1,2})\s*(?:gio|h)(?:\s*ruoi|\s*\d{1,2})?\s*(sang|chieu|toi)?\b/)
  if (hourMatch) {
    let h = Number(hourMatch[1])
    const meridiem = hourMatch[2]
    if (meridiem === 'chieu' && h < 12) h += 12
    if (meridiem === 'toi' && h < 12) h += 12
    if (meridiem === 'sang' || (h >= 5 && h <= 11)) return { hint: 'MORNING', hour: h }
    if (meridiem === 'chieu' || (h >= 12 && h <= 17)) return { hint: 'AFTERNOON', hour: h }
    if (meridiem === 'toi' || h >= 18) return { hint: 'EVENING', hour: h }
  }
  if (/\b(buoi sang|sang mai|sang thu|vao buoi sang)\b/.test(text)) return { hint: 'MORNING' }
  if (/\b(buoi chieu|chieu mai|chieu thu|vao buoi chieu)\b/.test(text)) return { hint: 'AFTERNOON' }
  if (/\b(buoi toi|toi mai|toi thu)\b/.test(text)) return { hint: 'EVENING' }
  return {}
}

export function resolvePreferredTimeId(
  times: PreferredTimeCatalogItem[] | undefined,
  hint?: TimeSlotHint,
  hour?: number,
): string | undefined {
  if (!times || times.length === 0 || (!hint && hour === undefined)) return undefined
  if (hour !== undefined) {
    const byHour = times.find((slot) => {
      const start = Number((slot.startTime ?? '').slice(0, 2))
      const end = Number((slot.endTime ?? '').slice(0, 2))
      return Number.isFinite(start) && Number.isFinite(end) && hour >= start && hour <= end
    })
    if (byHour) return byHour.id
  }
  if (hint === 'MORNING') {
    return (
      times.find((s) => /sang|morning|06|07|08|09/i.test(`${s.name ?? ''} ${s.label ?? ''} ${s.startTime ?? ''}`))?.id ??
      times[0]?.id
    )
  }
  if (hint === 'AFTERNOON') {
    return (
      times.find((s) => /chieu|afternoon|13|14|15|16/i.test(`${s.name ?? ''} ${s.label ?? ''} ${s.startTime ?? ''}`))?.id ??
      times[1]?.id ??
      times[0]?.id
    )
  }
  if (hint === 'EVENING') {
    return times.find((s) => /toi|evening|17|18|19/i.test(`${s.name ?? ''} ${s.label ?? ''} ${s.startTime ?? ''}`))?.id
  }
  return undefined
}

/** Resolve mid-utterance Vietnamese voice self-corrections ("à không", "khoan,", "thôi bỏ") to the final intention. */
function resolveVoiceSelfCorrection(raw: string): string {
  const parts = raw.split(/(?:,\s*|\s+)(?:[àa]\s+kh[ôo]ng|kh[ôo]ng\s*,\s*|khoan\s*,\s*)(?=\s*[a-zA-ZÀ-ỹ0-9])/i)
  if (parts.length > 1) {
    const tail = parts[parts.length - 1].trim()
    if (tail.length >= 4 && !/^(?:nh[àa]\s*x[ưu][ởo]ng|r[ừu]ng|c[ôo]ng\s*tr[ìi]nh)\s*,/i.test(tail)) {
      return tail
    }
  }
  return raw
}

function stripNegatedClause(raw: string): string {
  const deaccented = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
  const cleaned = deaccented.replace(
    /\b(?:khong phai|khong chon|khong lay|bo qua)\s+[^,.;!?]+?(?=\s*(?:ma la|ma chon|doi sang|chuyen sang|$)|[,.;!?])/g,
    ' ',
  )
  return correctTranscript(normalizeVi(cleaned))
}

function detectExplicitSection(text: string): SectionTarget | null {
  if (/\b(dich vu|goi dich vu)\b/.test(text)) return 'service'
  if (/\b(muc dich|muc dich bay)\b/.test(text)) return 'purpose'
  if (/\b(mo ta|noi dung nhiem vu)\b/.test(text)) return 'description'
  if (/\b(khu vuc|dia chi|dia diem|vi tri|ban do)\b/.test(text)) return 'location'
  if (/\b(checklist|hang muc|san pham)\b/.test(text)) return 'checklist'
  if (/\b(lien he|nguoi lien he|so dien thoai|hien truong|quyen giam sat)\b/.test(text)) return 'contact'
  if (/\b(lich bay|ngay bay|khung gio|thoi gian)\b/.test(text)) return 'schedule'
  if (/\b(xem lai|ban giao|tong ket|dieu khoan)\b/.test(text)) return 'review'
  return null
}

/** True when the customer is asking a consultation question rather than issuing a command. */
function isConsultationQuestion(original: string, text: string): boolean {
  if (/\b(mo ta.*co on khong|danh gia mo ta)\b/.test(text)) return false
  if (/\b(co duoc khong|co ho tro.*khong|bao nhieu tien|chi phi the nao|mat bao lau|la gi|nhu the nao)\b/.test(text)) {
    return true
  }
  if (original.trim().endsWith('?') && !/\b(chon|doi|them|bo|sua|xoa|ap dung|xac nhan|gui)\b/.test(text)) {
    return true
  }
  return false
}

/** Extracts a specific location query from Vietnamese phrasing ("tại ...", "ở ...", "địa chỉ là ..."). */
function extractLocationQuery(original: string, text: string): string | undefined {
  const explicit = original.match(
    /(?:địa\s*chỉ\s*(?:là|:)|tại|ở)\s+([^,.;!?]{3,140}?)(?=\s*(?:,|;|\.|quay\b|chụp\b|bay\b|lúc\b|lấy\b|số\b|email\b|tôi\s+tên|$))/i,
  )?.[1]?.trim()
  if (explicit && !/^(?:đây|chỗ này|gần đây|bên kia|đâu đó|khu vực này)$/i.test(explicit)) {
    // Avoid capturing "tại công trình" generic noun without place name
    if (normalizeVi(explicit).split(' ').length >= 2) return explicit
  }
  // Strip vague phrases check
  if (/\b(o day|cho nay|gan day|ben kia|dau do)\b/.test(text)) return undefined
  return undefined
}

/** Deterministic V5 Universal Voice-to-Field parser over the real catalog; never invents IDs or coordinates. */
export function parseUtterance(raw: string, context: ParseContext): ParseResult {
  const original = resolveVoiceSelfCorrection(raw.trim())
  if (!original) return { actions: [] }

  // 0a. Security & authorization gate FIRST — never emit submit or mutating actions!
  if (isSecurityRestrictedRequest(original)) {
    return {
      actions: [],
      clarification:
        'Em không thể thực hiện yêu cầu này vì vượt ngoài quyền hạn của trợ lý (không tự gửi đơn, không sửa giá/giảm giá, không bỏ qua kiểm tra hoặc truy cập dữ liệu khách hàng khác).',
    }
  }

  const text = correctTranscript(normalizeVi(original))
  const actions: AgentAction[] = []
  if (!text) return { actions }
  const today = context.today ?? new Date().toISOString().slice(0, 10)
  const mem = context.memory

  // 0b. Consultation questions must NOT mutate form state (Section 17)
  if (isConsultationQuestion(original, text)) {
    return { actions: [] }
  }

  // 1. Final submit confirmation when dialog is awaiting confirmation
  if (
    mem?.awaitingSubmitConfirm &&
    /\b(toi xac nhan gui|xac nhan gui|dong y gui|gui ngay di)\b/.test(text)
  ) {
    return { actions: [{ type: 'confirm_submit' }] }
  }

  // 2. Redo / Undo / Restore initial / Restore previous / Keep previous / Reset
  if (
    /^(?:ap dung lai|lam lai)$/.test(text) ||
    /\b(redo|lam lai thao tac|ap dung lai thao tac vua huy|ap dung lai thao tac vua hoan tac|khoi phuc(?: lai)? thao tac vua hoan tac|lam lai buoc vua undo|thuc hien lai thao tac vua hoan tac|tien lai thao tac vua undo)\b/.test(
      text,
    )
  ) {
    return { actions: [{ type: 'redo' }] }
  }
  if (
    /\b(hoan tac|undo|bo thao tac vua roi|quay lai trang thai truoc thao tac|huy thay doi vua nay|huy thao tac moi nay|bo buoc vua lam|tra lai nhu truoc luc ai sua)\b/.test(
      text,
    )
  ) {
    return { actions: [{ type: 'undo' }] }
  }

  if (/\b(lua chon ban dau|lua chon dau tien ban dau|ve lua chon ban dau)\b/.test(text)) {
    const initialId = (mem as ConversationMemory & { initialServiceId?: string })?.initialServiceId ?? mem?.previousServiceId
    if (initialId) return { actions: [{ type: 'select_service', serviceId: initialId }] }
    return { actions: [{ type: 'undo' }] }
  }

  if (
    /\b(lay cai cu|lay lai cai cu|quay ve cai luc nay|quay ve cai vua nay|chon lai cai cu|chon lai cai luc nay|lay lai cai luc nay|dung lai cai luc nay|giu nguyen mo ta cu)\b/.test(
      text,
    )
  ) {
    if (/\bmo ta\b/.test(text)) return { actions: [{ type: 'undo' }] }
    if (mem?.previousServiceId) {
      return { actions: [{ type: 'select_service', serviceId: mem.previousServiceId }] }
    }
    return { actions: [{ type: 'undo' }] }
  }

  if (/\b(giu nguyen|giu y nguyen|thoi giu nguyen|giu nhu cu|thoi khong doi nua|khong doi dich vu nua)\b/.test(text)) {
    actions.push({ type: 'keep_previous' })
  }

  if (/\b(xoa het ban nhap|lam lai tu dau|reset ban nhap|xoa ban nhap)\b/.test(text)) {
    return { actions: [{ type: 'reset' }] }
  }

  // 3. Complete draft validation ("Kiểm tra lại toàn bộ")
  if (/\b(kiem tra lai toan bo|kiem tra ban nhap|xem con thieu gi|ra soat toan bo)\b/.test(text)) {
    return { actions: [{ type: 'validate_complete_draft' }] }
  }

  // 4. Description 4-stage refinement & editing commands (Section 6)
  if (/\b(doc lai mo ta|nghe lai mo ta)\b/.test(text)) {
    return { actions: [{ type: 'read_description' }] }
  }
  if (/\b(xoa mo ta|xoa het mo ta)\b/.test(text)) {
    return { actions: [{ type: 'clear_description' }] }
  }
  if (/\b(danh gia mo ta|mo ta.*co on khong|kiem tra mo ta)\b/.test(text)) {
    return { actions: [{ type: 'evaluate_description' }] }
  }
  if (/\b(viet mo ta chuyen nghiep hon|hoan thien mo ta|viet lai mo ta hay hon|chuan hoa mo ta)\b/.test(text)) {
    return { actions: [{ type: 'improve_description', mode: 'professional' }] }
  }
  if (/\b(rut gon mo ta|viet ngan gon mo ta)\b/.test(text)) {
    return { actions: [{ type: 'improve_description', mode: 'shorten' }] }
  }
  if (/\b(ap dung mo ta|ap dung di|duoc roi ap dung|ap dung luon)\b/.test(text)) {
    if (mem?.activeSection === 'description' || mem?.hasGeneratedDescription || /\bmo ta\b/.test(text)) {
      return { actions: [{ type: 'apply_description' }] }
    }
    return { actions: [{ type: 'confirm_section' }] }
  }
  const appendDesc = original.match(
    /(?:th[êe]m|b[ổo]\s*sung)\s+(.+?)\s+(?:v[àa]o\s+m[ôo]\s*t[ảa])/i,
  )?.[1]?.trim()
  if (appendDesc) {
    return { actions: [{ type: 'append_description', text: appendDesc }] }
  }
  if (
    mem?.activeSection === 'description' &&
    /^(?:th[êe]m|b[ổo]\s*sung)\s+/i.test(original) &&
    !/\b(video|checklist|hang muc|ghi chu)\b/.test(text)
  ) {
    const addition = original.replace(/^(?:th[êe]m|b[ổo]\s*sung)\s+/i, '').trim()
    if (addition.length >= 3) return { actions: [{ type: 'append_description', text: addition }] }
  }
  const removeDesc = original.match(
    /(?:b[ỏo]|x[óo]a)\s+(?:ph[ầa]n|m[ụu]c|đo[ạa]n)\s+(.+?)(?:\s*(?:đi|trong m[ôo] t[ảa]|kh[ỏo]i m[ôo] t[ảa]|$))/i,
  )?.[1]?.trim()
  if (removeDesc && !/\b(video|phim|checklist|hang muc)\b/.test(text)) {
    return { actions: [{ type: 'remove_description_content', phrase: removeDesc }] }
  }
  const replaceDesc = original.match(
    /(?:s[ửu]a\s*(?:l[ạa]i\s*)?(?:m[ôo]\s*t[ảa]\s*)?th[àa]nh)\s+(.+)$/i,
  )?.[1]?.trim()
  if (replaceDesc && !/\b(so dien thoai|sdt|lich|ngay|dich vu|muc dich|do cao|lien he)\b/.test(text)) {
    return { actions: [{ type: 'set_description', text: replaceDesc }] }
  }

  // 5. Confirmation & workflow continuation ("Xác nhận", "Được rồi", "Tiếp tục đi")
  if (
    /\b(tiep tuc di|tiep tuc|thoi khoi tiep tuc|khong can chon lai nua|chuyen buoc tiep theo|di tiep luon)\b/.test(text) &&
    text.split(' ').length <= 10
  ) {
    return { actions: [{ type: 'continue_workflow' }] }
  }
  if (/^(?:xac nhan|duoc roi|ok|dong y|chot|xac nhan luon)$/.test(text)) {
    return { actions: [{ type: 'confirm_section' }] }
  }

  // 6. Direct step navigation (non-blocking for navigate_step so "Quay lại bước 3 rồi bỏ quay video" runs both)
  if (/\b(quay lai buoc dau|ve buoc dau|quay ve buoc dau|buoc 1|buoc dau tien)\b/.test(text)) {
    actions.push({ type: 'reopen_selection', target: 'service' })
  } else if (
    /\b(quay lai buoc truoc|quay ve luc nay|lui lai mot buoc)\b/.test(text) ||
    /^(?:khoan\s+|thoi\s+)?quay lai(?:\s+di|\s+nhe|\s+em|\s+gium.*)?$/.test(text)
  ) {
    actions.push({ type: 'go_back' })
  } else {
    const explicitStepMatch = text.match(/\b(?:sang|ve|den|toi|mo|quay lai|chuyen sang)\s+buoc\s+([1-6])\b/)
    if (explicitStepMatch) {
      actions.push({ type: 'navigate_step', step: Number(explicitStepMatch[1]) as Step })
    }
  }

  // 7. Monitoring area clear command
  if (/\b(xoa vung giam sat|bo vung giam sat|xoa khu vuc da ve)\b/.test(text)) {
    return { actions: [{ type: 'clear_monitoring_area' }] }
  }

  // 8. Active description clarification answer (Stage 2 of 4-stage refinement)
  if (
    mem?.activeSection === 'description' &&
    mem.hasActiveDescriptionQuestion &&
    !detectExplicitSection(text) &&
    !/\b(gui yeu cau|hoan tac|quay lai)\b/.test(text)
  ) {
    return { actions: [{ type: 'clarify_description', answer: original }] }
  }

  // 9. Service resolution (handles negation "không phải nhà xưởng, công trình" & ordinals)
  const cleanedForMatch = /\b(khong phai|khong chon|khong lay|bo qua)\b/.test(text)
    ? stripNegatedClause(original)
    : text
  const wantsService = /\b(dich vu|goi|the|muc|cai|lua chon|chon|lay|doi sang|chuyen sang|muon|khong phai|dang noi|dat)\b/.test(text)
  const isPurposeOnlyClause =
    /\bmuc dich\b/.test(text) && !/\b(dich vu|chon|doi sang|chuyen sang|lay|dat)\b/.test(text.split(/\bmuc dich\b/)[0] ?? '')
  const matches = isPurposeOnlyClause ? [] : matchServices(cleanedForMatch, context.services)
  const best = matches[0]

  const displayed = (context.displayedServices ?? context.services).filter((s) => s.isActive !== false)
  const ordinalMatch = Object.entries(ORDINALS).find(([phrase]) =>
    new RegExp(`\\b(?:cai|dich vu|the|goi|muc|lua chon)?\\s*${phrase}\\b`).test(cleanedForMatch),
  )
  const outOfRangeOrdinal = cleanedForMatch.match(/\b(?:cai|dich vu|the|goi|muc|lua chon)\s+(?:thu|so)\s+(\d+)\b/)
  const hasOrdinalServiceIntent = Boolean(
    ordinalMatch &&
      !/\bbuoc\s+[1-6]\b/.test(cleanedForMatch) &&
      !/\b(bo|xoa|huy)\s+muc\b/.test(cleanedForMatch) &&
      (/\b(chon|lay|cai|dich vu|goi|the|muc|lua chon)\b/.test(cleanedForMatch) ||
        cleanedForMatch.split(' ').length <= 4),
  )

  if (
    !best &&
    !hasOrdinalServiceIntent &&
    /\b(khong muon chon dich vu nay nua|khong lay dich vu nay nua|bo chon dich vu|bo dich vu nay|khong lay cai do nua|khong phai cai nay)\b/.test(text)
  ) {
    return { actions: [{ type: 'clear_service' }, { type: 'reopen_selection', target: 'service' }] }
  }

  const asksReselect = /\b(chon lai|sua lai|doi lai|mo lai|chinh lai|xem lai|quay lai chon|quay ve chon|ve lai chon|ve chon|quay lai dich vu|quay ve dich vu|doi dich vu|cho toi doi cai khac|thoi doi lai|doi sang dia chi khac|doi dich vu truoc|sua .* truoc)\b/.test(text)

  // Unlisted service check ("chọn dịch vụ giao đồ ăn", "phun thuốc trừ sâu", "vận chuyển hàng hóa")
  if (
    !best &&
    !hasOrdinalServiceIntent &&
    !outOfRangeOrdinal &&
    !asksReselect &&
    /\bdich vu\s+(?!nay|do|cu|khac|nha\b|nhe\b|di\b|giup\b|gium\b|luon\b|voi\b|a\b|giam sat\b|kiem tra\b)[a-z0-9]+/.test(cleanedForMatch) &&
    matchServices(cleanedForMatch, context.services, 0.5).length === 0 &&
    !/\b(chon lai|sua lai|doi lai|mo lai|doi dich vu|chinh lai|bo chon)\b/.test(text)
  ) {
    return { actions: [] }
  }
  const explicitTarget = detectExplicitSection(text)
  const hasExplicitNewValue =
    Boolean(best) ||
    hasOrdinalServiceIntent ||
    PURPOSE_KEYWORDS.some(([, pattern]) => pattern.test(text)) ||
    explicitDates(text, today).length > 0 ||
    Boolean(normalizeSpokenPhone(original)) ||
    Boolean(normalizeSpokenEmail(original)) ||
    /m[ôo]\s*t[ảa]\s*(?:nhi[ệe]m\s*v[ụu])?\s*(?:l[àa]|:)/i.test(original)

  if (
    explicitTarget === 'location' &&
    /\b(o day|cho nay|gan day|ben kia|dau do)\b/.test(text)
  ) {
    return {
      actions: [],
      clarification:
        'Anh/chị cho em địa chỉ cụ thể (số nhà, đường, phường/xã, tỉnh) để mở bản đồ đúng vị trí nhé?',
    }
  }

  if (asksReselect && !hasExplicitNewValue) {
    if (explicitTarget) {
      return { actions: [{ type: 'reopen_selection', target: explicitTarget }] }
    }
    const memTarget = mem?.activeSection ?? mem?.lastReferencedSection
    if (memTarget && memTarget !== 'service') {
      if (mem?.activeStep === 1 && mem.currentServiceId && mem.hasFlightPurpose) {
        return { actions: [], clarification: 'Anh/chị muốn chọn lại dịch vụ hay mục đích bay?' }
      }
      return { actions: [{ type: 'reopen_selection', target: memTarget }] }
    }
    if (mem?.currentServiceId && mem?.hasFlightPurpose && !memTarget) {
      return { actions: [], clarification: 'Anh/chị muốn chọn lại dịch vụ hay mục đích bay?' }
    }
    return { actions: [{ type: 'reopen_selection', target: 'service' }] }
  }

  const wantsEditSection = /\b(sua|doi|chinh|mo|xem|quay lai)\b/.test(text)
  if (explicitTarget && wantsEditSection && !hasExplicitNewValue && explicitTarget !== 'service' && explicitTarget !== 'checklist') {
    const hasLoc = Boolean(extractLocationQuery(original, text))
    if (!hasLoc && !actions.some((a) => a.type === 'navigate_step' || a.type === 'go_back' || a.type === 'reopen_selection')) {
      return { actions: [{ type: 'reopen_selection', target: explicitTarget }] }
    }
  }

  if (best && (matches.length === 1 || best.score > matches[1].score)) {
    actions.push({ type: 'select_service', serviceId: best.service.id })
  } else if (hasOrdinalServiceIntent && ordinalMatch) {
    const index = ordinalMatch[1] < 0 ? displayed.length - 1 : ordinalMatch[1]
    const service = displayed[index]
    if (service) actions.push({ type: 'select_service', serviceId: service.id })
    else return { actions: [], clarification: `Hiện chỉ có ${displayed.length} dịch vụ. Anh/chị muốn chọn dịch vụ nào?` }
  } else if (outOfRangeOrdinal) {
    const num = Number(outOfRangeOrdinal[1])
    if (num < 1 || num > displayed.length) {
      return { actions: [], clarification: `Hiện chỉ có ${displayed.length} dịch vụ. Anh/chị muốn chọn dịch vụ nào?` }
    }
  } else if (matches.length > 1 && wantsService) {
    return {
      actions: [],
      clarification: `Anh/chị muốn chọn dịch vụ nào: ${matches.map((m) => m.service.name).join(' hay ')}?`,
    }
  } else if (wantsService && !isPurposeOnlyClause && matchServices(cleanedForMatch, context.services, 0.5).length > 1) {
    const partial = matchServices(cleanedForMatch, context.services, 0.5)
    return {
      actions: [],
      clarification: `Anh/chị muốn chọn dịch vụ nào: ${partial.map((m) => m.service.name).join(' hay ')}?`,
    }
  } else if (wantsService && mem?.activeSection !== 'checklist') {
    const ordinal = Object.entries(ORDINALS).find(([phrase]) =>
      new RegExp(`\\b(cai|dich vu|the|lua chon)?\\s*${phrase}\\b`).test(text),
    )
    const displayed = (context.displayedServices ?? context.services).filter((s) => s.isActive !== false)
    if (ordinal && /\b(chon|lay|cai|dich vu)\b/.test(text) && !/\bmuc\b/.test(text)) {
      const index = ordinal[1] < 0 ? displayed.length - 1 : ordinal[1]
      const service = displayed[index]
      if (service) actions.push({ type: 'select_service', serviceId: service.id })
      else return { actions: [], clarification: `Hiện chỉ có ${displayed.length} dịch vụ. Anh/chị muốn chọn dịch vụ nào?` }
    }
  }

  // 10. Flight Purpose resolution (natural Vietnamese descriptions, even without saying "mục đích")
  const explicitPurposeSlice = cleanedForMatch.match(/\bmuc dich\b(.*)$/)?.[1]
  const purposeSource = explicitPurposeSlice ?? cleanedForMatch
  const purpose = PURPOSE_KEYWORDS.find(([, pattern]) => pattern.test(purposeSource))
  if (purpose) {
    const selectedServiceInSameTurn = actions.some((a) => a.type === 'select_service')
    // Only auto-set purpose from natural text when either explicit "mục đích", on purpose section
    // (without simultaneously switching service), or a strong purpose phrase is clearly stated.
    const strongPurpose =
      Boolean(explicitPurposeSlice) ||
      (mem?.activeSection === 'purpose' && !selectedServiceInSameTurn) ||
      /\b(theo doi tien do|giam sat tien do|tien do cong trinh|tien do thi cong|tien do xay dung|khao sat khu vuc|do dac cong trinh|kiem tra hien trang)\b/.test(
        cleanedForMatch,
      )
    if (strongPurpose) {
      actions.push({ type: 'set_flight_purpose', purpose: purpose[0] })
    }
  }

  // 11. Mission Description extraction (explicit OR contextual when on description section OR rich mission phrasing)
  const isChitchatOrNoise =
    /^(?:alo|o um|um|de xem|khoan cho|cho xiu|hom nay troi|cam on|xin chao|chao ban|hello|hi|test|12345)\b/.test(text) ||
    /\b(nghe ro khong|troi dep qua|de xem da|khoan cho xiu)\b/.test(text) ||
    !/[a-z]{3,}/.test(text)
  const explicitDescription = original
    .match(/m[ôo]\s*t[ảa]\s*(?:nhi[ệe]m\s*v[ụu]|y[êe]u\s*c[ầa]u)?\s*(?:l[àa]|:)\s*(.+)$/i)?.[1]
    ?.trim()
  if (explicitDescription) {
    actions.push({ type: 'set_description', text: explicitDescription })
  } else if (
    mem?.activeSection === 'description' &&
    actions.length === 0 &&
    !isChitchatOrNoise &&
    original.length >= 10 &&
    !/\b(gui yeu cau|kiem tra lai)\b/.test(text)
  ) {
    actions.push({ type: 'set_description', text: original })
  } else if (
    /\b(quay toan canh|kiem tra mai|ghi nhan tien do|chup anh mai|kiem tra hien trang toa nha|quay phim cong trinh)\b/.test(
      text,
    )
  ) {
    actions.push({ type: 'set_description', text: original })
  }

  // 12. Location extraction & geocoding search (never fabricates coordinates!)
  const isAmbiguousLocation =
    /\b(khu vuc|dia diem|vi tri|ban do|o day|cho nay|gan day|ben kia|dau do)\b/.test(text) &&
    /\b(o day|cho nay|gan day|ben kia|dau do)\b/.test(text) &&
    !actions.some((a) => a.type === 'select_service' || a.type === 'set_flight_purpose')

  if (isAmbiguousLocation) {
    return {
      actions,
      clarification:
        'Anh/chị cho em địa chỉ cụ thể (số nhà, đường, phường/xã, tỉnh) để mở bản đồ đúng vị trí nhé?',
    }
  }

  const locQuery = extractLocationQuery(original, text)
  if (locQuery) {
    actions.push({ type: 'search_location', query: locQuery })
  } else if (
    mem?.activeSection === 'location' &&
    actions.length === 0 &&
    original.length >= 4 &&
    !/\b(o day|cho nay|gan day|ben kia|dau do|gui yeu cau)\b/.test(text)
  ) {
    actions.push({ type: 'search_location', query: original })
  } else if (
    /\b(khu vuc|dia diem|vi tri|ban do)\b/.test(text) &&
    !actions.some((a) => a.type === 'select_service' || a.type === 'set_flight_purpose')
  ) {
    if (text.split(' ').length < 6) {
      return {
        actions,
        clarification:
          'Anh/chị cho em địa chỉ cụ thể (số nhà, đường, phường/xã, tỉnh) để mở bản đồ đúng vị trí nhé?',
      }
    }
    actions.push({ type: 'open_map' })
  }

  // 13. Checklist & Deliverables
  if (
    /\b(tich|chon|lay)\s+(het|tat ca|toan bo)\s*(cac\s+)?(hang muc|checklist|muc)?\b/.test(text) &&
    /\b(checklist|hang muc|muc|het|tat ca)\b/.test(text)
  ) {
    actions.push({ type: 'checklist_select_all' })
  } else if (/\b(bo het|bo chon het|xoa het checklist|bo tat ca)\b/.test(text)) {
    actions.push({ type: 'checklist_clear_all' })
  } else if (/\b(chi lay.*bat buoc|chi chon.*bat buoc|muc bat buoc)\b/.test(text)) {
    actions.push({ type: 'checklist_select_mandatory_only' })
  } else {
    const itemOrdinal = Object.entries(ORDINALS).find(([phrase]) =>
      new RegExp(`\\bmuc\\s+${phrase}\\b`).test(text),
    )
    if (itemOrdinal) {
      const deselect = /\b(bo|xoa|huy)\b/.test(text)
      actions.push({
        type: 'checklist_toggle_item',
        index: itemOrdinal[1] < 0 ? 0 : itemOrdinal[1],
        selected: !deselect,
      })
    }
  }

  if (/\b(bo|khong (can|lay|quay)|bo qua)\s*(quay\s*)?(video|phim)\b|\bkhong\s+video\b/.test(text)) {
    actions.push({ type: 'checklist_set_videos', count: 0 })
  } else if (/\b(them lai|tich them|bat lai|them|co|chup anh va quay|quay)\s*(cai\s*)?(quay\s*)?(video|phim)\b/.test(text)) {
    actions.push({ type: 'checklist_set_videos', count: 1 })
  }

  if (/\b(bo|khong (can|lay|chup))\s*(chup\s*)?anh\b/.test(text)) {
    actions.push({ type: 'checklist_set_images', count: 0 })
  } else if (/\b(chup anh va quay video|them chup anh|co chup anh)\b/.test(text)) {
    actions.push({ type: 'checklist_set_images', count: 3 })
  }

  // 14. Contact & Site Information (including Account Autofill, spoken phone & email)
  if (
    /\b(lay thong tin.*tai khoan|thong tin trong tai khoan|dung so dien thoai da dang ky|thong tin tu tai khoan)\b/.test(
      text,
    )
  ) {
    actions.push({ type: 'autofill_account_contact' })
  }

  const phone = normalizeSpokenPhone(original)
  const email = normalizeSpokenEmail(original)
  const name = original
    .match(
      /(?:ng[ưu][ờo]i\s*li[êe]n\s*h[ệe]|t[êe]n|t[ôo]i\s*t[êe]n)\s*(?:l[àa]\s*|:\s*|\s+)([A-Za-zÀ-ỹ][A-Za-zÀ-ỹ\s]{1,60}?)(?=\s*(?:,|\.|s[ốo]|sdt|email|\d|$))/i,
    )?.[1]
    ?.replace(/^(?:l[àa]|th[àa]nh)\s+/i, '')
    ?.trim()
  const accessNotes = original
    .match(/(?:(?:th[êe]m\s+)?ghi\s*ch[úu]\s*(?:h[iệe]n\s*tr[ưu][ờo]ng\s*)?|[đd]i[ềe]u\s*ki[ệe]n\s*ra\s*v[àa]o)\s*(?:l[àa]|:)\s*(.+)$/i)?.[1]
    ?.trim()
  const altMatch = text.match(/\b(?:do cao|cao(?:\s+bay|\s+xuong|\s+len)?)\D{0,15}(\d{1,4})\s*(?:m|met)\b/)
  const altitudeM = altMatch ? Number(altMatch[1]) : undefined
  const relationship: MonitoringRelationship | undefined = /\b(toi la|toi thuoc|noi nham|vai tro|quan he)\b/.test(text)
    ? /\b(uy quyen|duoc uy quyen)\b/.test(text)
      ? 'AUTHORIZED_PERSON'
      : /\bnha thau\b/.test(text)
        ? 'CONTRACTOR'
        : /\b(don vi quan ly|tu van giam sat)\b/.test(text)
          ? 'MANAGER_OR_SUPERVISOR'
          : /\b(chu so huu|chu dat|chu dau tu)\b/.test(text)
            ? 'OWNER'
            : undefined
    : undefined
  const authConfirmed = /\b(xac nhan quyen giam sat|dong y quyen giam sat)\b/.test(text)
    ? true
    : undefined

  if (phone || name || email || accessNotes || altitudeM !== undefined || relationship || authConfirmed) {
    const contact = parseAgentAction({
      type: 'set_contact',
      ...(name ? { name } : {}),
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
      ...(accessNotes ? { accessNotes } : {}),
      ...(altitudeM !== undefined ? { altitudeM } : {}),
      ...(relationship ? { relationship } : {}),
      ...(authConfirmed ? { authorizationConfirmed: true } : {}),
    })
    if (contact) actions.push(contact)
  }

  // 15. Schedule (explicit dates, relative dates, weekday names, shift days, and time slots)
  const shiftBack = text.match(/\b(?:lui lich|doi lich|lui)\s*(?:lai\s*)?(\d+|mot|hai|ba)\s*ngay\b/)
  if (shiftBack) {
    const countMap: Record<string, number> = { mot: 1, hai: 2, ba: 3 }
    const days = countMap[shiftBack[1]] ?? Number(shiftBack[1])
    if (Number.isFinite(days) && days > 0) {
      actions.push({ type: 'set_schedule', shiftDays: days })
    }
  } else {
    const dates = explicitDates(text, today)
    const relativeDate = dates.length === 0 ? parseRelativeDateVi(text, today) : undefined
    const { hint: timeSlotHint, hour } = parseTimeSlotHint(text)
    const preferredTimeId = resolvePreferredTimeId(context.preferredTimes, timeSlotHint, hour)

    if (dates.length > 0) {
      actions.push({
        type: 'set_schedule',
        dateFrom: dates[0],
        dateTo: dates[1] ?? dates[0],
        ...(preferredTimeId ? { preferredTimeId } : {}),
        ...(timeSlotHint ? { timeSlotHint } : {}),
      })
    } else if (relativeDate) {
      actions.push({
        type: 'set_schedule',
        dateFrom: relativeDate,
        dateTo: relativeDate,
        ...(preferredTimeId ? { preferredTimeId } : {}),
        ...(timeSlotHint ? { timeSlotHint } : {}),
      })
    } else if (timeSlotHint || preferredTimeId) {
      actions.push({
        type: 'set_schedule',
        ...(preferredTimeId ? { preferredTimeId } : {}),
        ...(timeSlotHint ? { timeSlotHint } : {}),
      })
    }
  }

  // 16. Submit request
  if (/\b(gui yeu cau|gui don|nop yeu cau|tao yeu cau|hoan tat yeu cau|gui di)\b/.test(text)) {
    actions.push({ type: 'submit' })
  }

  return { actions }
}

/* ------------------------------------------------------------------ */
/* Controlled executor                                                 */
/* ------------------------------------------------------------------ */

export type ActionResult = { action: AgentAction; ok: boolean; message: string }

export type ExecutorHandlers = {
  checklistSelectAll?: () => number | null
  checklistClearAll?: () => number | null
  checklistSelectMandatoryOnly?: () => number | null
  checklistToggleItem?: (index: number | undefined, keyword: string | undefined, selected: boolean) => number | null
  checklistSetImages?: (count: number) => number | null
  checklistSetVideos?: (count: number) => number | null
  openStep?: (step: Step) => void
  reopenSection?: (target: SectionTarget) => void
  goBack?: () => Step | null
  continueWorkflow?: () => Step | null
  confirmSection?: () => string | null
  getAccountContact?: () => { name?: string; phone?: string; email?: string } | null
  preferredTimes?: PreferredTimeCatalogItem[]
}

export type ExecutionContext = {
  services: CatalogService[]
  purposeLabels: Record<FlightPurpose, string>
  handlers: ExecutorHandlers
}

/**
 * Applies synchronous form actions to one authoritative draft.
 * Async actions (geocoding search, backend description review, undo, submit) are handled by
 * the orchestrator in OrderConversation so every mutation is verified against real state.
 */
export function executeFormActions(
  form: FormState,
  actions: AgentAction[],
  context: ExecutionContext,
): { form: FormState; results: ActionResult[] } {
  let next = form
  const results: ActionResult[] = []
  for (const candidate of actions) {
    const action = parseAgentAction(candidate)
    if (!action) {
      results.push({
        action: candidate,
        ok: false,
        message: 'Hành động không hợp lệ nên em không thực hiện.',
      })
      continue
    }
    switch (action.type) {
      case 'select_service': {
        const service = context.services.find(
          (s) => s.id === action.serviceId && s.isActive !== false,
        )
        if (!service) {
          results.push({
            action,
            ok: false,
            message: 'Không tìm thấy dịch vụ này trong danh mục nên em chưa chọn.',
          })
          break
        }
        if (next.serviceId === service.id) {
          results.push({
            action,
            ok: true,
            message: `Dịch vụ ${service.name} đã được chọn sẵn.`,
          })
          break
        }
        next = applyConfirmedAgentChanges(next, { serviceId: service.id })
        results.push({ action, ok: true, message: `Đã chọn dịch vụ ${service.name}.` })
        break
      }
      case 'set_flight_purpose':
        next = {
          ...next,
          flightPurpose: action.purpose,
          otherFlightPurpose: action.purpose === 'OTHER' ? action.otherText ?? next.otherFlightPurpose : '',
        }
        results.push({
          action,
          ok: true,
          message: `Đã đặt mục đích bay: ${context.purposeLabels[action.purpose]}.`,
        })
        break
      case 'set_description':
        next = { ...next, description: action.text }
        results.push({ action, ok: true, message: 'Đã cập nhật mô tả nhiệm vụ vào biểu mẫu.' })
        break
      case 'append_description': {
        const current = next.description.trim()
        const combined = current ? `${current}. ${action.text}` : action.text
        next = { ...next, description: combined.slice(0, 2000) }
        results.push({
          action,
          ok: true,
          message: `Đã bổ sung "${action.text}" vào mô tả nhiệm vụ.`,
        })
        break
      }
      case 'remove_description_content': {
        if (!next.description.trim()) {
          results.push({ action, ok: false, message: 'Hiện chưa có mô tả để xóa nội dung.' })
          break
        }
        const escaped = action.phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const updated = next.description
          .replace(new RegExp(`[,;.]?\\s*${escaped}\\s*[,;.]?`, 'gi'), ' ')
          .replace(/\s+/g, ' ')
          .trim()
        next = { ...next, description: updated }
        results.push({
          action,
          ok: true,
          message: `Đã bỏ phần "${action.phrase}" khỏi mô tả.`,
        })
        break
      }
      case 'clear_description':
        next = { ...next, description: '' }
        results.push({ action, ok: true, message: 'Đã xóa mô tả nhiệm vụ.' })
        break
      case 'read_description':
        results.push({
          action,
          ok: true,
          message: next.description.trim()
            ? `Mô tả hiện tại: ${next.description.trim()}`
            : 'Hiện chưa có nội dung mô tả nào.',
        })
        break
      case 'clear_monitoring_area':
        next = {
          ...next,
          coverageArea: null,
          coverageAreaShape: '',
          coverageAreaCenter: null,
        }
        results.push({ action, ok: true, message: 'Đã xóa vùng giám sát trên bản đồ.' })
        break
      case 'set_contact': {
        const emailNote = action.email
          ? `Email liên hệ: ${action.email}`
          : undefined
        const mergedNotes = [
          next.accessNotes.trim(),
          action.accessNotes?.trim(),
          emailNote && !next.accessNotes.includes(action.email!) ? emailNote : undefined,
        ]
          .filter(Boolean)
          .join(' · ')
        next = {
          ...next,
          ...(action.name ? { siteContactName: action.name } : {}),
          ...(action.phone ? { siteContactPhone: action.phone } : {}),
          ...(mergedNotes && (action.accessNotes || emailNote) ? { accessNotes: mergedNotes } : {}),
          ...(action.altitudeM !== undefined ? { altitudeM: action.altitudeM } : {}),
          ...(action.relationship ? { monitoringRelationship: action.relationship } : {}),
          ...(action.authorizationConfirmed !== undefined
            ? { monitoringAuthorizationConfirmed: action.authorizationConfirmed }
            : {}),
        }
        const parts = [
          action.name && `người liên hệ ${action.name}`,
          action.phone && `số ${action.phone}`,
          action.email && `email ${action.email}`,
          action.accessNotes && `ghi chú hiện trường`,
          action.altitudeM !== undefined && `độ cao ${action.altitudeM}m`,
        ].filter(Boolean)
        results.push({
          action,
          ok: true,
          message: `Đã cập nhật ${parts.join(', ')}.`,
        })
        break
      }
      case 'autofill_account_contact': {
        const account = context.handlers.getAccountContact?.() ?? null
        if (!account || (!account.name && !account.phone)) {
          results.push({
            action,
            ok: false,
            message: 'Tài khoản hiện tại chưa có đủ họ tên hoặc số điện thoại để tự điền.',
          })
          break
        }
        next = {
          ...next,
          ...(account.name ? { siteContactName: account.name } : {}),
          ...(account.phone ? { siteContactPhone: account.phone } : {}),
        }
        results.push({
          action,
          ok: true,
          message: `Đã lấy thông tin liên hệ từ tài khoản (${[account.name, account.phone].filter(Boolean).join(' — ')}).`,
        })
        break
      }
      case 'set_schedule': {
        let from = action.dateFrom ?? next.preferredDateFrom
        let to = action.dateTo ?? (action.dateFrom ? action.dateFrom : next.preferredDateTo)
        if (action.shiftDays !== undefined) {
          if (!from) {
            results.push({
              action,
              ok: false,
              message: 'Chưa có ngày bay cũ để dời lịch; anh/chị cho em ngày bay mong muốn nhé.',
            })
            break
          }
          from = addDays(from, action.shiftDays)
          to = to ? addDays(to, action.shiftDays) : from
        }
        if (from && to && to < from) {
          results.push({
            action,
            ok: false,
            message: 'Ngày kết thúc trước ngày bắt đầu nên em chưa đặt lịch.',
          })
          break
        }
        const resolvedTimeId =
          action.preferredTimeId ??
          (action.timeSlotHint
            ? resolvePreferredTimeId(context.handlers.preferredTimes, action.timeSlotHint)
            : undefined) ??
          next.preferredTimeId
        next = {
          ...next,
          ...(from ? { preferredDateFrom: from } : {}),
          ...(to ? { preferredDateTo: to } : {}),
          ...(resolvedTimeId ? { preferredTimeId: resolvedTimeId } : {}),
        }
        const timeLabel =
          action.timeSlotHint === 'MORNING'
            ? 'buổi sáng'
            : action.timeSlotHint === 'AFTERNOON'
              ? 'buổi chiều'
              : action.timeSlotHint === 'EVENING'
                ? 'buổi tối'
                : ''
        results.push({
          action,
          ok: true,
          message: from
            ? `Đã đặt ngày bay ${from}${to && to !== from ? ` đến ${to}` : ''}${timeLabel ? ` (${timeLabel})` : ''}${next.preferredTimeId ? '.' : '; anh/chị chọn thêm khung giờ nhé.'}`
            : `Đã cập nhật khung giờ bay${timeLabel ? ` (${timeLabel})` : ''}.`,
        })
        break
      }
      case 'clear_service': {
        if (!next.serviceId) {
          results.push({
            action,
            ok: true,
            message: 'Hiện chưa có dịch vụ nào được chọn. Anh/chị muốn chọn dịch vụ nào?',
          })
          break
        }
        next = { ...next, serviceId: '', deliverableTypeId: '', agentChecklistItems: undefined }
        results.push({
          action,
          ok: true,
          message: 'Đã bỏ chọn dịch vụ hiện tại và giữ nguyên các thông tin tương thích.',
        })
        break
      }
      case 'reopen_selection': {
        const labelsMap: Record<SectionTarget, string> = {
          service: 'bước chọn dịch vụ. Anh/chị muốn chọn dịch vụ nào?',
          purpose: 'phần mục đích bay. Anh/chị muốn chọn mục đích nào?',
          description: 'phần mô tả nhiệm vụ. Anh/chị muốn cập nhật nội dung gì?',
          location: 'phần khu vực giám sát trên bản đồ. Anh/chị muốn chọn địa điểm nào?',
          checklist: 'phần checklist & sản phẩm.',
          contact: 'phần liên hệ và điều kiện hiện trường.',
          schedule: 'phần lịch bay dự kiến.',
          review: 'màn hình xem lại và bàn giao.',
        }
        context.handlers.reopenSection?.(action.target)
        results.push({ action, ok: true, message: `Đã mở lại ${labelsMap[action.target]}` })
        break
      }
      case 'navigate_step': {
        context.handlers.openStep?.(action.step)
        results.push({ action, ok: true, message: `Đã chuyển sang bước ${action.step}.` })
        break
      }
      case 'go_back': {
        const prev = context.handlers.goBack?.() ?? null
        results.push(
          prev
            ? {
                action,
                ok: true,
                message: `Đã quay lại bước ${prev} và giữ nguyên thông tin đã nhập.`,
              }
            : {
                action,
                ok: true,
                message: 'Đang ở bước đầu tiên; anh/chị có thể chọn lại dịch vụ ngay bên dưới.',
              },
        )
        break
      }
      case 'confirm_section': {
        const msg = context.handlers.confirmSection?.()
        results.push({
          action,
          ok: true,
          message: msg ?? 'Đã xác nhận phần hiện tại và chuyển tiếp.',
        })
        break
      }
      case 'continue_workflow': {
        const target = context.handlers.continueWorkflow?.() ?? null
        results.push({
          action,
          ok: true,
          message: target
            ? `Đã chuyển tiếp sang bước ${target} còn thiếu.`
            : 'Bản nháp đã đủ thông tin, sẵn sàng xem lại.',
        })
        break
      }
      case 'keep_previous': {
        results.push({ action, ok: true, message: 'Đã giữ nguyên thông tin hiện tại.' })
        break
      }
      case 'checklist_select_all': {
        const changed = next.serviceId ? context.handlers.checklistSelectAll?.() ?? null : null
        results.push(
          changed === null
            ? {
                action,
                ok: false,
                message: 'Checklist chưa sẵn sàng (cần chọn dịch vụ trước) nên em chưa tích được.',
              }
            : {
                action,
                ok: true,
                message: `Đã tích tất cả hạng mục checklist (${changed} mục thay đổi).`,
              },
        )
        break
      }
      case 'checklist_clear_all': {
        const changed = next.serviceId ? context.handlers.checklistClearAll?.() ?? null : null
        results.push(
          changed === null
            ? { action, ok: false, message: 'Checklist chưa sẵn sàng nên em chưa bỏ chọn được.' }
            : {
                action,
                ok: true,
                message: `Đã bỏ chọn các hạng mục checklist (${changed} mục thay đổi).`,
              },
        )
        break
      }
      case 'checklist_select_mandatory_only': {
        const changed = next.serviceId
          ? context.handlers.checklistSelectMandatoryOnly?.() ?? null
          : null
        results.push(
          changed === null
            ? { action, ok: false, message: 'Checklist chưa sẵn sàng nên em chưa lọc mục bắt buộc.' }
            : {
                action,
                ok: true,
                message: `Đã chỉ giữ lại các hạng mục bắt buộc (${changed} mục thay đổi).`,
              },
        )
        break
      }
      case 'checklist_toggle_item': {
        const changed = next.serviceId
          ? context.handlers.checklistToggleItem?.(action.index, action.keyword, action.selected) ??
            null
          : null
        results.push(
          changed === null
            ? { action, ok: false, message: 'Không tìm thấy hạng mục checklist phù hợp.' }
            : {
                action,
                ok: true,
                message: action.selected
                  ? `Đã chọn hạng mục checklist (${changed} mục cập nhật).`
                  : `Đã bỏ chọn hạng mục checklist (${changed} mục cập nhật).`,
              },
        )
        break
      }
      case 'checklist_set_images': {
        const changed = next.serviceId
          ? context.handlers.checklistSetImages?.(action.count) ?? null
          : null
        results.push(
          changed === null
            ? { action, ok: false, message: 'Checklist chưa sẵn sàng nên em chưa đổi cấu hình ảnh.' }
            : {
                action,
                ok: true,
                message:
                  action.count === 0
                    ? 'Đã bỏ chụp ảnh ở các hạng mục cho phép.'
                    : `Đã bật chụp ảnh (${action.count} ảnh mỗi hạng mục).`,
              },
        )
        break
      }
      case 'checklist_set_videos': {
        const changed = next.serviceId
          ? context.handlers.checklistSetVideos?.(action.count) ?? null
          : null
        results.push(
          changed === null
            ? { action, ok: false, message: 'Checklist chưa sẵn sàng nên em chưa đổi số video.' }
            : {
                action,
                ok: true,
                message:
                  action.count === 0
                    ? 'Đã bỏ quay video ở các hạng mục cho phép.'
                    : `Đã bật quay video (${action.count} video mỗi hạng mục).`,
              },
        )
        break
      }
      case 'set_result_formats':
        next = { ...next, resultFormats: action.formats }
        results.push({
          action,
          ok: true,
          message: `Đã chọn định dạng bàn giao: ${action.formats.join(', ')}.`,
        })
        break
      case 'open_map':
        context.handlers.openStep?.(2)
        results.push({
          action,
          ok: true,
          message: 'Em đã mở bản đồ; anh/chị tìm địa chỉ và xác nhận khu vực giúp em.',
        })
        break
      default:
        results.push({ action, ok: false, message: 'Hành động này cần xử lý riêng.' })
    }
  }
  return { form: next, results }
}

/** Reply text built only from what actually ran. */
export function replyFromResults(results: ActionResult[], clarification?: string): string {
  const lines = results.map((r) => r.message)
  if (clarification) lines.push(clarification)
  return lines.join(' ').trim()
}

/* ------------------------------------------------------------------ */
/* Draft history (undo + optimistic concurrency)                       */
/* ------------------------------------------------------------------ */

export class DraftHistory {
  private version = 0
  private lastForm: FormState | null = null
  private undoStack: Array<{ before: FormState; after: FormState; afterVersion: number }> = []
  private redoStack: Array<{ before: FormState; after: FormState; afterVersion: number }> = []

  observe(form: FormState) {
    if (form !== this.lastForm) {
      this.lastForm = form
      this.version += 1
    }
    return this.version
  }

  get current() {
    return this.version
  }

  get canUndo() {
    const last = this.undoStack.at(-1)
    return Boolean(last && last.afterVersion === this.version)
  }

  get canRedo() {
    const last = this.redoStack.at(-1)
    return Boolean(last && last.afterVersion === this.version)
  }

  canApply(expectedVersion: number) {
    return expectedVersion === this.version
  }

  record(before: FormState, after: FormState) {
    this.lastForm = after
    this.version += 1
    this.undoStack.push({ before, after, afterVersion: this.version })
    this.redoStack = []
    if (this.undoStack.length > 20) this.undoStack.shift()
  }

  undo(): { ok: true; form: FormState } | { ok: false; reason: string } {
    const last = this.undoStack.at(-1)
    if (!last) return { ok: false, reason: 'Chưa có thao tác nào của trợ lý để hoàn tác.' }
    if (last.afterVersion !== this.version)
      return {
        ok: false,
        reason:
          'Bản nháp đã được sửa sau thao tác của trợ lý nên em không hoàn tác để tránh mất thay đổi của anh/chị.',
      }
    this.undoStack.pop()
    this.lastForm = last.before
    this.version += 1
    this.redoStack.push({ before: last.before, after: last.after, afterVersion: this.version })
    return { ok: true, form: last.before }
  }

  redo(): { ok: true; form: FormState } | { ok: false; reason: string } {
    const last = this.redoStack.at(-1)
    if (!last) return { ok: false, reason: 'Chưa có thao tác nào để áp dụng lại.' }
    if (last.afterVersion !== this.version) {
      return { ok: false, reason: 'Bản nháp đã thay đổi nên không thể áp dụng lại.' }
    }
    this.redoStack.pop()
    this.lastForm = last.after
    this.version += 1
    this.undoStack.push({ before: last.before, after: last.after, afterVersion: this.version })
    return { ok: true, form: last.after }
  }
}

/* ------------------------------------------------------------------ */
/* Transcript guard                                                    */
/* ------------------------------------------------------------------ */

export class TranscriptGuard {
  private last = ''
  private lastAt = 0
  private spoken: string[] = []
  private windowMs: number

  constructor(windowMs = 5000) {
    this.windowMs = windowMs
  }

  rememberSpoken(text: string) {
    const key = normalizeVi(text).replace(/\.+/g, ' ').replace(/\s+/g, ' ').trim()
    this.spoken = [key, ...this.spoken].slice(0, 5)
  }

  accept(transcript: string, now = Date.now()): boolean {
    const key = normalizeVi(transcript).replace(/\.+/g, ' ').replace(/\s+/g, ' ').trim()
    if (!key) return false
    if (key === this.last && now - this.lastAt < this.windowMs) return false
    if (this.spoken.some((s) => s && (s === key || (key.length > 12 && s.includes(key))))) {
      return false
    }
    this.last = key
    this.lastAt = now
    return true
  }
}

/* ------------------------------------------------------------------ */
/* Submit gate                                                         */
/* ------------------------------------------------------------------ */

export function submitBlockers(
  stepValidity: Partial<Record<1 | 2 | 3 | 4 | 5 | 6, boolean>> | undefined,
  checklistValid: boolean | undefined,
): number[] {
  const steps = [1, 2, 3, 4, 5, 6] as const
  const missing: number[] = steps.filter((step) => stepValidity?.[step] !== true)
  if (checklistValid !== true && !missing.includes(3)) missing.push(3)
  return missing.sort()
}

export function submitOnce(submit: () => Promise<unknown>) {
  let inFlight: Promise<unknown> | null = null
  let sent = false
  return async () => {
    if (sent) return false
    if (inFlight) return inFlight.then(() => false)
    inFlight = submit()
      .then((ok) => {
        sent = ok !== false
        return ok
      })
      .finally(() => {
        inFlight = null
      })
    return inFlight
  }
}
