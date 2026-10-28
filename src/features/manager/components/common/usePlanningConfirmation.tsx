import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { commonMiscMessages } from './commonMisc.messages'
import { Modal } from '../../../../shared/components/ui/Modal'

type Confirmation = {
  title: string
  body: string
  action?: string
  /** `danger` styles the dialog and confirm button for destructive actions. */
  tone?: 'warning' | 'danger'
}

/** Reuses the app dialog/focus trap. Resolve cancellation on unmount; no native browser UI. */
export function usePlanningConfirmation() {
  const { t } = useI18n(commonMiscMessages)
  const [question, setQuestion] = useState<Confirmation | null>(null)
  const resolve = useRef<((accepted: boolean) => void) | null>(null)
  const confirm = useCallback(
    (next: Confirmation) =>
      new Promise<boolean>((done) => {
        if (resolve.current) {
          done(false)
          return
        }
        resolve.current = done
        setQuestion(next)
      }),
    [],
  )
  useEffect(
    () => () => {
      resolve.current?.(false)
      resolve.current = null
    },
    [],
  )
  function answer(accepted: boolean) {
    const done = resolve.current
    resolve.current = null
    setQuestion(null)
    done?.(accepted)
  }
  const dialog = question ? (
    <Modal
      title={question.title}
      tone={question.tone ?? 'warning'}
      onClose={() => answer(false)}
      footer={
        <>
          <Button variant="ghost" onClick={() => answer(false)}>
            {t.cancel}
          </Button>
          <Button
            variant={question.tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => answer(true)}
          >
            {question.action ?? t.confirm}
          </Button>
        </>
      }
    >
      <p>{question.body}</p>
    </Modal>
  ) : null
  return { confirm, dialog }
}
