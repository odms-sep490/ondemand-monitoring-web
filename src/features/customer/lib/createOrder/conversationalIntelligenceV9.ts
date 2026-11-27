/**
 * AI Chatbot V9 — Deep Conversational Intelligence, Context Grounding & Human-Like Consultation Engine.
 *
 * Implements:
 *  - Semantic Question Understanding (12 question categories + subject resolution)
 *  - Conversational Modes (CONSULTATION, QUESTION_ANSWERING, SERVICE_RECOMMENDATION, etc.)
 *  - Multi-Turn Topic Tracker (independent from active workflow section)
 *  - Natural Follow-Up Question Resolution ("Bao lâu?", "Có rõ không?", "Bao nhiêu tiền?")
 *  - Conversational Repair ("Ý coi là...", "Không phải ý tôi", "Tôi chọn rồi mà")
 *  - Vietnamese ASR Noise Robustness
 *  - Verified Drone Domain Knowledge Base (no fabricated specs, prices or guarantees)
 *  - Deterministic Response Relevance Validator
 */
import type { ServiceOption, ServicePricingEstimate } from '../../api/customerApi'
import type { ChecklistRow } from '../checklist/types'
import { normalizeVi, type AgentAction, type SectionTarget } from './orderActionAgent'
import type { FormState } from './types'

export type QuestionCategory =
  | 'WHAT'
  | 'HOW'
  | 'WHY'
  | 'WHEN'
  | 'WHERE'
  | 'HOW_MUCH'
  | 'HOW_LONG'
  | 'CAN'
  | 'DIFFERENCE'
  | 'RECOMMENDATION'
  | 'STATUS'
  | 'CONFIRMATION'
  | 'NONE'

export type ConsultationSubject =
  | 'video_recording'
  | 'photography'
  | 'construction_monitoring'
  | 'factory_inspection'
  | 'forest_monitoring'
  | 'solar_monitoring'
  | 'pricing'
  | 'schedule'
  | 'weather_permit'
  | 'monitoring_area'
  | 'deliverables'
  | 'cancellation_status'
  | 'general'

export type ConversationalMode =
  | 'CONSULTATION'
  | 'QUESTION_ANSWERING'
  | 'SERVICE_RECOMMENDATION'
  | 'FIELD_EDITING'
  | 'ACTION_EXECUTION'
  | 'WORKFLOW_NAVIGATION'
  | 'CLARIFICATION'
  | 'REVIEW'
  | 'ERROR_RECOVERY'

export type TopicState = {
  activeTopic: ConsultationSubject | null
  lastQuestionCategory: QuestionCategory
  lastReferencedOption:
    | 'panoramic_video'
    | 'top_down_video'
    | 'orbit_video'
    | 'roof_photo'
    | 'overview_photo'
    | null
  lastAssistantReply: string
  turnIndex: number
}

export type GroundedContext = {
  form: FormState
  services: ServiceOption[]
  selectedService?: ServiceOption
  activeSection: SectionTarget
  completedCount: number
  pricingEstimate?: ServicePricingEstimate | null
  checklistRows?: ChecklistRow[]
  topicState?: TopicState
}

export type QuestionAnalysis = {
  isQuestion: boolean
  isRepair: boolean
  isFollowUp: boolean
  isHybridQuestionAction: boolean
  mode: ConversationalMode
  questionCategory: QuestionCategory
  subject: ConsultationSubject
  referencedOption: TopicState['lastReferencedOption']
  /** True when the turn must NOT mutate form state. */
  forbidMutation: boolean
}

export type RelevanceValidation = {
  passed: boolean
  violations: string[]
}

export type V9ConsultationResult = {
  handled: boolean
  analysis: QuestionAnalysis
  reply: string
  actions: AgentAction[]
  nextTopicState: TopicState
  relevance: RelevanceValidation
}

