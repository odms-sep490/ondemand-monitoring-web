import { lazy, Suspense } from 'react'
import { Alert, Button, Skeleton } from 'antd'

import { useAuthSession } from '../../../auth/hooks/useAuthSession'
import { operatorApi } from '../../../staff/api/operatorApi'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { missionsApi } from '../../api/missionsApi'
import { schedulePageMessages } from './SchedulePage.messages'
import '../../manager.css'
import '../../components/layout/mgrLayout.css'
import './schedule.scss'

const Office3DView = lazy(() =>
  import('./components/Office3DView').then((module) => ({
    default: module.Office3DView,
  })),
)

export function SchedulePage() {
  const { t, lang } = useI18n(schedulePageMessages)
  const { user } = useAuthSession()
  const staffQuery = useApiQuery(() => operatorApi.getAvailable(), [])
  const missionQuery = useApiQuery(
    (signal) => missionsApi.listMissions({ signal }),
    [],
  )

  const hasError = Boolean(staffQuery.error || missionQuery.error)
  const retry = () => {
    staffQuery.reload()
    missionQuery.reload()
  }

  return (
    <div className="mgr-view mgr-schedule mgr-office-page" aria-label={t.pageAriaLabel}>
      {hasError && (
        <Alert
          className="mgr-office-page-alert"
          type="warning"
          showIcon
          message={t.partialDataTitle}
          description={t.partialDataDescription}
          action={<Button onClick={retry}>{t.retry}</Button>}
        />
      )}

      <Suspense
        fallback={
          <div className="mgr-office-page-loading" aria-busy="true">
            <Skeleton active paragraph={{ rows: 8 }} />
          </div>
        }
      >
        <Office3DView
          staff={staffQuery.data ?? []}
          missions={missionQuery.data?.items ?? []}
          manager={
            user
              ? {
                  id: user.id,
                  fullName: user.fullName,
                  email: user.email,
                }
              : null
          }
          loading={staffQuery.loading || missionQuery.loading}
          lang={lang}
        />
      </Suspense>
    </div>
  )
}
