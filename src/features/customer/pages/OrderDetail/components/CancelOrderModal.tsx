import { MockDataBadge, Modal } from '../../../components/common/ui'
import { useI18n } from '../../../../../shared/i18n'
import { cancelOrderModalMessages } from './CancelOrderModal.messages'

type Props = {
  orderTitle: string
  cancelling: boolean
  error: string | null
  onConfirm: () => void
  onClose: () => void
}

/** Danger confirmation for the (mock-only) cancel action. */
export function CancelOrderModal({ orderTitle, cancelling, error, onConfirm, onClose }: Props) {
  const { t } = useI18n(cancelOrderModalMessages)

  const footer = (
    <>
      <button type="button" className="odm-btn odm-btn-gh" onClick={onClose} disabled={cancelling}>
        {t.keep}
      </button>
      <button type="button" className="odm-btn is-danger" onClick={onConfirm} disabled={cancelling}>
        {cancelling ? t.cancelling : t.confirm}
      </button>
    </>
  )

  return (
    <Modal
      title={t.title}
      subtitle={t.subtitle}
      icon="shield"
      tone="danger"
      width={480}
      onClose={() => !cancelling && onClose()}
      footer={footer}
    >
      <p className="od-modal-text">{t.body(orderTitle)}</p>
      <MockDataBadge />
      {error && (
        <div className="od-notice is-danger" role="alert">
          {error}
        </div>
      )}
    </Modal>
  )
}
