import { useI18n } from '../../../../shared/i18n'
import type { ReactNode } from 'react'
import { StatusBadge } from '../../../../shared/components/ui'
import { OrderIcon } from './OrderIcon'
import { planningPresentationMessages } from './planningPresentation.messages'

export function PlanningHeader({
  status,
  revision,
  loading = false,
  action,
  primary = false,
}: {
  status?: 'DRAFT' | 'FINALIZED'
  revision: number
  loading?: boolean
  action?: ReactNode
  primary?: boolean
}) {
  const { t } = useI18n(planningPresentationMessages)
  const Heading = primary ? 'h1' : 'h2'
  return (
    <header className="odm-plan-header">
      <div className="odm-plan-heading">
        <span className="odm-plan-icon" aria-hidden="true">
          <OrderIcon name="doc" size={22} />
        </span>
        <div>
          <Heading>{t.title}</Heading>
        </div>
      </div>
      <div className="odm-plan-badges" aria-live="polite">
        {loading ? (
          <span role="status">{t.loading}</span>
        ) : (
          <>
            <StatusBadge
              tone={
                status === 'FINALIZED'
                  ? 'success'
                  : status === 'DRAFT'
                    ? 'warning'
                    : 'neutral'
              }
            >
              {status === 'FINALIZED'
                ? t.finalizedBadge
                : status === 'DRAFT'
                  ? t.draftBadge
                  : t.unverified}
            </StatusBadge>
            {status && (
              <span className="odm-or-pill">{t.version(revision)}</span>
            )}
          </>
        )}
        {action}
      </div>
    </header>
  )
}
