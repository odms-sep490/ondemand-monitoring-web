import { CloseOutlined } from '@ant-design/icons'
import { Button, Input } from 'antd'
import { useState } from 'react'
import type { MissionCalendarItem } from '../../../types/missions'
import type { PageMessages } from '../scheduleTypes'
import { missionsApi } from '../../../api/missionsApi'
import { planningApi } from '../../../api/planningApi'
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
    mission.scheduledStartAt?.slice(0, 16) ?? '',
  )
  const [newEnd, setNewEnd] = useState(
    mission.scheduledEndAt?.slice(0, 16) ?? '',
  )
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!newStart || !newEnd) {
      setSaveError(t.validationRequired)
      return
    }
    if (newStart >= newEnd) {
      setSaveError(t.validationOrder)
      return
    }
    setSaving(true)
    setSaveError(null)
    try {
      const plan = await planningApi.getExecutionPlan(mission.orderId)
      const updated = await missionsApi.rescheduleMission(mission.id, {
        expectedPlanRevision: plan.revision,
        scheduledStartAt: newStart + ':00+07:00',
        scheduledEndAt: newEnd + ':00+07:00',
        ...(reason.trim() ? { rescheduleReason: reason.trim() } : {}),
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

      {finished ? null : !reschedule ? (
        <Button block onClick={() => setReschedule(true)}>
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
              <span>{t.rescheduleReason}</span>
              <Input
                type="text"
                value={reason}
                placeholder={t.rescheduleReasonPlaceholder}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
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
