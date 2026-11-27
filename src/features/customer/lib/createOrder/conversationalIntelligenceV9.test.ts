import { describe, expect, it } from 'vitest'
import { createDefaultForm } from './draftStorage'
import { planAutonomousTurn } from './autonomousAgentV3'
import {
  createTopicState,
  handleConversationalTurnV9,
  type GroundedContext,
} from './conversationalIntelligenceV9'

const SERVICES = [
  { id: 'svc-build', name: 'Giám sát công trình', isActive: true, defaultPrice: 3500000 },
  { id: 'svc-factory', name: 'Kiểm tra nhà xưởng', isActive: true, defaultPrice: 4200000 },
  { id: 'svc-forest', name: 'Giám sát rừng', isActive: true, defaultPrice: 5000000 },
]

function make3Of7Context(topicState = createTopicState()): GroundedContext {
  const form = {
    ...createDefaultForm(),
    serviceId: 'svc-build',
    flightPurpose: 'CONSTRUCTION_MONITORING' as const,
    description: 'Quay toàn cảnh công trình và kiểm tra mái tại Đại học FPT HCM.',
  }
  return {
    form,
    services: SERVICES as never,
    selectedService: SERVICES[0] as never,
    activeSection: 'location',
    completedCount: 3,
    topicState,
  }
}

describe('AI Chatbot V9 — Deep Conversational Intelligence & Screenshot Regression', () => {
  it('CRITICAL REGRESSION: "Ý coi là. Quay video như thế nào?" at 3/7 state explains video recording without recommending service or mutating draft', () => {
    const ctx = make3Of7Context()
    const res = handleConversationalTurnV9('Ý coi là. Quay video như thế nào?', ctx)

    expect(res.handled).toBe(true)
    expect(res.analysis.isQuestion).toBe(true)
    expect(res.analysis.isRepair).toBe(true)
    expect(res.analysis.questionCategory).toBe('HOW')
    expect(res.analysis.subject).toBe('video_recording')
    expect(res.analysis.forbidMutation).toBe(true)
    expect(res.actions).toEqual([])
    expect(res.relevance.passed).toBe(true)
    expect(res.reply).toMatch(/quay toàn cảnh|từ trên xuống|vòng quanh/i)
    expect(res.reply).not.toMatch(/bạn có quan tâm đến dịch vụ này không/i)
    expect(res.reply).not.toMatch(/dịch vụ phù hợp với nhu cầu của bạn là/i)

    // Verify V3 autonomous planner also NEVER fires recommend_service when service is already selected
    const v3 = planAutonomousTurn('Ý coi là. Quay video như thế nào?', {
      services: SERVICES as never,
      purposeLabels: {} as never,
      memory: {
        activeStep: 2,
        activeSection: 'location',
        currentServiceId: 'svc-build',
        hasFlightPurpose: true,
      },
    })
    expect(v3.actions.some((a) => a.type === 'recommend_service')).toBe(false)
  })

  it('tracks multi-turn video topic across short follow-ups ("Bao lâu?", "Có rõ không?", "Có chỉnh sửa không?", "Bao nhiêu tiền?", "Có gửi file gốc không?")', () => {
    let topic = createTopicState()
    const ask = (q: string) => {
      const r = handleConversationalTurnV9(q, make3Of7Context(topic))
      topic = r.nextTopicState
      return r
    }

    const r1 = ask('Quay video như thế nào?')
    expect(r1.analysis.subject).toBe('video_recording')

    const r2 = ask('Bao lâu?')
    expect(r2.analysis.isFollowUp).toBe(true)
    expect(r2.analysis.subject).toBe('video_recording')
    expect(r2.analysis.questionCategory).toBe('HOW_LONG')
    expect(r2.actions).toEqual([])
    expect(r2.reply).toMatch(/thời lượng video không cố định|phụ thuộc/i)

    const r3 = ask('Có rõ không?')
    expect(r3.analysis.subject).toBe('video_recording')
    expect(r3.actions).toEqual([])
    expect(r3.reply).toMatch(/10–120m|ánh sáng|thời tiết/i)

    const r4 = ask('Có chỉnh sửa không?')
    expect(r4.analysis.subject).toBe('video_recording')
    expect(r4.actions).toEqual([])

    const r5 = ask('Bao nhiêu tiền?')
    expect(r5.analysis.subject).toBe('video_recording')
    expect(r5.analysis.questionCategory).toBe('HOW_MUCH')
    expect(r5.reply).toMatch(/chi phí quay video|tạm tính/i)

    const r6 = ask('Có gửi file gốc không?')
    expect(r6.analysis.subject).toBe('video_recording')
    expect(r6.reply).toMatch(/DOWNLOAD|EMAIL/i)
  })

  it('handles topic tracking + anaphoric consultation-to-action ("Còn quay quanh tòa nhà?" -> "Vậy chọn kiểu đó")', () => {
    let topic = createTopicState()
    const r1 = handleConversationalTurnV9('Quay video như thế nào?', make3Of7Context(topic))
    topic = r1.nextTopicState

    const r2 = handleConversationalTurnV9('Còn quay quanh tòa nhà?', make3Of7Context(topic))
    topic = r2.nextTopicState
    expect(r2.analysis.subject).toBe('video_recording')
    expect(r2.actions).toEqual([])
    expect(topic.lastReferencedOption).toBe('orbit_video')

    const r3 = handleConversationalTurnV9('Vậy chọn kiểu đó.', make3Of7Context(topic))
    expect(r3.handled).toBe(true)
    expect(r3.actions.map((a) => a.type)).toContain('checklist_set_videos')
    expect(r3.actions.map((a) => a.type)).toContain('append_description')
  })

  it('handles hybrid question + action in one sentence', () => {
    const res = handleConversationalTurnV9(
      'Quay video như thế nào, nếu quay được toàn cảnh thì thêm video giúp tôi.',
      make3Of7Context(),
    )
    expect(res.handled).toBe(true)
    expect(res.analysis.isHybridQuestionAction).toBe(true)
    expect(res.actions.map((a) => a.type)).toContain('checklist_set_videos')
    expect(res.reply).toMatch(/toàn cảnh/i)
  })

  it('handles conversational repair without restarting service selection', () => {
    const res = handleConversationalTurnV9(
      'Không phải ý tôi, tôi chọn rồi mà, không cần giới thiệu dịch vụ nữa.',
      make3Of7Context(),
    )
    expect(res.handled).toBe(true)
    expect(res.analysis.isRepair).toBe(true)
    expect(res.actions).toEqual([])
    expect(res.relevance.passed).toBe(true)
  })
})
