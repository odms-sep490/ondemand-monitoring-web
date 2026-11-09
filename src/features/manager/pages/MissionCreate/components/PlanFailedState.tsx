import { missionCreatePageMessages } from '../MissionCreatePage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { Dispatch, SetStateAction } from 'react'
import type { SubmitState } from '../createMissionTypes'
import { Button } from '../../../../../shared/components/ui'

export function PlanFailedState({
  submit,
  setSubmit,
}: {
  submit: { kind: 'planFailed'; message: string }
  setSubmit: Dispatch<SetStateAction<SubmitState>>
}) {
  const { t } = useI18n(missionCreatePageMessages)
  return (
    <div className="odm-or-card">
      <div className="odm-mgr-review-error">
        <div className="odm-mgr-review-error-icon" aria-hidden="true">
          !
        </div>
        <div style={{ fontSize: 15, fontWeight: 600 }}>{t.planFailedTitle}</div>
        <div style={{ color: 'var(--tx3)', maxWidth: 420, lineHeight: 1.5 }}>
          {t.planFailedBody}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--tx3)',
            background: 'var(--sf3)',
            padding: '3px 8px',
            borderRadius: 5,
          }}
        >
          {submit.message}
        </div>
        <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
          <Button
            type="button"
            variant="primary"
            onClick={() => setSubmit({ kind: 'idle' })}
          >
            {t.retry}
          </Button>
        </div>
      </div>
    </div>
  )
}
