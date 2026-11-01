import { ArrowLeftOutlined, CheckSquareOutlined } from '@ant-design/icons'
import { Button, Skeleton } from 'antd'

import {
  CardComponent,
  EmptyState,
  PageHeader,
} from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { catalogApi } from '../../api/catalogApi'
import { adminHref } from '../../routes'
import { ChecklistLoadError } from './ChecklistUi'
import { checklistMessages } from './checklists.messages'
import { ServiceTemplateEditor } from './ServiceTemplateEditor'

export function ServiceChecklistPage({ serviceId }: { serviceId?: string }) {
  const { t } = useI18n(checklistMessages)
  const services = useApiQuery((signal) => catalogApi.listServices(signal), [])
  const selected = serviceId ?? services.data?.[0]?.id
  return (
    <div className="mgr-view checklist-page">
      <PageHeader
        title={t.template}
        description={t.templateSubtitle}
        crumb={
          <a className="checklist-back" href={adminHref({ screen: 'catalog' })}>
            <ArrowLeftOutlined aria-hidden="true" aria-label={undefined} />{' '}
            {t.back}
          </a>
        }
        actions={
          <Button
            icon={
              <CheckSquareOutlined aria-hidden="true" aria-label={undefined} />
            }
            href={adminHref({ screen: 'checklists' })}
          >
            {t.catalog}
          </Button>
        }
      />
      {services.loading && (
        <CardComponent>
          <Skeleton active aria-busy="true" />
        </CardComponent>
      )}
      {services.error !== undefined && (
        <ChecklistLoadError
          title={t.loadError}
          error={services.error}
          retry={services.reload}
        />
      )}
      {!services.loading &&
        services.error === undefined &&
        services.data &&
        (selected ? (
          <ServiceTemplateEditor
            key={selected}
            serviceId={selected}
            services={services.data}
          />
        ) : (
          <CardComponent>
            <EmptyState title={t.noServices} />
          </CardComponent>
        ))}
    </div>
  )
}
