import { ArrowRightOutlined } from '@ant-design/icons'
import { Button, Skeleton } from 'antd'

import { EmptyState } from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { displayLocalized, useI18n } from '../../../../shared/i18n'
import { AdminModal } from '../../components/common/AdminModal'
import { checklistsApi } from '../../api/checklistsApi'
import { adminHref } from '../../routes'
import { ChecklistLoadError } from './ChecklistUi'
import { checklistMessages } from './checklists.messages'

/** Services that currently use one checklist definition. */
export function ChecklistUsage({
  id,
  close,
}: {
  id: string
  close: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const query = useApiQuery(
    (signal) => checklistsApi.services(id, signal),
    [id],
  )
  return (
    <AdminModal
      title={t.usage}
      onClose={close}
      footer={<Button onClick={close}>{t.close}</Button>}
    >
      {query.loading && <Skeleton active aria-busy="true" />}
      {query.error !== undefined && (
        <ChecklistLoadError
          title={t.catalogLoadError}
          error={query.error}
          retry={query.reload}
        />
      )}
      {!query.loading && query.error === undefined && query.data && (
        <ul className="checklist-usage-list">
          {query.data.map((row) => (
            <li key={row.id}>
              <a
                href={adminHref({
                  screen: 'serviceChecklists',
                  serviceId: row.serviceId,
                })}
              >
                {displayLocalized(row.serviceName)}
                <ArrowRightOutlined aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}
      {query.data?.length === 0 && <EmptyState title={t.noneUsed} />}
    </AdminModal>
  )
}
