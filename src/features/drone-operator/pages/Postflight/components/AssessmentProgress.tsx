import { Button, Progress } from 'antd'

import { CardComponent, StatusTag } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import type { PostflightSummary } from '../../../lib/postflightSummary'
import type { PostflightItemKey } from '../../../types/mission'
import { ALL_KEYS } from '../postflightHelpers'
import { postflightPageMessages } from '../PostflightPage.messages'

export function AssessmentProgress({
  failItems,
  summary,
  allAssessed,
  handlePassAll,
}: {
  failItems: PostflightItemKey[]
  summary: PostflightSummary
  allAssessed: boolean
  handlePassAll: () => void
}) {
  const { t } = useI18n(postflightPageMessages)
  const assessed = summary.nOk + failItems.length
  return (
    <CardComponent>
      <div className="stf-row" style={{ justifyContent: 'space-between' }}>
        <div className="stf-stack-sm" style={{ gap: 4, flex: '1 1 260px' }}>
          <div className="stf-group-title">{t.assessmentProgress}</div>
          <div className="stf-row">
            <span style={{ fontSize: 22, fontWeight: 800 }}>
              {t.itemsAssessed(assessed, ALL_KEYS.length)}
            </span>
            {allAssessed && (
              <StatusTag tone={failItems.length > 0 ? 'danger' : 'success'}>
                {failItems.length > 0
                  ? t.someFailed(failItems.length)
                  : t.allPassed}
              </StatusTag>
            )}
          </div>
          <Progress
            size="small"
            showInfo={false}
            percent={Math.round((assessed / ALL_KEYS.length) * 100)}
            status={failItems.length > 0 ? 'exception' : 'normal'}
          />
        </div>
        <Button type="primary" onClick={handlePassAll}>
          {t.passAll}
        </Button>
      </div>
    </CardComponent>
  )
}
