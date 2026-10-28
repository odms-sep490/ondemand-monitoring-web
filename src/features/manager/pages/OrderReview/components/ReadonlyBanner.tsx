import type { Dispatch, SetStateAction } from 'react'
import { Button } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { readonlyBannerMessages } from './ReadonlyBanner.messages'

export function ReadonlyBanner({
  setViewStage,
}: {
  setViewStage: Dispatch<
    SetStateAction<
      'intake' | 'criteria' | 'decision' | 'deposit' | 'planning' | null
    >
  >
}) {
  const { t } = useI18n(readonlyBannerMessages)
  return (
    <div className="odm-or-readonly-banner" role="status">
      <strong>{t.title}</strong>
      <span>{t.body}</span>
      <Button
        type="button"
        variant="primary"
        onClick={() => setViewStage(null)}
      >
        {t.back}
      </Button>
    </div>
  )
}
