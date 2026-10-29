import { Button } from 'antd'
import type { Dispatch, RefObject, SetStateAction } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { operatorMediaApi } from '../../../../media/api/operatorMediaApi'
import type { LocalMedia } from '../../../../media/api/operatorMediaApi'
import { uploadMediaPageMessages } from '../UploadMediaPage.messages'

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
      className="stf-lightbox"
      aria-label={t.enlargePreview}
      onClose={() => setPreview(null)}
    >
      <Button onClick={() => previewDialog.current?.close()}>
        {t.closePreview}
      </Button>
      <img
        src={operatorMediaApi.previewUrl(preview.localMediaId)}
        alt={preview.fileName}
      />
    </dialog>
  )
}
