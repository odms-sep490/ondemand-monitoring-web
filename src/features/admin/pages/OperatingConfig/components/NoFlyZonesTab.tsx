import { useState } from 'react'

import { Button } from 'antd'

import {
  CardComponent,
  EmptyState,
  ErrorState,
} from '../../../../../shared/components/antd'
import { AdminLoading } from '../../../components/common/AdminLoading'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import type { NoFlyZone } from '../../../types/operatingConfig'
import { NoFlyZonesTable } from './NoFlyZonesTable'
import { noFlyZonesTabMessages } from './NoFlyZonesTab.messages'
import { ZoneModal } from './ZoneModal'

export function NoFlyZonesTab() {
  const { t } = useI18n(noFlyZonesTabMessages)
  const [dialog, setDialog] = useState<{ zone?: NoFlyZone } | null>(null)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listNoFlyZones(signal),
    [],
  )

  async function handleToggle(zone: NoFlyZone) {
    await adminApi.updateNoFlyZone(zone.id, { isActive: !zone.isActive })
    reload()
  }

  return (
    <div className="mgr-view">
      <div className="adm-toolbar">
        <span />
        <Button type="primary" onClick={() => setDialog({})}>
          {t.addZone}
        </Button>
      </div>
      {loading && !data && <AdminLoading />}
      {!loading && !data && <ErrorState error={error} onRetry={reload} />}
      {data && data.items.length === 0 && (
        <CardComponent>
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        </CardComponent>
      )}
      {data && data.items.length > 0 && (
        <CardComponent styles={{ body: { padding: 0 } }}>
          <NoFlyZonesTable
            items={data.items}
            onEdit={(zone) => setDialog({ zone })}
            onToggle={handleToggle}
          />
        </CardComponent>
      )}
      {dialog && (
        <ZoneModal
          zone={dialog.zone}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null)
            reload()
          }}
        />
      )}
    </div>
  )
}
