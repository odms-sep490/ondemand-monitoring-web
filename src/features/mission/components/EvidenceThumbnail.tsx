import { PictureOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { VideoPoster } from '../../../shared/components/media/VideoThumbnail'
import type { MissionChecklistEvidence } from '../types/checklistExecution'

export function EvidenceThumbnail({
  link,
  alt = '',
}: {
  link: MissionChecklistEvidence
  alt?: string
}) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  if (link.mediaType === 'VIDEO')
    return <VideoPoster poster={link.thumbnailUrl} />
  const src = link.thumbnailUrl ?? link.previewUrl
  if (src && src !== failedUrl)
    return (
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setFailedUrl(src)}
      />
    )
  return <PictureOutlined aria-hidden="true" />
}
