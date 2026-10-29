import { Button, Input, Modal, Select } from 'antd'
import { useState, type ReactNode } from 'react'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
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
  const { t } = useI18n(maintenanceTicketDialogMessages)

  return (
    <Modal
      open
      centered
      width={480}
      title={t.title}
      getContainer={mgrPopupContainer}
      onCancel={submitting ? undefined : onCancel}
      footer={
        <>
          <Button onClick={onCancel} disabled={submitting}>
            {t.cancel}
          </Button>
          <Button
            type="primary"
            onClick={() => onConfirm(issueType, severity, description)}
            disabled={submitting}
            loading={submitting}
          >
            {submitting ? t.submitting : t.submit}
          </Button>
        </>
      }
    >
      <div className="stf-muted" style={{ fontSize: 12.5, marginBottom: 12 }}>
        {t.subtitle}
      </div>
      <div className="stf-stack-sm">
        <Field label="device_id">
          <Input value={droneCode} readOnly />
        </Field>
        <Field label="mission_id">
          <Input value={missionId} readOnly />
        </Field>
        <Field label="issue_type">
          <Select
            style={{ width: '100%' }}
            value={issueType}
            onChange={(value) => setIssueType(value)}
            options={FAULT_TYPES.map((value) => ({ value, label: value }))}
          />
        </Field>
        <Field label="severity">
          <Select
            style={{ width: '100%' }}
            value={severity}
            onChange={(value) => setSeverity(value)}
            options={SEVERITIES.map((value) => ({ value, label: value }))}
          />
        </Field>
        <Field label="description">
          <Input.TextArea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="stf-field">
      <span className="stf-field-label stf-mono">{label}</span>
      {children}
    </label>
  )
}
