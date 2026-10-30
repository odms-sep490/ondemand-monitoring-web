import { FileSearchOutlined } from '@ant-design/icons'
import { InnerCollapse } from '../../../components/common/InnerCollapse'
import { Icon, type IconName } from '../../../../../shared/components/Icon'
import { Card } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type {
  PreferredTimeOption,
  ServiceDeliverableOption,
  ServiceOption,
} from '../../../api/customerApi'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { localizeDeliverableName } from '../../../lib/i18n/catalogNames'
import { localizeTimeslot } from '../../../lib/i18n/timeslots'
import { calcArea } from '../../../lib/createOrder/payload'
import type { FormState, Step } from '../../../lib/createOrder/types'
import { requestInfoPanelMessages } from './RequestInfoPanel.messages'
import { monitoringAuthorizationMessages } from './MonitoringAuthorizationSection.messages'
import { requestSummaryCardMessages } from './RequestSummaryCard.messages'
import { deliveryOptionsCardMessages } from './DeliveryOptionsCard.messages'

type Props = {
  /** Legacy request page still includes the selected result format summary. */
  mediaTotals?: { images: number; videos: number }
  form: FormState
  service?: ServiceOption
  time?: PreferredTimeOption
  deliverable?: ServiceDeliverableOption
  checklistCounts?: {
    total: number
    packageSelected: number
    packageTotal: number
    additional: number
  }
  onEdit?: (step: Step) => void
}

type Item = {
  key: string
  icon?: IconName
  label: string
  lines: string[]
  clamp?: boolean
  /** How many leading lines form the bold headline; the rest are joined into one muted line. */
  lead?: number
  /** Wizard step where this value is edited. */
  step?: Step
}

/** `2026-10-07` → `07/10/2026` for Vietnamese; other values pass through. */
function formatDate(value: string, lang: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return value
  return lang === 'vi'
    ? `${match[3]}/${match[2]}/${match[1]}`
    : `${match[2]}/${match[3]}/${match[1]}`
}

/** Bold headline line(s) first, everything else folded into one muted line. */
function summaryLines(item: Item) {
  if (item.clamp) return item.lines
  const lead = item.lead ?? 1
  const head = item.lines.slice(0, lead).join(' · ')
  const rest = item.lines.slice(lead).join(' · ')
  return [head, rest].filter(Boolean)
}

