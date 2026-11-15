import './ImagePreview.css'
import { Image } from 'antd'
import {
  cloneElement,
  useEffect,
  useState,
  type ReactElement,
  type ImgHTMLAttributes,
  type ReactNode,
} from 'react'
import { defineMessages, useI18n } from '../../i18n'
import { useMediaRecovery, type MediaRecoveryProps } from './useMediaRecovery'
import { MediaRecoveryNotice } from './MediaRecovery'

const imagePreviewMessages = defineMessages({
  vi: {
    openImage: (name: string) => `Phóng to ảnh ${name}`,
    zoomImage: 'Phóng to ảnh',
  },
  en: {
    openImage: (name: string) => `Enlarge image ${name}`,
    zoomImage: 'Enlarge image',
  },
})

export type ImagePreviewProps = MediaRecoveryProps & {
  previewSrc?: string
  fileName: string
  visible?: boolean
  onVisibleChange?: (visible: boolean) => void
  toolbarExtra?: ReactNode
  viewerOnly?: boolean
  className?: string
  statusContent?: ReactNode
  onError?: () => void
}
export function ImagePreview(props: ImagePreviewProps) {
  return (
    <ImagePreviewContent key={props.mediaId ?? props.fileName} {...props} />
  )
}
function ImagePreviewContent(props: ImagePreviewProps) {
  const { t } = useI18n(imagePreviewMessages)
  const [internalVisible, setInternalVisible] = useState(false)
  const visible = props.visible ?? internalVisible
  const setVisible = (next: boolean) => {
    setInternalVisible(next)
    props.onVisibleChange?.(next)
  }
  const small = useMediaRecovery({ ...props, alternateSrc: props.previewSrc })
  const large = useMediaRecovery({
    ...props,
    src: props.previewSrc ?? props.src,
  })
  const recovery = visible ? large : small
  useEffect(() => {
    if (
      visible &&
      recovery.source &&
      !props.statusContent &&
      !recovery.loading &&
      !recovery.failed &&
      !recovery.paused
    )
      recovery.startLoad()
    return recovery.stopLoad
  }, [
    visible,
    recovery.source,
    recovery.loading,
    recovery.failed,
    recovery.paused,
    props.statusContent,
  ])
  const notice =
    props.statusContent ??
    (recovery.loading || recovery.failed || recovery.paused ? (
      <MediaRecoveryNotice recovery={recovery} />
    ) : null)
  if (notice && !visible) return notice
  return (
    <button
      type="button"
      className={`shared-image-preview${props.className ? ` ${props.className}` : ''}`}
      style={props.viewerOnly ? { display: 'none' } : undefined}
      aria-label={t.openImage(props.fileName)}
      onClick={(event) => {
        if (!event.currentTarget.contains(event.target as Node)) return
        event.preventDefault()
        event.stopPropagation()
        setVisible(true)
      }}
    >
      <Image
        src={small.source || undefined}
        alt={props.fileName}
        loading="lazy"
        onLoad={small.completeLoad}
        onError={props.onError ?? small.onError}
        preview={{
          src: large.source || undefined,
          visible,
          onVisibleChange: setVisible,
          mask: t.zoomImage,
          destroyOnHidden: true,
          toolbarRender: notice
            ? () => null
            : props.toolbarExtra
              ? (originalNode) => (
                  <>
                    {originalNode}
                    {props.toolbarExtra}
                  </>
                )
              : undefined,
          imageRender: (node) => {
            const image = node as ReactElement<
              ImgHTMLAttributes<HTMLImageElement>
            >
            if (notice) return notice
            return cloneElement(image, {
              onError: (event) => {
                image.props.onError?.(event)
                if (props.onError) props.onError()
                else large.onError()
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
