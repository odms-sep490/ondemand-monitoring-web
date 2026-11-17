import { useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { getTicketSeverityLabel } from '../../../../../shared/lib/statusTone'
import { formatIssueType } from '../../../../manager/lib/ticketText'
import type { FaultType, MaintenanceSeverity } from '../../../types/mission'
import { maintenanceTicketDialogMessages } from './MaintenanceTicketDialog.messages'

const FAULT_TYPES: FaultType[] = [
  'MOTOR_VIBRATION',
  'SIGNAL_LOSS',
  'BATTERY_DEGRADED',
  'CAMERA_GIMBAL',
  'PHYSICAL_DAMAGE',
  'OTHER',
]

const SEVERITIES: MaintenanceSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

export function MaintenanceTicketDialog({
  droneCode,
  missionId,
  defaultIssueType,
  defaultDescription,
  submitting,
  onCancel,
  onConfirm,
}: {
  droneCode: string
  missionId: string
  defaultIssueType: FaultType
  defaultDescription: string
  submitting: boolean
  onCancel: () => void
  onConfirm: (
    issueType: FaultType,
    severity: MaintenanceSeverity,
    description: string,
  ) => void
}) {
  const [issueType, setIssueType] = useState<FaultType>(defaultIssueType)
  const [severity, setSeverity] = useState<MaintenanceSeverity>('MEDIUM')
  const [description, setDescription] = useState(defaultDescription)
  const { t, lang } = useI18n(maintenanceTicketDialogMessages)

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--ui-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        className="odm-card"
        style={{ width: 460, maxWidth: '92vw', padding: 0 }}
      >
        <div className="odm-card-body" style={{ padding: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
            {t.title}
          </h2>
          <div style={{ fontSize: 12, color: 'var(--tx3)', marginTop: 4 }}>
            {t.subtitle}
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 14,
            }}
          >
            <Field label={t.deviceId}>
              <input
                className="odm-input"
                value={droneCode}
                readOnly
                style={{ width: '100%' }}
              />
            </Field>
            <Field label={t.missionId}>
              <input
                className="odm-input"
                value={missionId}
                readOnly
                style={{ width: '100%' }}
              />
            </Field>
            <Field label={t.issueType}>
              <select
                className="odm-input"
                style={{ width: '100%' }}
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as FaultType)}
              >
                {FAULT_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {formatIssueType(f)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.severity}>
              <select
                className="odm-input"
                style={{ width: '100%' }}
                value={severity}
                onChange={(e) =>
                  setSeverity(e.target.value as MaintenanceSeverity)
                }
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {getTicketSeverityLabel(s, lang)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.description}>
              <textarea
                className="odm-input"
                rows={3}
                style={{ width: '100%', resize: 'vertical' }}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              marginTop: 18,
            }}
          >
            <button
              type="button"
              className="odm-btn"
              onClick={onCancel}
              disabled={submitting}
            >
              {t.cancel}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={() => onConfirm(issueType, severity, description)}
              disabled={submitting}
            >
              {submitting ? t.submitting : t.submit}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label style={{ display: 'block' }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--tx3)',
          display: 'block',
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  )
}