/** Normalize Vietnamese ASR slips common in spoken consultation questions. */
export function normalizeSpokenConsultation(raw: string): string {
  const base = normalizeVi(raw)
  return base
    .replace(/\by\s+coi\s+la\b/g, 'y toi la')
    .replace(/\by\s+tui\s+la\b/g, 'y toi la')
    .replace(/\bvi\s*deo\b/g, 'video')
    .replace(/\bquay\s+phim\b/g, 'quay video')
    .replace(/\bkieu\s+gi\b/g, 'nhu the nao')
    .replace(/\blam\s+sao\b/g, 'nhu the nao')
    .replace(/\bnhu\s+nao\b/g, 'nhu the nao')
    .replace(/\bsao\s+a\b/g, 'nhu the nao')
    .replace(/\bkhong\s+a\b/g, 'khong')
    .replace(/\s+/g, ' ')
    .trim()
}

export function createTopicState(): TopicState {
  return {
    activeTopic: null,
    lastQuestionCategory: 'NONE',
    lastReferencedOption: null,
    lastAssistantReply: '',
    turnIndex: 0,
  }
}

function detectRepair(text: string): boolean {
  return /\b(khong phai y toi|ban hieu sai|hieu sai roi|y toi la|toi dang hoi|khong can gioi thieu dich vu|toi chon roi ma|da chon roi ma|tra loi dung cau hoi|cach lam chu khong phai chon dich vu|khong phai chon dich vu)\b/.test(
    text,
  )
}

function detectQuestionCategory(original: string, text: string): QuestionCategory {
  if (/\b(bao nhieu tien|gia bao nhieu|ton bao nhieu|them phi|chi phi|dat khong|re hon)\b/.test(text)) {
    return 'HOW_MUCH'
  }
  if (/\b(bao lau|may phut|thoi luong|dai bao nhieu|mat bao lau)\b/.test(text)) {
    return 'HOW_LONG'
  }
  if (/\b(khac nhau|khac gi|so sanh|giong nhau)\b/.test(text)) {
    return 'DIFFERENCE'
  }
  if (/\b(nen chon|goi y dich vu|phu hop nhat|tu van dich vu)\b/.test(text)) {
    return 'RECOMMENDATION'
  }
  if (/\b(nhu the nao|cach nao|bang cach nao|ra sao|kieu nao)\b/.test(text)) {
    return 'HOW'
  }
  if (/\b(tai sao|vi sao|ly do)\b/.test(text)) {
    return 'WHY'
  }
  if (/\b(khi nao|bao gio|truoc bao lau)\b/.test(text)) {
    return 'WHEN'
  }
  if (/\b(o dau|khu vuc nao|pham vi nao)\b/.test(text)) {
    return 'WHERE'
  }
  if (/\b(da lam chua|xong chua|toi dau roi|trang thai)\b/.test(text)) {
    return 'STATUS'
  }
  if (/\b(co dung khong|dung chua|phai khong|chac khong)\b/.test(text)) {
    return 'CONFIRMATION'
  }
  if (
    /\b(co the|duoc khong|co ho tro|co ro khong|co chinh sua khong|co gui file goc|co quay|co chup|co bao gom|co can)\b/.test(
      text,
    )
  ) {
    return 'CAN'
  }
  if (/\b(la gi|cai gi|gom nhung gi|nhung gi)\b/.test(text) || /\?\s*$/.test(original)) {
    return 'WHAT'
  }
  return 'NONE'
}

