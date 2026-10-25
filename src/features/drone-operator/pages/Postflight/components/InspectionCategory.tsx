import { postflightPageMessages } from '../PostflightPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { PostflightCategoryDef } from '../postflightTypes'
import type {
  PostflightItemKey,
  PreflightItemResult,
} from '../../../types/mission'

export function InspectionCategory({
  cat,
  results,
  handleSetResult,
}: {
  cat: PostflightCategoryDef
  results: Partial<Record<PostflightItemKey, PreflightItemResult>>
  handleSetResult: (key: PostflightItemKey, result: PreflightItemResult) => void
}) {
  const { t } = useI18n(postflightPageMessages)
  return (
    <div
      style={{
        background: 'var(--sf, #fff)',
        border: '1.5px solid var(--bd, #e2e8f0)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
      }}
    >
      <div
        style={{
          padding: '10px 16px',
          background: 'var(--sf2, #f8fafc)',
          borderBottom: '1px solid var(--bd, #e2e8f0)',
          fontWeight: 700,
          fontSize: 13.5,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--tx, #1e293b)',
        }}
      >
        <span>{cat.icon}</span>
        <span>{cat.title}</span>
      </div>

      <div
        style={{
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {cat.items.map((item) => {
          const status = results[item.key] ?? null
          const isOk = status === 'ok'
          const isFail = status === 'fail'

          return (
            <div
              key={item.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderRadius: 10,
                background: isFail
                  ? 'rgba(239, 68, 68, 0.08)'
                  : isOk
                    ? 'rgba(16, 185, 129, 0.05)'
                    : 'var(--sf3, #f8fafc)',
                border: `1.5px solid ${
                  isFail ? '#fca5a5' : isOk ? '#a7f3d0' : 'var(--bd, #e2e8f0)'
                }`,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14.5,
                    color: 'var(--tx, #0f172a)',
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--tx3, #64748b)',
                    marginTop: 2,
                  }}
                >
                  {item.detail}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, flex: 'none' }}>
                <button
                  type="button"
                  onClick={() => handleSetResult(item.key, 'ok')}
                  style={{
                    padding: '7px 18px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    border: '1.5px solid',
                    borderColor: isOk ? '#10b981' : '#cbd5e1',
                    background: isOk ? '#10b981' : '#fff',
                    color: isOk ? '#fff' : '#475569',
                    cursor: 'pointer',
                    boxShadow: isOk
                      ? '0 2px 6px rgba(16, 185, 129, 0.3)'
                      : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t.pass}
                </button>
                <button
                  type="button"
                  onClick={() => handleSetResult(item.key, 'fail')}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    border: '1.5px solid',
                    borderColor: isFail ? '#ef4444' : '#cbd5e1',
                    background: isFail ? '#ef4444' : '#fff',
                    color: isFail ? '#fff' : '#475569',
                    cursor: 'pointer',
                    boxShadow: isFail
                      ? '0 2px 6px rgba(239, 68, 68, 0.3)'
                      : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {t.fail}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
