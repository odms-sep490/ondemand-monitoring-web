import type { MissionCalendarItem, MissionRescheduleReason } from '../../../types/missions'
import type { PageMessages } from '../scheduleTypes'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { useState } from 'react'
import { missionsApi } from '../../../api/missionsApi'
import { ApiError } from '../../../../../shared/api/httpClient'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { managerHref } from '../../../routes'

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
  const tone = missionStatusTone[mission.status] ?? 'gray'

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
        <dt>{t.customerWindow}</dt>
        <dd>
          {mission.orderPreferredDateFrom ?? '—'} → {mission.orderPreferredDateTo ?? '—'}
          {mission.orderPreferredTimeName ? ` · ${mission.orderPreferredTimeName}` : ''}
        </dd>
        <dt>{t.customerFallback}</dt>
        <dd>{t.fallbackLabels[fallback]}</dd>
      </dl>

      {mission.lastRescheduledAt && (
        <div className="odm-card" style={{ margin: '0 16px 12px', padding: 12, fontSize: 12 }}>
          <strong>{t.lastReschedule}</strong>
          <div style={{ marginTop: 4, color: 'var(--tx2)' }}>
            {new Date(mission.lastRescheduledAt).toLocaleString(locale)}
            {mission.lastRescheduleReason ? ` · ${t.reasonLabels[mission.lastRescheduleReason]}` : ''}
          </div>
          {mission.lastRescheduleNote && <div style={{ marginTop: 4 }}>{mission.lastRescheduleNote}</div>}
        </div>
      )}

      {(rescheduleBlocked || runtimeStarted) && (
        <div role="alert" style={{ margin: '0 16px 12px', padding: 10, borderRadius: 8, background: 'var(--yellow-bg)', color: 'var(--yellow-fg)', fontSize: 12 }}>
          {runtimeStarted ? t.runtimeStartedMessage : t.cancelPolicyMessage}
        </div>
      )}

      {/* Reschedule section */}
      {!reschedule ? (
        <div style={{ padding: '0 16px 16px' }}>
          <button
            type="button"
            className="odm-btn"
            disabled={rescheduleBlocked || runtimeStarted}
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
            {t.reason}
            <select className="odm-inp" value={reason} onChange={(event) => setReason(event.target.value as MissionRescheduleReason)} style={{ display: 'block', marginTop: 4, width: '100%' }}>
              {Object.entries(t.reasonLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
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
            {t.note}
            <textarea className="odm-inp" value={note} maxLength={1000} onChange={(event) => setNote(event.target.value)} style={{ display: 'block', marginTop: 4, width: '100%', minHeight: 70 }} />
          </label>
          {needsCustomerConfirmation && (
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
              <input type="checkbox" checked={customerConfirmed} onChange={(event) => setCustomerConfirmed(event.target.checked)} />
              <span>{t.customerConfirmed}</span>
            </label>
          )}
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
