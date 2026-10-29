import { Alert, Button } from 'antd'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { handoverBannersMessages } from './HandoverBanners.messages'

export function RevokedBanner({ onReconfirm }: { onReconfirm: () => void }) {
  const { t } = useI18n(handoverBannersMessages)
  return (
    <div className="stf-stack-sm">
      <Alert
        type="error"
        showIcon
        message={
          <>
            <strong>{t.revokedTitle}</strong> {t.revokedBody}
          </>
        }
      />
      <CardComponent>
        <div className="stf-row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{t.statusTitle}</div>
            <div className="stf-muted" style={{ fontSize: 12.5 }}>
              {t.revokedNote}
            </div>
          </div>
          <StatusTag tone="danger">{t.revokedBadge}</StatusTag>
        </div>
      </CardComponent>
      <Button type="primary" size="large" onClick={onReconfirm}>
        {t.reconfirm}
      </Button>
    </div>
  )
}

export function ConfirmedBanner() {
  const { t } = useI18n(handoverBannersMessages)
  return <Alert type="success" showIcon message={t.confirmedText} />
}
