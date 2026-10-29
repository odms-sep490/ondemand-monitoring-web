import { Alert, Button } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { accountActionsCardMessages } from './AccountActionsCard.messages'

export function AccountActionsCard({
  inactive,
  loading,
  error,
  onDeactivate,
  onActivate,
}: {
  inactive: boolean
  loading: boolean
  error: string | null
  onDeactivate: () => void
  onActivate: () => void
}) {
  const { t } = useI18n(accountActionsCardMessages)

  return (
    <CardComponent title={t.actions}>
      <p className="adm-card-hint">{t.deactivateHint}</p>

      {error && <Alert type="error" showIcon role="alert" message={error} className="adm-modal-gap" />}

      <div className="adm-row">
        {!inactive && (
          <Button danger type="primary" loading={loading} onClick={onDeactivate}>
            {loading ? t.processing : t.deactivate}
          </Button>
        )}
        {inactive && (
          <Button type="primary" loading={loading} onClick={onActivate}>
            {loading ? t.processing : t.reactivate}
          </Button>
        )}
      </div>
    </CardComponent>
  )
}
