import { CheckCircleFilled, ClockCircleOutlined, EditOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import type { ServiceOption } from '../../../api/customerApi'
import type { ChecklistInput } from '../../../lib/checklist/types'
import { isValidCoverageArea } from '../../../lib/createOrder/coverageGeometry'
import type { FlightPurpose, FormState, Step } from '../../../lib/createOrder/types'
import { requestInfoPanelMessages } from './RequestInfoPanel.messages'

type Props = {
  form: FormState
  services: ServiceOption[]
  checklist: ChecklistInput[]
  checklistValid?: boolean
  preferredTimes?: Array<{ id: string; name: string }>
  activeStep: Step
  onEditStep: (step: Step) => void
  onReadyForReview?: () => void
  /** Highlight key pulsed when a flying data chip lands on this Draft row. */
  highlightedKey?: string | null
  /** Optional ref callback for RobotTargetRegistry. */
  panelRef?: (node: HTMLElement | null) => void
}

type DraftRow = {
  key: string
  step: Step
  label: string
  value: string
  confirmed: boolean
}

export function computeOrderDraftRows(
  form: FormState,
  services: ServiceOption[],
  checklist: ChecklistInput[],
  checklistValid: boolean | undefined,
  preferredTimes?: Array<{ id: string; name: string }>,
): DraftRow[] {
  const service = services.find((s) => s.id === form.serviceId)
  const purposeText =
    form.flightPurpose === 'OTHER'
      ? form.otherFlightPurpose.trim()
      : form.flightPurpose
        ? requestInfoPanelMessages.vi.flightPurposes[form.flightPurpose as FlightPurpose] ??
          form.flightPurpose
        : ''
  const hasLocation =
    form.locationStatus === 'confirmed' &&
    Boolean(form.locationConfirmedAt) &&
    isValidCoverageArea(form.coverageArea)
  const hasChecklist =
    Boolean(form.serviceId) && Boolean(checklistValid ?? checklist.length > 0)
  const hasSiteContact =
    Boolean(form.siteContactName.trim()) &&
    /^[+0-9 ().-]{8,20}$/.test(form.siteContactPhone.trim()) &&
    Boolean(form.accessNotes.trim()) &&
    Boolean(form.monitoringRelationship) &&
    form.monitoringAuthorizationConfirmed
  const hasSchedule = Boolean(
    form.preferredDateFrom && form.preferredDateTo && form.preferredTimeId,
  )
  const timeName = preferredTimes?.find((t) => t.id === form.preferredTimeId)?.name

  return [
    {
      key: 'service',
      step: 1,
      label: 'Dịch vụ',
      value: service?.name ?? 'Chưa chọn',
      confirmed: Boolean(service),
    },
    {
      key: 'purpose',
      step: 1,
      label: 'Mục đích bay',
      value: purposeText || 'Chưa chọn',
      confirmed: Boolean(purposeText),
    },
    {
      key: 'description',
      step: 1,
      label: 'Mô tả nhiệm vụ',
      value: form.description.trim()
        ? form.description.trim().slice(0, 72) +
          (form.description.trim().length > 72 ? '…' : '')
        : 'Chưa nhập',
      confirmed: Boolean(form.description.trim()),
    },
    {
      key: 'location',
      step: 2,
      label: 'Khu vực giám sát',
      value: hasLocation
        ? form.normalizedAddress || form.address || 'Đã xác nhận'
        : 'Chưa chọn',
      confirmed: hasLocation,
    },
    {
      key: 'checklist',
      step: 3,
      label: 'Checklist & sản phẩm',
      value: hasChecklist
        ? `${checklist.length} hạng mục`
        : 'Chưa chọn',
      confirmed: hasChecklist,
    },
    {
      key: 'contact',
      step: 4,
      label: 'Liên hệ & hiện trường',
      value: hasSiteContact
        ? `${form.siteContactName} · ${form.siteContactPhone}`
        : 'Chưa đủ',
      confirmed: hasSiteContact,
    },
    {
      key: 'schedule',
      step: 5,
      label: 'Lịch bay dự kiến',
      value: hasSchedule
        ? `${form.preferredDateFrom} → ${form.preferredDateTo}${timeName ? ` (${timeName})` : ''}`
        : 'Chưa chọn',
      confirmed: hasSchedule,
    },
  ]
}

export function AIOrderDraftSummary({
  form,
  services,
  checklist,
  checklistValid,
  preferredTimes,
  activeStep,
  onEditStep,
  onReadyForReview,
  highlightedKey,
  panelRef,
}: Props) {
  const reduceMotion = useReducedMotion()
  const [mobileOpen, setMobileOpen] = useState(false)
  const rows = computeOrderDraftRows(
    form,
    services,
    checklist,
    checklistValid,
    preferredTimes,
  )
  const confirmedCount = rows.filter((r) => r.confirmed).length
  const firstMissing = rows.find((r) => !r.confirmed)?.key
  const readyForReview = confirmedCount === rows.length
  const wasReady = useRef(readyForReview)
  useEffect(() => {
    if (readyForReview && !wasReady.current) onReadyForReview?.()
    wasReady.current = readyForReview
  }, [readyForReview, onReadyForReview])

  return (
    <aside
      ref={panelRef}
      className={`ai-draft-panel${mobileOpen ? ' is-mobile-open' : ''}${readyForReview ? ' is-ready' : ''}`}
      aria-label="Bản nháp yêu cầu trực tiếp"
    >
      <div className="ai-draft-header">
        <div>
          <strong>{readyForReview ? 'Sẵn sàng xem lại' : 'Bản nháp yêu cầu'}</strong>
          <span className="ai-draft-progress-text">
            {confirmedCount}/{rows.length} mục đã xong
          </span>
        </div>
        <Button
          size="small"
          className="ai-draft-mobile-toggle"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? 'Thu gọn' : 'Xem nháp'}
        </Button>
      </div>

      <ol className="ai-draft-milestones" aria-label="Tiến độ các mục bắt buộc">
        {rows.map((row) => (
          <li
            key={row.key}
            title={row.label}
            aria-label={`${row.label}: ${row.confirmed ? 'đã xác nhận' : 'chưa có'}`}
            className={`ai-draft-milestone${row.confirmed ? ' is-done' : ''}${row.key === firstMissing ? ' is-current' : ''}`}
          >
            {row.confirmed && (
              <motion.span
                key="done"
                className="ai-draft-milestone-glow"
                initial={reduceMotion ? false : { scale: 0.4, opacity: 0.9 }}
                animate={{ scale: 1.8, opacity: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            )}
          </li>
        ))}
      </ol>

      <ul className="ai-draft-list">
        {rows.map((row) => (
          <motion.li
            key={`${row.key}:${row.confirmed ? 'ok' : 'pending'}:${row.value}`}
            data-draft-key={row.key}
            className={`ai-draft-item${row.confirmed ? ' is-confirmed' : ' is-missing'}${
              row.step === activeStep ? ' is-active' : ''
            }${highlightedKey === row.key ? ' is-chip-landed' : ''}`}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            aria-label={`Mở và nghe hướng dẫn ${row.label}`}
            onClick={() => onEditStep(row.step)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onEditStep(row.step)
              }
            }}
            initial={
              reduceMotion ? false : { opacity: 0.75, backgroundColor: '#dbeafe' }
            }
            animate={{
              opacity: 1,
              backgroundColor: row.confirmed ? '#f8fbff' : '#ffffff',
            }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <div className="ai-draft-item-icon" aria-hidden="true">
              {row.confirmed ? (
                <CheckCircleFilled style={{ color: '#10b981' }} />
              ) : (
                <ClockCircleOutlined style={{ color: '#94a3b8' }} />
              )}
            </div>
            <div className="ai-draft-item-body">
              <span className="ai-draft-item-label">{row.label}</span>
              <span className="ai-draft-item-value">{row.value}</span>
            </div>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              aria-label={`Chỉnh sửa ${row.label}`}
              onClick={(e) => {
                e.stopPropagation()
                onEditStep(row.step)
              }}
            />
          </motion.li>
        ))}
      </ul>
    </aside>
  )
}
