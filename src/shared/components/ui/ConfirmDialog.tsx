import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { useI18n } from '../../i18n'
import { Button } from './Button'
import { confirmMessages } from './ConfirmDialog.messages'
import { Modal } from './Modal'

export type ConfirmTone = 'danger' | 'primary'

export type ConfirmOptions = {
  title: ReactNode
  description?: ReactNode
  confirmLabel?: ReactNode
  cancelLabel?: ReactNode
  tone?: ConfirmTone
}

type DialogProps = ConfirmOptions & {
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Confirmation dialog built on Modal. Use directly, or via `useConfirm()`. */
export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}: DialogProps) {
  const { t } = useI18n(confirmMessages)
  return (
    <Modal
      title={title}
      icon={tone === 'danger' ? 'trash' : 'shield'}
      tone={tone === 'danger' ? 'danger' : 'primary'}
      width={420}
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel ?? t.cancel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel ?? t.confirm}
          </Button>
        </>
      }
    >
      {description ? <p className="ui-confirm-desc">{description}</p> : null}
    </Modal>
  )
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>

/** Without a provider, confirming resolves true so flows keep working. */
const ConfirmContext = createContext<ConfirmFn>(() => Promise.resolve(true))

export function useConfirm(): ConfirmFn {
  return useContext(ConfirmContext)
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const resolver = useRef<((v: boolean) => void) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => {
    resolver.current?.(false)
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve
      setOptions(opts)
    })
  }, [])

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value)
    resolver.current = null
    setOptions(null)
  }, [])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options ? (
        <ConfirmDialog
          {...options}
          onConfirm={() => settle(true)}
          onCancel={() => settle(false)}
        />
      ) : null}
    </ConfirmContext.Provider>
  )
}
