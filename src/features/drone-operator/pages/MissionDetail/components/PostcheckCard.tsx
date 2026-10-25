import type { PostflightCheckStatus } from '../types'
import {
  postflightFaultLabel,
  postflightNoteLabel,
  formatCheckedAt,
  formatNumber,
  inspectionLabel,
} from '../missionFormat'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { PostMetric } from './PostMetric'
import {
  viCheckName,
  viCheckMessage,
} from '../../../../../shared/lib/checkText'

// ─── Postcheck card ───────────────────────────────────────────────────────────

export function PostcheckCard({
  postflight,
}: {
  postflight: PostflightCheckStatus | null
}) {
  const issueText = postflightFaultLabel(postflight?.faultType)
  const noteText = postflightNoteLabel(postflight?.notes)
  const itemChecks =
    postflight?.items?.filter((item) => item.checkName || item.checkType) ?? []
  const checks: Array<[string, boolean | null | undefined]> = [
    ['Thân vỏ', postflight?.physicalConditionOk],
    ['Động cơ', postflight?.motorOk],
    ['Pin', postflight?.batteryOk],
    ['Camera', postflight?.cameraOk],
    ['Định vị', postflight?.gpsOk],
    ['Kết nối', postflight?.communicationOk],
  ]

  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span style={{ fontWeight: 700 }}>Kết quả postcheck</span>
        <StatusBadge
          tone={postflight ? (postflight.overallOk ? 'green' : 'red') : 'gray'}
        >
          {postflight
            ? postflight.overallOk
              ? 'Đạt'
              : 'Cần bảo trì'
            : 'Chưa postcheck'}
        </StatusBadge>
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        {postflight ? (
          <>
            {/* Telemetry metrics 2×2 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 7,
                marginBottom: 10,
              }}
            >
              <PostMetric
                label="Kiểm tra lúc"
                value={formatCheckedAt(postflight.checkedAt)}
              />
              <PostMetric
                label="Độ cao"
                value={formatNumber(postflight.landingAltitudeM, ' m')}
              />
              <PostMetric
                label="Pin hạ cánh"
                value={formatNumber(postflight.landingBatteryPercent, '%')}
              />
              <PostMetric
                label="Tốc độ"
                value={formatNumber(postflight.landingSpeedMps, ' m/s')}
              />
              {postflight.landingTelemetryOnline != null && (
                <PostMetric
                  label="Telemetry"
                  value={
                    postflight.landingTelemetryOnline
                      ? 'Trực tuyến'
                      : 'Mất kết nối'
                  }
                />
              )}
              {postflight.landingHeadingDeg != null && (
                <PostMetric
                  label="Heading"
                  value={formatNumber(postflight.landingHeadingDeg, '°', 0)}
                />
              )}
            </div>

            {itemChecks.length > 0 ? (
              <div
                style={{
                  border: '1px solid var(--bd)',
                  borderRadius: 7,
                  overflow: 'hidden',
                }}
              >
                {itemChecks.map((item, idx) => {
                  const isFail = item.status === 'FAIL'
                  const isWarn = item.status === 'WARN'
                  return (
                    <div
                      key={item.id ?? `${item.checkType}-${idx}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '18px 1fr auto',
                        gap: 6,
                        alignItems: 'center',
                        padding: '7px 10px',
                        borderBottom:
                          idx < itemChecks.length - 1
                            ? '1px solid var(--bd)'
                            : 'none',
                        background: isFail ? 'var(--red-bg)' : '#fff',
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          color: isFail
                            ? 'var(--red-fg)'
                            : isWarn
                              ? 'var(--yellow-fg)'
                              : 'var(--green-fg)',
                          fontSize: 13,
                        }}
                      >
                        {isFail ? '✗' : isWarn ? '!' : '✓'}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: isFail ? 'var(--red-fg)' : 'var(--tx)',
                          }}
                        >
                          {viCheckName(item.checkName ?? item.checkType)}
                        </div>
                        {item.message && (
                          <div
                            style={{
                              fontSize: 11,
                              color: isFail ? 'var(--red-fg)' : 'var(--tx3)',
                              marginTop: 1,
                              lineHeight: 1.35,
                            }}
                          >
                            {viCheckMessage(item.message)}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 11.5,
                          color: isFail
                            ? 'var(--red-fg)'
                            : isWarn
                              ? 'var(--yellow-fg)'
                              : 'var(--green-fg)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {inspectionLabel(item.status)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 5,
                }}
              >
                {checks.map(([label, value]) => (
                  <div
                    key={String(label)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 8px',
                      borderRadius: 7,
                      border: '1px solid var(--bd)',
                      background:
                        value === false ? 'var(--red-bg)' : 'var(--sf2)',
                      fontSize: 11.5,
                    }}
                  >
                    <span style={{ color: 'var(--tx3)' }}>{label}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          value === false ? 'var(--red-fg)' : 'var(--green-fg)',
                      }}
                    >
                      {value === true ? '✓' : value === false ? '✗' : '—'}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {(issueText || noteText) && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 10px',
                  borderRadius: 7,
                  border: `1px solid ${postflight.overallOk ? 'var(--bd)' : 'var(--red-dot)'}`,
                  background: postflight.overallOk
                    ? 'var(--sf2)'
                    : 'var(--red-bg)',
                  color: postflight.overallOk ? 'var(--tx2)' : 'var(--red-fg)',
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                {issueText && (
                  <div style={{ fontWeight: 700 }}>{issueText}</div>
                )}
                {noteText && (
                  <div style={{ marginTop: issueText ? 3 : 0 }}>{noteText}</div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
            Chưa có kết quả postcheck cho mission này.
          </div>
        )}
      </div>
    </div>
  )
}
