import type { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import type { OrderResourcePreview } from '../../../types/orders'
import type { OrderReviewMessages } from '../OrderReviewPage.messages'
import { OrderIcon } from '../../../components/common/OrderIcon'

type Query = ReturnType<typeof useApiQuery<OrderResourcePreview | null>>

export function ResourceAvailabilityCard({
  query,
  t,
}: {
  query: Query
  t: OrderReviewMessages
}) {
  if (query.loading) {
    return (
      <section className="odm-or-card" aria-busy="true">
        <header className="odm-or-card-head">
          <span className="odm-or-card-title">
            <OrderIcon name="users" size={18} />
            {t.resourceStatus}
          </span>
        </header>
        <div className="odm-or-card-body">
          <span className="odm-sk" style={{ width: '100%', height: 72 }} />
        </div>
      </section>
    )
  }
  if (query.error) return null

  const preview = query.data
  const ready =
    preview != null &&
    preview.eligibleDroneCount > 0 &&
    preview.eligiblePilotCount > 0

  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="users" size={18} />
          {t.resourceStatus}
        </span>
        {preview ? (
          <span
            className={`odm-or-status-dot ${ready ? 'is-ready' : 'is-short'}`}
          >
            {ready ? t.resourceReady : t.resourceShort}
          </span>
        ) : null}
      </header>
      {!preview ? (
        <div className="odm-or-card-body odm-or-empty">{t.noResourceData}</div>
      ) : (
        <div className="odm-or-card-body">
          <div className="odm-or-resource-grid">
            <div className="odm-or-resource-tile">
              <span className="odm-or-resource-icon">
                <OrderIcon name="drone" size={18} />
              </span>
              <span className="odm-or-resource-label">{t.droneLabel}</span>
              <b className="odm-or-resource-value">
                {preview.eligibleDroneCount}
              </b>
              <span className="odm-or-resource-sub">{t.dronesAvailable}</span>
            </div>
            <div className="odm-or-resource-tile">
              <span className="odm-or-resource-icon">
                <OrderIcon name="user" size={18} />
              </span>
              <span className="odm-or-resource-label">{t.staffLabel}</span>
              <b className="odm-or-resource-value">
                {preview.eligiblePilotCount}
              </b>
              <span className="odm-or-resource-sub">{t.staffAvailable}</span>
            </div>
          </div>
          <CandidateList title={t.topDrones} items={preview.topDrones} />
          <CandidateList title={t.topPilots} items={preview.topPilots} />
        </div>
      )}
    </section>
  )
}

function CandidateList({
  title,
  items,
}: {
  title: string
  items: OrderResourcePreview['topDrones']
}) {
  if (items.length === 0) return null
  return (
    <div className="odm-or-candidates">
      <div className="odm-or-candidates-title">{title}</div>
      {items.map((item) => (
        <div key={item.name} className="odm-or-candidate">
          <span className="odm-or-candidate-score">{item.score}</span>
          <span className="odm-or-candidate-name">{item.name}</span>
          <span className="odm-or-candidate-meta">{item.distanceLabel}</span>
        </div>
      ))}
    </div>
  )
}
