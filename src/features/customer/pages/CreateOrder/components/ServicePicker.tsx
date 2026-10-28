import { Button } from 'antd'
import { AppstoreOutlined } from '@ant-design/icons'
import { useState } from 'react'

import { Card, EmptyState } from '../../../components/common/ui'
import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import type { ServiceOption } from '../../../api/customerApi'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { servicePickerMessages } from './ServicePicker.messages'
import { formatMoney } from '../../../lib/createOrder/format'

/** Services shown before "show more": two rows of the 3-column grid. */
const SERVICE_LIMIT = 6

function ServiceImage({
  imageUrl,
  fallbackImageUrl,
  noImage,
}: {
  imageUrl?: string | null
  fallbackImageUrl?: string | null
  noImage: string
}) {
  const [failedUrls, setFailedUrls] = useState<string[]>([])
  const source = [imageUrl, fallbackImageUrl].find(
    (candidate): candidate is string => Boolean(candidate) && !failedUrls.includes(candidate!),
  )

  return source ? (
    <img
      className="co-service-image"
      src={source}
      alt=""
      loading="lazy"
      onError={() => setFailedUrls((current) => [...current, source])}
    />
  ) : (
    <span className="co-service-noimg">
      <Icon name="camera" width={20} height={20} aria-hidden="true" />
      {noImage}
    </span>
  )
}

type Props = {
  services: ServiceOption[]
  loading: boolean
  selectedId: string
  suggested?: ServiceOption
  error?: string
  onSelect: (serviceId: string) => void
}

export function ServicePicker({
  services,
  loading,
  selectedId,
  suggested,
  error,
  onSelect,
}: Props) {
  const { t, lang, locale } = useI18n(servicePickerMessages)
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)
  const needle = query.trim().toLowerCase()
  const visible = needle
    ? services.filter((service) =>
        `${localizeServiceName(service.id, lang, service.name)} ${service.description ?? ''}`
          .toLowerCase()
          .includes(needle),
      )
    : services
  // Searching, or a selection further down, keeps everything visible.
  const selectedHidden =
    !needle &&
    visible.findIndex((service) => service.id === selectedId) >= SERVICE_LIMIT
  const showAll = expanded || Boolean(needle) || selectedHidden
  const shown = showAll ? visible : visible.slice(0, SERVICE_LIMIT)
  const hiddenCount = visible.length - shown.length

  return (
    <Card
      icon={<AppstoreOutlined />}
      title={t.cardTitle}
      className="co-service-card"
      actions={
        services.length > SERVICE_LIMIT ? (
          <input
            type="search"
            className="co-input co-service-search"
            aria-label={t.searchLabel}
            placeholder={t.searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        ) : undefined
      }
    >
      <p className="co-service-lead">{t.cardHint}</p>
      {suggested && (
        <div className="co-suggest">
          <strong>{t.aiSuggested}</strong>
          <div className="co-hint">{t.aiSuggestedHint}</div>
          <div className="co-service">
            <span className="co-service-illustration">
              <ServiceImage
                imageUrl={suggested.imageUrl}
                fallbackImageUrl={suggested.fallbackImageUrl}
                noImage={t.noImage}
              />
            </span>
            <div className="co-service-name">
              {localizeServiceName(suggested.id, lang, suggested.name)}
            </div>
            <div className="co-service-desc">
              {suggested.description || t.defaultDescription}
            </div>
            <strong>{formatMoney(suggested.defaultPrice ?? suggested.basePrice, locale)}</strong>
            <Button
              size="small"
              onClick={() => onSelect(suggested.id)}
            >
              {selectedId === suggested.id ? t.selectedNow : t.pickSuggestion}
            </Button>
          </div>
        </div>
      )}
      <div className="co-row-between co-mt">
        <strong>{t.allServices}</strong>
        <span className="co-hint">{t.serviceCount(services.length)}</span>
      </div>
      {loading && <p className="co-hint co-mt">{t.loading}</p>}
      {!loading && services.length === 0 && (
        <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
      )}
      {!loading && services.length > 0 && visible.length === 0 && (
        <p className="co-hint co-mt">{t.noMatch}</p>
      )}
      <div className="co-service-grid co-mt">
        {shown.map((service) => {
          const cls = [
            'co-service',
            selectedId === service.id ? 'is-active' : '',
            suggested?.id === service.id ? 'is-suggested' : '',
          ].join(' ')
          return (
            <button
              key={service.id}
              type="button"
              className={cls}
              aria-pressed={selectedId === service.id}
              onClick={() => onSelect(service.id)}
            >
              <span className="co-service-illustration">
                <ServiceImage
                  imageUrl={service.imageUrl}
                  fallbackImageUrl={service.fallbackImageUrl}
                  noImage={t.noImage}
                />
                {selectedId === service.id && (
                  <span className="co-service-check" aria-hidden="true">
                    <svg viewBox="0 0 16 16" width="14" height="14">
                      <path
                        d="M3.5 8.5l3 3 6-6.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </span>
              {selectedId === service.id && (
                <span className="co-service-selected">{t.selectedBadge}</span>
              )}
              <span className="co-service-name">
                {localizeServiceName(service.id, lang, service.name)}
              </span>
              <span className="co-service-desc">
                {service.description || t.defaultDescription}
              </span>
              <strong>{formatMoney(service.defaultPrice ?? service.basePrice, locale)}</strong>
            </button>
          )
        })}
      </div>
      {hiddenCount > 0 && (
        <button
          type="button"
          className="co-service-more"
          onClick={() => setExpanded(true)}
        >
          {t.showMore(hiddenCount)}
        </button>
      )}
      {showAll && !needle && !selectedHidden && visible.length > SERVICE_LIMIT && (
        <button
          type="button"
          className="co-service-more"
          onClick={() => setExpanded(false)}
        >
          {t.showLess}
        </button>
      )}
      {error &&<div className="ui-field-error">{error}</div>}
    </Card>
  )
}
