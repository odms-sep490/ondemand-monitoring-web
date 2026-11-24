import { CheckCircleFilled, QuestionCircleOutlined } from '@ant-design/icons'
import { Alert, Button, Input, Space, Tag } from 'antd'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { OrderAgentSession } from '../../../lib/createOrder/orderAgent'
import type { AIRobotEvent } from './AIRobotAnimationController'
import { HologramEffectLayer } from './HologramEffectLayer'
import './MissionDescriptionAssistant.css'

export type MissionDescriptionReview = {
  serviceId: string
  originalText: string
  statements: string[]
  facts: Record<string, { value: string; quote: string; source: number }>
  readiness: string
  readinessState?: string
  nextQuestion: string
  nextQuestionField?: string | null
  quickReplies?: string[]
  unknownInformation: string[]
  optionalImprovements: string[]
  generatedDescription: string
  contradictions: string[]
  unsupportedRequests: string[]
  sourceReferences: Array<{ sourceId: string; excerpt: string; version: number | null }>
}

const FIELD_LABELS: Record<string, string> = {
  objective: 'Mục tiêu giám sát',
  subject: 'Đối tượng giám sát',
  scope: 'Phạm vi thực hiện',
  directions: 'Hướng / góc quan sát',
  concerns: 'Điểm cần chú ý',
  outputs: 'Kết quả mong muốn',
  constraints: 'Lưu ý hiện trường',
}

function getStatusBadge(result: MissionDescriptionReview): { label: string; color: string } {
  const state = result.readinessState || result.readiness
  switch (state) {
    case 'INSUFFICIENT_INFORMATION':
      return { label: 'Cần thêm thông tin', color: 'default' }
    case 'MATERIAL_CLARIFICATION_REQUIRED':
    case 'NEEDS_CLARIFICATION':
      return { label: 'Cần làm rõ phạm vi', color: 'processing' }
    case 'SUFFICIENT_FOR_DRAFT':
    case 'READY_FOR_DRAFT':
      return { label: 'Có thể hoàn thiện mô tả', color: 'cyan' }
    case 'READY_FOR_CUSTOMER_REVIEW':
      return { label: 'Sẵn sàng xem lại', color: 'success' }
    case 'NEEDS_OPERATIONAL_REVIEW':
    case 'NEEDS_HUMAN_REVIEW':
      return { label: 'Cần đội vận hành xác nhận', color: 'warning' }
    default:
      return { label: 'Đang phân tích', color: 'default' }
  }
}

function getProgressStage(result: MissionDescriptionReview | undefined, applied: boolean): number {
  if (applied) return 4
  if (!result) return 1
  if (result.generatedDescription) return 3
  return 2
}

type Props = {
  serviceId: string
  description: string
  session: OrderAgentSession
  busy: boolean
  review: (body: { originalText: string; answer: string; action: string }) => Promise<void>
  onApply: (description: string) => void
  onRobotEvent?: (event: AIRobotEvent) => void
}

const PROGRESS_STEPS = ['1. Đánh giá', '2. Làm rõ', '3. Hoàn thiện', '4. Áp dụng']

