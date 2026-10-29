import { Spin } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { flightPageMessages } from '../FlightPage.messages'

export function FlightOpeningShell() {
  const { t } = useI18n(flightPageMessages)
  return (
    <main className="stf-flight-center" role="status">
      <Spin size="large" tip={t.opening}>
        <div style={{ padding: 40 }} />
      </Spin>
    </main>
  )
}
