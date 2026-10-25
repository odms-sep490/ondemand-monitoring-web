import { FlightStepHeader } from '../../../components/common/FlightStepper'
import { Row } from './PostflightRow'
import { operatorHref } from '../../../routes'
import { postflightPageMessages } from '../PostflightPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { PostflightItemKey } from '../../../types/mission'

export function PostflightCompletedView({
  missionLabel,
  completed,
  deviceLabel,
  failItems,
}: {
  missionLabel: string
  completed: { overallOk: boolean; ticketCreated: boolean; droneStatus: string }
  deviceLabel: string
  failItems: PostflightItemKey[]
}) {
  const { t } = useI18n(postflightPageMessages)
  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title={t.completedStepTitle}
        missionId={missionLabel}
        active={6}
      />
      <div style={{ padding: '32px 24px', maxWidth: 680, margin: '0 auto' }}>
        <div
          style={{
            padding: '28px 24px',
            borderRadius: 16,
            background: completed.overallOk
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.15) 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.15) 100%)',
            border: `1.5px solid ${completed.overallOk ? 'var(--green-dot, #10b981)' : '#f59e0b'}`,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: completed.overallOk ? '#10b981' : '#f59e0b',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 26,
                fontWeight: 800,
                flex: 'none',
              }}
            >
              {completed.overallOk ? '✓' : '⚠️'}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
                {completed.overallOk ? t.successTitle : t.ticketCreatedTitle}
              </h3>
              <div
                className="odm-mono"
                style={{ fontSize: 13, color: 'var(--tx2)', marginTop: 4 }}
              >
                {t.missionCodeLabel} <b>{missionLabel}</b> · {t.deviceLabel}{' '}
                <b>{deviceLabel}</b>
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              padding: '16px 18px',
              borderRadius: 12,
              background: 'var(--sf, #fff)',
              border: '1px solid var(--bd, #e5e7eb)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <Row label={t.missionStatusLabel} value={t.missionStatusValue} />
            <Row
              label={t.physicalCheckLabel}
              value={
                completed.overallOk
                  ? t.physicalCheckAllPass
                  : t.physicalCheckSomeFail(failItems.length)
              }
            />
            <Row
              label={t.droneStatusLabel(deviceLabel)}
              value={
                completed.overallOk
                  ? t.droneStatusAvailable
                  : t.droneStatusMaintenance
              }
            />
            {completed.ticketCreated && (
              <Row
                label={t.maintenanceTicketLabel}
                value={t.maintenanceTicketValue}
              />
            )}
          </div>

          <div
            style={{
              marginTop: 24,
              display: 'flex',
              gap: 12,
              justifyContent: 'flex-end',
            }}
          >
            <a
              className="odm-btn odm-btn-ok"
              href={operatorHref({ screen: 'missions' })}
              style={{
                minWidth: 220,
                height: 42,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                borderRadius: 10,
              }}
            >
              {t.backToMissionList}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
