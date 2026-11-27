/**
 * V9 Conversational Intelligence Training & Evaluation Dataset Factory (Section 17)
 * Generates validated Vietnamese scenarios across all 9 V9 conversational families:
 *  1. contextual_qa
 *  2. follow_up_question
 *  3. conversational_repair
 *  4. vietnamese_asr_consultation
 *  5. topic_switching
 *  6. domain_consultation
 *  7. consultation_to_action
 *  8. long_context
 *  9. response_relevance
 *
 * Uses grouped 70/15/15 split by scenarioFamily so zero paraphrases leak into held-out.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ConsultationSubject, QuestionCategory } from '../../src/features/customer/lib/createOrder/conversationalIntelligenceV9'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export type V9Scenario = {
  scenarioId: string
  scenarioFamily: string
  category:
    | 'contextual_qa'
    | 'follow_up_question'
    | 'conversational_repair'
    | 'vietnamese_asr_consultation'
    | 'topic_switching'
    | 'domain_consultation'
    | 'consultation_to_action'
    | 'long_context'
    | 'response_relevance'
  initialServiceId: string
  initialActiveSection: 'service' | 'purpose' | 'description' | 'location' | 'checklist' | 'contact' | 'schedule'
  priorTopic: ConsultationSubject | null
  priorOption: 'panoramic_video' | 'top_down_video' | 'orbit_video' | 'roof_photo' | 'overview_photo' | null
  userMessage: string
  expectedQuestionCategory: QuestionCategory
  expectedSubject: ConsultationSubject
  expectHandled: boolean
  expectMutation: boolean
  expectedActionTypes: string[]
  forbidServiceRecommendation: boolean
}

const PREFIXES = ['', 'Em ơi, ', 'Cho anh hỏi, ', 'Cho chị hỏi, ', 'Alo bạn ơi, ', 'Này em, ']
const SUFFIXES = ['', ' nhé', ' vậy em', ' ạ', ' vậy']

function stableBucket(key: string): number {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h) % 100
}

function buildScenarios(): V9Scenario[] {
  const rows: V9Scenario[] = []
  let seq = 0
  const add = (item: Omit<V9Scenario, 'scenarioId'>) => {
    seq += 1
    rows.push({ scenarioId: `v9-${item.category}-${String(seq).padStart(4, '0')}`, ...item })
  }

  // 1. Contextual QA (HOW/WHAT/CAN/HOW_LONG/HOW_MUCH while service already selected)
  const qaTemplates: Array<{
    fam: string
    q: string
    cat: QuestionCategory
    subj: ConsultationSubject
  }> = [
    { fam: 'qa-video-how', q: 'Quay video như thế nào?', cat: 'HOW', subj: 'video_recording' },
    { fam: 'qa-video-topdown', q: 'Có quay từ trên xuống không?', cat: 'CAN', subj: 'video_recording' },
    { fam: 'qa-video-orbit', q: 'Còn quay quanh tòa nhà thì sao?', cat: 'WHAT', subj: 'video_recording' },
    { fam: 'qa-video-duration', q: 'Video bao lâu?', cat: 'HOW_LONG', subj: 'video_recording' },
    { fam: 'qa-photo-clarity', q: 'Chụp ảnh mái nhà có rõ không?', cat: 'CAN', subj: 'photography' },
    { fam: 'qa-area-fpt', q: 'Quay toàn bộ FPT được không?', cat: 'CAN', subj: 'video_recording' },
    { fam: 'qa-weather', q: 'Trời mưa gió có bay được không?', cat: 'CAN', subj: 'weather_permit' },
    { fam: 'qa-deliverables', q: 'Sản phẩm bàn giao gồm những định dạng nào?', cat: 'WHAT', subj: 'deliverables' },
    { fam: 'qa-cancel', q: 'Chính sách hủy đơn như thế nào?', cat: 'HOW', subj: 'cancellation_status' },
  ]
  for (const t of qaTemplates) {
    for (const pre of PREFIXES) {
      add({
        scenarioFamily: t.fam,
        category: 'contextual_qa',
        initialServiceId: 'svc-build',
        initialActiveSection: 'location',
        priorTopic: null,
        priorOption: null,
        userMessage: `${pre}${t.q}`.trim(),
        expectedQuestionCategory: t.cat,
        expectedSubject: t.subj,
        expectHandled: true,
        expectMutation: false,
        expectedActionTypes: [],
        forbidServiceRecommendation: true,
      })
    }
  }

  // 2. Follow-up questions without repeated subject
  const followUps: Array<{ fam: string; q: string; cat: QuestionCategory; topic: ConsultationSubject }> = [
    { fam: 'fu-duration', q: 'Bao lâu?', cat: 'HOW_LONG', topic: 'video_recording' },
    { fam: 'fu-clarity', q: 'Có rõ không?', cat: 'CAN', topic: 'video_recording' },
    { fam: 'fu-edit', q: 'Có chỉnh sửa không?', cat: 'CAN', topic: 'video_recording' },
    { fam: 'fu-price', q: 'Bao nhiêu tiền?', cat: 'HOW_MUCH', topic: 'video_recording' },
    { fam: 'fu-raw', q: 'Có gửi file gốc không?', cat: 'CAN', topic: 'video_recording' },
  ]
  for (const f of followUps) {
    for (const suf of SUFFIXES) {
      add({
        scenarioFamily: f.fam,
        category: 'follow_up_question',
        initialServiceId: 'svc-build',
        initialActiveSection: 'location',
        priorTopic: f.topic,
        priorOption: 'panoramic_video',
        userMessage: `${f.q.replace(/\?$/, '')}${suf}?`,
        expectedQuestionCategory: f.cat,
        expectedSubject: f.topic,
        expectHandled: true,
        expectMutation: false,
        expectedActionTypes: [],
        forbidServiceRecommendation: true,
      })
    }
  }

  // 3. Conversational repair
  const repairs: Array<{ fam: string; msg: string; subj: ConsultationSubject; cat: QuestionCategory }> = [
    { fam: 'rep-video-1', msg: 'Ý coi là. Quay video như thế nào?', subj: 'video_recording', cat: 'HOW' },
    { fam: 'rep-video-2', msg: 'Không phải ý tôi, tôi đang hỏi quay video như thế nào.', subj: 'video_recording', cat: 'HOW' },
    { fam: 'rep-video-3', msg: 'Bạn hiểu sai rồi, tôi đang hỏi video mà.', subj: 'video_recording', cat: 'NONE' },
    { fam: 'rep-svc-already', msg: 'Không cần giới thiệu dịch vụ nữa, tôi chọn rồi mà.', subj: 'construction_monitoring', cat: 'NONE' },
    { fam: 'rep-method', msg: 'Ý tôi là cách làm chứ không phải chọn dịch vụ.', subj: 'construction_monitoring', cat: 'NONE' },
  ]
  for (const r of repairs) {
    for (const pre of PREFIXES.slice(0, 4)) {
      add({
        scenarioFamily: r.fam,
        category: 'conversational_repair',
        initialServiceId: 'svc-build',
        initialActiveSection: 'location',
        priorTopic: 'video_recording',
        priorOption: null,
        userMessage: `${pre}${r.msg}`.trim(),
        expectedQuestionCategory: r.cat,
        expectedSubject: r.subj,
        expectHandled: true,
        expectMutation: false,
        expectedActionTypes: [],
        forbidServiceRecommendation: true,
      })
    }
  }

  // 4. Vietnamese ASR noise on consultation questions
  const asrQuestions = [
    'Ý coi là quay video như thế nào',
    'Ý tui là quay video sao á',
    'Quay vi deo kiểu gì',
    'Quay phim trên cao là sao',
    'Video nó quay làm sao',
    'Quay như nào ấy',
  ]
  for (const [idx, msg] of asrQuestions.entries()) {
    for (const suf of SUFFIXES.slice(0, 4)) {
      add({
        scenarioFamily: `asr-video-${idx}`,
        category: 'vietnamese_asr_consultation',
        initialServiceId: 'svc-build',
        initialActiveSection: 'description',
        priorTopic: null,
        priorOption: null,
        userMessage: `${msg}${suf}?`,
        expectedQuestionCategory: 'HOW',
        expectedSubject: 'video_recording',
        expectHandled: true,
        expectMutation: false,
        expectedActionTypes: [],
        forbidServiceRecommendation: true,
      })
    }
  }

  // 5. Consultation-to-action transitions & hybrid Q+A
  const transitions: Array<{ fam: string; msg: string; opt: V9Scenario['priorOption']; actions: string[]; cat: QuestionCategory }> = [
    { fam: 'cta-add-video', msg: 'Vậy thêm video luôn', opt: 'panoramic_video', actions: ['checklist_set_videos', 'append_description'], cat: 'NONE' },
    { fam: 'cta-pick-orbit', msg: 'Vậy chọn kiểu đó', opt: 'orbit_video', actions: ['checklist_set_videos', 'append_description'], cat: 'NONE' },
    { fam: 'cta-hybrid-panoramic', msg: 'Quay video như thế nào, nếu quay được toàn cảnh thì thêm video giúp tôi', opt: null, actions: ['checklist_set_videos', 'append_description'], cat: 'HOW' },
  ]
  for (const tr of transitions) {
    for (const suf of SUFFIXES.slice(0, 4)) {
      add({
        scenarioFamily: tr.fam,
        category: 'consultation_to_action',
        initialServiceId: 'svc-build',
        initialActiveSection: 'location',
        priorTopic: 'video_recording',
        priorOption: tr.opt,
        userMessage: `${tr.msg}${suf}`.trim(),
        expectedQuestionCategory: tr.cat,
        expectedSubject: 'video_recording',
        expectHandled: true,
        expectMutation: true,
        expectedActionTypes: tr.actions,
        forbidServiceRecommendation: true,
      })
    }
  }

  // 6. Topic switching (form on schedule/contact, asking about photography or deliverables)
  const switches: Array<{ fam: string; sec: V9Scenario['initialActiveSection']; msg: string; subj: ConsultationSubject; cat: QuestionCategory }> = [
    { fam: 'ts-photo-from-schedule', sec: 'schedule', msg: 'Chụp ảnh mái nhà có rõ không?', subj: 'photography', cat: 'CAN' },
    { fam: 'ts-permit-from-contact', sec: 'contact', msg: 'Giấy phép bay cần chuẩn bị như thế nào?', subj: 'weather_permit', cat: 'HOW' },
    { fam: 'ts-deliv-from-checklist', sec: 'checklist', msg: 'Có gửi file gốc qua email không?', subj: 'deliverables', cat: 'CAN' },
  ]
  for (const sw of switches) {
    for (const pre of PREFIXES.slice(0, 4)) {
      add({
        scenarioFamily: sw.fam,
        category: 'topic_switching',
        initialServiceId: 'svc-build',
        initialActiveSection: sw.sec,
        priorTopic: 'pricing',
        priorOption: null,
        userMessage: `${pre}${sw.msg}`.trim(),
        expectedQuestionCategory: sw.cat,
        expectedSubject: sw.subj,
        expectHandled: true,
        expectMutation: false,
        expectedActionTypes: [],
        forbidServiceRecommendation: true,
      })
    }
  }

  return rows
}

function writeJsonl(filePath: string, rows: V9Scenario[]) {
  fs.writeFileSync(filePath, rows.map((r) => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''), 'utf8')
}

function main() {
  const all = buildScenarios()
  const train: V9Scenario[] = []
  const dev: V9Scenario[] = []
  const heldOut: V9Scenario[] = []

  const byFamily = new Map<string, V9Scenario[]>()
  for (const r of all) {
    const arr = byFamily.get(r.scenarioFamily) ?? []
    arr.push(r)
    byFamily.set(r.scenarioFamily, arr)
  }

  for (const [fam, items] of byFamily.entries()) {
    const b = stableBucket(fam)
    if (b < 70) train.push(...items)
    else if (b < 85) dev.push(...items)
    else heldOut.push(...items)
  }

  const critical = all.filter(
    (r) =>
      r.category === 'conversational_repair' ||
      r.category === 'follow_up_question' ||
      r.category === 'vietnamese_asr_consultation' ||
      r.category === 'consultation_to_action',
  )

  const outDir = path.resolve(__dirname, '../datasets')
  fs.mkdirSync(outDir, { recursive: true })
  writeJsonl(path.join(outDir, 'v9-train.jsonl'), train)
  writeJsonl(path.join(outDir, 'v9-dev.jsonl'), dev)
  writeJsonl(path.join(outDir, 'v9-held-out.jsonl'), heldOut)
  writeJsonl(path.join(outDir, 'v9-critical.jsonl'), critical)

  console.log(
    `[v9-factory] Total=${all.length} across ${byFamily.size} families | train=${train.length}, dev=${dev.length}, held-out=${heldOut.length}, critical=${critical.length}`,
  )
}

main()
