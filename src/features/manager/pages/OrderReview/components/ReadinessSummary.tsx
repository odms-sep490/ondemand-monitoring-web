import { resultLabel } from '../readinessHelpers'
import type { ReadinessCriterion } from '../../../types/readiness'
import { useI18n } from '../../../../../shared/i18n'
import { readinessSummaryMessages } from './ReadinessSummary.messages'

export function ReadinessSummary({
  autoPassed,
  auto,
}: {
  autoPassed: number
  auto: ReadinessCriterion[]
}) {
  const { t } = useI18n(readinessSummaryMessages)
  return (
    <div className="odm-or-readiness-col">
      <h3>
        {t.systemChecks}
        <span className="odm-or-readiness-count">
          {autoPassed}/{auto.length} {t.passed}
        </span>
      </h3>
      <ul className="odm-or-readiness-list">
        {auto.map((c) => (
          <li key={c.code} className={`is-${c.result.toLowerCase()}`}>
            <span className="odm-or-readiness-dot" aria-hidden="true" />
            <div>
              <strong>
                {c.title}
                {c.required ? (
                  <>
                    <span className="odm-or-readiness-tag">{t.required}</span>
                  </>
                ) : null}
              </strong>
              <span>{c.reason ?? c.description}</span>
            </div>
            <em>{resultLabel[c.result]}</em>
          </li>
        ))}
      </ul>
    </div>
  )
}
