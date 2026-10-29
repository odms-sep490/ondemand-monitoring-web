import { Button, Result } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { operatorHref } from '../../../routes'
import { flightPageMessages } from '../FlightPage.messages'

export function FlightEmptyState({
  tone = 'info',
  title,
  message,
  primaryLabel,
  primaryHref = operatorHref({ screen: 'missions' }),
}: {
  tone?: 'info' | 'error' | 'loading'
  title: string
  message: string
  primaryLabel?: string
  primaryHref?: string
}) {
  const { t } = useI18n(flightPageMessages)
  const resolvedPrimaryLabel = primaryLabel ?? t.backToMissions

  return (
    <main className="stf-flight-center">
      <CardComponent className="stf-flight-card">
        <Result
          status={tone === 'error' ? 'error' : 'info'}
          title={<h1 style={{ margin: 0, fontSize: 24 }}>{title}</h1>}
          subTitle={message}
          extra={[
            <Button
              key="primary"
              type="primary"
              size="large"
              href={primaryHref}
            >
              {resolvedPrimaryLabel}
            </Button>,
            <Button
              key="preflight"
              size="large"
              href={operatorHref({ screen: 'preflight' })}
            >
              {t.throughPreflight}
            </Button>,
          ]}
        />
      </CardComponent>
    </main>
  )
}
