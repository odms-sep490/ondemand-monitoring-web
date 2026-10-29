import { ArrowLeftOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { PageHeader, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionPermissions } from '../../../../mission/types/permissions'
import {
  missionHasSafeStop,
  missionMayTerminate,
  missionStopLabel,
} from '../../../../mission/lib/missionOperationalState'
import { operatorHref } from '../../../routes'
import type { OperatorMission } from '../../../types/mission'
import {
  GCS_CONNECTED_STATUSES,
  INSPECTION_MEDIA_STATUSES,
  STATUS_TONE,
} from '../missionConstants'
import { missionProgressBadge, missionStatusLabel } from '../missionFormat'
import { missionDetailViewMessages } from '../missionDetailView.messages'

export function MissionHeader({
  mission,
  access,
  submitting,
  onStartWorkflow,
}: {
  mission: OperatorMission
  access?: MissionPermissions
  submitting?: boolean
  onStartWorkflow?: () => void
}) {
  const { t, lang } = useI18n(missionDetailViewMessages)
  const hasAccepted = mission.myResponseStatus === 'ACCEPTED'
  const stopping = missionHasSafeStop(mission)
  const progressBadge = stopping
    ? null
    : missionProgressBadge(mission.backendStatus, lang)
  const backendStatus = mission.backendStatus ?? mission.status
  const canConnectGcs =
    !stopping &&
    access?.canOperatePayload === true &&
    backendStatus === 'SCHEDULED' &&
    !GCS_CONNECTED_STATUSES.has(backendStatus)
  const canRunPreflight =
    !stopping &&
    access?.canOperatePayload === true &&
    ['CONNECTED', 'PREFLIGHT_CHECKING', 'FAILED_PREFLIGHT'].includes(
      backendStatus,
    )
  const canHandleInspectionMedia =
    access?.canInspectDevice === true ||
    access?.canCompleteMission === true ||
    (access?.canUploadMedia === true &&
      INSPECTION_MEDIA_STATUSES.has(mission.backendStatus ?? ''))
  const showProgressBadge =
    progressBadge &&
    !(access?.canInspectDevice === true || access?.canUploadMedia === true)
  const uploadHref = operatorHref({ screen: 'upload', missionId: mission.id })
  const flightHref = operatorHref({ screen: 'flight', missionId: mission.id })

  return (
    <PageHeader
      crumb={
        <a href={operatorHref({ screen: 'missions' })}>
          <ArrowLeftOutlined /> {t.backToList}
        </a>
      }
      title={
        <span className="stf-mono">{mission.missionCode ?? mission.id}</span>
      }
      description={mission.serviceLabel || undefined}
      actions={
        <>
          {access?.canExecuteMonitoringChecklist === true &&
            !canHandleInspectionMedia && (
              <Button href={uploadHref}>{t.checklistAndData}</Button>
            )}
          {canRunPreflight && (
            <Button
              href={operatorHref({
                screen: 'preflight',
                missionId: mission.id,
              })}
            >
              {t.runPreflight}
            </Button>
          )}
          {access?.canMaintainDevice &&
            ['RETURNING', 'POSTFLIGHT_CHECKING'].includes(
              mission.backendStatus ?? '',
            ) && (
              <Button
                href={operatorHref({
                  screen: 'postflight',
                  missionId: mission.id,
                })}
              >
                {t.runPostflight}
              </Button>
            )}
          {canHandleInspectionMedia && (
            <Button href={uploadHref}>{t.openAcceptanceData}</Button>
          )}
          {stopping ? (
            missionMayTerminate(mission, access?.canTerminateFlight) ? (
              <Button danger type="primary" href={flightHref}>
                {t.stopFlight}
              </Button>
            ) : null
          ) : hasAccepted &&
            (backendStatus === 'READY' ||
              backendStatus === 'WAITING_OPERATOR_ACCEPTANCE') ? (
            access?.canStartMission ? (
              <Button
                type="primary"
                disabled={submitting}
                onClick={onStartWorkflow}
              >
                {submitting ? t.starting : t.startMission}
              </Button>
            ) : (
              <StatusTag tone="success">{t.accepted}</StatusTag>
            )
          ) : mission.status === 'PENDING' ? null : mission.backendStatus ===
              'READY_TO_FLY' && access?.canControlFlight ? (
            <Button type="primary" href={flightHref}>
              {t.openCockpit}
            </Button>
          ) : canConnectGcs ? (
            <Button
              type="primary"
              icon={<ThunderboltOutlined aria-hidden="true" />}
              href={operatorHref({ screen: 'connect', missionId: mission.id })}
            >
              {t.connectGcs}
            </Button>
          ) : mission.status === 'IN_FLIGHT' ? (
            <>
              {access?.canUploadMedia && (
                <Button href={uploadHref}>{t.reviewMedia}</Button>
              )}
              {access?.canControlFlight && (
                <Button type="primary" href={flightHref}>
                  {t.openCockpit}
                </Button>
              )}
            </>
          ) : null}
        </>
      }
    >
      <div className="stf-row" style={{ marginTop: 8 }}>
        <StatusTag tone={STATUS_TONE[mission.status]}>
          {missionStopLabel(mission) ??
            missionStatusLabel(mission.backendStatus ?? mission.status, lang)}
        </StatusTag>
        {showProgressBadge ? (
          <StatusTag tone={progressBadge.tone}>{progressBadge.label}</StatusTag>
        ) : null}
      </div>
    </PageHeader>
  )
}
