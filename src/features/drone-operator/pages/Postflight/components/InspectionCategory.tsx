import { Button, theme } from 'antd'

import { CardComponent } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type {
  PostflightItemKey,
  PreflightItemResult,
} from '../../../types/mission'
import { postflightPageMessages } from '../PostflightPage.messages'
import type { PostflightCategoryDef } from '../postflightTypes'

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
  const { token } = theme.useToken()
  return (
    <CardComponent title={cat.title}>
      <div className="stf-stack-sm">
        {cat.items.map((item) => {
          const status = results[item.key] ?? null
          const isOk = status === 'ok'
          const isFail = status === 'fail'
          return (
            <div
              key={item.key}
              className="stf-item stf-item-main"
              style={{
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                ...(isFail
                  ? {
                      borderColor: token.colorErrorBorder,
                      background: token.colorErrorBg,
                    }
                  : isOk
                    ? {
                        borderColor: token.colorSuccessBorder,
                        background: token.colorSuccessBg,
                      }
                    : null),
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div className="stf-item-name">{item.label}</div>
                <div
                  className="stf-muted"
                  style={{ fontSize: 12, marginTop: 2 }}
                >
                  {item.detail}
                </div>
              </div>
              <div className="stf-item-action">
                <Button
                  type={isOk ? 'primary' : 'default'}
                  onClick={() => handleSetResult(item.key, 'ok')}
                >
                  {t.pass}
                </Button>
                <Button
                  danger
                  type={isFail ? 'primary' : 'default'}
                  onClick={() => handleSetResult(item.key, 'fail')}
                >
                  {t.fail}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
    </CardComponent>
  )
}
