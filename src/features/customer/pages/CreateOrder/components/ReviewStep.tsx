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
import { AgreementSection } from './AgreementSection'
import { DeliverablesCard } from './DeliverablesCard'
import { DeliveryOptionsCard } from './DeliveryOptionsCard'
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

/** Step 6: review the request, choose delivery options and submit. */
export function ReviewStep(p: Props) {
  return (
    <div className="co-grid is-review co-review-layout">
      <RequestSummaryCard
        variant="review"
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
      <div className="co-review-financial-grid">
        <DeliveryOptionsCard
          variant="review"
          form={p.form}
          errors={p.errors}
          update={p.update}
          mediaTotals={p.mediaTotals}
        >
          <DeliverablesCard
            variant="inline"
            deliverables={p.deliverables}
            loading={p.deliverablesLoading}
            error={p.deliverablesError}
            onRetry={p.reloadDeliverables}
            mediaTotals={p.mediaTotals}
          />
        </DeliveryOptionsCard>
        <PricingEstimateCard
          variant="review"
          estimate={p.pricingEstimate}
          loading={p.pricingLoading}
          hasService={Boolean(p.service)}
          additionalChecklists={p.additionalChecklists}
        />
      </div>
      <AgreementSection
        variant="review"
        form={p.form}
        errors={p.errors}
        update={p.update}
      />
    </div>
  )
}
