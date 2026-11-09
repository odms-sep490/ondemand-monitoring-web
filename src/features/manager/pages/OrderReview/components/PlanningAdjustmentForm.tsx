import type { Dispatch, SetStateAction } from 'react'
import { Button } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { planningAdjustmentFormMessages } from './PlanningAdjustmentForm.messages'

export function PlanningAdjustmentForm({
  mutate,
  reason,
  setReason,
  busy,
  setAmending,
}: {
  mutate: (
    action: 'finalize' | 'amend' | 'cancel',
    missionId?: string | undefined,
  ) => Promise<void>
  reason: string
  setReason: Dispatch<SetStateAction<string>>
  busy: boolean
  setAmending: Dispatch<SetStateAction<boolean>>
}) {
  const { t } = useI18n(planningAdjustmentFormMessages)
  return (
    <form
      className="odm-planning-adjustment"
      onSubmit={(e) => {
        e.preventDefault()
        void mutate('amend')
      }}
    >
      <h3>{t.title}</h3>
      <p>{t.intro}</p>
      <label>
        {t.reasonLabel}
        <textarea
          required
          autoFocus
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </label>
      <Button type="submit" variant="primary" disabled={busy || !reason.trim()}>
        {t.confirm}
      </Button>
      <Button type="button" onClick={() => setAmending(false)}>
        {t.close}
      </Button>
    </form>
  )
}
