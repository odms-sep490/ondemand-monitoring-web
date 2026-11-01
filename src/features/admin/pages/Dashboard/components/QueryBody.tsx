import { Button, Skeleton } from 'antd'
import type { ReactNode } from 'react'

import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminDashboardPageMessages } from '../AdminDashboardPage.messages'

/** Renders one data source: skeleton, a small inline error, or the content. */
export function QueryBody<T>({
  query,
  rows = 3,
  children,
}: {
  query: UseApiQueryState<T>
  rows?: number
  children: (data: T) => ReactNode
}) {
  const { t } = useI18n(adminDashboardPageMessages)
  if (query.data !== undefined && !query.error)
    return <>{children(query.data)}</>
  if (query.error)
    return (
      <div className="adm-dash-error" role="alert">
        <span>{t.loadError}</span>
        <Button size="small" onClick={query.reload}>
          {t.retry}
        </Button>
      </div>
    )
  return (
    <div aria-busy="true">
      <Skeleton active paragraph={{ rows }} title={false} />
    </div>
  )
}