function detectSubject(
  text: string,
  prevTopic: ConsultationSubject | null,
  selectedServiceName?: string,
): { subject: ConsultationSubject; isFollowUp: boolean; referencedOption: TopicState['lastReferencedOption'] } {
  let referencedOption: TopicState['lastReferencedOption'] = null
  if (/\b(tu tren xuong|goc thang dung|top down)\b/.test(text)) referencedOption = 'top_down_video'
  else if (/\b(quanh toa nha|vong quanh|mat dung|xung quanh)\b/.test(text)) referencedOption = 'orbit_video'
  else if (/\b(toan canh|toan bo|bao quat)\b/.test(text)) referencedOption = 'panoramic_video'
  else if (/\b(chup.*mai|anh.*mai|mai nha)\b/.test(text)) referencedOption = 'roof_photo'

  if (/\b(video|quay|ghi hinh|clip|quay tu tren xuong|quay quanh|quay toan canh)\b/.test(text)) {
    return { subject: 'video_recording', isFollowUp: false, referencedOption }
  }
  if (/\b(chup anh|chup hinh|hinh anh|anh mai|anh chi tiet)\b/.test(text)) {
    return { subject: 'photography', isFollowUp: false, referencedOption }
  }
  if (/\b(file goc|dinh dang|ban giao|pdf|bao cao|chinh sua|hau ky|luu tru)\b/.test(text)) {
    if (prevTopic === 'video_recording' && /\b(chinh sua|file goc|ro khong)\b/.test(text)) {
      return { subject: 'video_recording', isFollowUp: true, referencedOption }
    }
    return { subject: 'deliverables', isFollowUp: false, referencedOption }
  }
  if (/\b(thoi tiet|mua|gio|giay phep|phep bay|do cao|an toan bay)\b/.test(text)) {
    return { subject: 'weather_permit', isFollowUp: false, referencedOption }
  }
  if (/\b(huy don|hoan tien|chinh sach huy|trang thai don)\b/.test(text)) {
    return { subject: 'cancellation_status', isFollowUp: false, referencedOption }
  }
  if (/\b(lich bay|dat truoc|ngay bay|khung gio)\b/.test(text)) {
    return { subject: 'schedule', isFollowUp: false, referencedOption }
  }
  if (/\b(khu vuc|pham vi|khoanh vung|ranh gioi|ban do|fpt|toan bo truong)\b/.test(text)) {
    return { subject: 'monitoring_area', isFollowUp: false, referencedOption }
  }
  if (/\b(gia|chi phi|bao nhieu tien|phu phi)\b/.test(text)) {
    if (prevTopic === 'video_recording' || prevTopic === 'photography') {
      return { subject: prevTopic, isFollowUp: true, referencedOption }
    }
    return { subject: 'pricing', isFollowUp: false, referencedOption }
  }
  if (/\b(nha xuong|xuong san xuat)\b/.test(text)) {
    return { subject: 'factory_inspection', isFollowUp: false, referencedOption }
  }
  if (/\b(rung|cay xanh|lam nghiep)\b/.test(text)) {
    return { subject: 'forest_monitoring', isFollowUp: false, referencedOption }
  }
  if (/\b(dien mat troi|pin mat troi)\b/.test(text)) {
    return { subject: 'solar_monitoring', isFollowUp: false, referencedOption }
  }
  if (/\b(cong trinh|tien do thi cong|xay dung)\b/.test(text)) {
    return { subject: 'construction_monitoring', isFollowUp: false, referencedOption }
  }

  // Short follow-up questions inherit previous topic ("Bao lâu?", "Có rõ không?", "Có chỉnh sửa không?", "Còn quay quanh tòa nhà?")
  if (
    prevTopic &&
    (text.split(' ').length <= 8 ||
      /\b(bao lau|co ro khong|co chinh sua|file goc|bao nhieu tien|con |vay |the )\b/.test(text))
  ) {
    return { subject: prevTopic, isFollowUp: true, referencedOption }
  }

  if (selectedServiceName) {
    const normSvc = normalizeVi(selectedServiceName)
    if (normSvc.includes('cong trinh')) return { subject: 'construction_monitoring', isFollowUp: false, referencedOption }
    if (normSvc.includes('nha xuong')) return { subject: 'factory_inspection', isFollowUp: false, referencedOption }
    if (normSvc.includes('rung')) return { subject: 'forest_monitoring', isFollowUp: false, referencedOption }
    if (normSvc.includes('mat troi')) return { subject: 'solar_monitoring', isFollowUp: false, referencedOption }
  }

  return { subject: 'general', isFollowUp: false, referencedOption }
}

