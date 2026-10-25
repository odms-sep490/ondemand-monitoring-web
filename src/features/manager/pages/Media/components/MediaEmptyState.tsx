import { StateView } from '../../../../../shared/components/odm/StateView'
import { mediaPageMessages } from '../MediaPage.messages'
import { useI18n } from '../../../../../shared/i18n'

export function MediaEmptyState() {
  const { t } = useI18n(mediaPageMessages)
  return (
    <div>
      <h1
        style={{
          margin: '0 0 16px',
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '-.01em',
        }}
      >
        {t.pageTitle}
      </h1>
      <StateView
        state="empty"
        title={t.emptyTitle}
        description={t.emptyDescription}
      />
    </div>
  )
}
