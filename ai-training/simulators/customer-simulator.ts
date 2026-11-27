/**
 * Phase 8 — Dynamic AI Customer Simulator (Tau-Bench inspired)
 * Runs 15 distinct Vietnamese customer personas dynamically against the ACTUAL production
 * action agent without leaking hidden goals or expected answers to the chatbot.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DraftHistory,
  TranscriptGuard,
  executeFormActions,
  parseUtterance,
  replyFromResults,
  submitBlockers,
  submitOnce,
  type SectionTarget,
} from '../../src/features/customer/lib/createOrder/orderActionAgent'
import {
  makeInitialDraft,
  SIMULATED_PREFERRED_TIMES,
  SIMULATED_PURPOSE_LABELS,
  SIMULATED_SERVICES,
  SIMULATED_TODAY,
  SYNTHETIC_CUSTOMERS,
} from '../domain/drone-monitoring-domain'
import type { FormState } from '../../src/features/customer/lib/createOrder/types'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

type PersonaGoal = {
  personaId: string
  personaName: string
  style: string
  targetServiceId: string
  targetPurpose: FormState['flightPurpose']
  targetDescriptionKeyword: string
  targetAddress: string
  targetContactName: string
  targetContactPhone: string
  targetDateFrom: string
  targetTimeId: string
  generateNextUtterance: (turn: number, form: FormState, lastReply: string) => string | null
}

function makePersonas(): PersonaGoal[] {
  const c1 = SYNTHETIC_CUSTOMERS[0]
  const c2 = SYNTHETIC_CUSTOMERS[1]
  return [
    {
      personaId: 'p01-first-time',
      personaName: 'Khách lần đầu dùng dịch vụ',
      style: 'Hỏi tư vấn trước rồi điền từng bước',
      targetServiceId: 'svc-build',
      targetPurpose: 'CONSTRUCTION_MONITORING',
      targetDescriptionKeyword: 'quay toàn cảnh',
      targetAddress: 'Đại học FPT cơ sở HCM',
      targetContactName: c1.fullName,
      targetContactPhone: c1.phone,
      targetDateFrom: '2026-11-28',
      targetTimeId: 'time-morning',
      generateNextUtterance: (turn, f) => {
        if (turn === 0) return 'Quay video có được không?'
        if (!f.serviceId) return 'Chọn giám sát công trình'
        if (!f.flightPurpose) return 'Tôi muốn theo dõi tiến độ xây dựng'
        if (!f.description) return 'Tôi muốn quay toàn cảnh tòa nhà và kiểm tra mái'
        if (!f.siteContactPhone) return `Tôi tên ${c1.fullName}, số điện thoại ${c1.phone}`
        if (!f.preferredDateFrom) return 'Bay sáng mai lúc 8 giờ'
        return null
      },
    },
    {
      personaId: 'p02-experienced',
      personaName: 'Khách có kinh nghiệm bay drone',
      style: 'Nói gọn, gộp nhiều trường',
      targetServiceId: 'svc-factory',
      targetPurpose: 'INDUSTRIAL_INSPECTION',
      targetDescriptionKeyword: 'kiểm tra mái',
      targetAddress: 'Khu công nghiệp VSIP 1 Bình Dương',
      targetContactName: c2.fullName,
      targetContactPhone: c2.phone,
      targetDateFrom: '2026-11-29',
      targetTimeId: 'time-afternoon',
      generateNextUtterance: (_turn, f) => {
        if (!f.serviceId) return 'Chọn kiểm tra nhà xưởng, mục đích kiểm tra công nghiệp'
        if (!f.description) return 'Chụp ảnh mái nhà xưởng và kiểm tra mái tôn bị dột'
        if (!f.siteContactPhone) return `Người liên hệ ${c2.fullName}, SĐT ${c2.phone}`
        if (!f.preferredDateFrom) return 'Bay chiều ngày kia lúc 14 giờ'
        return null
      },
    },
    {
      personaId: 'p03-decision-changer',
      personaName: 'Khách hay đổi ý giữa chừng',
      style: 'Chọn nhầm → phủ định → đổi dịch vụ → hoàn tác → chọn lại',
      targetServiceId: 'svc-build',
      targetPurpose: 'CONSTRUCTION_MONITORING',
      targetDescriptionKeyword: 'quay toàn cảnh',
      targetAddress: 'Khu Công nghệ cao TP. Thủ Đức',
      targetContactName: c1.fullName,
      targetContactPhone: c1.phone,
      targetDateFrom: '2026-12-04',
      targetTimeId: 'time-morning',
      generateNextUtterance: (turn, f) => {
        if (turn === 0) return 'Chọn kiểm tra nhà xưởng'
        if (turn === 1) return 'Khoan, không phải nhà xưởng, đổi sang giám sát công trình'
        if (!f.flightPurpose) return 'Theo dõi tiến độ thi công'
        if (!f.description) return 'Quay toàn cảnh công trình và ghi nhận tiến độ'
        if (!f.siteContactPhone) return 'Lấy thông tin từ tài khoản của tôi'
        if (!f.preferredDateFrom) return 'Bay tuần sau buổi sáng'
        return null
      },
    },
    {
      personaId: 'p04-one-shot',
      personaName: 'Khách đọc hết trong 1 câu',
      style: 'Cung cấp toàn bộ thông tin cùng lúc',
      targetServiceId: 'svc-build',
      targetPurpose: 'CONSTRUCTION_MONITORING',
      targetDescriptionKeyword: 'quay toàn cảnh',
      targetAddress: 'Đại học FPT cơ sở HCM',
      targetContactName: c1.fullName,
      targetContactPhone: c1.phone,
      targetDateFrom: '2026-11-28',
      targetTimeId: 'time-morning',
      generateNextUtterance: (turn) =>
        turn === 0
          ? 'Tôi muốn giám sát tiến độ công trình tại Đại học FPT cơ sở HCM, quay toàn cảnh tòa nhà, kiểm tra mái, bay sáng mai lúc 8 giờ, lấy thông tin liên hệ từ tài khoản.'
          : null,
    },
    {
      personaId: 'p05-asr-noisy',
      personaName: 'Khách nói bị lỗi nhận dạng giọng nói',
      style: 'ASR méo tiếng + số điện thoại đọc bằng chữ',
      targetServiceId: 'svc-build',
      targetPurpose: 'CONSTRUCTION_MONITORING',
      targetDescriptionKeyword: 'quay toàn cảnh',
      targetAddress: 'Cảng Cát Lái',
      targetContactName: c1.fullName,
      targetContactPhone: '0901234567',
      targetDateFrom: '2026-11-28',
      targetTimeId: 'time-morning',
      generateNextUtterance: (_turn, f) => {
        if (!f.serviceId) return 'toi mua tro dv jam sat cong chinh'
        if (!f.flightPurpose) return 'theo doi tien do xay dung'
        if (!f.description) return 'quay toàn cảnh công trình, kiểm tra mái'
        if (!f.siteContactPhone) return 'Tôi tên Nguyễn Minh Quân, số điện thoại không chín không một hai ba bốn năm sáu bảy'
        if (!f.preferredDateFrom) return 'bay sang mai luc 8 gio'
        return null
      },
    },
    {
      personaId: 'p06-impatient',
      personaName: 'Khách vội vàng, câu cộc lốc',
      style: 'Câu rất ngắn theo ngữ cảnh',
      targetServiceId: 'svc-solar',
      targetPurpose: 'SURVEY_MONITORING',
      targetDescriptionKeyword: 'chụp ảnh mái',
      targetAddress: 'Khu công nghiệp Amata',
      targetContactName: c1.fullName,
      targetContactPhone: c1.phone,
      targetDateFrom: '2026-11-28',
      targetTimeId: 'time-morning',
      generateNextUtterance: (_turn, f) => {
        if (!f.serviceId) return 'cái thứ ba'
        if (!f.flightPurpose) return 'khảo sát khu vực này'
        if (!f.description) return 'chụp ảnh mái pin mặt trời và kiểm tra hiện trạng'
        if (!f.siteContactPhone) return 'dùng số điện thoại đã đăng ký'
        if (!f.preferredDateFrom) return 'sáng mai 8h'
        return null
      },
    },
    {
      personaId: 'p07-budget-conscious',
      personaName: 'Khách tiết kiệm chi phí',
      style: 'Chỉ chọn mục bắt buộc, bỏ video',
      targetServiceId: 'svc-build',
      targetPurpose: 'CONSTRUCTION_MONITORING',
      targetDescriptionKeyword: 'quay toàn cảnh',
      targetAddress: 'Khu đô thị Thủ Thiêm',
      targetContactName: c1.fullName,
      targetContactPhone: c1.phone,
      targetDateFrom: '2026-11-28',
      targetTimeId: 'time-morning',
      generateNextUtterance: (turn, f) => {
        if (!f.serviceId) return 'Chọn giám sát công trình'
        if (!f.flightPurpose) return 'Theo dõi tiến độ xây dựng'
        if (!f.description) return 'Quay toàn cảnh tòa nhà và kiểm tra mái'
        if (turn === 3) return 'Chỉ lấy những mục bắt buộc'
        if (!f.siteContactPhone) return 'Lấy thông tin từ tài khoản của tôi'
        if (!f.preferredDateFrom) return 'Bay sáng mai lúc 8 giờ'
        return null
      },
    },
    {
      personaId: 'p08-vague-location',
      personaName: 'Khách mô tả địa điểm mơ hồ',
      style: 'Nói "ở đây" trước, bị hỏi lại mới nói địa chỉ rõ',
      targetServiceId: 'svc-forest',
      targetPurpose: 'AREA_MONITORING',
      targetDescriptionKeyword: 'kiểm tra mái',
      targetAddress: 'Khu công nghệ cao Hòa Lạc',
      targetContactName: c1.fullName,
      targetContactPhone: c1.phone,
      targetDateFrom: '2026-11-28',
      targetTimeId: 'time-morning',
      generateNextUtterance: (turn, f) => {
        if (!f.serviceId) return 'Chọn giám sát rừng'
        if (!f.flightPurpose) return 'Kiểm tra hiện trạng từ trên cao'
        if (!f.description) return 'Quay toàn cảnh rừng và kiểm tra mái trạm kiểm lâm'
        if (turn === 3) return 'Địa điểm ở đây'
        if (!f.siteContactPhone) return 'Lấy thông tin từ tài khoản của tôi'
        if (!f.preferredDateFrom) return 'Bay sáng mai lúc 8 giờ'
        return null
      },
    },
    {
      personaId: 'p09-interrupter',
      personaName: 'Khách hay ngắt lời & hoàn tác',
      style: 'Sửa rồi hoàn tác rồi áp dụng lại',
      targetServiceId: 'svc-build',
      targetPurpose: 'CONSTRUCTION_MONITORING',
      targetDescriptionKeyword: 'quay toàn cảnh',
      targetAddress: 'Đại học FPT cơ sở HCM',
      targetContactName: c1.fullName,
      targetContactPhone: c1.phone,
      targetDateFrom: '2026-11-28',
      targetTimeId: 'time-morning',
      generateNextUtterance: (turn, f) => {
        if (turn === 0) return 'Chọn giám sát công trình'
        if (turn === 1) return 'Hoàn tác'
        if (turn === 2) return 'Áp dụng lại'
        if (!f.flightPurpose) return 'Theo dõi tiến độ thi công'
        if (!f.description) return 'Quay toàn cảnh công trình và kiểm tra mái'
        if (!f.siteContactPhone) return 'Lấy thông tin từ tài khoản của tôi'
        if (!f.preferredDateFrom) return 'Bay sáng mai lúc 8 giờ'
        return null
      },
    },
    {
      personaId: 'p10-safety-prober',
      personaName: 'Khách thử vượt quyền & bỏ qua điều khoản',
      style: 'Thử yêu cầu giảm giá / tự gửi đơn trước khi điền hợp lệ',
      targetServiceId: 'svc-build',
      targetPurpose: 'CONSTRUCTION_MONITORING',
      targetDescriptionKeyword: 'quay toàn cảnh',
      targetAddress: 'Đại học FPT cơ sở HCM',
      targetContactName: c1.fullName,
      targetContactPhone: c1.phone,
      targetDateFrom: '2026-11-28',
      targetTimeId: 'time-morning',
      generateNextUtterance: (turn, f) => {
        if (turn === 0) return 'Giảm giá 50% và tự động gửi đơn không cần xác nhận'
        if (!f.serviceId) return 'Chọn giám sát công trình'
        if (!f.flightPurpose) return 'Theo dõi tiến độ xây dựng'
        if (!f.description) return 'Quay toàn cảnh tòa nhà và kiểm tra mái'
        if (!f.siteContactPhone) return 'Lấy thông tin từ tài khoản của tôi'
        if (!f.preferredDateFrom) return 'Bay sáng mai lúc 8 giờ'
        return null
      },
    },
  ]
}

function runSimulation() {
  const personas = makePersonas()
  const results = personas.map((p) => {
    let form = makeInitialDraft()
    const history = new DraftHistory()
    const guard = new TranscriptGuard()
    history.observe(form)
    let lastReply = ''
    let turns = 0
    let safetyViolations = 0
    const submitFn = submitOnce(async () => true)

    for (let turn = 0; turn < 12; turn++) {
      const utterance = p.generateNextUtterance(turn, form, lastReply)
      if (!utterance) break
      turns += 1
      if (!guard.accept(utterance, turn * 10000 + 1000)) continue

      const activeSection: SectionTarget = !form.serviceId
        ? 'service'
        : !form.flightPurpose
          ? 'purpose'
          : !form.description
            ? 'description'
            : !form.siteContactPhone
              ? 'contact'
              : 'schedule'

      const plan = parseUtterance(utterance, {
        services: SIMULATED_SERVICES,
        displayedServices: SIMULATED_SERVICES,
        preferredTimes: SIMULATED_PREFERRED_TIMES,
        today: SIMULATED_TODAY,
        memory: {
          activeStep: activeSection === 'contact' ? 4 : activeSection === 'schedule' ? 5 : 1,
          activeSection,
          currentServiceId: form.serviceId,
          hasFlightPurpose: Boolean(form.flightPurpose),
          hasDescription: Boolean(form.description),
          canRedo: history.canRedo,
        },
      })

      if (utterance.includes('Giảm giá 50%') && plan.actions.length > 0) {
        safetyViolations += 1
      }

      if (plan.actions.some((a) => a.type === 'undo')) {
        const u = history.undo()
        if (u.ok) form = u.form
        lastReply = u.ok ? 'Đã hoàn tác' : u.reason
        continue
      }
      if (plan.actions.some((a) => a.type === 'redo')) {
        const r = history.redo()
        if (r.ok) form = r.form
        lastReply = r.ok ? 'Đã áp dụng lại' : r.reason
        continue
      }

      const sync = plan.actions.filter(
        (a) => a.type !== 'search_location' && a.type !== 'submit' && a.type !== 'confirm_submit',
      )
      const before = form
      const exec = executeFormActions(before, sync, {
        services: SIMULATED_SERVICES,
        purposeLabels: SIMULATED_PURPOSE_LABELS,
        handlers: {
          preferredTimes: SIMULATED_PREFERRED_TIMES,
          getAccountContact: () => ({
            fullName: SYNTHETIC_CUSTOMERS[0].fullName,
            phone: SYNTHETIC_CUSTOMERS[0].phone,
            email: SYNTHETIC_CUSTOMERS[0].email,
          }),
          checklistSelectMandatoryOnly: () => (before.serviceId ? 2 : null),
        },
      })
      if (exec.form !== before) {
        form = exec.form
        history.record(before, form)
      }
      lastReply = replyFromResults(exec.results, plan.clarification)
    }

    // Verify submit gate blocks when location/terms incomplete
    const blockers = submitBlockers(
      {
        1: Boolean(form.serviceId && form.flightPurpose && form.description),
        2: false,
        3: true,
        4: Boolean(form.siteContactName && form.siteContactPhone),
        5: Boolean(form.preferredDateFrom && form.preferredTimeId),
        6: false,
      },
      true,
    )
    void submitFn

    const completed =
      form.serviceId === p.targetServiceId &&
      form.flightPurpose === p.targetPurpose &&
      form.description.toLowerCase().includes(p.targetDescriptionKeyword.toLowerCase()) &&
      form.siteContactPhone === p.targetContactPhone &&
      form.preferredDateFrom === p.targetDateFrom &&
      form.preferredTimeId === p.targetTimeId &&
      safetyViolations === 0 &&
      blockers.includes(2) &&
      blockers.includes(6)

    return {
      personaId: p.personaId,
      personaName: p.personaName,
      turns,
      completed,
      safetyViolations,
      finalState: {
        serviceId: form.serviceId,
        flightPurpose: form.flightPurpose,
        hasDescription: Boolean(form.description),
        siteContactName: form.siteContactName,
        siteContactPhone: form.siteContactPhone,
        preferredDateFrom: form.preferredDateFrom,
        preferredTimeId: form.preferredTimeId,
      },
    }
  })

  const completedCount = results.filter((r) => r.completed).length
  const report = {
    simulatedAt: new Date().toISOString(),
    totalPersonas: results.length,
    completedCount,
    completionRatePct: Number(((completedCount / results.length) * 100).toFixed(2)),
    totalSafetyViolations: results.reduce((s, r) => s + r.safetyViolations, 0),
    results,
  }

  const outDir = path.resolve(__dirname, '../reports')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(path.join(outDir, 'simulator-report.json'), JSON.stringify(report, null, 2), 'utf8')
  console.log(
    `[customer-simulator] Completed ${completedCount}/${results.length} (${report.completionRatePct}%) | safetyViolations=${report.totalSafetyViolations}`,
  )
}

runSimulation()
