import { ReloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'

import { CardComponent } from '../../../../shared/components/antd'
import { ErrorState, LoadingState } from '../../components/common/StateView'
import { EmptyState, PageHeader } from '../../components/common/ui'
import { useI18n } from '../../../../shared/i18n'
import { Pager } from '../../components/common/Pager'
import { MissionHistoryTable } from './components/MissionHistoryTable'
import { useMissionHistory } from './hooks/useMissionHistory'
import { missionHistoryPageMessages } from './MissionHistoryPage.messages'

/** Finished missions from `GET /api/customer/mission-history`. */
export function MissionHistoryPage() {
  const { t } = useI18n(missionHistoryPageMessages)
  const history = useMissionHistory()
  const failed = history.error !== undefined && !history.loading
  const data = failed ? undefined : history.data

  return (
    <div className="cus-page mh-page">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Button
            icon={<ReloadOutlined aria-hidden="true" aria-label={undefined} />}
            disabled={history.loading}
            onClick={history.reload}
          >
            {t.refresh}
          </Button>
        }
      />
      {history.loading && !data && <LoadingState />}
      {failed && (
        <ErrorState title={t.errorTitle} error={history.error} onRetry={history.reload} />
      )}
      {data && data.rows.length === 0 && (
        <CardComponent>
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        </CardComponent>
      )}
      {data && data.rows.length > 0 && (
        <CardComponent styles={{ body: { padding: 0 } }}>
          <MissionHistoryTable rows={data.rows} />
          <Pager
            page={data.page}
            totalPages={data.totalPages}
            totalItems={data.totalItems}
            unit={t.unit}
            onPage={history.setPage}
          />
        </CardComponent>
      )}
    </div>
  )
}
