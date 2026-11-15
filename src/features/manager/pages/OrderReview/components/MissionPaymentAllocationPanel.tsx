import { Alert, Spin, Tag } from 'antd'
import { useEffect, useState } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { financeApi } from '../../../../finance/api'
import type { MissionPaymentAllocation } from '../../../../finance/types'
import type { MissionResponse } from '../../../types/missions'
import { missionPaymentAllocationMessages } from './MissionPaymentAllocationPanel.messages'
import '../../../../finance/finance.css'

const statusTone: Record<string, string> = {
  NOT_YET_DUE: 'default',
  UNPAID: 'orange',
  PENDING: 'processing',
  EXPIRED: 'red',
  PAID: 'green',
  CANCELLED: 'default',
}

export function MissionPaymentAllocationPanel({
  orderId,
  invoice,
  allocation,
}: {
  orderId: string
  invoice: { totalAmount: number; depositAmount: number }
  allocation: MissionPaymentAllocation | null
  /** Kept optional for callers compiled against the former editable panel props. */
  missions?: MissionResponse[]
  onSaved?: () => void
}) {
  const { t } = useI18n(missionPaymentAllocationMessages)
  const calculateFailed = t.calculateFailed
  const [calculatedAllocation, setCalculatedAllocation] =
    useState<MissionPaymentAllocation | null>(allocation)
  const [calculating, setCalculating] = useState(true)
  const [error, setError] = useState('')
  const target = calculatedAllocation?.allocationTargetAmount ??
    Math.max(0, invoice.totalAmount - invoice.depositAmount)

  useEffect(() => {
    let current = true
    setCalculating(true)
    setError('')
    void financeApi.calculateManagerMissionPaymentAllocations(orderId)
      .then((result) => {
        if (current) setCalculatedAllocation(result)
      })
      .catch(() => {
        if (current) {
          setError(calculateFailed)
        }
      })
      .finally(() => {
        if (current) setCalculating(false)
      })
    return () => {
      current = false
    }
  }, [calculateFailed, orderId])

  return (
    <section className="mission-allocation-card" aria-labelledby="mission-allocation-title">
      <header>
        <div>
          <h3 id="mission-allocation-title">{t.title}</h3>
          <p>{t.description}</p>
        </div>
        <div className="mission-allocation-card__totals">
          <span>{t.target}<strong>{formatVnd(target)}</strong></span>
          <span>{t.allocated}<strong>{formatVnd(calculatedAllocation?.allocatedAmount ?? 0)}</strong></span>
        </div>
      </header>

      {calculating ? <p className="mission-allocation-card__loading" role="status"><Spin size="small" /> {t.calculating}</p> : null}
      {error ? <Alert type="error" showIcon message={error} /> : null}
      {calculatedAllocation && !calculatedAllocation.allocationComplete ? (
        <Alert type="warning" showIcon message={t.allocationIncomplete} />
      ) : null}
      {!calculating && !error && !calculatedAllocation?.milestones.length ? (
        <p className="mission-payment-card__empty">{t.noMissions}</p>
      ) : null}

      <div className="mission-allocation-list">
        {calculatedAllocation?.milestones.map((milestone) => (
          <div className="mission-allocation-row" key={milestone.id}>
            <div className="mission-allocation-row__mission">
              <strong>{milestone.scopeLabel?.trim() || milestone.missionCode || t.missionFallback}</strong>
              <span>{milestone.missionCode}</span>
            </div>
            <Tag color={statusTone[milestone.status] ?? 'default'}>
              {t.status[milestone.status] ?? milestone.status}
            </Tag>
            <div className="mission-allocation-row__amount">
              <span>{t.customerPayment}</span>
              <strong>{formatVnd(milestone.amount)}</strong>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
