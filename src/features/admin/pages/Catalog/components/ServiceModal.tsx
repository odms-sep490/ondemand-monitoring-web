import { useI18n } from '../../../../../shared/i18n'
import { catalogApi } from '../../../api/catalogApi'
import { mapService } from '../../../lib/catalogMappers'
import { EditLoader } from './EditLoader'
import { ServiceForm, type ServiceFormProps } from './ServiceForm'
import { serviceModalMessages } from './ServiceModal.messages'

export function ServiceModal({ service, onClose, onSaved }: ServiceFormProps) {
  const { t } = useI18n(serviceModalMessages)
  return (
    <EditLoader
      title={t.editTitle}
      onClose={onClose}
      load={
        service
          ? (signal) =>
              catalogApi.getService(service.id, signal).then(mapService)
          : undefined
      }
    >
      {(fresh) => (
        <ServiceForm
          service={fresh ?? service}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </EditLoader>
  )
}
