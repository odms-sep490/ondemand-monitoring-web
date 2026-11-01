import { Button, Skeleton } from 'antd'
import { useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { AdminModal } from '../../components/common/AdminModal'
import {
  checklistsApi,
  type ChecklistDefinition,
} from '../../api/checklistsApi'
import { checklistMessages } from './checklists.messages'
import { checklistError } from './checklistError'
import { ChecklistLoadError } from './ChecklistUi'
import {
  ChecklistConfigForm,
  type ConfigServiceContext,
} from './ChecklistConfigForm'
import { ChecklistHistoryPanel } from './ChecklistHistoryPanel'

export type { ConfigServiceContext }

/**
 * The one place a checklist is configured: content, price and, when opened from a service template, how that
 * service uses it. The change history is one click away but is not a second place to edit.
 */
export function ChecklistConfigModal({
  checklist,
  service,
  close,
  saved,
}: {
  /** The library row; omit to create a new checklist, or when only `service` is known. */
  checklist?: ChecklistDefinition
  service?: ConfigServiceContext
  close: () => void
  saved: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const creating = !checklist && !service
  const checklistId = checklist?.id ?? service?.row.checklistId
  const [showHistory, setShowHistory] = useState(false)
  return (
    <AdminModal
      width={720}
      title={creating ? t.add : t.configTitle}
      subtitle={
        service
          ? `${service.name} · ${service.row.content}`
          : checklist?.content
      }
      onClose={close}
    >
      {checklistId && (
        <div className="checklist-modal-tools">
          <Button
            htmlType="button"
            type="text"
            size="small"
            aria-pressed={showHistory}
            onClick={() => setShowHistory((value) => !value)}
          >
            {showHistory ? t.historyBack : t.tabHistory}
          </Button>
        </div>
      )}
      {showHistory && checklistId ? (
        <ChecklistHistoryPanel checklistId={checklistId} />
      ) : checklist || creating ? (
        <ChecklistConfigForm
          key={checklist?.id ?? 'new'}
          row={checklist}
          service={service}
          close={close}
          saved={saved}
        />
      ) : (
        service && (
          <ServiceFormLoader service={service} close={close} saved={saved} />
        )
      )}
    </AdminModal>
  )
}

/** Opened from a service: loads the library checklist, then shows the form with this service's column. */
function ServiceFormLoader({
  service,
  close,
  saved,
}: {
  service: ConfigServiceContext
  close: () => void
  saved: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const query = useApiQuery(
    (signal) => checklistsApi.get(service.row.checklistId, signal),
    [service.row.checklistId],
  )
  if (query.loading) return <Skeleton active aria-busy="true" />
  if (query.error !== undefined || !query.data)
    return (
      <ChecklistLoadError
        title={t.catalogLoadError}
        error={query.error}
        retry={query.reload}
      />
    )
  const definition = query.data
  return (
    <ChecklistConfigForm
      key={definition.id}
      row={definition}
      service={service}
      close={close}
      saved={saved}
      extra={
        (definition.usedByServiceCount ?? 0) > 1 ? (
          <ForkOffer
            serviceId={service.id}
            checklistId={definition.id}
            done={saved}
          />
        ) : undefined
      }
    />
  )
}

/** "Only change it for this service": copies the shared checklist for this service instead of editing the original. */
function ForkOffer({
  serviceId,
  checklistId,
  done,
}: {
  serviceId: string
  checklistId: string
  done: () => void
}) {
  const { t } = useI18n(checklistMessages)
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function fork() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await checklistsApi.fork(serviceId, checklistId)
      done()
    } catch (cause) {
      setError(checklistError(cause, t))
      setBusy(false)
    }
  }
  return (
    <div className="checklist-fork">
      <span>{t.forkTitle}</span>
      {confirming ? (
        <div className="checklist-form-actions">
          <span>{t.forkConfirm}</span>
          <Button
            htmlType="button"
            type="text"
            disabled={busy}
            onClick={() => setConfirming(false)}
          >
            {t.cancel}
          </Button>
          <Button
            htmlType="button"
            type="primary"
            disabled={busy}
            onClick={() => void fork()}
          >
            {busy ? t.forking : t.fork}
          </Button>
        </div>
      ) : (
        <Button
          htmlType="button"
          size="small"
          title={t.forkHint}
          onClick={() => setConfirming(true)}
        >
          {t.fork}
        </Button>
      )}
      {error && (
        <p className="checklist-banner is-error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
