import type { ReactNode } from 'react'
import { Button } from '../../../../../shared/components/ui'
import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import { catalogToolbarMessages } from './Toolbar.messages'
import type { CatalogFilterControls, CatalogStatus } from './useCatalogFilter'

/** Row above a tab's table: optional badge on the left, create button right. */
export function Toolbar({
  badge,
  createLabel,
  onCreate,
  filters,
  total,
  visible,
  loading,
  onReload,
}: {
  badge?: ReactNode
  createLabel: string
  onCreate: () => void
  filters: CatalogFilterControls
  total?: number
  visible: number
  loading: boolean
  onReload: () => void
}) {
  const { t } = useI18n(catalogToolbarMessages)
  return (
    <>
      <div className="catalog-toolbar">
        <div className="catalog-filters">
          <label className="catalog-filter catalog-search">
            <span>{t.search}</span>
            <span className="catalog-search-input">
              <Icon name="search" width={17} height={17} aria-hidden="true" />
              <input
                type="search"
                value={filters.search}
                onChange={(e) => filters.setSearch(e.target.value)}
                placeholder={t.placeholder}
              />
            </span>
          </label>
          {filters.hasStatus && (
            <label className="catalog-filter">
              <span>{t.status}</span>
              <select
                value={filters.status}
                onChange={(e) =>
                  filters.setStatus(e.target.value as CatalogStatus)
                }
              >
                <option value="">{t.all}</option>
                <option value="active">{t.active}</option>
                <option value="inactive">{t.inactive}</option>
              </select>
            </label>
          )}
          <Button
            variant="ghost"
            icon="x"
            size="sm"
            onClick={filters.reset}
            disabled={!filters.filtered}
          >
            {t.clear}
          </Button>
        </div>
        <div className="catalog-toolbar-actions">
          <Button icon="activity" onClick={onReload} disabled={loading}>
            {t.refresh}
          </Button>
          <Button variant="primary" onClick={onCreate}>
            {createLabel}
          </Button>
        </div>
      </div>
      <div className="catalog-results-summary">
        <span role="status">
          {loading
            ? t.loading
            : total !== undefined
              ? t.results(visible, total)
              : ''}
        </span>
        {badge}
      </div>
    </>
  )
}
