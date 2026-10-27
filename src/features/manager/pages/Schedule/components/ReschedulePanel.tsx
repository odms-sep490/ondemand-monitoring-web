import { CloseOutlined } from '@ant-design/icons'
import type { MissionCalendarItem } from '../../../types/missions'
import type { PageMessages } from '../scheduleTypes'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { useState } from 'react'
import { missionsApi } from '../../../api/missionsApi'
import { planningApi } from '../../../api/planningApi'
import { ApiError } from '../../../../../shared/api/httpClient'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { managerFeedbackMessages } from '../../../feedback.messages'
import { Button, Card, useToast } from '../../../../../shared/components/ui'

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
  const tone = missionStatusTone[mission.status] ?? 'gray'

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
      <Card
        title={
          <span className="mgr-sched-panel-title">
            <span className="odm-mono mgr-muted">{mission.missionCode}</span>
            <span>{mission.serviceLabel ?? mission.addressText ?? '—'}</span>
          </span>
        }
        actions={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label={t.closeDetail}
          >
            <CloseOutlined aria-hidden="true" />
          </Button>
        }
      >
        <div className="mgr-badge-row">
          <StatusBadge kind="mission" status={mission.status} tone={tone} />
          {(mission.status === 'CREATED' ||
            mission.status === 'RESOURCE_ASSIGNING') && (
            <Button
              href={managerHref({
                screen: 'missionDispatch',
                missionId: mission.id,
              })}
              variant="primary"
              size="sm"
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
      </Card>

      {!reschedule ? (
        <Button type="button" onClick={() => setReschedule(true)}>
          {t.reschedule}
        </Button>
      ) : (
        <Card title={t.rescheduleTitle}>
          <div className="mgr-form">
            <label className="mgr-field">
              <span>{t.start}</span>
              <input
                type="datetime-local"
                className="mgr-input"
                value={newStart}
                onChange={(e) => setNewStart(e.target.value)}
              />
            </label>
            <label className="mgr-field">
              <span>{t.end}</span>
              <input
                type="datetime-local"
                className="mgr-input"
                value={newEnd}
                onChange={(e) => setNewEnd(e.target.value)}
              />
            </label>
            <label className="mgr-field">
              <span>{t.rescheduleReason}</span>
              <input
                type="text"
                className="mgr-input"
                value={reason}
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
                type="button"
                variant="primary"
                disabled={saving}
                onClick={handleSave}
              >
                {saving ? t.saving : t.save}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setReschedule(false)
                  setSaveError(null)
                }}
              >
                {t.cancel}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </aside>
  )
}
