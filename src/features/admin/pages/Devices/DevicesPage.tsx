import { PlusOutlined } from '@ant-design/icons'
import { Button, message } from 'antd'
import { useState } from 'react'

import {
  CardComponent,
  EmptyState,
  ErrorState,
  PageHeader,
} from '../../../../shared/components/antd'
import { useI18n } from '../../../../shared/i18n'
import { adminDevicesApi } from '../../api/adminDevicesApi'
import { deviceErrorMessage } from '../../lib/deviceError'
import { mapDevice } from '../../lib/deviceMappers'
import type { AdminDevice, DeviceFormValues } from '../../types/devices'
import { DeviceDetailDrawer } from './components/DeviceDetailDrawer'
import { DeviceFilters } from './components/DeviceFilters'
import { DeviceFormModal } from './components/DeviceFormModal'
import { DeviceStats } from './components/DeviceStats'
import { DevicesTable } from './components/DevicesTable'
import { devicesPageMessages } from './DevicesPage.messages'
import { useDevicesData } from './useDevicesData'

type FormState = { device: AdminDevice | null } | null

export function DevicesPage() {
  const { t } = useI18n(devicesPageMessages)
  const [messageApi, messageHolder] = message.useMessage()
  const {
    filters,
    changeFilters,
    keyword,
    page,
    setPage,
    size,
    setSize,
    list,
    stats,
    models,
    modelsFailed,
    refresh,
  } = useDevicesData()
  const [form, setForm] = useState<FormState>(null)
  const [viewing, setViewing] = useState<AdminDevice | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function submitForm(values: DeviceFormValues) {
    const editing = form?.device ?? null
    try {
      if (editing) {
        const updated = await adminDevicesApi.update(editing.id, values)
        setViewing((cur) => (cur?.id === editing.id ? mapDevice(updated) : cur))
        messageApi.success(t.updated)
      } else {
        await adminDevicesApi.create({ ...values })
        messageApi.success(t.created)
      }
      setForm(null)
      refresh()
    } catch (cause) {
      messageApi.error(deviceErrorMessage(cause, t))
      throw cause
    }
  }

  async function removeDevice(device: AdminDevice) {
    setDeletingId(device.id)
    try {
      await adminDevicesApi.remove(device.id)
      messageApi.success(t.deleted)
      if (list.data?.items.length === 1 && page > 1) setPage(page - 1)
      refresh()
    } catch (cause) {
      messageApi.error(deviceErrorMessage(cause, t))
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = Boolean(keyword || filters.status || filters.modelId)
  const data = list.data

  function renderBody() {
    if (list.error && !data)
      return <ErrorState error={list.error} onRetry={list.reload} />
    if (!list.loading && (!data || data.items.length === 0)) {
      return (
        <CardComponent>
          <EmptyState
            title={filtered ? t.emptyFiltered : t.emptyTitle}
            description={filtered ? t.emptyFilteredDesc : t.emptyDesc}
          />
        </CardComponent>
      )
    }
    return (
      <CardComponent styles={{ body: { padding: 0 } }}>
        <DevicesTable
          devices={data?.items ?? []}
          loading={list.loading}
          deletingId={deletingId}
          onView={setViewing}
          onEdit={(device) => setForm({ device })}
          onDelete={removeDevice}
          pagination={{
            current: page,
            pageSize: size,
            total: data?.totalItems ?? 0,
            onChange: (nextPage, nextSize) => {
              setPage(nextSize === size ? nextPage : 1)
              setSize(nextSize)
            },
          }}
        />
      </CardComponent>
    )
  }

  return (
    <div className="mgr-view">
      {messageHolder}
      <PageHeader
        title={t.title}
        description={t.subtitle}
        actions={
          <Button
            type="primary"
            icon={<PlusOutlined aria-hidden="true" aria-label={undefined} />}
            onClick={() => setForm({ device: null })}
          >
            {t.add}
          </Button>
        }
      />
      <DeviceStats stats={stats} />
      <DeviceFilters value={filters} models={models} onChange={changeFilters} />
      {renderBody()}
      <DeviceFormModal
        open={form !== null}
        device={form?.device ?? null}
        models={models}
        modelsFailed={modelsFailed}
        onCancel={() => setForm(null)}
        onSubmit={submitForm}
      />
      <DeviceDetailDrawer device={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
