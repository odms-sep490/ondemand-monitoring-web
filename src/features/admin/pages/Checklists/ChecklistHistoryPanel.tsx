import { useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { LoadingState } from '../../../../shared/components/odm/StateView'
import { EmptyState } from '../../../../shared/components/ui'
import { checklistsApi, type ChecklistAudit } from '../../api/checklistsApi'
import { checklistMessages } from './checklists.messages'
import { ChecklistLoadError, ChecklistPagination } from './ChecklistUi'

/** Who changed what and when, for one library checklist and its use in services. Newest first. */
export function ChecklistHistoryPanel({
  checklistId,
}: {
  checklistId: string
}) {
  const { t, lang } = useI18n(checklistMessages)
  const [page, setPage] = useState(0)
  const query = useApiQuery(
    (signal) => checklistsApi.audits({ checklistId, page }, signal),
    [checklistId, page],
  )
  const empty = (value: string | null) => value ?? t.historyValueEmpty
  return (
    <div className="checklist-dialog">
      {query.loading && <LoadingState />}
      {query.error !== undefined && (
        <ChecklistLoadError
          title={t.historyLoadError}
          error={query.error}
          retry={query.reload}
        />
      )}
      {!query.loading && query.error === undefined && query.data && (
        <>
          {query.data.items.length === 0 ? (
            <EmptyState title={t.historyEmpty} />
          ) : (
            <ol className="checklist-history">
              {query.data.items.map((entry: ChecklistAudit) => (
                <li key={entry.id}>
                  <div className="checklist-history-head">
                    <strong>{t.audit[entry.action] ?? entry.action}</strong>
                    {entry.serviceName && (
                      <span className="checklist-pricing-chip">
                        {t.historyFor}: {entry.serviceName}
                      </span>
                    )}
                  </div>
                  <div className="checklist-field-meta">
                    {new Date(entry.createdAt).toLocaleString(
                      lang === 'vi' ? 'vi-VN' : 'en-US',
                    )}
                    {entry.actorName
                      ? ` · ${t.historyBy} ${entry.actorName}`
                      : ''}
                  </div>
                  {entry.changes.length > 0 && (
                    <ul className="checklist-history-changes">
                      {entry.changes.map((change) => (
                        <li key={change.field}>
                          <span>{t.field[change.field] ?? change.field}</span>
                          <del>{empty(change.from)}</del>
                          <span aria-hidden="true">→</span>
                          <ins>{empty(change.to)}</ins>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          )}
          <ChecklistPagination
            page={page}
            totalPages={query.data.totalPages}
            first={query.data.first}
            last={query.data.last}
            change={setPage}
          />
        </>
      )}
    </div>
  )
}
