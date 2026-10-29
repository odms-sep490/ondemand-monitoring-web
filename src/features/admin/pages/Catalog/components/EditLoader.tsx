import { Alert, Button, Modal, Skeleton } from 'antd'
import type { ReactNode } from 'react'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { editLoaderMessages } from './EditLoader.messages'

type Props<T> = {
  title: string
  /** Fetches the record from the BE; omit for the create flow. */
  load?: (signal: AbortSignal) => Promise<T>
  onClose: () => void
  children: (initial: T | undefined) => ReactNode
}

/** Loads the record for an edit modal, then renders the form modal. */
export function EditLoader<T>({ title, load, onClose, children }: Props<T>) {
  const { t } = useI18n(editLoaderMessages)
  const { data, error, reload } = useApiQuery<T | undefined>(
    (signal) => (load ? load(signal) : Promise.resolve(undefined)),
    [],
  )
  if (!load || data !== undefined) return <>{children(data)}</>
  return (
    <Modal
      open
      centered
      getContainer={mgrPopupContainer}
      title={title}
      onCancel={onClose}
      footer={null}
    >
      {error === undefined ? (
        <div aria-busy="true">
          <Skeleton active paragraph={{ rows: 4 }} />
          <span className="odm-visually-hidden">{t.loading}</span>
        </div>
      ) : (
        <Alert
          type="error"
          showIcon
          role="alert"
          message={error instanceof Error ? error.message : String(error)}
          action={
            <Button size="small" onClick={reload}>
              {t.retry}
            </Button>
          }
        />
      )}
    </Modal>
  )
}
