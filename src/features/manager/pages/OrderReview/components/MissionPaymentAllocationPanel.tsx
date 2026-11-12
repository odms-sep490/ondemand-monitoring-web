import { Alert, Button, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { formatVnd } from '../../../../../shared/lib/formatVnd'
import { financeApi } from '../../../../finance/api'
import type { MissionPaymentAllocation } from '../../../../finance/types'
import type { MissionResponse } from '../../../types/missions'
import { missionPaymentAllocationMessages } from './MissionPaymentAllocationPanel.messages'
import '../../../../finance/finance.css'

export function MissionPaymentAllocationPanel({
  orderId,
  invoice,
  missions,
  allocation,
  onSaved,
}: {
  orderId: string
  invoice: { totalAmount: number; depositAmount: number }
  missions: MissionResponse[]
  allocation: MissionPaymentAllocation | null
  onSaved: () => void
}) {
  const { t } = useI18n(missionPaymentAllocationMessages)
  const originalMissions = useMemo(
    () => missions.filter((mission) => mission.purpose !== 'REWORK' && mission.status !== 'CANCELLED'),
    [missions],
  )
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const existing = allocation?.milestones ?? []
  const amountByMission = new Map(existing.map((milestone) => [milestone.missionId, milestone.amount]))
  const target = invoice.totalAmount - invoice.depositAmount
  const allocated = originalMissions.reduce((sum, mission) => {
    const parsed = Number(amounts[mission.id] ?? amountByMission.get(mission.id) ?? 0)
    return Number.isSafeInteger(parsed) && parsed > 0 ? sum + parsed : sum
  }, 0)
  const locked = originalMissions.some((mission) =>
    !['PLANNING', 'PENDING_PAYMENT'].includes(mission.status),
  ) || existing.some((milestone) =>
    milestone.handedOverAt != null || milestone.status !== 'NOT_YET_DUE' || milestone.payments.length > 0,
  )
  const complete = originalMissions.length > 0 && allocated === target && originalMissions.every((mission) => {
    const amount = Number(amounts[mission.id] ?? amountByMission.get(mission.id) ?? 0)
    return Number.isSafeInteger(amount) && amount > 0
  })

  useEffect(() => {
    setAmounts(Object.fromEntries(existing.map((milestone) => [milestone.missionId, String(milestone.amount)])))
  }, [allocation])

  async function save() {
    if (!complete || locked || saving) return
    setSaving(true)
    setError('')
    setNotice('')
    try {
      await financeApi.configureManagerMissionPaymentAllocations(
        orderId,
        originalMissions.map((mission) => ({ missionId: mission.id, amount: Number(amounts[mission.id] ?? amountByMission.get(mission.id)) })),
      )
      setNotice(t.saved)
      onSaved()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save Mission payment allocations.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mission-allocation-card" aria-labelledby="mission-allocation-title">
      <header>
        <div>
          <h3 id="mission-allocation-title">{t.title}</h3>
          <p>{t.description}</p>
        </div>
        <div className="mission-allocation-card__totals">
          <span>{t.target}<strong>{formatVnd(target)}</strong></span>
          <span>{t.allocated}<strong>{formatVnd(allocated)}</strong></span>
        </div>
      </header>
      {locked ? <Alert type="info" showIcon message={t.locked} /> : null}
      {!complete && !locked ? <Alert type="warning" showIcon message={t.exactTotal} /> : null}
      {error ? <Alert type="error" showIcon message={error} /> : null}
      {notice ? <Alert type="success" showIcon message={notice} /> : null}
      {originalMissions.length === 0 ? <p>{t.noMissions}</p> : null}
      <div className="mission-allocation-list">
        {originalMissions.map((mission) => {
          const amount = amountByMission.get(mission.id)
          const milestone = existing.find((item) => item.missionId === mission.id)
          return (
            <div className="mission-allocation-row" key={mission.id}>
              <div className="mission-allocation-row__mission">
                <strong>{mission.scopeLabel || mission.missionCode}</strong>
                <span>{mission.missionCode}</span>
              </div>
              {milestone ? <Tag>{t.status[milestone.status] ?? milestone.status}</Tag> : null}
              <label>
                <span>{t.amount}</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  inputMode="numeric"
                  value={amounts[mission.id] ?? (amount == null ? '' : String(amount))}
                  disabled={locked || saving}
                  onChange={(event) => setAmounts((current) => ({ ...current, [mission.id]: event.target.value }))}
                />
              </label>
            </div>
          )
        })}
      </div>
      {!locked ? (
        <footer>
          <Button type="primary" disabled={!complete || saving} loading={saving} onClick={() => void save()}>
            {t.save}
          </Button>
        </footer>
      ) : null}
    </section>
  )
}
