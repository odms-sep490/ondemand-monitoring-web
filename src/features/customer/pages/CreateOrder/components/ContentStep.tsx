import {
  CheckCircleFilled,
  PictureOutlined,
  UnorderedListOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'

import { Card } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type {
  ServiceOption,
  ServicePricingEstimate,
} from '../../../api/customerApi'
import type { ChecklistRow } from '../../../lib/checklist/types'
import { contentStepMessages } from './ContentStep.messages'
import { PricingEstimateCard } from './PricingEstimateCard'
import './ContentStep.css'
import { RequestServiceAssistant } from '../../../components/request-assistant/RequestServiceAssistant'
import type { CustomerQuoteSelection } from '../../../../../shared/api/checklistPricingApi'

type Props = {
  selected?: ServiceOption
  checklist: ReactNode
  selectedCount: number
  packageSelectedCount: number
  packageCount: number
  mediaTotals: { images: number; videos: number }
  additionalChecklists: ChecklistRow[]
  valid: boolean
  pricingEstimate: ServicePricingEstimate | null
  pricingLoading: boolean
  assistantSelection?: CustomerQuoteSelection | null
  onServiceCatalogChanged?: () => void
}

/** Edit requirements while summary and navigation remain available on all screens. */
export function ContentStep(p: Props) {
  const { t } = useI18n(contentStepMessages)
  const packageProgress = p.packageCount
    ? Math.min(100, Math.round((p.packageSelectedCount / p.packageCount) * 100))
    : 0

  return (
    <div className="co-content-shell">
      <div className="co-content-layout">
        <section className="co-content-editor" aria-label={t.editorTitle}>
          {p.checklist}
        </section>
        <div className="co-content-sidegroup">
          <aside
            className="co-summary co-content-aside"
            aria-label={t.summaryTitle}
          >
            <PricingEstimateCard
              checklistOnly
              estimate={p.pricingEstimate}
              loading={p.pricingLoading}
              hasService={Boolean(p.selected)}
              additionalChecklists={p.additionalChecklists}
            />
            <RequestServiceAssistant
              key={JSON.stringify(p.assistantSelection)}
              selection={p.assistantSelection ?? null}
              onSelectionInvalid={p.onServiceCatalogChanged}
            />
          </aside>
          <Card
            className="co-content-overview-card"
            icon={<UnorderedListOutlined aria-hidden="true" />}
            title={t.overviewTitle}
          >
            <div className="co-content-overview-lead">
              <span className="co-content-overview-count" aria-hidden="true">
                {String(p.selectedCount).padStart(2, '0')}
              </span>
              <div className="co-content-overview-copy">
                <strong>{t.selectedItems}</strong>
                <span>{t.overviewHint}</span>
              </div>
              <span
                className={`co-content-overview-status${p.valid ? ' is-ready' : ''}`}
              >
                {p.valid && <CheckCircleFilled aria-hidden="true" />}
                {p.valid ? t.ready : t.needsReview}
              </span>
            </div>

            <div className="co-content-overview-package">
              <div className="co-content-overview-package-label">
                <span>{t.packageContent}</span>
                <strong>{t.count(p.packageSelectedCount, p.packageCount)}</strong>
              </div>
              <div
                className="co-content-overview-progress"
                role="progressbar"
                aria-label={t.packageContent}
                aria-valuemin={0}
                aria-valuemax={Math.max(1, p.packageCount)}
                aria-valuenow={p.packageSelectedCount}
              >
                <span style={{ width: `${packageProgress}%` }} />
              </div>
              {p.additionalChecklists.length > 0 && (
                <div className="co-content-overview-added">
                  <span>{t.additionalContent}</span>
                  <strong>{p.additionalChecklists.length}</strong>
                </div>
              )}
            </div>

            <div className="co-content-overview-media">
              <div className="co-content-overview-media-item">
                <PictureOutlined aria-hidden="true" />
                <strong>{p.mediaTotals.images}</strong>
                <span>{t.imageFiles}</span>
              </div>
              <div className="co-content-overview-media-item">
                <VideoCameraOutlined aria-hidden="true" />
                <strong>{p.mediaTotals.videos}</strong>
                <span>{t.videoFiles}</span>
              </div>
            </div>
            <p className="co-content-overview-footnote">{t.mediaHint}</p>
            {!p.valid && (
              <p className="co-content-overview-warning" role="alert">
                {t.invalid}
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