/** Analyze a Vietnamese utterance for V9 conversational intelligence. */
export function analyzeConsultationUtterance(
  raw: string,
  ctx: GroundedContext,
): QuestionAnalysis {
  const original = raw.trim()
  const text = normalizeSpokenConsultation(original)
  const prevTopic = ctx.topicState?.activeTopic ?? null
  const isRepair = detectRepair(text)
  const questionCategory = detectQuestionCategory(original, text)
  const { subject, isFollowUp, referencedOption } = detectSubject(
    text,
    prevTopic,
    ctx.selectedService?.name,
  )

  const hasExplicitActionVerb =
    /\b(them video|chon kieu do|them cai do|lay video|them quay video|bat quay video|them chup anh|cap nhat mo ta)\b/.test(
      text,
    )
  const isQuestion = questionCategory !== 'NONE' || isRepair
  const isHybridQuestionAction = isQuestion && hasExplicitActionVerb

  let mode: ConversationalMode = 'ACTION_EXECUTION'
  if (isHybridQuestionAction) mode = 'CONSULTATION'
  else if (isRepair) mode = 'QUESTION_ANSWERING'
  else if (questionCategory === 'RECOMMENDATION' && !ctx.selectedService) mode = 'SERVICE_RECOMMENDATION'
  else if (isQuestion) mode = 'QUESTION_ANSWERING'
  else if (hasExplicitActionVerb) mode = 'ACTION_EXECUTION'

  return {
    isQuestion,
    isRepair,
    isFollowUp,
    isHybridQuestionAction,
    mode,
    questionCategory,
    subject,
    referencedOption,
    forbidMutation: isQuestion && !isHybridQuestionAction,
  }
}

/**
 * Verified Drone Domain Knowledge Base (Section 8).
 * Only states verified platform capabilities — never fabricates camera models, exact durations,
 * unverified prices, discounts, or guaranteed flight approvals.
 */
