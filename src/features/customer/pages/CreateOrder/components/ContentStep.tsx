import type { ReactNode } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import type {
  ServiceOption,
  ServicePricingEstimate,
} from '../../../api/customerApi'
import type { ChecklistRow } from '../../../lib/checklist/types'
import { contentStepMessages } from './ContentStep.messages'
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
}

/** Edit requirements while summary and navigation remain available on all screens. */
export function ContentStep(p: Props) {
  const { t } = useI18n(contentStepMessages)

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
          </aside>
        </div>
      </div>
    </div>
  )
}
