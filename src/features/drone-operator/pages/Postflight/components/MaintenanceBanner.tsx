import { postflightPageMessages } from '../PostflightPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { PostflightItemKey } from '../../../types/mission'
import type { Dispatch, SetStateAction } from 'react'

export function MaintenanceBanner({
  failItems,
  deviceLabel,
  setShowTicketDialog,
  ticketCreated,
}: {
  failItems: PostflightItemKey[]
  deviceLabel: string
  setShowTicketDialog: Dispatch<SetStateAction<boolean>>
  ticketCreated: boolean
}) {
  const { t } = useI18n(postflightPageMessages)
  return (
    <div
      style={{
        padding: '16px 20px',
        borderRadius: 14,
        background:
          'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.15) 100%)',
        border: '1.5px solid #f59e0b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: '#92400e' }}>
          {t.foundFailures(failItems.length)}
        </div>
        <div style={{ fontSize: 13, color: '#78350f', marginTop: 4 }}>
          {t.autoTicketNotePrefix} <b>{t.autoTicketNoteBold}</b>{' '}
          {t.autoTicketNoteMid} <b>{deviceLabel}</b> {t.autoTicketNoteSuffix}
        </div>
      </div>

      <button
        type="button"
        className="odm-btn"
        onClick={() => setShowTicketDialog(true)}
        style={{
          background: '#f59e0b',
          color: '#fff',
          fontWeight: 700,
          fontSize: 13,
          padding: '8px 16px',
          borderRadius: 8,
          border: 'none',
          flex: 'none',
          cursor: 'pointer',
        }}
      >
        {ticketCreated ? t.detailsAdded : t.addMaintenanceDetails}
      </button>
    </div>
  )
}
