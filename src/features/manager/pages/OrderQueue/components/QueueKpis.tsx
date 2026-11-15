import { useI18n } from '../../../../../shared/i18n'
import { orderQueuePageMessages } from '../OrderQueuePage.messages'

type Props = {
  pending: number
  ready: number
  /** Null while the full order list is still loading or failed to load. */
  needsInfo: number | null
  waitingDeposit: number | null
}

export function QueueKpis({ pending, ready, needsInfo, waitingDeposit }: Props) {
  const { t } = useI18n(orderQueuePageMessages)
  const show = (value: number | null) => (value === null ? '–' : value)
  const metrics = [
    {
      key: 'pending',
      tone: 'pending',
      label: t.kpis.pending,
      value: pending,
      hint: t.kpis.pendingHint,
    },
    {
      key: 'needs-info',
      tone: 'needs-info',
      label: t.kpis.needsInfo,
      value: show(needsInfo),
      hint: needsInfo === null ? undefined : t.kpis.needsInfoHint,
    },
    {
      key: 'waiting-deposit',
      tone: 'deposit',
      label: t.kpis.waitingDeposit,
      value: show(waitingDeposit),
      hint: waitingDeposit === null ? undefined : t.kpis.waitingDepositHint,
    },
    {
      key: 'ready',
      tone: 'ready',
      label: t.kpis.ready,
      value: ready,
      hint: t.kpis.readyHint,
    },
  ]

  return (
    <section className="mgr-queue-kpis" aria-label={t.title}>
      {metrics.map((metric) => (
        <article
          key={metric.key}
          className={`mgr-queue-kpi mgr-queue-kpi--${metric.tone}`}
        >
          <dl>
            <dt>{metric.label}</dt>
            <dd>{metric.value}</dd>
          </dl>
          {metric.hint ? <p>{metric.hint}</p> : null}
        </article>
      ))}
    </section>
  )
}
