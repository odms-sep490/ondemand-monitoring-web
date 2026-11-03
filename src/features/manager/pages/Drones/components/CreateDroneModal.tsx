import { useState } from 'react'
import { Alert, Button, Form, Input, Modal, Select, Upload } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { UploadFile, UploadProps } from 'antd'

import { useToast } from '../../../../../shared/components/ui'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { dronesApi } from '../../../api/dronesApi'
import type { DeviceCreateRequest, DeviceResponse } from '../../../types/drones'
import { dronesPageMessages } from '../DronesPage.messages'

type Props = {
  onClose: () => void
  onCreated: (device: DeviceResponse) => void
}

export function CreateDroneModal({ onClose, onCreated }: Props) {
  const { t } = useI18n(dronesPageMessages)
  const toast = useToast()
  const [form] = Form.useForm<DeviceCreateRequest>()
  const models = useApiQuery(
    (signal) => dronesApi.listDeviceModels({ signal }),
    [],
  )
  const [image, setImage] = useState<File | undefined>()
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const beforeUpload: UploadProps['beforeUpload'] = (file) => {
    if (file.size > 5 * 1024 * 1024) {
      setError(t.createModal.imageTooLarge)
      return Upload.LIST_IGNORE
    }
    setError(null)
    setImage(file)
    setFileList([file])
    return false
  }

  async function handleCreate(values: DeviceCreateRequest) {
    setSaving(true)
    setError(null)
    try {
      const created = await dronesApi.createDrone(values, image)
      toast.success(t.createModal.created)
      onCreated(created)
    } catch (failure) {
      const message =
        failure instanceof Error ? failure.message : t.unknownError
      setError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const modelOptions = (models.data?.items ?? []).map((model) => ({
    value: model.id,
    label: `${model.modelName || model.code}${model.manufacturer ? ` · ${model.manufacturer}` : ''}`,
  }))

  return (
    <Modal
      open
      centered
      width={520}
      title={t.createModal.title}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={saving}>
          {t.createModal.cancel}
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<PlusOutlined />}
          loading={saving}
          disabled={models.loading || modelOptions.length === 0}
          onClick={() => form.submit()}
        >
          {saving ? t.createModal.saving : t.createModal.save}
        </Button>,
      ]}
    >
      <Form<DeviceCreateRequest>
        form={form}
        layout="vertical"
        requiredMark="optional"
        onFinish={handleCreate}
      >
        <Form.Item
          name="serialNumber"
          label={t.createModal.serial}
          rules={[{ required: true, message: t.createModal.serialRequired }]}
        >
          <Input maxLength={100} autoComplete="off" />
        </Form.Item>
        <Form.Item
          name="name"
          label={t.createModal.name}
          rules={[{ required: true, message: t.createModal.nameRequired }]}
        >
          <Input maxLength={100} />
        </Form.Item>
        <Form.Item
          name="modelId"
          label={t.createModal.model}
          rules={[{ required: true, message: t.createModal.modelRequired }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            loading={models.loading}
            placeholder={
              models.loading ? t.createModal.modelLoading : undefined
            }
            options={modelOptions}
            disabled={models.loading || modelOptions.length === 0}
          />
        </Form.Item>
        {models.error ? (
          <Alert
            type="error"
            showIcon
            message={
              models.error instanceof Error ? models.error.message : t.loadError
            }
          />
        ) : null}
        {!models.loading && !models.error && modelOptions.length === 0 ? (
          <Alert type="info" showIcon message={t.createModal.modelEmpty} />
        ) : null}
        <Form.Item label={t.createModal.image} extra={t.createModal.imageHint}>
          <Upload
            accept="image/jpeg,image/png,image/webp"
            beforeUpload={beforeUpload}
            fileList={fileList}
            maxCount={1}
            onRemove={() => {
              setImage(undefined)
              setFileList([])
            }}
          >
            <Button>{t.createModal.chooseImage}</Button>
          </Upload>
        </Form.Item>
        {error ? (
          <Alert type="error" showIcon role="alert" message={error} />
        ) : null}
      </Form>
    </Modal>
  )
}
