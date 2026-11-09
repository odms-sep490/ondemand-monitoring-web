import { Skeleton } from 'antd'

import type { ComponentProps } from 'react'

import { CardComponent, EmptyState as AntEmptyState } from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { stateViewMessages } from '../../../../shared/components/odm/StateView.messages'

export { ErrorState } from '../../../../shared/components/antd'

/** Empty block inside a card, for full-page empty states. */
export function EmptyState(props: ComponentProps<typeof AntEmptyState>) {
  return (
    <CardComponent>
      <AntEmptyState {...props} />
    </CardComponent>
  )
}

/** Card skeleton shown while a customer page loads (aria-busy for assistive tech). */
export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n(stateViewMessages)
  return (
    <CardComponent aria-busy="true" aria-live="polite">
      <Skeleton active paragraph={{ rows: 4 }} />
      <span className="odm-visually-hidden">{label ?? t.loading}</span>
    </CardComponent>
  )
}
