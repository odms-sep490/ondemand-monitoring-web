import { CloseOutlined } from '@ant-design/icons'
import { Button, Checkbox, Input, Select } from 'antd'
import { useState } from 'react'
import type { MissionCalendarItem, MissionRescheduleReason } from '../../../types/missions'
import type { PageMessages } from '../scheduleTypes'
import { missionsApi } from '../../../api/missionsApi'
import { ApiError } from '../../../../../shared/api/httpClient'
import { CardComponent } from '../../../../../shared/components/antd'
import { MissionStatusTag } from '../../../components/common/MissionStatusTag'
import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { managerFeedbackMessages } from '../../../feedback.messages'
import { useToast } from '../../../../../shared/components/ui'

// ── ReschedulePanel ────────────────────────────────────────────────────────

export type ReschedulePanelProps = {
  mission: MissionCalendarItem
  onClose: () => void
  onRescheduled: (updated: MissionCalendarItem) => void
  t: PageMessages
  locale: 'vi-VN' | 'en-US'
}

function toLocalDateTimeInput(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function ReschedulePanel({
  mission,
  onClose,
  onRescheduled,
  t,
  locale,
}: ReschedulePanelProps) {
  const { t: fb } = useI18n(managerFeedbackMessages)
  const toast = useToast()
  const finished =
    mission.status === 'COMPLETED' ||
    mission.status === 'FAILED' ||
    mission.status === 'CANCELLED'
  const subtitle = mission.serviceLabel ?? mission.addressText

  const [reschedule, setReschedule] = useState(false)
  const [newStart, setNewStart] = useState(
    toLocalDateTimeInput(mission.scheduledStartAt),
  )
  const [newEnd, setNewEnd] = useState(
    toLocalDateTimeInput(mission.scheduledEndAt),
  )
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [reason, setReason] = useState<MissionRescheduleReason>('WEATHER_UNSAFE')
  const [note, setNote] = useState('')
  const [customerConfirmed, setCustomerConfirmed] = useState(false)

  const fallback = mission.orderWeatherFallback ?? 'CONTACT_CUSTOMER'
  const rescheduleBlocked = fallback === 'CANCEL_ORDER'
  const needsCustomerConfirmation = fallback === 'CONTACT_CUSTOMER'
  const runtimeStarted = Boolean(
    ['CONNECTED', 'PREFLIGHT_CHECKING', 'READY_TO_FLY', 'IN_FLIGHT', 'IN_PROGRESS', 'RETURNING', 'POSTFLIGHT_CHECKING', 'PENDING_REVIEW', 'COMPLETED', 'FAILED', 'CANCELLED']
      .includes(mission.status),
  )

  const handleSave = async () => {
    if (!newStart || !newEnd) {
      setSaveError(t.validationRequired)
      return
    }
    if (newStart >= newEnd) {
      setSaveError(t.validationOrder)
      return
    }
    if (needsCustomerConfirmation && !customerConfirmed) {
      setSaveError(t.customerConfirmationRequired)
      return
    }
    if (rescheduleBlocked) {
      setSaveError(t.cancelPolicyMessage)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const updated = await missionsApi.patchSchedule(mission.id, {
        scheduledStartAt: new Date(newStart).toISOString(),
        scheduledEndAt: new Date(newEnd).toISOString(),
        reason,
        note: note.trim() || undefined,
        customerConfirmed,
      })
      // Merge only the fields a reschedule changes; the response lacks
      // radiusM, mediaRequirements and flightPlan, so a full spread would wipe them.
      onRescheduled({
        ...mission,
        scheduledStartAt: updated.scheduledStartAt ?? mission.scheduledStartAt,
        scheduledEndAt: updated.scheduledEndAt ?? mission.scheduledEndAt,
        ...(updated.status ? { status: updated.status } : {}),
      })
      toast.success(fb.missionRescheduled)
    } catch (err) {
      const failure =
        err instanceof ApiError
          ? (err.message ?? t.rescheduleFailed)
          : t.unknownError
      setSaveError(failure)
      toast.error(failure)
    } finally {
      setSaving(false)
    }
  }

  const timeText = mission.scheduledStartAt
    ? `${new Date(mission.scheduledStartAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}${mission.scheduledEndAt ? ` → ${new Date(mission.scheduledEndAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}` : t.noEndTime}`
    : '—'
  const rows: Array<[string, string]> = [
    [
      t.drone,
      mission.droneCode
        ? `${mission.droneCode}${mission.droneName ? ` · ${mission.droneName}` : ''}`
        : t.notAssigned,
    ],
    [t.pilot, mission.operatorName ?? t.notAssigned],
    [t.schedule, timeText],
  ]
  if (mission.addressText) rows.push([t.location, mission.addressText])
  rows.push([
    t.customerWindow,
    `${mission.orderPreferredDateFrom ?? '—'} → ${mission.orderPreferredDateTo ?? '—'}${mission.orderPreferredTimeName ? ` · ${mission.orderPreferredTimeName}` : ''}`,
  ])
  rows.push([t.customerFallback, t.fallbackLabels[fallback]])

  return (
    <aside
      className="mgr-sched-panel"
      role="complementary"
      aria-label={t.missionDetail}
    >
      <CardComponent
        title={
          <span className="mgr-sched-panel-title">
            <span className="mgr-code">{mission.missionCode}</span>
            {subtitle ? <span className="mgr-sched-panel-sub">{subtitle}</span> : null}
          </span>
        }
        extra={
          <Button
            type="text"
            className="mgr-icon-btn"
            icon={<CloseOutlined aria-hidden="true" />}
            onClick={onClose}
            aria-label={t.closeDetail}
          />
        }
      >
        <div className="mgr-badge-row">
          <MissionStatusTag mission={mission} />
          {(mission.status === 'CREATED' ||
            mission.status === 'RESOURCE_ASSIGNING') && (
            <Button
              type="primary"
              size="small"
              href={managerHref({
                screen: 'missionDispatch',
                missionId: mission.id,
              })}
            >
              {t.assignResources}
            </Button>
          )}
        </div>
        <dl className="mgr-kv">
          {rows.map(([label, value]) => (
            <div className="mgr-kv-row" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </CardComponent>

      {mission.lastRescheduledAt ? (
        <CardComponent title={t.lastReschedule}>
          <div>
            {new Date(mission.lastRescheduledAt).toLocaleString(locale)}
            {mission.lastRescheduleReason
              ? ` · ${t.reasonLabels[mission.lastRescheduleReason]}`
              : ''}
          </div>
          {mission.lastRescheduleNote ? <div>{mission.lastRescheduleNote}</div> : null}
        </CardComponent>
      ) : null}

      {!finished && (rescheduleBlocked || runtimeStarted) ? (
        <div className="mgr-form-error" role="alert">
          {runtimeStarted ? t.runtimeStartedMessage : t.cancelPolicyMessage}
        </div>
      ) : null}

      {finished ? null : !reschedule ? (
        <Button
          block
          disabled={rescheduleBlocked || runtimeStarted}
          onClick={() => setReschedule(true)}
        >
          {t.reschedule}
        </Button>
      ) : (
        <CardComponent title={t.rescheduleTitle}>
          <div className="mgr-form">
            <label className="mgr-field">
              <span>{t.start}</span>
              <Input
                type="datetime-local"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
              />
            </label>
            <label className="mgr-field">
              <span>{t.end}</span>
              <Input
                type="datetime-local"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
              />
            </label>
            <label className="mgr-field">
              <span>{t.reason}</span>
              <Select
                value={reason}
                onChange={(value: MissionRescheduleReason) => setReason(value)}
                options={Object.entries(t.reasonLabels).map(([value, label]) => ({
                  value,
                  label,
                }))}
              />
            </label>
            <label className="mgr-field">
              <span>{t.note}</span>
              <Input.TextArea
                value={note}
                maxLength={1000}
                rows={3}
                onChange={(e) => setNote(e.target.value)}
              />
            </label>
            {needsCustomerConfirmation && (
              <Checkbox
                checked={customerConfirmed}
                onChange={(e) => setCustomerConfirmed(e.target.checked)}
              >
                {t.customerConfirmed}
              </Checkbox>
            )}
            {saveError && (
              <div className="mgr-form-error" role="alert">
                {saveError}
              </div>
            )}
            <div className="mgr-actions">
              <Button
                type="primary"
                loading={saving}
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? t.saving : t.save}
              </Button>
              <Button
                onClick={() => {
                  setReschedule(false)
                  setSaveError(null)
                }}
              >
                {t.cancel}
              </Button>
            </div>
          </div>
        </CardComponent>
      )}
    </aside>
  )
}
