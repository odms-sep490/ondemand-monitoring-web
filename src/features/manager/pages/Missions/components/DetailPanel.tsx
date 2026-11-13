import { Fragment, useState } from 'react'
import { Alert, Button, Form, Input, message, Progress, Select, Spin } from 'antd'
import { CloseOutlined, RightOutlined, SwapOutlined } from '@ant-design/icons'

import { CardComponent } from '../../../../../shared/components/antd'
import { formatOrderCode } from '../../../components/common/format'
import { MissionStatusTag } from '../../../components/common/MissionStatusTag'
import { OrderIcon } from '../../../components/common/OrderIcon'
import {
  initialsOf,
  groupStaffAssignments,
  STAFF_ROLE_LABELS,
  assignmentTone,
  STAFF_RESPONSE_LABELS,
} from '../../../components/common/missionDetailHelpers'
import { assignmentReadiness } from '../../../lib/assignmentReadiness'
import { managerHref } from '../../../routes'
import type {
  MissionCalendarItem,
  MissionDeviceAssignmentResponse,
} from '../../../types/missions'
import { formatScheduled, formatStaffSummary } from '../missionsHelpers'
import type { PageMessages } from '../missionsTypes'
import { missionsApi } from '../../../api/missionsApi'
import { droneApi } from '../../../../staff/api/droneApi'
import { operatorApi } from '../../../../staff/api/operatorApi'

type ReplacementOption = { value: string; label: string }
type ReplacementValues = { resourceId: string; reason: string }
type ReplacementTarget = {
  kind: 'DEVICE' | 'STAFF'
  targetId: string
}