function buildGroundedAnswer(
  analysis: QuestionAnalysis,
  text: string,
  ctx: GroundedContext,
): { reply: string; actions: AgentAction[]; nextOption: TopicState['lastReferencedOption'] } {
  const svcName = ctx.selectedService?.name
  const svcPrefix = svcName ? `Với dịch vụ ${svcName} anh/chị đã chọn` : 'Trong hệ thống OnDemand Monitor'
  const actions: AgentAction[] = []
  let nextOption = analysis.referencedOption ?? ctx.topicState?.lastReferencedOption ?? null

  // 1. Consultation-to-action anaphoric follow-up ("Vậy thêm video luôn", "Vậy chọn kiểu đó", "Thế thêm cái đó luôn")
  if (
    !analysis.isQuestion &&
    /\b(vay them video|them video luon|vay chon kieu do|the them cai do|chon kieu do|them cai do luon)\b/.test(
      text,
    )
  ) {
    if (ctx.topicState?.activeTopic === 'video_recording' || /\bvideo\b/.test(text)) {
      actions.push({ type: 'checklist_set_videos', count: 1 })
      if (nextOption === 'top_down_video') {
        actions.push({ type: 'append_description', text: 'quay video góc từ trên xuống' })
      } else if (nextOption === 'orbit_video') {
        actions.push({ type: 'append_description', text: 'quay video vòng quanh tòa nhà' })
      } else if (nextOption === 'panoramic_video') {
        actions.push({ type: 'append_description', text: 'quay video toàn cảnh khu vực' })
      }
      return {
        reply: 'Đã bật tùy chọn quay video trong checklist và cập nhật yêu cầu góc quay vào bản nháp.',
        actions,
        nextOption,
      }
    }
    if (ctx.topicState?.activeTopic === 'photography') {
      actions.push({ type: 'checklist_set_images', count: 1 })
      return {
        reply: 'Đã cập nhật tùy chọn chụp ảnh trong checklist cho anh/chị.',
        actions,
        nextOption,
      }
    }
  }

  // 2. Hybrid Question + Action ("Quay video như thế nào, nếu quay được toàn cảnh thì thêm video giúp tôi")
  if (analysis.isHybridQuestionAction && analysis.subject === 'video_recording') {
    if (ctx.form.serviceId) {
      actions.push({ type: 'checklist_set_videos', count: 1 })
      if (/\btoan canh\b/.test(text)) {
        nextOption = 'panoramic_video'
        actions.push({ type: 'append_description', text: 'quay video toàn cảnh' })
      }
    }
    const actionNote = ctx.form.serviceId
      ? ' Hệ thống hỗ trợ quay toàn cảnh nên em đã bật tùy chọn quay video trong checklist và bổ sung vào mô tả nhiệm vụ.'
      : ' Anh/chị chọn dịch vụ trước rồi em sẽ bật tùy chọn quay video trong checklist ngay.'
    return {
      reply:
        `${svcPrefix}, drone hỗ trợ quay toàn cảnh từ trên cao, quay góc từ trên xuống và quay vòng quanh công trình theo đúng phạm vi đã khoanh vùng (độ cao bay hợp lệ 10–120m).` +
        actionNote,
      actions,
      nextOption,
    }
  }

  // 3. Pure Question Answering / Conversational Repair (ZERO state mutation)
  switch (analysis.subject) {
    case 'video_recording': {
      if (analysis.questionCategory === 'HOW_LONG') {
        return {
          reply:
            'Thời lượng video không cố định sẵn mà phụ thuộc vào diện tích khu vực giám sát, số hạng mục checklist và yêu cầu cụ thể của anh/chị. Anh/chị có thể ghi rõ thời lượng mong muốn trong phần mô tả để đội vận hành lên kế hoạch bay phù hợp.',
          actions: [],
          nextOption,
        }
      }
      if (analysis.questionCategory === 'HOW_MUCH') {
        const priceNote = ctx.pricingEstimate?.estimatedTotal
          ? ` Mức tạm tính hiện tại của đơn là ${ctx.pricingEstimate.estimatedTotal.toLocaleString('vi-VN')} VNĐ.`
          : ''
        return {
          reply:
            `Chi phí quay video phụ thuộc vào số lượng video trong từng hạng mục checklist và gói dịch vụ đã chọn.${priceNote} Mức giá trên hệ thống là giá tạm tính tham khảo; quản lý sẽ xác nhận báo giá chính thức trước khi triển khai.`,
          actions: [],
          nextOption,
        }
      }
      if (/\b(co ro khong|do net|do phan giai|chat luong)\b/.test(text)) {
        return {
          reply:
            'Độ rõ của video phụ thuộc vào độ cao bay (10–120m), khoảng cách tiếp cận an toàn, ánh sáng và điều kiện thời tiết lúc bay. Khi cần quan sát chi tiết (như mái hoặc mặt dựng), phi công sẽ bay ở độ cao phù hợp trong phạm vi cho phép.',
          actions: [],
          nextOption,
        }
      }
      if (/\b(chinh sua|hau ky|cat ghep)\b/.test(text)) {
        return {
          reply:
            'Hệ thống bàn giao video ghi nhận hiện trường theo đúng hạng mục checklist (định dạng VIDEO, kèm ảnh hoặc báo cáo PDF nếu anh/chị chọn). Nếu cần yêu cầu biên tập/cắt ghép riêng, anh/chị có thể ghi chú trong mô tả để quản lý xác nhận phạm vi.',
          actions: [],
          nextOption,
        }
      }
      if (/\b(file goc|ban goc|tai ve|ban giao)\b/.test(text)) {
        return {
          reply:
            'Sản phẩm video sau chuyến bay được bàn giao trực tiếp qua hệ thống để tải về (DOWNLOAD) hoặc gửi liên kết qua EMAIL, với thời hạn lưu trữ tùy chọn 30, 90, 180 hoặc 365 ngày.',
          actions: [],
          nextOption,
        }
      }
      if (/\b(tu tren xuong|top down)\b/.test(text)) {
        return {
          reply:
            `${svcPrefix}, drone có hỗ trợ quay góc từ trên xuống để bao quát mặt bằng, mái và bố trí tổng thể khu vực trong giới hạn độ cao bay 10–120m và điều kiện an toàn bay.`,
          actions: [],
          nextOption: 'top_down_video',
        }
      }
      if (/\b(quanh toa nha|vong quanh|mat dung|xung quanh)\b/.test(text)) {
        return {
          reply:
            `${svcPrefix}, drone có hỗ trợ bay quay vòng quanh bên ngoài tòa nhà/công trình để ghi nhận mặt dựng và tiến độ thi công, miễn là khu vực không có vật cản nguy hiểm và nằm trong ranh giới được phép bay.`,
          actions: [],
          nextOption: 'orbit_video',
        }
      }
      return {
        reply:
          `${svcPrefix}, quy trình quay video bằng drone gồm các góc ghi hình thực tế được hỗ trợ: quay toàn cảnh khu vực từ trên cao, quay góc từ trên xuống (mặt bằng/mái), quay vòng quanh ngoại thất công trình và quay theo từng hạng mục checklist cụ thể (độ cao 10–120m). Video hoàn thành sẽ bàn giao qua tải trực tiếp hoặc email. Nếu muốn bật quay video cho đơn này, anh/chị chỉ cần nói "Thêm video luôn".`,
        actions: [],
        nextOption: 'panoramic_video',
      }
    }

    case 'photography': {
      return {
        reply:
          `${svcPrefix}, chụp ảnh bằng drone hỗ trợ ảnh toàn cảnh từ trên cao, ảnh chi tiết khu vực ưu tiên (như mái nhà, mặt dựng) và ảnh so sánh tiến độ qua các đợt bay. Độ sắc nét phụ thuộc vào độ cao bay (10–120m), ánh sáng và khoảng cách an toàn; ảnh được bàn giao dưới định dạng PHOTO (kèm báo cáo PDF nếu chọn).`,
        actions: [],
        nextOption: 'roof_photo',
      }
    }

    case 'monitoring_area': {
      return {
        reply:
          'Khả năng bay quay/chụp toàn bộ một khu vực lớn (như khuôn viên trường học hoặc khu công nghiệp) phụ thuộc vào ranh giới thực tế anh/chị khoanh trên bản đồ, phạm vi phục vụ tại TP. Hồ Chí Minh, độ cao an toàn 10–120m và phê duyệt phép bay theo quy định. Em sẽ không tự khẳng định được phép bay trước khi đội vận hành kiểm tra khu vực.',
        actions: [],
        nextOption,
      }
    }

    case 'weather_permit': {
      return {
        reply:
          'Chuyến bay drone tuân thủ độ cao 10–120m, yêu cầu đặt lịch trước tối thiểu 7 ngày và phụ thuộc vào điều kiện thời tiết thực tế (mưa/gió mạnh có thể cần dời lịch) cùng hồ sơ phép bay theo khu vực. Đội vận hành và quản lý sẽ kiểm tra, xác nhận điều kiện an toàn trước khi cất cánh.',
        actions: [],
        nextOption,
      }
    }

    case 'deliverables': {
      return {
        reply:
          'Hệ thống hỗ trợ các định dạng bàn giao gồm Ảnh (PHOTO), Video (VIDEO) và Báo cáo PDF (PDF_REPORT), nhận qua tải trực tiếp (DOWNLOAD) hoặc Email (EMAIL), với thời hạn lưu trữ 30, 90, 180 hoặc 365 ngày.',
        actions: [],
        nextOption,
      }
    }

    case 'cancellation_status': {
      return {
        reply:
          'Đơn hiện tại mới ở trạng thái bản nháp (chưa gửi). Sau khi anh/chị tự xác nhận điều khoản và gửi yêu cầu, quản lý sẽ kiểm tra phạm vi, báo giá chính thức và điều kiện bay; mọi yêu cầu hủy hoặc điều chỉnh lịch sẽ theo chính sách vận hành do quản lý xác nhận.',
        actions: [],
        nextOption,
      }
    }

    case 'pricing': {
      const priceNote = ctx.pricingEstimate?.estimatedTotal
        ? `Mức tạm tính hiện tại là ${ctx.pricingEstimate.estimatedTotal.toLocaleString('vi-VN')} VNĐ.`
        : ctx.selectedService?.defaultPrice
          ? `Giá tham khảo của ${ctx.selectedService.name} từ ${ctx.selectedService.defaultPrice.toLocaleString('vi-VN')} VNĐ.`
          : 'Chi phí phụ thuộc vào dịch vụ và số hạng mục ảnh/video anh/chị chọn.'
      return {
        reply: `${priceNote} Đây là giá tạm tính tham khảo; quản lý sẽ xác nhận báo giá chính thức sau khi kiểm tra khu vực và yêu cầu cụ thể.`,
        actions: [],
        nextOption,
      }
    }

    default: {
      if (analysis.isRepair && svcName) {
        return {
          reply:
            `Em xin lỗi đã hiểu nhầm ý anh/chị. Em đã ghi nhận anh/chị đang chọn ${svcName} và giữ nguyên toàn bộ bản nháp hiện tại. Anh/chị muốn em giải thích cụ thể hơn về cách quay video, chụp ảnh, checklist hay khu vực bay ạ?`,
          actions: [],
          nextOption,
        }
      }
      return { reply: '', actions: [], nextOption }
    }
  }
}

