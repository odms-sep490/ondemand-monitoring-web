import { SafetyCertificateOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { useState } from 'react'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { CheckGlyph, checkTone } from '../../../components/common/CheckGlyph'
import { KeyValueList } from '../../../components/common/KeyValueList'
import { missionDetailViewMessages } from '../missionDetailView.messages'
import {
  checkLabel,
  preflightCheckName,
  preflightLabel,
  preflightMessageLabel,
  statusTone,
} from '../missionFormat'
import type { RuntimePreflightStatus, WeatherPreflightStatus } from '../types'
import { PrecheckWeatherResult } from './PrecheckWeatherResult'

const PREVIEW_COUNT = 5

export function PrecheckCard({
  preflight,
  weather,
}: {
  preflight: RuntimePreflightStatus | null
  weather: WeatherPreflightStatus | null
}) {
  const { t, lang } = useI18n(missionDetailViewMessages)
  const [expanded, setExpanded] = useState(false)
  const passCount =
    preflight?.checks.filter((c) => c.status === 'PASS' || c.status === 'WARN')
      .length ?? 0
  const failCount =
    preflight?.checks.filter((c) => c.status === 'FAIL').length ?? 0
  const visibleChecks = preflight
    ? expanded
      ? preflight.checks
      : preflight.checks.slice(0, PREVIEW_COUNT)
    : []
  const hasMore = (preflight?.checks.length ?? 0) > PREVIEW_COUNT

  return (
    <CardComponent
      title={t.precheckTitle}
      icon={<SafetyCertificateOutlined />}
      tone="green"
      extra={
        <StatusTag tone={statusTone(preflight?.status)}>
          {preflightLabel(preflight?.status, lang)}
        </StatusTag>
      }
    >
      {preflight ? (
        <>
          <KeyValueList
            items={[
              {
                label: t.checkId,
                value: <span className="stf-mono">{preflight.checkId}</span>,
              },
              {
                label: t.progress,
                value: t.progressValue(
                  Math.round(preflight.progress),
                  passCount,
                  failCount,
                ),
              },
            ]}
          />
          <PrecheckWeatherResult weather={weather} />
          <div className="stf-checklist">
            {visibleChecks.map((item, idx) => {
              const message = preflightMessageLabel(item.message, lang)
              return (
                <div className="stf-check" key={`${item.key}-${idx}`}>
                  <CheckGlyph tone={checkTone(item.status)} />
                  <div style={{ minWidth: 0 }}>
                    <div className="stf-check-name">
                      {preflightCheckName(item, lang)}
                    </div>
                    {message && (
                      <div className="stf-check-msg" title={message}>
                        {message}
                      </div>
                    )}
                  </div>
                  <StatusTag tone={checkTone(item.status)}>
                    {checkLabel(item.status, lang)}
                  </StatusTag>
                </div>
              )
            })}
          </div>
          {hasMore && (
            <Button
              type="link"
              block
              style={{ marginTop: 6 }}
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded
                ? t.collapse
                : t.showMore(preflight.checks.length - PREVIEW_COUNT)}
            </Button>
          )}
        </>
      ) : (
        <>
          <PrecheckWeatherResult weather={weather} />
          <div className="stf-muted">{t.noPrecheck}</div>
        </>
      )}
    </CardComponent>
  )
}
