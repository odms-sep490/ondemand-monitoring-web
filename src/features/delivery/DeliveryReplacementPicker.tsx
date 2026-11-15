import { VideoThumbnail } from '../../shared/components/media/VideoThumbnail'
import { useState } from 'react'
import { Button, Modal, Radio, Typography } from 'antd'
import { SwapOutlined } from '@ant-design/icons'
import type { ChecklistDeliveryAsset } from './api'
import { useI18n } from '../../shared/i18n'
import { managerDeliveryPanelMessages } from './managerDeliveryPanel.messages'
import { ImagePreview } from '../../shared/components/media/ImagePreview'
import './DeliveryReplacementPicker.css'

function Preview({ asset }: { asset: ChecklistDeliveryAsset }) {
  const { t } = useI18n(managerDeliveryPanelMessages)
  if (!asset.previewUrl)
    return (
      <div className="delivery-replacement-unavailable">
        {t.replacementPreviewUnavailable}
      </div>
    )
  return asset.type.toUpperCase().includes('VIDEO') ? (
    <VideoThumbnail src={asset.previewUrl} poster={asset.thumbnailUrl} fallbackUrl={null} fileName={asset.fileName} fileSize={asset.size} original={asset.previewStatus !== 'READY'} />
  ) : (
    <ImagePreview
      src={asset.thumbnailUrl ?? asset.previewUrl}
      fallbackUrl={null}
      fileSize={asset.size}
      original={asset.previewStatus !== 'READY'}
      previewSrc={asset.previewUrl}
      fileName={asset.fileName}
    />
  )
}

export function DeliveryReplacementPicker({
  source,
  options,
  selectedId,
  disabled,
  rework,
  onChange,
}: {
  source: ChecklistDeliveryAsset
  options: ChecklistDeliveryAsset[]
  selectedId?: string
  disabled: boolean
  rework?: boolean
  onChange: (mediaId: string | undefined) => void
}) {
  const { t } = useI18n(managerDeliveryPanelMessages)
  const [open, setOpen] = useState(false)
  const [draftId, setDraftId] = useState<string | undefined>()
  const selected = options.find((asset) => asset.mediaAssetId === selectedId)
  const candidate = options.find((asset) => asset.mediaAssetId === draftId)
  const title = rework ? t.chooseReworkMedia : t.chooseReplacement
  return (
    <div className="delivery-replacement-picker">
      {selected && (
        <div className="delivery-replacement-selection">
          <span className="delivery-replacement-caption">
            {t.replacementSelected}
          </span>
          <div className="delivery-replacement-selection-body">
            <Preview asset={selected} />
            <div className="delivery-replacement-meta">
              <strong title={selected.fileName}>{selected.fileName}</strong>
              <small>{selected.missionCode}</small>
            </div>
          </div>
        </div>
      )}
      <Button
        block
        icon={<SwapOutlined aria-hidden="true" />}
        disabled={disabled || options.length === 0}
        onClick={() => {
          setDraftId(selectedId)
          setOpen(true)
        }}
      >
        {selected ? t.changeReplacement : title}
      </Button>
      {selectedId && (
        <Button
          type="text"
          size="small"
          disabled={disabled}
          onClick={() => onChange(undefined)}
        >
          {t.clearReplacement}
        </Button>
      )}
      <Modal
        open={open}
        title={title}
        width={820}
        className="delivery-replacement-modal"
        destroyOnHidden
        onCancel={() => setOpen(false)}
        onOk={() => {
          if (disabled || !candidate || candidate.accessReason) return
          onChange(candidate.mediaAssetId)
          setOpen(false)
        }}
        okText={t.confirmReplacement}
        cancelText={t.cancelReplacement}
        okButtonProps={{
          disabled: disabled || !candidate || !!candidate.accessReason,
        }}
      >
        <p className="delivery-replacement-help">
          {rework ? t.reworkMediaHelp : t.replacementHelp}
        </p>
        <div className="delivery-replacement-source">
          <Preview asset={source} />
          <div className="delivery-replacement-meta">
            <span className="delivery-replacement-caption">
              {t.replacementSource}
            </span>
            <strong title={source.fileName}>{source.fileName}</strong>
            <small>{source.missionCode}</small>
          </div>
        </div>
        <Radio.Group
          value={draftId}
          onChange={(event) => setDraftId(event.target.value)}
          className="delivery-replacement-options"
          aria-label={title}
        >
          {options.map((asset) => (
            <article
              className={`delivery-replacement-option${asset.mediaAssetId === draftId ? ' is-selected' : ''}`}
              key={asset.mediaAssetId}
            >
              <Preview asset={asset} />
              <div className="delivery-replacement-meta">
                <Typography.Text ellipsis={{ tooltip: asset.fileName }}>
                  {asset.fileName}
                </Typography.Text>
                <small>{asset.missionCode}</small>
              </div>
              <Radio
                value={asset.mediaAssetId}
                aria-label={`${t.selectReplacement}: ${asset.fileName}`}
                disabled={disabled || !!asset.accessReason || !asset.previewUrl}
              >
                {t.selectReplacement}
              </Radio>
            </article>
          ))}
        </Radio.Group>
      </Modal>
    </div>
  )
}
