import { Alert, Button, Progress } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { operatorHref } from '../../../routes'
import { preflightPageMessages } from '../PreflightPage.messages'
import type { PreflightItemDef } from './PreflightItem'

export function SummaryBanner({
  nOk,
  nTotal,
  progress,
  isReady,
  isFailed,
  failedItems,
  error,
  hasTriggered,
  triggering,
  onTrigger,
  onReady,
  missionId,
  backendPreflightMessage,
  backendPreflightRegistering,
}: {
  nOk: number
  nTotal: number
  progress: number
  isReady: boolean
  isFailed: boolean
  failedItems: PreflightItemDef[]
  error: string | null
  hasTriggered: boolean
  triggering: boolean
  onTrigger: () => void
  onReady?: () => void
  missionId: string
  backendPreflightMessage?: string | null
  backendPreflightRegistering?: boolean
}) {
  const { t } = useI18n(preflightPageMessages)
  const percent = nTotal > 0 ? Math.round((nOk / nTotal) * 100) : 0

  return (
    <CardComponent>
      <div className="stf-summary">
        <Progress
          type="circle"
          size={72}
          percent={percent}
          status={isFailed ? 'exception' : isReady ? 'success' : 'active'}
          format={() => (
            <span className="stf-mono">
              {nOk}/{nTotal}
            </span>
          )}
        />
        <div className="stf-summary-text">
          <div
            className="stf-muted"
            style={{ fontWeight: 600, fontSize: 12.5 }}
          >
            {t.itemsPassed}
          </div>
          {isReady ? (
            <Alert
              type="success"
              showIcon
              message={<strong>{t.passReady}</strong>}
              description={backendPreflightMessage || undefined}
            />
          ) : isFailed ? (
            <Alert
              type="error"
              showIcon
              message={
                <strong>
                  {t.failBlocked(
                    failedItems.map((item) => item.label).join(', '),
                  )}
                </strong>
              }
            />
          ) : (
            <Alert
              type={error ? 'error' : 'info'}
              showIcon
              message={
                error ??
                (hasTriggered
                  ? t.runningPrecheck(progress)
                  : t.pressTriggerHint)
              }
            />
          )}
        </div>
        <div className="stf-summary-action">
          {isReady ? (
            onReady ? (
              <Button
                type="primary"
                size="large"
                onClick={onReady}
                disabled={backendPreflightRegistering}
                loading={backendPreflightRegistering}
              >
                {backendPreflightRegistering
                  ? t.switchingToReady
                  : t.continueToHandover}
              </Button>
            ) : (
              <Button
                type="primary"
                size="large"
                href={operatorHref({ screen: 'missionDetail', missionId })}
              >
                {t.continueToHandover}
              </Button>
            )
          ) : isFailed ? (
            <Button
              danger
              type="primary"
              size="large"
              onClick={onTrigger}
              disabled={triggering}
              loading={triggering}
            >
              {triggering ? t.triggeringAgain : t.triggerAgain}
            </Button>
          ) : !hasTriggered || error ? (
            <Button
              type="primary"
              size="large"
              onClick={onTrigger}
              disabled={triggering}
              loading={triggering}
            >
              {triggering ? t.triggeringAgain : t.triggerPrecheck}
            </Button>
          ) : (
            <Button size="large" disabled>
              {t.continueToHandover}
            </Button>
          )}
        </div>
      </div>
    </CardComponent>
  )
}