/**
 * Lightweight Deterministic Response Relevance Validator (Section 16).
 */
export function validateResponseRelevance(
  analysis: QuestionAnalysis,
  ctx: GroundedContext,
  reply: string,
  actions: AgentAction[],
): RelevanceValidation {
  const violations: string[] = []
  const lower = normalizeVi(reply)

  if (ctx.selectedService && /ban co quan tam den dich vu nay khong|dich vu phu hop voi nhu cau cua ban la/.test(lower)) {
    violations.push('REPEATED_SERVICE_RECOMMENDATION')
  }
  if (analysis.forbidMutation && actions.length > 0) {
    violations.push('UNAUTHORIZED_MUTATION_ON_CONSULTATION')
  }
  if (analysis.subject === 'video_recording' && reply && !/\b(video|quay|ghi hinh|thoi luong|do cao|ban giao|chi phi)\b/.test(lower)) {
    violations.push('SUBJECT_MISMATCH_VIDEO')
  }
  if (analysis.forbidMutation && /^da (chon|cap nhat|them|xoa|gui)\b/.test(lower)) {
    violations.push('FALSE_ACTION_CLAIM')
  }

  return { passed: violations.length === 0, violations }
}

/**
 * Main V9 runtime entry point.
 * Returns `handled: true` when V9 handles a consultation question, follow-up, repair,
 * or consultation-to-action transition cleanly without falling into scripted service recommendation loops.
 */
