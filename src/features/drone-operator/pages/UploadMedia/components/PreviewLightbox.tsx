import { staffMediaSources } from '../../../../media/upload/staffMediaSources'
import { ImagePreview } from '../../../../../shared/components/media/ImagePreview'
import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { LocalMedia } from '../../../../media/api/operatorMediaApi'

export function PreviewLightbox({
  setPreview,
  preview,
}: {
  setPreview: Dispatch<SetStateAction<LocalMedia | null>>
  preview: LocalMedia
}) {
  const [failed, setFailed] = useState<string[]>([])
  const sources = staffMediaSources(preview).viewImages
  const source = sources.find((url) => !failed.includes(url))
  return (
    <ImagePreview
      src={source ?? ''}
      fileName={preview.fileName}
      viewerOnly
      visible
      onVisibleChange={(visible) => {
        if (!visible) setPreview(null)
      }}
      onError={() => {
        if (source) setFailed((previous) => [...previous, source])
      }}
    />
  )
}
