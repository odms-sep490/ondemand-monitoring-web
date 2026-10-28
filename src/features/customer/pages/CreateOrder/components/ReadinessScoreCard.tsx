import { Card } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { AiScore } from '../../../lib/createOrder/types'
import { readinessScoreCardMessages } from './ReadinessScoreCard.messages'

export function ReadinessScoreCard({ score }: { score: AiScore }) {
  const { t } = useI18n(readinessScoreCardMessages)
  return (
    <Card title={t.cardTitle}>
      <div className="co-score">
        <div className={`co-score-value is-${score.level}`}>{score.score}</div>
        <div>
          <strong>{t.scoreTitle}</strong>
          <p className="co-hint">{t.scoreHint}</p>
        </div>
      </div>
      <ul className="co-notes">
        {score.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </Card>
  )
}
