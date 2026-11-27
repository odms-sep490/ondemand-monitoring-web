import { Button, EmptyState } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { catalogToolbarMessages } from './Toolbar.messages'

export function CatalogNoResults({ reset }: { reset: () => void }) {
  const { t } = useI18n(catalogToolbarMessages)
  return (
    <div className="catalog-no-results">
      <EmptyState
        title={t.noMatches}
        description={t.noMatchesHint}
        action={<Button onClick={reset}>{t.clear}</Button>}
      />
    </div>
  )
}