/** Read-only, scannable summary of everything the customer entered. */
export function RequestSummaryCard(p: Props) {
  const { t, lang } = useI18n(requestSummaryCardMessages)
  const { t: delivery } = useI18n(deliveryOptionsCardMessages)
  const { t: info } = useI18n(requestInfoPanelMessages)
  const { t: authorization } = useI18n(monitoringAuthorizationMessages)
  const { form } = p
  const dateFrom = formatDate(form.preferredDateFrom, lang)
  const dateTo = formatDate(form.preferredDateTo, lang)
  const dates = !dateFrom
    ? ''
    : dateTo && dateTo !== dateFrom
      ? `${dateFrom} → ${dateTo}`
      : dateFrom
  const timeWindow = p.time ? localizeTimeslot(p.time, lang) : ''
  const resultQuantity = [
    p.mediaTotals?.images ? t.quantityUnit('IMAGE', p.mediaTotals.images) : '',
    p.mediaTotals?.videos ? t.quantityUnit('VIDEO', p.mediaTotals.videos) : '',
  ]
    .filter(Boolean)
    .join(' · ')
  const usagePurpose =
    form.usagePurpose === 'OTHER'
      ? form.otherUsagePurpose.trim()
      : form.usagePurpose
        ? info.purposes[form.usagePurpose]
        : ''
  const flightPurpose =
    form.flightPurpose === 'OTHER'
      ? form.otherFlightPurpose.trim()
      : info.flightPurposes[form.flightPurpose]
  const relationship =
    form.monitoringRelationship === 'OTHER'
      ? form.otherMonitoringRelationship.trim()
      : form.monitoringRelationship
        ? authorization.relationships[form.monitoringRelationship]
        : ''

  const items: Item[] = [
    {
      key: 'service',
      icon: 'clipboard',
      label: t.service,
      lines: [
        p.service
          ? localizeServiceName(p.service.id, lang, p.service.name)
          : t.noValue,
        usagePurpose,
      ].filter(Boolean),
      step: 1,
    },
    ...(p.checklistCounts
      ? [
          {
            key: 'checklists',
            icon: 'check' as const,
            label: t.monitoringContent,
            lines: [
              t.totalContent(p.checklistCounts.total),
              [
                t.packageContent(
                  p.checklistCounts.packageSelected,
                  p.checklistCounts.packageTotal,
                ),
                ...(p.checklistCounts.additional > 0
                  ? [t.additionalContent(p.checklistCounts.additional)]
                  : []),
              ].join(' · '),
            ],
            step: 3 as Step,
          },
        ]
      : []),
    {
      key: 'location',
      icon: 'map-pin',
      label: t.location,
      lines: [form.address || t.noAddress],
      clamp: true,
      step: 2,
    },
    {
      key: 'area',
      icon: 'radio',
      label: t.area,
      lines: [`${t.radius} ${form.radiusM} m · ${calcArea(form.radiusM)} ha`],
      step: 2,
    },
    {
      key: 'site-details',
      icon: 'radio',
      label: t.siteDetails,
      lines: [
        t.altitude(form.altitudeM),
        Number(form.estimatedLengthM) > 0
          ? t.length(Number(form.estimatedLengthM))
          : '',
        form.areaFiles.length ? t.areaFiles(form.areaFiles.length) : '',
      ].filter(Boolean),
      step: 4,
    },
    {
      key: 'flight-purpose',
      icon: 'eye',
      label: t.flightPurpose,
      lines: [flightPurpose || t.noValue],
      step: 1,
    },
    ...(relationship
      ? [
          {
            key: 'relationship',
            icon: 'shield' as const,
            label: t.relationship,
            lines: [relationship],
            step: 4 as Step,
          },
        ]
      : []),
    ...(form.siteContactName.trim() ||
    form.siteContactPhone.trim() ||
    form.accessNotes.trim()
      ? [
          {
            key: 'contact',
            icon: 'users' as const,
            label: t.contact,
            lines: [
              [form.siteContactName.trim(), form.siteContactPhone.trim()]
                .filter(Boolean)
                .join(' · '),
              form.accessNotes.trim(),
            ].filter(Boolean),
            step: 4 as Step,
          },
        ]
      : []),
    ...(form.permitStatus !== 'NONE'
      ? [
          {
            key: 'permit',
            icon: 'shield' as const,
            label: t.permit,
            lines: [
              form.permitStatus === 'HAVE_PERMIT'
                ? t.permitHave(form.permitNumber.trim())
                : t.permitSupport,
            ],
            step: 4 as Step,
          },
        ]
      : []),
    {
      key: 'schedule',
      icon: 'clock',
      label: t.schedule,
      lines: [
        [dates, timeWindow].filter(Boolean).join(' · ') || t.noValue,
        form.recurrenceType === 'WEEKLY'
          ? t.repeatWeekly(form.recurrenceOccurrences)
          : form.recurrenceType === 'MONTHLY'
            ? t.repeatMonthly(form.recurrenceOccurrences)
            : '',
        form.resultDeadline
          ? t.deadline(formatDate(form.resultDeadline, lang))
          : '',
        t.fallbackValues[form.weatherFallback],
      ].filter(Boolean),
      lead: 1,
      step: 5,
    },
    ...(p.mediaTotals || p.deliverable
      ? [
          {
            key: 'deliverable',
            icon: 'camera' as const,
            label: t.deliverable,
            lines: [
              localizeDeliverableName(
                p.deliverable?.deliverableTypeName,
                lang,
              ) || t.noValue,
              resultQuantity,
            ].filter(Boolean),
            step: 6 as Step,
          },
          {
            key: 'delivery',
            icon: 'mail' as const,
            label: t.delivery,
            lines: [
              form.resultFormats
                .map((format) => delivery.formats[format])
                .join(', '),
              form.deliveryMethods
                .map((method) => delivery.methods[method])
                .join(', '),
              delivery.days(form.dataRetentionDays),
            ].filter(Boolean),
            step: 6 as Step,
          },
        ]
      : []),
    ...(form.attachments.length > 0
      ? [{
          key: 'attachments',
          icon: 'file-text' as const,
          label: t.attachments,
          lines: [t.attachmentCount(form.attachments.length)],
          step: 1 as Step,
        }]
      : []),
  ]
  const sections: Array<{ step: Step; title: string }> = [
    { step: 1, title: t.groupService },
    { step: 2, title: t.groupLocation },
    { step: 3, title: t.groupContent },
    { step: 4, title: t.groupSite },
    { step: 5, title: t.groupSchedule },
    ...(p.mediaTotals || p.deliverable
      ? [{ step: 6 as Step, title: t.groupDelivery }]
      : []),
  ]

  return (
    <Card icon={<FileSearchOutlined />} title={t.cardTitle}>
      <p className="co-hint">{t.cardSubtitle}</p>
      <div className="co-sum-request-title">
        <span>{t.requestTitle}</span>
        <p title={form.title || undefined}>{form.title.trim() || t.noTitle}</p>
      </div>
      <div className="co-review-groups">
        {sections.map((section) => {
          const sectionItems = items.filter(
            (item) => item.step === section.step,
          )
          return (
            <section
              key={section.step}
              className={`co-review-group is-step-${section.step}`}
              aria-labelledby={`co-review-group-${section.step}`}
            >
              <div className="co-review-group-heading">
                <h3 id={`co-review-group-${section.step}`}>{section.title}</h3>
                {p.onEdit && (
                  <button
                    type="button"
                    className="co-sum-edit"
                    aria-label={`${t.edit}: ${section.title}`}
                    onClick={() => p.onEdit?.(section.step)}
                  >
                    {t.edit}
                  </button>
                )}
              </div>
              <dl className="co-sum-list">
                {sectionItems.map((item) => (
                  <div key={item.key} className="co-sum-item">
                    <span className="co-sum-icon" aria-hidden="true">
                      {item.icon && (
                        <Icon name={item.icon} width={16} height={16} />
                      )}
                    </span>
                    <div className="co-sum-body">
                      <dt>{item.label}</dt>
                      {summaryLines(item).map((line, index) => (
                        <dd
                          key={index}
                          className={`${index > 0 ? 'is-sub ' : ''}${item.clamp ? 'is-clamp' : ''}`}
                          title={item.clamp ? line : undefined}
                        >
                          {line}
                        </dd>
                      ))}
                    </div>
                  </div>
                ))}
              </dl>
            </section>
          )
        })}
      </div>
      <InnerCollapse className="co-sum-tech" title={t.technical}>
        <div className="co-sum-tech-row">
          <span>{t.coordinates}</span>
          <span className="co-mono">
            {form.latitude && form.longitude
              ? `${form.latitude}, ${form.longitude}`
              : '—'}
          </span>
        </div>
      </InnerCollapse>
    </Card>
  )
}
