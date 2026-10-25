import { resultLabel } from '../readinessHelpers'
import type { ReadinessCriterion } from '../../../types/readiness'

export function ReadinessSummary({
  autoPassed,
  auto,
}: {
  autoPassed: number
  auto: ReadinessCriterion[]
}) {
  return (
    <div className="odm-or-readiness-col">
      <h3>
        Hệ thống kiểm tra
        <span className="odm-or-readiness-count">
          {autoPassed}/{auto.length} đạt
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
                    <span className="odm-or-readiness-tag">Bắt buộc</span>
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
