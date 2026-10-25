import type { MissionCalendarItem } from '../../../types/missions'
import type { PageMessages } from '../scheduleTypes'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { useState } from 'react'
import { missionsApi } from '../../../api/missionsApi'
import { ApiError } from '../../../../../shared/api/httpClient'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { managerHref } from '../../../routes'
import { env } from '../../../../../config/env'

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
  const tone = missionStatusTone[mission.status] ?? 'gray'

  const [reschedule, setReschedule] = useState(false)
  const [newStart, setNewStart] = useState(
    mission.scheduledStartAt?.slice(0, 16) ?? '',
  )
  const [newEnd, setNewEnd] = useState(
    mission.scheduledEndAt?.slice(0, 16) ?? '',
  )
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
      const updated = await missionsApi.patchSchedule(mission.id, {
        scheduledStart: newStart + ':00+07:00',
        scheduledEnd: newEnd + ':00+07:00',
      })
      onRescheduled({ ...mission, ...updated })
    } catch (err) {
      if (err instanceof ApiError) {
        setSaveError(err.message ?? t.rescheduleFailed)
      } else {
        setSaveError(t.unknownError)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="odm-sched-panel"
      role="complementary"
      aria-label={t.missionDetail}
    >
      {/* Header */}
      <div className="odm-sched-panel-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 12,
              color: 'var(--tx3)',
            }}
          >
            {mission.missionCode}
          </div>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {mission.serviceLabel ?? mission.addressText ?? '—'}
          </div>
        </div>
        <button
          type="button"
          className="odm-btn"
          style={{ flex: 'none' }}
          onClick={onClose}
          aria-label={t.closeDetail}
        >
          ✕
        </button>
      </div>

      {/* Status badge + dispatch shortcut */}
      <div
        style={{
          padding: '8px 16px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
        }}
      >
        <StatusBadge kind="mission" status={mission.status} tone={tone} />
        {(mission.status === 'CREATED' ||
          mission.status === 'RESOURCE_ASSIGNING') && (
          <a
            href={managerHref({
              screen: 'missionDispatch',
              missionId: mission.id,
            })}
            className="odm-btn odm-btn-p odm-btn-sm"
          >
            {t.assignResources}
          </a>
        )}
      </div>

      {/* Mission info */}
      <dl className="odm-sched-panel-dl">
        <dt>{t.drone}</dt>
        <dd>
          {mission.droneCode
            ? `${mission.droneCode}${mission.droneName ? ` · ${mission.droneName}` : ''}`
            : t.notAssigned}
        </dd>
        <dt>{t.pilot}</dt>
        <dd>{mission.operatorName ?? t.notAssigned}</dd>
        <dt>{t.schedule}</dt>
        <dd>
          {mission.scheduledStartAt
            ? `${new Date(mission.scheduledStartAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}${mission.scheduledEndAt ? ` → ${new Date(mission.scheduledEndAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}` : t.noEndTime}`
            : '—'}
        </dd>
        {mission.addressText && (
          <>
            <dt>{t.location}</dt>
            <dd>{mission.addressText}</dd>
          </>
        )}
      </dl>

      {/* Reschedule section */}
      {!reschedule ? (
        <div style={{ padding: '0 16px 16px' }}>
          <button
            type="button"
            className="odm-btn"
            disabled={!env.useMockApi && import.meta.env.MODE !== 'test'}
            title={
              !env.useMockApi && import.meta.env.MODE !== 'test'
                ? t.backendNotSupported
                : undefined
            }
            onClick={() => setReschedule(true)}
          >
            {t.reschedule}
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: '0 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 600 }}>
            {t.rescheduleTitle}
          </div>
          <label style={{ fontSize: 12, color: 'var(--tx2)' }}>
            {t.start}
            <input
              type="datetime-local"
              className="odm-inp"
              value={newStart}
              onChange={(e) => setNewStart(e.target.value)}
              style={{ display: 'block', marginTop: 4, width: '100%' }}
            />
          </label>
          <label style={{ fontSize: 12, color: 'var(--tx2)' }}>
            {t.end}
            <input
              type="datetime-local"
              className="odm-inp"
              value={newEnd}
              onChange={(e) => setNewEnd(e.target.value)}
              style={{ display: 'block', marginTop: 4, width: '100%' }}
            />
          </label>
          {saveError && (
            <div
              style={{
                fontSize: 12,
                color: 'var(--red-fg)',
                background: 'var(--red-bg)',
                borderRadius: 6,
                padding: '6px 10px',
              }}
              role="alert"
            >
              {saveError}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? t.saving : t.save}
            </button>
            <button
              type="button"
              className="odm-btn"
              onClick={() => {
                setReschedule(false)
                setSaveError(null)
              }}
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
