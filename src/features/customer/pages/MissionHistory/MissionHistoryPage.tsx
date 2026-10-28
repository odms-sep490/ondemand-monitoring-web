import { ErrorState, LoadingState } from '../../components/common/StateView'
import { EmptyState, PageHeader, TableCard } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { Pager } from '../../components/common/Pager'
import { MissionHistoryTable } from './components/MissionHistoryTable'
import { useMissionHistory } from './hooks/useMissionHistory'
import './MissionHistory.css'
import { missionHistoryPageMessages } from './MissionHistoryPage.messages'

/** Finished missions from `GET /api/customer/mission-history`. */
export function MissionHistoryPage() {
  const { t } = useI18n(missionHistoryPageMessages)
  const history = useMissionHistory()
  const failed = history.error !== undefined && !history.loading
  const data = failed ? undefined : history.data

  return (
    <div className="mh-page">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            disabled={history.loading}
            onClick={history.reload}
          >
            {t.refresh}
          </button>
        }
      />
      {history.loading && !data && <LoadingState />}
      {failed && (
        <ErrorState title={t.errorTitle} error={history.error} onRetry={history.reload} />
      )}
      {data && data.rows.length === 0 && (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
      {data && data.rows.length > 0 && (
        <TableCard
          footer={
            <Pager
              page={data.page}
              totalPages={data.totalPages}
              totalItems={data.totalItems}
              unit={t.unit}
              onPage={history.setPage}
            />
          }
        >
          <MissionHistoryTable rows={data.rows} />
        </TableCard>
      )}
    </div>
  )
}
