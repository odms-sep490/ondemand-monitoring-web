import { UploadOutlined } from '@ant-design/icons'
import { Button, Upload } from 'antd'

import { useI18n } from '../../../../../shared/i18n'
import { AdminField } from '../../../components/common/AdminField'
import { SERVICE_IMAGE_TYPES } from '../../../lib/serviceImage'
import { serviceModalMessages } from './ServiceModal.messages'

/** Picture picker of the service form: preview, antd Upload (nothing is sent until the form is saved) and remove. */
export function ServiceImageField({
  preview,
  removable,
  busy,
  error,
  onPick,
  onRemove,
}: {
  preview: string | null
  removable: boolean
  busy: boolean
  error?: string
  onPick: (file: File) => void
  onRemove: () => void
}) {
  const { t } = useI18n(serviceModalMessages)
  return (
    <AdminField id="adm-svc-image" label={t.image} error={error}>
      <div className="adm-service-image">
        {preview && <img src={preview} alt={t.image} />}
        <Upload
          id="adm-svc-image"
          accept={SERVICE_IMAGE_TYPES.join(',')}
          showUploadList={false}
          disabled={busy}
          beforeUpload={(file) => {
            onPick(file)
            return false
          }}
        >
          <Button
            htmlType="button"
            size="small"
            disabled={busy}
            icon={<UploadOutlined aria-hidden="true" aria-label={undefined} />}
          >
            {t.chooseImage}
          </Button>
        </Upload>
        <small className="adm-check-hint">{t.imageHint}</small>
        {removable && (
          <Button size="small" disabled={busy} onClick={onRemove}>
            {t.removeImage}
          </Button>
        )}
      </div>
    </AdminField>
  )
}
