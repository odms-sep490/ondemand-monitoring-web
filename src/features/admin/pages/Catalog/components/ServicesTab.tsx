import { useState } from 'react'

import {
  CardComponent,
  EmptyState,
  ErrorState,
} from '../../../../../shared/components/antd'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { catalogApi } from '../../../api/catalogApi'
import { AdminLoading } from '../../../components/common/AdminLoading'
import { mapService } from '../../../lib/catalogMappers'
import type { AdminService } from '../../../types/catalog'
import { DeleteConfirmModal } from './DeleteConfirmModal'
import { ServiceModal } from './ServiceModal'
import { ServicesTable } from './ServicesTable'
import { servicesTabMessages } from './ServicesTab.messages'
import { Toolbar } from './Toolbar'

type Dialog =
  | { type: 'form'; service?: AdminService }
  | { type: 'delete'; service: AdminService }
  | null

export function ServicesTab() {
  const { t } = useI18n(servicesTabMessages)
  const [dialog, setDialog] = useState<Dialog>(null)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => catalogApi.listServices(signal).then((r) => r.map(mapService)),
    [],
  )

  function done() {
    setDialog(null)
    reload()
  }

  return (
    <div className="mgr-view">
      <Toolbar createLabel={t.add} onCreate={() => setDialog({ type: 'form' })} />
      {loading && !data && <AdminLoading />}
      {!loading && (error !== undefined || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}
      {data && data.length === 0 && (
        <CardComponent>
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        </CardComponent>
      )}
      {data && data.length > 0 && (
        <CardComponent styles={{ body: { padding: 0 } }}>
          <ServicesTable
            items={data}
            onEdit={(service) => setDialog({ type: 'form', service })}
            onDelete={(service) => setDialog({ type: 'delete', service })}
          />
        </CardComponent>
      )}
      {dialog?.type === 'form' && (
        <ServiceModal service={dialog.service} onClose={() => setDialog(null)} onSaved={done} />
      )}
      {dialog?.type === 'delete' && (
        <DeleteConfirmModal
          title={t.deleteTitle}
          name={dialog.service.name}
          onConfirm={() => catalogApi.deleteService(dialog.service.id)}
          onClose={() => setDialog(null)}
          onDeleted={done}
        />
      )}
    </div>
  )
}
