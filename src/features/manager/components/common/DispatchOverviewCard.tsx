import type { Mission } from '../../../mission/types/mission'
import { OrderIcon } from './OrderIcon'
import { fmtRadius, requestedWindow } from './liveDispatchHelpers'
import { simulationMapAspectRatio } from '../../../../shared/lib/simulationMapProjection'
import { SIMULATION_MAP_IMAGE_CROP } from './liveDispatchConstants'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { useI18n } from '../../../../shared/i18n'

export function DispatchOverviewCard({
  target,
  currentOrderCode,
  current,
  mapImageUrl,
  imageStyle,
}: {
  target: { x: number; y: number } | null
  currentOrderCode: string
  current: Mission
  mapImageUrl: string
  imageStyle: { left: string; top: string; width: string; height: string }
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="doc" size={18} />
          {t.orderInfoTitle}
        </span>
      </header>
      <div
        className={`odm-or-card-body odm-or-order-body${target ? ' has-map' : ''}`}
      >
        <dl className="odm-or-summary-list">
          <div>
            <dt>
              <OrderIcon name="tag" size={16} />
              {t.orderId}
            </dt>
            <dd>{currentOrderCode}</dd>
          </div>
          <div>
            <dt>
              <OrderIcon name="user" size={16} />
              {t.customer}
            </dt>
            <dd>{current.customerName ?? '—'}</dd>
          </div>
          <div>
            <dt>
              <OrderIcon name="service" size={16} />
              {t.service}
            </dt>
            <dd>{current.serviceName ?? '—'}</dd>
          </div>
          <div>
            <dt>
              <OrderIcon name="radius" size={16} />
              {t.areaRadius}
            </dt>
            <dd>{fmtRadius(current.radiusM)}</dd>
          </div>
          <div>
            <dt>
              <OrderIcon name="calendar" size={16} />
              {t.customerDeadline}
            </dt>
            <dd>{requestedWindow(current)}</dd>
          </div>
          <div>
            <dt>
              <OrderIcon name="media" size={16} />
              {t.orderTitle}
            </dt>
            <dd>{current.orderTitle ?? '—'}</dd>
          </div>
        </dl>
        {target && (
          <div
            className="odm-or-map odm-or-map-compact"
            style={{
              aspectRatio: simulationMapAspectRatio(SIMULATION_MAP_IMAGE_CROP),
            }}
          >
            <div
              className="odm-or-map-layer"
              style={{ left: 0, top: 0, width: '100%', height: '100%' }}
            >
              <img
                className="odm-or-map-image"
                src={mapImageUrl}
                alt=""
                style={imageStyle}
              />
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                role="img"
                aria-label={t.mapAriaLabel}
              >
                <circle
                  cx={target.x}
                  cy={target.y}
                  r="14"
                  className="odm-or-map-radius"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
              <span
                className="odm-or-map-pin"
                style={{ left: `${target.x}%`, top: `${target.y}%` }}
                aria-hidden="true"
              >
                <svg width="26" height="33" viewBox="0 0 30 38">
                  <path
                    d="M15 37C15 37 3 24.5 3 14.5a12 12 0 0 1 24 0C27 24.5 15 37 15 37z"
                    fill="#1677ff"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <circle cx="15" cy="14.5" r="4.5" fill="#fff" />
                </svg>
              </span>
              <span
                className="odm-or-map-badge"
                style={{ left: `${target.x}%`, top: `${target.y}%` }}
              >
                X {current.longitude?.toFixed(1) ?? '—'} · Y{' '}
                {current.latitude?.toFixed(1) ?? '—'}
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
