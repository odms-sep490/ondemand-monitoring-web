import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal } from '../../../../shared/components/ui/Modal'

type Confirmation = { title: string; body: string; action?: string }

/** Reuses the app dialog/focus trap. Resolve cancellation on unmount; no native browser UI. */
export function usePlanningConfirmation() {
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
      tone="warning"
      onClose={() => answer(false)}
      footer={
        <>
          <button
            type="button"
            className="odm-btn"
            onClick={() => answer(false)}
          >
            Hủy
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => answer(true)}
          >
            {question.action ?? 'Xác nhận'}
          </button>
        </>
      }
    >
      <p>{question.body}</p>
    </Modal>
  ) : null
  return { confirm, dialog }
}
