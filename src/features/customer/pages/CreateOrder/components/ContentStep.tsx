import type { ReactNode } from 'react'

import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { ServiceOption, ServicePricingEstimate } from '../../../api/customerApi'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import type { ChecklistRow } from '../../../lib/checklist/types'
import { contentStepMessages } from './ContentStep.messages'
import { Metric } from './Metric'
import { PricingEstimateCard } from './PricingEstimateCard'
import './ContentStep.css'

type Props = {
  selected?: ServiceOption
  checklist: ReactNode
  selectedCount: number
  packageSelectedCount: number
  packageCount: number
  additionalChecklists: ChecklistRow[]
  valid: boolean
  pricingEstimate: ServicePricingEstimate | null
  pricingLoading: boolean
  aiAnalysisRequested: boolean
  footer?: ReactNode
}

/** Edit requirements while summary and navigation remain available on all screens. */
export function ContentStep(p: Props) {
  const { t, lang } = useI18n(contentStepMessages)
  const serviceName = p.selected
    ? localizeServiceName(p.selected.id, lang, p.selected.name)
    : t.notSelected

  return (
    <div className="co-content-shell">
      <div className="co-content-layout">
        <section className="co-content-editor" aria-label={t.editorTitle}>
          {p.checklist}
        </section>
        <div className="co-content-sidegroup">
          <aside className="co-summary co-content-aside" aria-label={t.summaryTitle}>
            <Card title={t.summaryTitle}>
              <div className="co-content-service">
                <span className="co-content-service-label">{t.service}</span>
                <strong className="co-content-service-name">{serviceName}</strong>
              </div>
              <div className="co-content-stats">
                <Metric label={t.totalContent} value={String(p.selectedCount)} />
                <Metric
                  label={t.packageContent}
                  value={t.count(p.packageSelectedCount, p.packageCount)}
                />
                <Metric
                  label={t.additionalContent}
                  value={String(p.additionalChecklists.length)}
                />
              </div>
              <p className="co-content-hint" role={p.valid ? undefined : 'alert'}>
                {p.valid ? t.hint : t.invalid}
              </p>
            </Card>
            <PricingEstimateCard
              estimate={p.pricingEstimate}
              loading={p.pricingLoading}
              hasService={Boolean(p.selected)}
              aiAnalysisRequested={p.aiAnalysisRequested}
              additionalChecklists={p.additionalChecklists}
            />
          </aside>
          {p.footer && (
            <nav className="co-content-navigation" aria-label={t.navigationTitle}>
              {p.footer}
            </nav>
          )}
        </div>
      </div>
    </div>
  )
}
