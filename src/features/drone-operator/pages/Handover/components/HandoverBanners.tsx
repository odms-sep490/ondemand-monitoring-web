import { useI18n } from '../../../../../shared/i18n'
import { handoverBannersMessages } from './HandoverBanners.messages'

export function RevokedBanner({ onReconfirm }: { onReconfirm: () => void }) {
  const { t } = useI18n(handoverBannersMessages)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'var(--red-bg)',
          color: 'var(--red-fg)',
          border: '1px solid var(--red-dot)',
        }}
      >
        <div>
          <span style={{ fontWeight: 700 }}>{t.revokedTitle}</span>{' '}
          {t.revokedBody}
        </div>
      </div>
      <div className="odm-card">
        <div
          className="odm-card-body"
          style={{
            padding: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{t.statusTitle}</div>
            <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
              {t.revokedNote}
            </div>
          </div>
          <span className="odm-badge odm-badge-red odm-badge-lg">
            <span className="odm-badge-dot" aria-hidden="true" />
            {t.revokedBadge}
          </span>
        </div>
      </div>
      <button type="button" className="odm-btn odm-btn-p" onClick={onReconfirm}>
        {t.reconfirm}
      </button>
    </div>
  )
}

export function ConfirmedBanner() {
  const { t } = useI18n(handoverBannersMessages)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'var(--green-bg)',
          color: 'var(--green-fg)',
          border: '1px solid var(--green-dot)',
        }}
      >
        <span>{t.confirmedText}</span>
      </div>
    </div>
  )
}
