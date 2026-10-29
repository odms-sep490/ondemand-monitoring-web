import { useEffect, type ReactNode } from 'react'
import { missionApi } from '../../../mission/api/missionApi'
import {
  mayPerformMissionAction,
  type MissionAction,
} from '../../../mission/types/permissions'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { Button, Result, Spin } from 'antd'
import { useI18n } from '../../../../shared/i18n'
import { missionActionGuardMessages } from './MissionActionGuard.messages'
import { operatorHref } from '../../routes'

export function MissionActionGuard({
  missionId,
  action,
  children,
}: {
  missionId?: string
  action: MissionAction
  children: ReactNode
}) {
  const { t } = useI18n(missionActionGuardMessages)
  const query = useApiQuery(
    () =>
      missionId
        ? missionApi.getPermissions(missionId)
        : Promise.reject(new Error('Select a mission first.')),
    [missionId, action],
  )
  const backHref = missionId
    ? operatorHref({ screen: 'missionDetail', missionId })
    : operatorHref({ screen: 'missions' })
  const pilotOnOperatorStep =
    query.data?.canControlFlight === true &&
    query.data?.canOperatePayload !== true &&
    (action === 'connect' || action === 'preflight' || action === 'handover')

  useEffect(() => {
    if (pilotOnOperatorStep && missionId) {
      window.location.hash = operatorHref({ screen: 'flight', missionId })
    }
  }, [missionId, pilotOnOperatorStep])

  if (query.loading)
    return (
      <GuardStateCard
        tone="info"
        eyebrow={t.checkingEyebrow}
        title={t.checkingTitle}
        description={t.checkingDesc}
        statusRole="status"
        loading
      />
    )
  if (
    query.error ||
    !query.data ||
    !mayPerformMissionAction(query.data, action)
  ) {
    if (pilotOnOperatorStep) {
      return (
        <GuardStateCard
          tone="info"
          eyebrow={t.readyEyebrow}
          title={t.readyTitle}
          description={t.readyDesc}
          statusRole="status"
          loading
        />
      )
    }
    const message =
      (query.error ? t.errorMessage : undefined) ??
      (pilotOnOperatorStep ? t.pilotMessage : t.deniedMessage)
    return (
      <GuardStateCard
        tone="warning"
        eyebrow={t.deniedEyebrow}
        title={t.deniedTitle}
        description={message}
        statusRole="alert"
        primaryAction={{
          label: pilotOnOperatorStep ? t.openCockpit : t.backToMission,
          href:
            pilotOnOperatorStep && missionId
              ? operatorHref({ screen: 'flight', missionId })
              : backHref,
        }}
        secondaryAction={{ label: t.retry, onClick: query.reload }}
      />
    )
  }
  return children
}

function GuardStateCard({
  tone,
  eyebrow,
  title,
  description,
  statusRole,
  loading,
  primaryAction,
  secondaryAction,
}: {
  tone: 'info' | 'warning'
  eyebrow: string
  title: string
  description: string
  statusRole: 'status' | 'alert'
  loading?: boolean
  primaryAction?: { label: string; href: string }
  secondaryAction?: { label: string; onClick: () => void }
}) {
  return (
    <section role={statusRole} className="stf-fill-center">
      <Result
        icon={loading ? <Spin size="large" /> : undefined}
        status={tone === 'warning' ? 'warning' : 'info'}
        subTitle={
          <>
            <div
              className="stf-muted"
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {eyebrow}
            </div>
            <div>{description}</div>
          </>
        }
        title={<h1 style={{ margin: 0, fontSize: 22 }}>{title}</h1>}
        extra={
          primaryAction || secondaryAction
            ? [
                secondaryAction && (
                  <Button key="secondary" onClick={secondaryAction.onClick}>
                    {secondaryAction.label}
                  </Button>
                ),
                primaryAction && (
                  <Button
                    key="primary"
                    type="primary"
                    href={primaryAction.href}
                  >
                    {primaryAction.label}
                  </Button>
                ),
              ]
            : undefined
        }
      />
    </section>
  )
}
