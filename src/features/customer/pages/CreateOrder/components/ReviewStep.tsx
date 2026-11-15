import type {
  PreferredTimeOption,
  ServiceDeliverableOption,
  ServiceOption,
  ServicePricingEstimate,
} from '../../../api/customerApi'
import type {
  FormErrors,
  FormState,
  Step,
  UpdateField,
} from '../../../lib/createOrder/types'
import type { ChecklistRow } from '../../../lib/checklist/types'
import './ReviewStep.css'
import { AgreementSection } from './AgreementSection'
import { PricingEstimateCard } from './PricingEstimateCard'
import { RequestSummaryCard } from './RequestSummaryCard'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  service?: ServiceOption
  time?: PreferredTimeOption
  deliverables: ServiceDeliverableOption[]
  deliverablesLoading: boolean
  deliverablesError?: unknown
  reloadDeliverables: () => void
  mediaTotals: { images: number; videos: number }
  pricingEstimate: ServicePricingEstimate | null
  pricingLoading: boolean
  additionalChecklists: ChecklistRow[]
  packageSelectedCount: number
  packageCount: number
  /** Jump back to an earlier step from the summary. */
  onEdit: (step: Step) => void
}

/** Step 6: review the request and submit. */
export function ReviewStep(p: Props) {
  return (
    <div className="co-confirm-layout">
      <section className="co-confirm-details">
      <RequestSummaryCard
        variant="review"
        mediaTotals={p.mediaTotals}
        form={p.form}
        service={p.service}
        time={p.time}
        checklistCounts={{
          total: p.packageSelectedCount + p.additionalChecklists.length,
          packageSelected: p.packageSelectedCount,
          packageTotal: p.packageCount,
          additional: p.additionalChecklists.length,
        }}
        onEdit={p.onEdit}
      />
      </section>
      <aside className="co-confirm-sidebar">
      <PricingEstimateCard
        variant="review"
        estimate={p.pricingEstimate}
        loading={p.pricingLoading}
        hasService={Boolean(p.service)}
        additionalChecklists={p.additionalChecklists}
      />
      <AgreementSection
        variant="review"
        form={p.form}
        errors={p.errors}
        update={p.update}
      />

      </aside>
    </div>
  )
}
