import {
  CardComponent,
  EmptyState,
  ErrorState,
} from '../../../../../shared/components/antd'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { AdminLoading } from '../../../components/common/AdminLoading'
import { WeightGroup } from './WeightGroup'
import { weightsPanelMessages } from './WeightsPanel.messages'

export function WeightsPanel() {
  const { t } = useI18n(weightsPanelMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.listWeights(signal),
    [],
  )

  if (loading && !data) return <AdminLoading />
  if (!data) return <ErrorState error={error} onRetry={reload} />
  if (data.items.length === 0)
    return (
      <CardComponent>
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      </CardComponent>
    )

  async function saveGroup(
    group: 'DRONE' | 'OPERATOR',
    weights: Array<{ key: string; value: number }>,
  ) {
    await adminApi.updateWeights({ group, weights })
    reload()
  }

  return (
    <div className="mgr-view">
      <WeightGroup
        group="DRONE"
        label={t.droneSuggestion}
        items={data.items.filter((w) => w.group === 'DRONE')}
        onSave={(w) => saveGroup('DRONE', w)}
      />
      <WeightGroup
        group="OPERATOR"
        label={t.pilotSuggestion}
        items={data.items.filter((w) => w.group === 'OPERATOR')}
        onSave={(w) => saveGroup('OPERATOR', w)}
      />
    </div>
  )
}
