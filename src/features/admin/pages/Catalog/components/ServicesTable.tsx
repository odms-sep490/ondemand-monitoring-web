import { ImagePreview } from '../../../../../shared/components/media/ImagePreview'
import { useI18n } from '../../../../../shared/i18n'
import { StatusBadge } from '../../../../../shared/components/ui'
import { fmtDateTime } from '../../../lib/accountStatus'
import type { AdminService } from '../../../types/catalog'
import { ServiceRowActions } from './ServiceRowActions'
import { servicesTableMessages } from './ServicesTable.messages'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { Icon } from '../../../../../shared/components/Icon'

export function ServicesTable({
  items,
  onEdit,
  onDelete,
}: {
  items: AdminService[]
  onEdit: (s: AdminService) => void
  onDelete: (s: AdminService) => void
}) {
  const { t, lang } = useI18n(servicesTableMessages)
  return (
    <table className="odm-adm-table adm-services-table">
      <thead>
        <tr>
          <th scope="col">{t.service}</th>
          <th scope="col" className="adm-text-right">
            {t.defaultPrice}
          </th>
          <th scope="col">{t.status}</th>
          <th scope="col">{t.updated}</th>
          <th scope="col" className="adm-text-right">
            {t.actions}
          </th>
        </tr>
      </thead>
      <tbody>
        {items.map((s) => (
          <tr key={s.id}>
            <td>
              <div className="catalog-service-identity">
                {s.imageUrl ? (
                  <ImagePreview
                    className="adm-service-thumbnail"
                    src={s.imageUrl}
                    fileName={s.name}
                  />
                ) : (
                  <span
                    className="catalog-service-placeholder"
                    aria-hidden="true"
                  >
                    <Icon name="camera" width={22} height={22} />
                  </span>
                )}
                <div className="catalog-service-copy">
                  <div className="adm-wrap adm-strong">{s.name}</div>
                  {s.description && (
                    <div
                      className="adm-cell-email adm-wrap adm-service-description"
                      title={s.description}
                    >
                      {s.description}
                    </div>
                  )}
                </div>
              </div>
            </td>
            <td className="adm-cell-mono adm-strong adm-money-cell">
              {s.priceSource === 'UNPRICED' || s.defaultPrice == null
                ? t.unpriced
                : formatVnd(s.defaultPrice)}
            </td>
            <td>
              <StatusBadge tone={s.isActive ? 'success' : 'neutral'}>
                {s.isActive ? t.active : t.inactive}
              </StatusBadge>
            </td>
            <td className="adm-cell-mono">
              {s.updatedAt ? fmtDateTime(s.updatedAt, lang) : '—'}
            </td>
            <td>
              <ServiceRowActions
                service={s}
                edit={() => onEdit(s)}
                remove={() => onDelete(s)}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
