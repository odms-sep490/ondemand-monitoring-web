import './DeliveryImagePreview.css'
import { Image } from 'antd'
import { useState } from 'react'
import { useI18n } from '../../shared/i18n'
import { customerDeliveryPanelMessages } from './customerDeliveryPanel.messages'

export function DeliveryImagePreview({
  src,
  previewSrc,
  fileName,
}: {
  src: string
  previewSrc?: string
  fileName: string
}) {
  const { t } = useI18n(customerDeliveryPanelMessages)
  const [visible, setVisible] = useState(false)

  return (
    <button
      type="button"
      className="delivery-image-preview"
      aria-label={t.openImage(fileName)}
      onClick={(event) => {
        // Preview controls render in a portal; their clicks must not reopen it.
        if (!event.currentTarget.contains(event.target as Node)) return
        event.preventDefault()
        event.stopPropagation()
        setVisible(true)
      }}
    >
      <Image
        src={src}
        alt={fileName}
        loading="lazy"
        preview={{
          src: previewSrc ?? src,
          visible,
          onVisibleChange: setVisible,
          mask: t.zoomImage,
          destroyOnHidden: true,
        }}
      />
    </button>
  )
}
