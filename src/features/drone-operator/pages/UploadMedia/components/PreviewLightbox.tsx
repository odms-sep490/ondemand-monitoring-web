import { operatorMediaApi } from '../../../../media/api/operatorMediaApi'
import { uploadMediaPageMessages } from '../UploadMediaPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { RefObject, Dispatch, SetStateAction } from 'react'
import type { LocalMedia } from '../../../../media/api/operatorMediaApi'

export function PreviewLightbox({
  previewDialog,
  setPreview,
  preview,
}: {
  previewDialog: RefObject<HTMLDialogElement | null>
  setPreview: Dispatch<SetStateAction<LocalMedia | null>>
  preview: LocalMedia
}) {
  const { t } = useI18n(uploadMediaPageMessages)
  return (
    <dialog
      ref={previewDialog}
      className="upload-media-lightbox"
      aria-label={t.enlargePreview}
      onClose={() => setPreview(null)}
    >
      <button
        type="button"
        className="odm-btn"
        onClick={() => previewDialog.current?.close()}
      >
        {t.closePreview}
      </button>
      <img
        src={operatorMediaApi.previewUrl(preview.localMediaId)}
        alt={preview.fileName}
      />
    </dialog>
  )
}
