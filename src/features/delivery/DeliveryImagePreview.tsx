import './DeliveryImagePreview.css'
import { Image } from 'antd'
import {
  cloneElement,
  useEffect,
  useState,
  type ReactElement,
  type ImgHTMLAttributes,
} from 'react'
import { useI18n } from '../../shared/i18n'
import { customerDeliveryPanelMessages } from './customerDeliveryPanel.messages'
import {
  useMediaRecovery,
  type MediaRecoveryProps,
} from '../../shared/components/media/useMediaRecovery'
import { MediaRecoveryNotice } from '../../shared/components/media/MediaRecovery'

type Props = MediaRecoveryProps & { previewSrc?: string; fileName: string }
export function DeliveryImagePreview(props: Props) {
  return (
    <ImagePreview
      key={`${props.mediaId ?? ''}:${props.src}:${props.previewSrc ?? ''}`}
      {...props}
    />
  )
}
function ImagePreview(props: Props) {
  const { t } = useI18n(customerDeliveryPanelMessages)
  const [visible, setVisible] = useState(false)
  const small = useMediaRecovery({ ...props, alternateSrc: props.previewSrc })
  const large = useMediaRecovery({
    ...props,
    src: props.previewSrc ?? props.src,
  })
  const recovery = visible ? large : small
  useEffect(() => {
    if (visible && !recovery.loading && !recovery.failed && !recovery.paused)
      recovery.startLoad()
    return recovery.stopLoad
  }, [
    visible,
    recovery.source,
    recovery.loading,
    recovery.failed,
    recovery.paused,
  ])
  if (recovery.loading || recovery.failed || recovery.paused)
    return <MediaRecoveryNotice recovery={recovery} />
  return (
    <button
      type="button"
      className="delivery-image-preview"
      aria-label={t.openImage(props.fileName)}
      onClick={(event) => {
        if (!event.currentTarget.contains(event.target as Node)) return
        event.preventDefault()
        event.stopPropagation()
        setVisible(true)
      }}
    >
      <Image
        src={small.source}
        alt={props.fileName}
        loading="lazy"
        onLoad={small.completeLoad}
        onError={small.onError}
        preview={{
          src: large.source,
          visible,
          onVisibleChange: setVisible,
          mask: t.zoomImage,
          destroyOnHidden: true,
          imageRender: (node) => {
            const image = node as ReactElement<
              ImgHTMLAttributes<HTMLImageElement>
            >
            return cloneElement(image, {
              onError: (event) => {
                image.props.onError?.(event)
                large.onError()
              },
              onLoad: (event) => {
                image.props.onLoad?.(event)
                large.completeLoad()
              },
            })
          },
        }}
      />
    </button>
  )
}
