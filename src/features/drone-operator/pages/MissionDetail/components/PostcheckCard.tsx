import { ToolOutlined } from '@ant-design/icons'
import { Alert } from 'antd'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { CheckGlyph, checkTone } from '../../../components/common/CheckGlyph'
import { missionDetailViewMessages } from '../missionDetailView.messages'
import {
  formatCheckedAt,
  formatNumber,
  inspectionLabel,
  postflightFaultLabel,
  postflightNoteLabel,
} from '../missionFormat'
import type { PostflightCheckStatus } from '../types'
import {
  viCheckMessage,
  viCheckName,
} from '../../../../../shared/lib/checkText'

export function PostcheckCard({
  postflight,
}: {
  postflight: PostflightCheckStatus | null
}) {
  const { t, lang } = useI18n(missionDetailViewMessages)
  const issueText = postflightFaultLabel(postflight?.faultType, lang)
  const noteText = postflightNoteLabel(postflight?.notes)
  const itemChecks =
    postflight?.items?.filter((item) => item.checkName || item.checkType) ?? []
  const checks: Array<[string, boolean | null | undefined]> = [
    [t.partHull, postflight?.physicalConditionOk],
    [t.partMotor, postflight?.motorOk],
    [t.partBattery, postflight?.batteryOk],
    [t.partCamera, postflight?.cameraOk],
    [t.partGps, postflight?.gpsOk],
    [t.partComms, postflight?.communicationOk],
  ]
  const metrics = postflight
    ? [
        {
          label: t.checkedAt,
          value: formatCheckedAt(postflight.checkedAt, lang),
        },
        {
          label: t.altitude,
          value: formatNumber(postflight.landingAltitudeM, ' m'),
        },
        {
          label: t.landingBattery,
          value: formatNumber(postflight.landingBatteryPercent, '%'),
        },
        {
          label: t.speed,
          value: formatNumber(postflight.landingSpeedMps, ' m/s'),
        },
        ...(postflight.landingTelemetryOnline != null
          ? [
              {
                label: t.telemetry,
                value: postflight.landingTelemetryOnline ? t.online : t.offline,
              },
            ]
          : []),
        ...(postflight.landingHeadingDeg != null
          ? [
              {
                label: t.heading,
                value: formatNumber(postflight.landingHeadingDeg, '°', 0),
              },
            ]
          : []),
      ]
    : []

  return (
    <CardComponent
      title={t.postcheckTitle}
      icon={<ToolOutlined />}
      tone="violet"
      extra={
        <StatusTag
          tone={
            postflight
              ? postflight.overallOk
                ? 'success'
                : 'danger'
              : 'neutral'
          }
        >
          {postflight
            ? postflight.overallOk
              ? t.postPass
              : t.postNeedsMaintenance
            : t.postNone}
        </StatusTag>
      }
    >
      {postflight ? (
        <div className="stf-stack-sm">
          <div className="stf-metric-grid">
            {metrics.map((m) => (
              <div className="stf-metric" key={m.label}>
                <div className="stf-metric-label">{m.label}</div>
                <div className="stf-metric-value">{m.value}</div>
              </div>
            ))}
          </div>

          {itemChecks.length > 0 ? (
            <div className="stf-checklist">
              {itemChecks.map((item, idx) => (
                <div
                  className="stf-check"
                  key={item.id ?? `${item.checkType}-${idx}`}
                >
                  <CheckGlyph tone={checkTone(item.status)} />
                  <div style={{ minWidth: 0 }}>
                    <div className="stf-check-name">
                      {lang === 'vi'
                        ? viCheckName(item.checkName ?? item.checkType)
                        : (item.checkName ?? item.checkType)}
                    </div>
                    {item.message && (
                      <div className="stf-check-msg">
                        {lang === 'vi'
                          ? viCheckMessage(item.message)
                          : item.message}
                      </div>
                    )}
                  </div>
                  <StatusTag tone={checkTone(item.status)}>
                    {inspectionLabel(item.status, lang)}
                  </StatusTag>
                </div>
              ))}
            </div>
          ) : (
            <div className="stf-metric-grid">
              {checks.map(([label, value]) => (
                <div
                  className="stf-metric stf-row"
                  key={label}
                  style={{ justifyContent: 'space-between' }}
                >
                  <span className="stf-metric-label">{label}</span>
                  <CheckGlyph
                    tone={
                      value === true
                        ? 'success'
                        : value === false
                          ? 'danger'
                          : 'neutral'
                    }
                  />
                </div>
              ))}
            </div>
          )}

          {(issueText || noteText) && (
            <Alert
              type={postflight.overallOk ? 'info' : 'error'}
              showIcon
              message={issueText ?? undefined}
              description={noteText || undefined}
            />
          )}
        </div>
      ) : (
        <div className="stf-muted">{t.noPostcheck}</div>
      )}
    </CardComponent>
  )
}
