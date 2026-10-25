import { useI18n } from '../../../../../shared/i18n'
import { missionDispatchPageMessages } from '../MissionDispatchPage.messages'

export function ScoreRing({ score }: { score: number }) {
  const { t } = useI18n(missionDispatchPageMessages)
  const size = 44
  const r = 18
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - score / 100)
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="odm-mgr-score-ring"
      role="img"
      aria-label={t.scoreAria(score)}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--sf3)"
        strokeWidth={4}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--blue-solid)"
        strokeWidth={4}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
      >
        {score}
      </text>
    </svg>
  )
}