export function handleConversationalTurnV9(
  raw: string,
  ctx: GroundedContext,
): V9ConsultationResult {
  const original = raw.trim()
  const text = normalizeSpokenConsultation(original)
  const prev = ctx.topicState ?? createTopicState()
  const analysis = analyzeConsultationUtterance(original, ctx)

  // Resume workflow explicitly ("Rồi tiếp tục đi", "Không cần hỏi nữa, tiếp tục đi") -> let V5 handle continue_workflow
  if (/\b(tiep tuc di|khong can hoi nua|quay lai quy trinh)\b/.test(text)) {
    return {
      handled: false,
      analysis,
      reply: '',
      actions: [],
      nextTopicState: { ...prev, turnIndex: prev.turnIndex + 1 },
      relevance: { passed: true, violations: [] },
    }
  }

  // Handle pure consultation/repair/follow-up questions OR consultation-to-action anaphoric transitions
  const isAnaphoricTransition =
    !analysis.isQuestion &&
    /\b(vay them video|them video luon|vay chon kieu do|the them cai do|chon kieu do|them cai do luon)\b/.test(text)

  if (!analysis.isQuestion && !isAnaphoricTransition) {
    return {
      handled: false,
      analysis,
      reply: '',
      actions: [],
      nextTopicState: { ...prev, turnIndex: prev.turnIndex + 1 },
      relevance: { passed: true, violations: [] },
    }
  }

  // Only intercept when we have a grounded subject answer (or repair); otherwise fall through to Gemini with grounded context.
  const built = buildGroundedAnswer(analysis, text, ctx)
  if (!built.reply) {
    return {
      handled: false,
      analysis,
      reply: '',
      actions: [],
      nextTopicState: {
        activeTopic: analysis.subject !== 'general' ? analysis.subject : prev.activeTopic,
        lastQuestionCategory: analysis.questionCategory,
        lastReferencedOption: analysis.referencedOption ?? prev.lastReferencedOption,
        lastAssistantReply: prev.lastAssistantReply,
        turnIndex: prev.turnIndex + 1,
      },
      relevance: { passed: true, violations: [] },
    }
  }

  const relevance = validateResponseRelevance(analysis, ctx, built.reply, built.actions)
  const nextTopicState: TopicState = {
    activeTopic: analysis.subject !== 'general' ? analysis.subject : prev.activeTopic,
    lastQuestionCategory: analysis.questionCategory,
    lastReferencedOption: built.nextOption,
    lastAssistantReply: built.reply,
    turnIndex: prev.turnIndex + 1,
  }

  return {
    handled: relevance.passed,
    analysis,
    reply: built.reply,
    actions: built.actions,
    nextTopicState,
    relevance,
  }
}
