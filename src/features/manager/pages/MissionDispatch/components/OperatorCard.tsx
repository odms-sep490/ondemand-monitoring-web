import type { OperatorCandidate } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { missionDispatchPageMessages } from '../MissionDispatchPage.messages'
import { ScoreRing } from './ScoreRing'

export function OperatorCard({
  rank,
  operator,
  selected,
  onSelect,
}: {
  rank: number
  operator: OperatorCandidate
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useI18n(missionDispatchPageMessages)
  return (
    <div className={`odm-mgr-candidate-card${selected ? ' selected' : ''}`}>
      <div className="odm-mgr-candidate-head">
        <span
          className="odm-tn"
          style={{ fontWeight: 700, color: 'var(--tx3)' }}
        >
          {rank}
        </span>
        <ScoreRing score={operator.score} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700 }}>{operator.fullName}</div>
          <div style={{ color: 'var(--tx3)', fontSize: 12 }}>
            {operator.licenseClass} ·{' '}
            {t.candidate.validUntil(operator.licenseExpiry)} ·{' '}
            {operator.licenseNumber}
          </div>
        </div>
      </div>
      <div className="odm-mgr-candidate-metrics">
        <span>
          {t.candidate.missionsWithModel}{' '}
          <b className="odm-tn">{operator.missionsWithModel}</b>
        </span>
        <span>
          {t.candidate.successRate}{' '}
          <b className="odm-tn">{operator.successRatePct}%</b>
        </span>
        <span>
          {t.candidate.acceptanceRate}{' '}
          <b className="odm-tn">{operator.acceptanceRatePct}%</b>
        </span>
        <span>
          {t.candidate.missionsThisWeek}{' '}
          <b className="odm-tn">{operator.missionsThisWeek}</b>
        </span>
      </div>
      <div className="odm-mgr-candidate-reason">
        <div style={{ fontWeight: 700, marginBottom: 2 }}>
          {t.candidate.whySuggested}
        </div>
        {operator.reason}
      </div>
      <button
        type="button"
        className={
          selected ? 'odm-btn odm-btn-ok odm-btn-sm' : 'odm-btn odm-btn-sm'
        }
        onClick={onSelect}
      >
        {selected ? t.candidate.selected : t.candidate.selectThisOperator}
      </button>
    </div>
  )
}
