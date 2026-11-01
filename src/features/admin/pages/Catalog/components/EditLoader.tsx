import { Alert, Button, Skeleton } from 'antd'
import type { ReactNode } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { AdminModal } from '../../../components/common/AdminModal'
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
    <AdminModal title={title} onClose={onClose}>
      {error === undefined ? (
        <div aria-busy="true">
          <Skeleton active paragraph={{ rows: 3 }} />
          <span className="odm-visually-hidden">{t.loading}</span>
        </div>
      ) : (
        <Alert
          type="error"
          showIcon
          message={error instanceof Error ? error.message : String(error)}
          action={
            <Button size="small" onClick={reload}>
              {t.retry}
            </Button>
          }
        />
      )}
    </AdminModal>
  )
}
