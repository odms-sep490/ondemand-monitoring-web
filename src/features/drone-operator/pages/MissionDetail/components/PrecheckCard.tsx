import type { RuntimePreflightStatus, WeatherPreflightStatus } from '../types'
import { useState } from 'react'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import {
  statusTone,
  preflightLabel,
  preflightMessageLabel,
  preflightCheckName,
  checkLabel,
} from '../missionFormat'
import { PrecheckWeatherResult } from './PrecheckWeatherResult'

// ─── Precheck card ────────────────────────────────────────────────────────────

export function PrecheckCard({
  preflight,
  weather,
}: {
  preflight: RuntimePreflightStatus | null
  weather: WeatherPreflightStatus | null
}) {
  const [expanded, setExpanded] = useState(false)
  const passCount =
    preflight?.checks.filter((c) => c.status === 'PASS' || c.status === 'WARN')
      .length ?? 0
  const failCount =
    preflight?.checks.filter((c) => c.status === 'FAIL').length ?? 0
  const PREVIEW_COUNT = 5
  const visibleChecks = preflight
    ? expanded
      ? preflight.checks
      : preflight.checks.slice(0, PREVIEW_COUNT)
    : []
  const hasMore = (preflight?.checks.length ?? 0) > PREVIEW_COUNT

  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <h2 className="mds-card-heading">Kết quả precheck</h2>
        <StatusBadge tone={statusTone(preflight?.status)}>
          {preflightLabel(preflight?.status)}
        </StatusBadge>
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        {preflight ? (
          <>
            {/* Meta rows */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11.5,
                color: 'var(--tx3)',
                marginBottom: 4,
              }}
            >
              <span># Mã check</span>
              <span
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 10.5,
                  color: 'var(--tx2)',
                  maxWidth: 170,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {preflight.checkId}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11.5,
                color: 'var(--tx3)',
                marginBottom: 10,
              }}
            >
              <span>Tiến độ</span>
              <span style={{ fontWeight: 600, color: 'var(--tx)' }}>
                {Math.round(preflight.progress)}% · {passCount} đạt
                {failCount ? ` · ${failCount} lỗi` : ''}
              </span>
            </div>

            <PrecheckWeatherResult weather={weather} />

            {/* Check items */}
            <div
              style={{
                border: '1px solid var(--bd)',
                borderRadius: 7,
                overflow: 'hidden',
              }}
            >
              {visibleChecks.map((item, idx) => {
                const message = preflightMessageLabel(item.message)
                return (
                  <div
                    key={`${item.key}-${idx}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '18px 1fr auto',
                      gap: 6,
                      alignItems: 'center',
                      padding: '7px 10px',
                      borderBottom:
                        idx < visibleChecks.length - 1
                          ? '1px solid var(--bd)'
                          : 'none',
                      background:
                        item.status === 'FAIL' ? 'var(--red-bg)' : '#fff',
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 800,
                        color:
                          item.status === 'FAIL'
                            ? 'var(--red-fg)'
                            : 'var(--green-fg)',
                        fontSize: 13,
                      }}
                    >
                      {item.status === 'FAIL'
                        ? '✗'
                        : item.status === 'PASS' || item.status === 'WARN'
                          ? '✓'
                          : '○'}
                    </span>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          color:
                            item.status === 'FAIL'
                              ? 'var(--red-fg)'
                              : 'var(--tx)',
                        }}
                      >
                        {preflightCheckName(item)}
                      </div>
                      {message && (
                        <div
                          style={{
                            fontSize: 11,
                            color:
                              item.status === 'FAIL'
                                ? 'var(--red-fg)'
                                : 'var(--tx3)',
                            marginTop: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: 140,
                          }}
                          title={message}
                        >
                          {message}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 11.5,
                        color:
                          item.status === 'FAIL'
                            ? 'var(--red-fg)'
                            : 'var(--green-fg)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {checkLabel(item.status)}
                    </span>
                  </div>
                )
              })}
            </div>

            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '5px 0',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--blue-dot)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {expanded
                  ? `Thu gọn ↑`
                  : `Xem chi tiết (${preflight.checks.length - PREVIEW_COUNT} thêm) ↓`}
              </button>
            )}
          </>
        ) : (
          <>
            <PrecheckWeatherResult weather={weather} />
            <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
              Chưa có dữ liệu precheck cho mission này.
            </div>
          </>
        )}
      </div>
    </div>
  )
}
