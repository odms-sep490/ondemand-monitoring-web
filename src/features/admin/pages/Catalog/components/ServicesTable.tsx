import { useI18n } from '../../../../../shared/i18n'
import { StatusBadge } from '../../../../../shared/components/ui'
import { fmtDateTime } from '../../../lib/accountStatus'
import type { AdminService } from '../../../types/catalog'
import { ServiceRowActions } from './ServiceRowActions'
import { servicesTableMessages } from './ServicesTable.messages'
import { formatVnd } from '../../../../../shared/lib/formatVnd'

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
          <th>{t.service}</th>
          <th>{t.basePrice}</th>
          <th>{t.status}</th>
          <th>{t.updated}</th>
          <th className="adm-text-right">{t.actions}</th>
        </tr>
      </thead>
      <tbody>
        {items.map((s) => (
          <tr key={s.id}>
            <td>
              {s.imageUrl && (
                <img
                  className="adm-service-thumbnail"
                  src={s.imageUrl}
                  alt=""
                  loading="lazy"
                />
              )}
              <div className="adm-wrap adm-strong">{s.name}</div>
              {s.description && (
                <div className="adm-cell-email adm-wrap adm-service-description">
                  {s.description}
                </div>
              )}
            </td>
            <td className="adm-cell-mono adm-strong">{s.priceSource === 'UNPRICED' ? t.unpriced : formatVnd(s.defaultPrice ?? s.basePrice)}</td>
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
