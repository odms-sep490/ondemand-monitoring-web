import { Skeleton } from 'antd'

import { CardComponent } from '../../../../shared/components/antd'
import { stateViewMessages } from '../../../../shared/components/odm/StateView.messages'
import { useI18n } from '../../../../shared/i18n'

/** Card-style loading placeholder (antd Skeleton) with an `aria-busy` live region. */
export function AdminLoading({ rows = 4 }: { rows?: number }) {
  const { t } = useI18n(stateViewMessages)
  return (
    <CardComponent>
      <div aria-busy="true" aria-live="polite">
        <Skeleton active paragraph={{ rows }} />
        <span className="odm-visually-hidden">{t.loading}</span>
      </div>
    </CardComponent>
  )
}
