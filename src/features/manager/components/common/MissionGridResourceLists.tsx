import { Fragment } from 'react'
import { Alert, Button, Form, Input, Select, Spin } from 'antd'
import { CloseOutlined, SwapOutlined } from '@ant-design/icons'

import type {
  MissionDeviceAssignmentResponse,
  MissionStaffAssignmentResponse,
} from '../../types/missions'
import {
  groupStaffAssignments,
  STAFF_ROLE_LABELS,
} from './missionDetailHelpers'
import { missionGridCardMessages } from './MissionGridCard.messages'

type Messages = (typeof missionGridCardMessages)['vi']
export type ReplacementOption = { value: string; label: string }
export type ReplacementValues = { resourceId: string; reason: string }
export type ReplacementFormState = {
  targetId: string
  options: ReplacementOption[]
  loading: boolean
  busy: boolean
  error: string
}

function ResourceReplacementForm({
  t,
  title,
  state,
  onCancel,
  onSubmit,
}: {
  t: Messages
  title: string
  state: ReplacementFormState
  onCancel: () => void
  onSubmit: (values: ReplacementValues) => void
}) {
  const [form] = Form.useForm<ReplacementValues>()

  return (
    <div className="odm-mcard-inline-form odm-mcard-replacement-form" aria-busy={state.loading || state.busy}>
      <div className="odm-mcard-inline-form-heading">
        <strong>{title}</strong>
      </div>
      {state.error ? <Alert type="error" showIcon message={state.error} /> : null}
      {state.loading ? (
        <div className="odm-mcard-replacement-loading" role="status"><Spin size="small" /></div>
      ) : state.options.length === 0 ? (
        state.error ? null : <Alert type="info" showIcon message={t.replacementEmpty} />
      ) : (
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item
            label={t.replacementResourceLabel}
            name="resourceId"
            rules={[{ required: true, message: t.replacementResourceRequired }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={t.replacementResourceLabel}
              options={state.options}
              disabled={state.busy}
            />
          </Form.Item>
          <Form.Item
            label={t.replacementReasonLabel}
            name="reason"
            rules={[{ required: true, whitespace: true, message: t.replacementReasonRequired }]}
          >
            <Input.TextArea
              rows={2}
              maxLength={500}
              showCount
              placeholder={t.replacementReasonPlaceholder}
              disabled={state.busy}
            />
          </Form.Item>
          <div className="odm-mcard-inline-actions">
            <Button onClick={onCancel} disabled={state.busy}>{t.cancel}</Button>
            <Button type="primary" htmlType="submit" loading={state.busy}>
              {t.replacementSave}
            </Button>
          </div>
        </Form>
      )}
      {state.loading || state.options.length === 0 ? (
        <div className="odm-mcard-inline-actions">
          <Button onClick={onCancel} disabled={state.busy}>{t.cancel}</Button>
        </div>
      ) : null}
    </div>
  )
}

export function MissionGridStaffList({
  t,
  staff,
  canRemove,
  canReplace,
  busy,
  replacement,
  onRemove,
  onReplace,
  onCancelReplacement,
  onSubmitReplacement,
}: {
  t: Messages
  staff: MissionStaffAssignmentResponse[]
  canRemove: boolean
  canReplace: boolean
  busy: boolean
  replacement: ReplacementFormState | null
  onRemove: (assignmentId: string) => void
  onReplace: (staffId: string) => void
  onCancelReplacement: () => void
  onSubmitReplacement: (values: ReplacementValues) => void
}) {
  const staffGroups = groupStaffAssignments(staff)
  return (
    <div className="odm-mcard-res-list">
      {staffGroups.length === 0 ? (
        <p className="odm-mission-meta odm-mcard-note">{t.staffEmpty}</p>
      ) : (
        staffGroups.map((group) => (
          <Fragment key={group.staffId}>
            <div className="odm-mcard-res-item odm-mcard-assignment-item">
              <div className="odm-mcard-assignment-heading">
                <strong>{group.staffName || group.staffEmail || t.staffUnnamed}</strong>
                {canReplace ? (
                  <Button
                    type="link"
                    size="small"
                    icon={<SwapOutlined aria-hidden="true" />}
                    onClick={() => onReplace(group.staffId)}
                    disabled={busy}
                    aria-label={`${t.replaceStaffTitle}: ${group.staffName || group.staffEmail || t.staffUnnamed}`}
                  >
                    {t.replaceResource}
                  </Button>
                ) : null}
              </div>
              <div className="odm-mcard-assignment-chips">
                {group.assignments.map((assignment) => (
                  <span className="odm-mcard-assignment-chip" key={assignment.id}>
                    <span>{STAFF_ROLE_LABELS[assignment.assignedRole] || assignment.assignedRole}</span>
                    {canRemove ? (
                      <button
                        type="button"
                        className="odm-mcard-res-remove"
                        title={t.staffRemoveTitle}
                        aria-label={`${t.staffRemoveTitle}: ${STAFF_ROLE_LABELS[assignment.assignedRole]}`}
                        onClick={() => onRemove(assignment.id)}
                        disabled={busy}
                      >
                        <CloseOutlined aria-hidden="true" />
                      </button>
                    ) : null}
                  </span>
                ))}
              </div>
            </div>
            {replacement?.targetId === group.staffId ? (
              <ResourceReplacementForm
                t={t}
                title={t.replaceStaffTitle}
                state={replacement}
                onCancel={onCancelReplacement}
                onSubmit={onSubmitReplacement}
              />
            ) : null}
          </Fragment>
        ))
      )}
    </div>
  )
}

export function MissionGridDeviceList({
  t,
  devices,
  canRemove,
  canReplace,
  busy,
  replacement,
  onRemove,
  onReplace,
  onCancelReplacement,
  onSubmitReplacement,
}: {
  t: Messages
  devices: MissionDeviceAssignmentResponse[]
  canRemove: boolean
  canReplace: boolean
  busy: boolean
  replacement: ReplacementFormState | null
  onRemove: (assignmentId: string) => void
  onReplace: (assignmentId: string, currentResourceId: string) => void
  onCancelReplacement: () => void
  onSubmitReplacement: (values: ReplacementValues) => void
}) {
  return (
    <div className="odm-mcard-res-list">
      {devices.length === 0 ? (
        <p className="odm-mission-meta odm-mcard-note">{t.deviceEmpty}</p>
      ) : (
        devices.map((dev, idx) => (
          <Fragment key={dev.id || `${dev.deviceId}-${idx}`}>
            <div className="odm-mcard-res-item">
              <div>
                <span className="odm-mcard-res-role">
                  {dev.deviceRole === 'SUPPORT'
                    ? t.deviceRoleShortSupport
                    : t.deviceRoleShortMain}
                  :
                </span>{' '}
                <strong>{dev.deviceName || dev.deviceCode || t.deviceFallback}</strong>
              </div>
              <div className="odm-mcard-resource-actions">
                {canReplace && dev.id ? (
                  <Button
                    type="link"
                    size="small"
                    icon={<SwapOutlined aria-hidden="true" />}
                    onClick={() => onReplace(dev.id, dev.deviceId)}
                    disabled={busy}
                    aria-label={`${t.replaceDeviceTitle}: ${dev.deviceName || dev.deviceCode || t.deviceFallback}`}
                  >
                    {t.replaceResource}
                  </Button>
                ) : null}
                {canRemove && (
                  <button
                    type="button"
                    className="odm-mcard-res-remove"
                    title={t.deviceRemoveTitle}
                    aria-label={t.deviceRemoveTitle}
                    onClick={() => onRemove(dev.id)}
                    disabled={busy}
                  >
                    <CloseOutlined aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
            {replacement?.targetId === dev.id ? (
              <ResourceReplacementForm
                t={t}
                title={t.replaceDeviceTitle}
                state={replacement}
                onCancel={onCancelReplacement}
                onSubmit={onSubmitReplacement}
              />
            ) : null}
          </Fragment>
        ))
      )}
    </div>
  )
}
