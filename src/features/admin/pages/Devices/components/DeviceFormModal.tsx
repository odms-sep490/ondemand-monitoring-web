import { Form, Input, Modal, Select } from 'antd'
import { useEffect, useState } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import {
  DEVICE_STATUSES,
  type AdminDevice,
  type AdminDeviceModel,
  type DeviceFormValues,
} from '../../../types/devices'
import { devicesPageMessages } from '../DevicesPage.messages'

type Props = {
  open: boolean
  /** `null` creates a new device, otherwise edits it. */
  device: AdminDevice | null
  models: AdminDeviceModel[]
  modelsFailed: boolean
  onCancel: () => void
  onSubmit: (values: DeviceFormValues) => Promise<void>
}

export function DeviceFormModal({
  open,
  device,
  models,
  modelsFailed,
  onCancel,
  onSubmit,
}: Props) {
  const { t } = useI18n(devicesPageMessages)
  const [form] = Form.useForm<DeviceFormValues>()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    form.resetFields()
    form.setFieldsValue({
      serialNumber: device?.serialNumber ?? '',
      name: device && device.name !== device.serialNumber ? device.name : '',
      modelId: device?.model?.id,
      status: device?.status ?? 'AVAILABLE',
    })
  }, [open, device, form])

  async function submit() {
    const values = await form.validateFields()
    setBusy(true)
    try {
      await onSubmit({
        ...values,
        serialNumber: values.serialNumber.trim(),
        name: values.name?.trim() || undefined,
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title={device ? t.editTitle : t.createTitle}
      okText={t.save}
      cancelText={t.cancel}
      confirmLoading={busy}
      onOk={() => void submit().catch(() => undefined)}
      onCancel={onCancel}
      destroyOnClose
      forceRender
    >
      <Form form={form} layout="vertical" requiredMark autoComplete="off">
        <Form.Item
          name="serialNumber"
          label={t.fieldSerial}
          rules={[
            { required: true, whitespace: true, message: t.requiredSerial },
            { max: 64, message: t.serialMax },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="name"
          label={t.fieldName}
          rules={[{ max: 120, message: t.nameMax }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="modelId"
          label={t.fieldModel}
          rules={[{ required: true, message: t.requiredModel }]}
          extra={modelsFailed ? t.modelsError : undefined}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder={t.selectModel}
            options={models.map((m) => ({
              value: m.id,
              label: m.name,
            }))}
          />
        </Form.Item>
        <Form.Item
          name="status"
          label={t.fieldStatus}
          rules={[{ required: true, message: t.requiredStatus }]}
        >
          <Select
            options={DEVICE_STATUSES.map((s) => ({
              value: s,
              label: t.statuses[s],
            }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