function ResourceReplacementForm({
  title,
  t,
  options,
  loading,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  title: string
  t: PageMessages['assignments']
  options: ReplacementOption[]
  loading: boolean
  busy: boolean
  error: string
  onCancel: () => void
  onSubmit: (values: ReplacementValues) => void
}) {
  const [form] = Form.useForm<ReplacementValues>()

  return (
    <div className="odm-resource-replacement" aria-busy={loading || busy}>
      <strong className="odm-resource-replacement-title">{title}</strong>
      {error ? <Alert className="odm-resource-replacement-alert" type="error" showIcon message={error} /> : null}
      {loading ? (
        <div className="odm-resource-replacement-loading" role="status">
          <Spin size="small" />
        </div>
      ) : error ? null : options.length === 0 ? (
        <Alert className="odm-resource-replacement-alert" type="info" showIcon message={t.replacementEmpty} />
      ) : (
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item
            label={t.chooseResource}
            name="resourceId"
            rules={[{ required: true, message: t.resourceRequired }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder={t.chooseResource}
              options={options}
              disabled={busy}
            />
          </Form.Item>
          <Form.Item
            label={t.reason}
            name="reason"
            rules={[
              { required: true, whitespace: true, message: t.reasonRequired },
              { max: 500, message: t.reasonRequired },
            ]}
          >
            <Input.TextArea
              rows={2}
              maxLength={500}
              showCount
              placeholder={t.reasonPlaceholder}
              disabled={busy}
            />
          </Form.Item>
          <div className="odm-resource-replacement-actions">
            <Button onClick={onCancel} disabled={busy}>{t.replacementCancel}</Button>
            <Button type="primary" htmlType="submit" loading={busy}>
              {t.replacementSave}
            </Button>
          </div>
        </Form>
      )}
      {loading || error || options.length === 0 ? (
        <div className="odm-resource-replacement-actions">
          <Button onClick={onCancel} disabled={busy}>{t.replacementCancel}</Button>
        </div>
      ) : null}
    </div>
  )
}

export type DetailPanelProps = {
  mission: MissionCalendarItem
  onClose: () => void
  t: PageMessages
  locale: 'vi-VN' | 'en-US'
  onResourceChanged: () => void
}

function droneText(mission: MissionCalendarItem) {
  return mission.droneCode ? `${mission.droneCode}${mission.droneName ? ` ${mission.droneName}` : ''}` : '—'
}

export function DetailPanel({ mission, onClose, t, locale, onResourceChanged }: DetailPanelProps) {
  const [replacementTarget, setReplacementTarget] = useState<ReplacementTarget | null>(null)
  const [replacementOptions, setReplacementOptions] = useState<ReplacementOption[]>([])
  const [replacementLoading, setReplacementLoading] = useState(false)
  const [replacementBusy, setReplacementBusy] = useState(false)
  const [replacementError, setReplacementError] = useState('')
  const [cancelingReplacementRequestId, setCancelingReplacementRequestId] =
    useState<string | null>(null)
  const rows: Array<{ label: string; value: string }> = []
  if (mission.orderCode) rows.push({ label: t.fields.order, value: formatOrderCode(mission.orderCode) })
  if (mission.serviceLabel) rows.push({ label: t.fields.service, value: mission.serviceLabel })
  rows.push({
    label: t.fields.schedule,
    value: formatScheduled(mission.scheduledStartAt, mission.scheduledEndAt, locale),
  })
  if (mission.droneCode) rows.push({ label: t.fields.drone, value: droneText(mission) })
  if (mission.operatorName) rows.push({ label: t.fields.operator, value: mission.operatorName })
  if (mission.addressText) rows.push({ label: t.fields.address, value: mission.addressText })
  const staffAssignments = mission.staffAssignments ?? []
  const staffGroups = groupStaffAssignments(staffAssignments)
  const deviceAssignments = mission.deviceAssignments ?? []
  const hasAssignedResources = Boolean(mission.droneCode) || deviceAssignments.length > 0 || staffAssignments.length > 0
  const accepted = staffGroups.filter((item) => item.responseStatus === 'ACCEPTED').length
  const canReplaceResources =
    ['PENDING_CONFIRMATION', 'READY'].includes(mission.status)
  const canCancelReplacementRequest =
    ['PENDING_CONFIRMATION', 'READY'].includes(mission.status)

  async function openDeviceReplacement(assignment: MissionDeviceAssignmentResponse) {
    setReplacementTarget({ kind: 'DEVICE', targetId: assignment.id })
    setReplacementOptions([])
    setReplacementError('')
    setReplacementLoading(true)
    try {
      const devices = await droneApi.getAvailable(mission.id)
      const assignedIds = new Set(deviceAssignments
        .filter((item) => item.id !== assignment.id)
        .map((item) => item.deviceId))
      setReplacementOptions(devices
        .filter((device) => device.id !== assignment.deviceId && !assignedIds.has(device.id))
        .map((device) => ({ value: device.id, label: device.label })))
    } catch {
      setReplacementError(t.assignments.replacementLoadError)
    } finally {
      setReplacementLoading(false)
    }
  }

  async function openStaffReplacement(staffId: string) {
    setReplacementTarget({ kind: 'STAFF', targetId: staffId })
    setReplacementOptions([])
    setReplacementError('')
    setReplacementLoading(true)
    try {
      const staff = await operatorApi.getAvailable(mission.id)
      const replacedRoles = new Set(staffAssignments
        .filter((item) => item.staffId === staffId)
        .map((item) => item.assignedRole))
      const assignedStaffIds = new Set(staffAssignments
        .filter((item) => item.staffId !== staffId &&
          replacedRoles.has(item.assignedRole))
        .map((item) => item.staffId))
      setReplacementOptions(staff
        .filter((person) => person.id !== staffId && !assignedStaffIds.has(person.id))
        .map((person) => ({ value: person.id, label: `${person.fullName} (${person.email})` })))
    } catch {
      setReplacementError(t.assignments.replacementLoadError)
    } finally {
      setReplacementLoading(false)
    }
  }

  async function submitReplacement(values: ReplacementValues) {
    if (!replacementTarget) return
    setReplacementBusy(true)
    setReplacementError('')
    try {
      if (replacementTarget.kind === 'DEVICE') {
        await missionsApi.replaceDevice(
          mission.id,
          replacementTarget.targetId,
          values.resourceId,
          values.reason.trim(),
        )
      } else {
        await missionsApi.replaceStaff(
          mission.id,
          replacementTarget.targetId,
          values.resourceId,
          values.reason.trim(),
        )
      }
      setReplacementTarget(null)
      message.success(t.assignments.replacementSuccess)
      onResourceChanged()
    } catch (error) {
      setReplacementError(error instanceof Error ? error.message : t.assignments.replacementError)
    } finally {
      setReplacementBusy(false)
    }
  }

  async function cancelDeviceReplacementRequest(assignmentId: string) {
    setCancelingReplacementRequestId(assignmentId)
    try {
      await missionsApi.cancelDeviceReplacementRequest(mission.id, assignmentId)
      message.success(t.assignments.replacementRequestCancelled)
      onResourceChanged()
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : t.assignments.replacementRequestCancelError,
      )
    } finally {
      setCancelingReplacementRequestId(null)
    }
  }

  function closeReplacement() {
    if (replacementBusy) return
    setReplacementTarget(null)
    setReplacementOptions([])
    setReplacementError('')
  }

  function renderReplacementForm(targetId: string, title: string) {
    if (replacementTarget?.targetId !== targetId) return null
    return (
      <li className="odm-or-crew-replacement-item" key={`${targetId}-replacement-form`}>
        <ResourceReplacementForm
          key={targetId}
          title={title}
          t={t.assignments}
          options={replacementOptions}
          loading={replacementLoading}
          busy={replacementBusy}
          error={replacementError}
          onCancel={closeReplacement}
          onSubmit={submitReplacement}
        />
      </li>
    )
  }

  return (
    <aside className="mgr-detail-side mgr-missions-panel">
      <CardComponent
        title={<span className="mgr-card-title odm-mono">{mission.missionCode}</span>}
        extra={
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined aria-hidden="true" />}
            onClick={onClose}
            aria-label={t.close}
          />
        }
      >
        <div className="mgr-badge-row">
          <MissionStatusTag mission={mission} />
          {assignmentReadiness(mission).needsSetup ? (
            <Button
              type="primary"
              size="small"
              href={managerHref({ screen: 'missionSetup', missionId: mission.id })}
            >
              {t.dispatch}
            </Button>
          ) : null}
        </div>
        <dl className="mgr-kv">
          {rows.map((row) => (
            <div className="mgr-kv-row" key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardComponent>

      <CardComponent
        title={t.assignments.title}
        extra={
          staffGroups.length > 0 ? (
            <span className="odm-or-crew-count">{formatStaffSummary(staffAssignments)}</span>
          ) : undefined
        }
      >
        {staffGroups.length > 0 ? (
          <Progress
            percent={Math.round((accepted / staffGroups.length) * 100)}
            showInfo={false}
            size="small"
            aria-hidden="true"
          />
        ) : null}
        {hasAssignedResources ? (
          <ul className="odm-or-crew-list">
            {deviceAssignments.length > 0 ? deviceAssignments.map((assignment) => (
              <Fragment key={assignment.id}>
                <li className="odm-or-crew-item">
                  <span className="odm-or-crew-avatar is-device">
                    <OrderIcon name="drone" size={16} />
                  </span>
                  <span className="odm-or-crew-main">
                    <span className="odm-or-crew-role">{assignment.deviceRole === 'SUPPORT' ? t.assignments.deviceSupport : t.assignments.deviceMain}</span>
                    <strong>{assignment.deviceName ?? assignment.deviceCode ?? assignment.deviceSerialNumber ?? t.assignments.device}</strong>
                  </span>
                  {canReplaceResources && assignment.id ? (
                    <Button
                      type="link"
                      size="small"
                      disabled={replacementLoading || replacementBusy}
                      icon={<SwapOutlined aria-hidden="true" />}
                      onClick={() => void openDeviceReplacement(assignment)}
                      aria-label={`${t.assignments.replaceDevice}: ${assignment.deviceName ?? assignment.deviceCode ?? assignment.deviceId}`}
                    >
                      {t.assignments.replace}
                    </Button>
                  ) : null}
                </li>
                {assignment.replacementRequestedAt ? (
                  <li className="odm-or-crew-item" style={{ display: 'block' }}>
                    <Alert
                      type="warning"
                      showIcon
                      message={t.assignments.replacementRequested}
                      description={(
                        <div>
                          <div>
                            {t.assignments.replacementRequestReason}: {assignment.replacementRequestReason || '—'}
                          </div>
                          <div>
                            {t.assignments.replacementRequestedBy}:{' '}
                            {assignment.replacementRequestedBy
                              ? staffAssignments.find((staff) => staff.staffId === assignment.replacementRequestedBy)?.staffName
                                ?? assignment.replacementRequestedBy
                              : t.assignments.replacementRequesterFallback}
                          </div>
                        <div>{t.assignments.replacementRequestNote}</div>
                        {canCancelReplacementRequest ? (
                          <Button
                            type="link"
                            size="small"
                            danger
                            loading={cancelingReplacementRequestId === assignment.id}
                            disabled={replacementBusy || Boolean(cancelingReplacementRequestId)}
                            onClick={() => void cancelDeviceReplacementRequest(assignment.id)}
                          >
                            {t.assignments.cancelReplacementRequest}
                          </Button>
                        ) : null}
                        </div>
                      )}
                    />
                  </li>
                ) : null}
                {renderReplacementForm(assignment.id, t.assignments.replaceDevice)}
              </Fragment>
            )) : mission.droneCode ? (
              <li className="odm-or-crew-item">
                <span className="odm-or-crew-avatar is-device">
                  <OrderIcon name="drone" size={16} />
                </span>
                <span className="odm-or-crew-main">
                  <span className="odm-or-crew-role">{t.assignments.device}</span>
                  <strong>{droneText(mission)}</strong>
                </span>
              </li>
            ) : null}
            {staffGroups.map((group) => {
              const name = group.staffName ?? group.staffEmail ?? t.assignedStaffFallback
              return (
                <Fragment key={group.staffId}>
                  <li className="odm-or-crew-item">
                    <span className="odm-or-crew-avatar" aria-hidden="true">
                      {initialsOf(name)}
                    </span>
                    <span className="odm-or-crew-main">
                      <strong>{name}</strong>
                      {group.staffEmail && group.staffName ? <small>{group.staffEmail}</small> : null}
                      <span className="odm-or-crew-roles">
                        {group.assignments.map((assignment) => (
                          <span key={assignment.id}>{STAFF_ROLE_LABELS[assignment.assignedRole]}</span>
                        ))}
                      </span>
                    </span>
                    <span className={`odm-or-pill odm-or-pill-${assignmentTone(group.responseStatus)}`}>
                      {STAFF_RESPONSE_LABELS[group.responseStatus]}
                    </span>
                    {canReplaceResources ? (
                      <Button
                        type="link"
                        size="small"
                        disabled={replacementLoading || replacementBusy}
                        icon={<SwapOutlined aria-hidden="true" />}
                        onClick={() => void openStaffReplacement(group.staffId)}
                        aria-label={`${t.assignments.replaceStaff}: ${name}`}
                      >
                        {t.assignments.replace}
                      </Button>
                    ) : null}
                  </li>
                  {renderReplacementForm(group.staffId, t.assignments.replaceStaff)}
                </Fragment>
              )
            })}
          </ul>
        ) : (
          <Alert type="info" showIcon message={t.assignments.empty} />
        )}
      </CardComponent>

      <div className="mgr-actions">
        <Button type="primary" href={managerHref({ screen: 'missionDetail', missionId: mission.id })}>
          {t.viewDetail}
          <RightOutlined aria-hidden="true" />
        </Button>
        <Button href={managerHref({ screen: 'orderReview', orderId: mission.orderId })}>
          {t.openOrderPlan}
        </Button>
      </div>
    </aside>
  )
}
