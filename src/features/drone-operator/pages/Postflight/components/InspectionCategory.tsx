import { postflightPageMessages } from '../PostflightPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { PostflightCategoryDef } from '../postflightTypes'
import type {
  PostflightItemKey,
  PreflightItemResult,
} from '../../../types/mission'

export function InspectionCategory({
  index,
  cat,
  results,
  handleSetResult,
}: {
  index: number
  cat: PostflightCategoryDef
  results: Partial<Record<PostflightItemKey, PreflightItemResult>>
  handleSetResult: (key: PostflightItemKey, result: PreflightItemResult) => void
}) {
  const { t } = useI18n(postflightPageMessages)
  return (
    <section className="postflight-category">
      <h2 className="postflight-category-heading">
        <span>
          {index}. {cat.title}
        </span>
      </h2>

      <div className="postflight-category-items">
        {cat.items.map((item) => {
          const status = results[item.key] ?? null
          const isOk = status === 'ok'
          const isFail = status === 'fail'

          return (
            <div
              key={item.key}
              className={`postflight-row${isOk ? ' is-ok' : ''}${isFail ? ' is-fail' : ''}`}
            >
              <div className="postflight-row-copy">
                <div className="postflight-row-title">{item.label}</div>
                <div className="postflight-row-detail">{item.detail}</div>
              </div>

              <div className="postflight-choices" role="group" aria-label={item.label}>
                <button
                  type="button"
                  className={`postflight-choice is-pass${isOk ? ' is-selected' : ''}`}
                  aria-pressed={isOk}
                  onClick={() => handleSetResult(item.key, 'ok')}
                >
                  {t.pass}
                </button>
                <button
                  type="button"
                  className={`postflight-choice is-fail${isFail ? ' is-selected' : ''}`}
                  aria-pressed={isFail}
                  onClick={() => handleSetResult(item.key, 'fail')}
                >
                  {t.fail}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
