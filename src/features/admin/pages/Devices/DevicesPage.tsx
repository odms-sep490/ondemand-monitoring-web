import { PlusOutlined } from '@ant-design/icons'
import { Button, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'

import {
  CardComponent,
  EmptyState,
  ErrorState,
  PageHeader,
} from '../../../../shared/components/antd'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { adminDevicesApi } from '../../api/adminDevicesApi'
import { deviceErrorMessage } from '../../lib/deviceError'
import {
  computeDeviceStats,
  mapDeviceModel,
  mapDevice,
  mapDevicePage,
} from '../../lib/deviceMappers'
import type { AdminDevice, DeviceFormValues } from '../../types/devices'
import { DeviceDetailDrawer } from './components/DeviceDetailDrawer'
import {
  DeviceFilters,
  NO_DEVICE_FILTERS,
  type DeviceFilterState,
} from './components/DeviceFilters'
import { DeviceFormModal } from './components/DeviceFormModal'
import { DeviceStats } from './components/DeviceStats'
import { DevicesTable } from './components/DevicesTable'
import { devicesPageMessages } from './DevicesPage.messages'

const STATS_PAGE_SIZE = 200

type FormState = { device: AdminDevice | null } | null

export function DevicesPage() {
  const { t } = useI18n(devicesPageMessages)
  const [messageApi, messageHolder] = message.useMessage()
  const [filters, setFilters] = useState<DeviceFilterState>(NO_DEVICE_FILTERS)
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(1)
  const [size, setSize] = useState(10)
  const [form, setForm] = useState<FormState>(null)
  const [viewing, setViewing] = useState<AdminDevice | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Debounce free-text search so each keystroke does not hit the backend.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setKeyword(filters.keyword.trim())
      setPage(1)
    }, 300)
    return () => window.clearTimeout(id)
  }, [filters.keyword])

  const list = useApiQuery(
    (signal) =>
      adminDevicesApi
        .list({
          page: page - 1,
          size,
          keyword,
          status: filters.status,
          modelId: filters.modelId,
          signal,
        })
        .then(mapDevicePage),
    [page, size, keyword, filters.status, filters.modelId],
  )
  const statsQuery = useApiQuery(
    (signal) =>
      adminDevicesApi
        .list({ page: 0, size: STATS_PAGE_SIZE, signal })
        .then(mapDevicePage),
    [],
  )
  const modelsQuery = useApiQuery(
    (signal) =>
      adminDevicesApi
        .listModels(signal)
        .then((rows) => rows.map(mapDeviceModel)),
    [],
  )
  const models = modelsQuery.data ?? []
  const stats = useMemo(() => {
    if (!statsQuery.data) return null
    return {
      ...computeDeviceStats(statsQuery.data.items),
      total: statsQuery.data.totalItems,
    }
  }, [statsQuery.data])

  function refresh() {
    list.reload()
    statsQuery.reload()
  }

  function changeFilters(next: DeviceFilterState) {
    if (next.status !== filters.status || next.modelId !== filters.modelId) {
      setPage(1)
    }
    setFilters(next)
  }

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
        modelsFailed={Boolean(modelsQuery.error)}
        onCancel={() => setForm(null)}
        onSubmit={submitForm}
      />
      <DeviceDetailDrawer device={viewing} onClose={() => setViewing(null)} />
    </div>
  )
}