export function MissionDescriptionAssistant(p: Props) {
  const reduceMotion = useReducedMotion()
  const saved = p.session.state.descriptionReview
  const result = saved?.serviceId === p.serviceId ? saved : undefined
  const [answer, setAnswer] = useState('')
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [applied, setApplied] = useState(false)
  const original = useRef(p.description)

  useEffect(() => {
    setPreview(result?.generatedDescription ?? '')
  }, [result?.generatedDescription])

  async function run(action: string, customAnswer?: string) {
    setError('')
    setApplied(false)
    if (!result || action === 'restart') original.current = p.description
    const payloadAnswer = customAnswer !== undefined ? customAnswer : answer
    p.onRobotEvent?.('AGENT_REQUEST_STARTED')
    try {
      await p.review({
        originalText: result?.originalText ?? original.current,
        answer: payloadAnswer,
        action,
      })
      setAnswer('')
      p.onRobotEvent?.(action === 'generate' ? 'DESCRIPTION_READY' : 'REQUIREMENT_CONFIRMED')
    } catch (cause) {
      p.onRobotEvent?.('VALIDATION_FAILED')
      setError(cause instanceof Error ? cause.message : 'Chưa đánh giá được. Hãy thử lại.')
    }
  }

  const badge = result ? getStatusBadge(result) : null
  const factEntries = result ? Object.entries(result.facts) : []
  const stage = getProgressStage(result, applied)

  return (
    <section
      className="mission-description-assistant"
      aria-label="AI hỗ trợ hoàn thiện yêu cầu"
    >
      <div className="mission-description-heading">
        <strong>Làm rõ mô tả</strong>
        {badge && <Tag color={badge.color} style={{ marginInlineEnd: 0 }}>{badge.label}</Tag>}
      </div>

      {/* Step progress indicator */}
      <ol className="mission-description-stepper" aria-label="Tiến trình hoàn thiện mô tả">
        {PROGRESS_STEPS.map((label, idx) => {
          const stepNum = idx + 1
          const isDone = stepNum < stage || (stepNum === 4 && applied)
          const isActive = stepNum === stage && !applied
          return (
            <li
              key={label}
              className={`mission-description-step${isDone ? ' is-done' : ''}${
                isActive ? ' is-active' : ''
              }`}
            >
              {label}
            </li>
          )
        })}
      </ol>

      {error && <Alert type="warning" message={error} showIcon />}

      <HologramEffectLayer active={p.busy} compact label="Đang rà soát nội dung mô tả…" />

      {!result ? (
        <div>
          <Button
            size="small"
            loading={p.busy}
            disabled={!p.description.trim()}
            onClick={() => void run('review')}
          >
            Đánh giá mô tả
          </Button>
        </div>
      ) : (
        <>
          {/* Section A: Compact inline fact chips */}
          {factEntries.length > 0 && (
            <div className="mission-description-inline-row">
              <span className="mission-description-inline-label">Đã ghi nhận</span>
              <ul className="mission-description-facts">
                {factEntries.map(([field, fact]) => (
                  <motion.li
                    key={`${field}:${fact.value}`}
                    initial={
                      reduceMotion
                        ? false
                        : { opacity: 0, y: 4, backgroundColor: '#dbeafe' }
                    }
                    animate={{ opacity: 1, y: 0, backgroundColor: '#f8fbff' }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    className="mission-description-fact-item"
                  >
                    <CheckCircleFilled className="mission-description-fact-icon" />
                    <span>
                      <strong>{FIELD_LABELS[field] ?? field}:</strong> {fact.value}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          )}

          {/* Section B: Important gaps still unclear */}
          {result.unknownInformation.length > 0 && (
            <div className="mission-description-inline-row">
              <span className="mission-description-inline-label">Cần làm rõ</span>
              <Space wrap size={[4, 4]}>
                {result.unknownInformation.map((item) => (
                  <Tag key={item} color="orange" icon={<QuestionCircleOutlined />} style={{ marginInlineEnd: 0 }}>
                    {FIELD_LABELS[item] ?? item}
                  </Tag>
                ))}
              </Space>
            </div>
          )}

          {/* Section C & D: Active contextual question & quick choices */}
          <AnimatePresence mode="wait">
            {result.nextQuestion && (
              <motion.div
                key={result.nextQuestion}
                className="mission-description-question"
                initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <label htmlFor="mission-description-answer">{result.nextQuestion}</label>
                {result.quickReplies && result.quickReplies.length > 0 && (
                  <Space wrap size={[6, 6]}>
                    {result.quickReplies.map((choice) => (
                      <Button
                        key={choice}
                        size="small"
                        disabled={p.busy}
                        onClick={() => void run('review', choice)}
                      >
                        {choice}
                      </Button>
                    ))}
                  </Space>
                )}
                <Input.TextArea
                  id="mission-description-answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  maxLength={2000}
                  autoSize={{ minRows: 1, maxRows: 3 }}
                  placeholder="Nhập câu trả lời…"
                />
                <Space wrap size={[6, 6]}>
                  <Button
                    type="primary"
                    size="small"
                    loading={p.busy}
                    disabled={!answer.trim()}
                    onClick={() => void run('review')}
                  >
                    Trả lời
                  </Button>
                  <Button
                    size="small"
                    disabled={p.busy}
                    onClick={() => void run('review', 'Tôi chưa biết, cần tư vấn phần này.')}
                  >
                    Chưa biết
                  </Button>
                </Space>
              </motion.div>
            )}
          </AnimatePresence>

          {result.contradictions.map((text, i) => (
            <Alert key={'c' + i} type="warning" showIcon message={text} />
          ))}
          {result.unsupportedRequests.map((text, i) => (
            <Alert
              key={'u' + i}
              type="warning"
              showIcon
              message={'Cần vận hành xác nhận: ' + text}
            />
          ))}

          <Space wrap size={[6, 6]}>
            <Button size="small" loading={p.busy} onClick={() => void run('generate')}>
              Hoàn thiện mô tả
            </Button>
            <Button size="small" disabled={p.busy} onClick={() => void run('restart')}>
              Đánh giá lại
            </Button>
          </Space>

          {/* Section E & F: Description preview & explicit apply */}
          <AnimatePresence>
            {result.generatedDescription && (
              <motion.div
                className={`mission-description-preview is-mission-brief${applied ? ' is-applied' : ''}`}
                initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="mission-brief-header">
                  <label htmlFor="mission-description-preview">
                    Bản mô tả đề xuất
                  </label>
                  <span className="mission-brief-pill">Có thể chỉnh sửa trực tiếp</span>
                </div>
                <Input.TextArea
                  id="mission-description-preview"
                  value={preview}
                  onChange={(e) => setPreview(e.target.value)}
                  maxLength={2000}
                  autoSize={{ minRows: 3, maxRows: 6 }}
                />
                {result.unknownInformation.length > 0 && (
                  <Alert
                    type="warning"
                    showIcon
                    message="Còn thiếu thông tin quan trọng phía trên."
                  />
                )}
                <div>
                  <Button
                    type="primary"
                    size="small"
                    disabled={
                      p.busy ||
                      !preview.trim() ||
                      result.unknownInformation.length > 0 ||
                      result.contradictions.length > 0
                    }
                    onClick={() => {
                      p.onApply(preview.trim())
                      setApplied(true)
                      p.onRobotEvent?.('REQUIREMENT_CONFIRMED')
                    }}
                  >
                    Áp dụng mô tả này
                  </Button>
                </div>
                {applied && (
                  <Alert
                    type="success"
                    showIcon
                    message="Đã áp dụng vào yêu cầu."
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mission-description-meta-disclosures">
            <details>
              <summary>Đã ghi nhận ({result.statements.length})</summary>
              {result.statements.map((statement, i) => (
                <p key={i}>
                  {i + 1}. {statement}
                </p>
              ))}
            </details>
            {result.sourceReferences.length > 0 && (
              <details>
                <summary>Tham khảo ({result.sourceReferences.length})</summary>
                {result.sourceReferences.map((ref, i) => (
                  <p key={ref.sourceId + i}>
                    <strong>{ref.sourceId}:</strong> {ref.excerpt}
                  </p>
                ))}
              </details>
            )}
          </div>
        </>
      )}
    </section>
  )
}
