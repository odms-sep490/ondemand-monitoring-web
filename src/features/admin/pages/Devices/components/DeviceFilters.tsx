import { Button, Select } from 'antd'

import { FilterBar } from '../../../../../shared/components/antd'

import { useI18n } from '../../../../../shared/i18n'
import {
  DEVICE_STATUSES,
  type AdminDeviceModel,
  type DeviceStatus,
} from '../../../types/devices'
import { devicesPageMessages } from '../DevicesPage.messages'

export type DeviceFilterState = {
  keyword: string
  status: DeviceStatus | undefined
  modelId: string | undefined
}

export const NO_DEVICE_FILTERS: DeviceFilterState = {
  keyword: '',
  status: undefined,
  modelId: undefined,
}

export function DeviceFilters({
  value,
  models,
  onChange,
}: {
  value: DeviceFilterState
  models: AdminDeviceModel[]
  onChange: (next: DeviceFilterState) => void
}) {
  const { t } = useI18n(devicesPageMessages)
  const dirty = value.keyword || value.status || value.modelId

  return (
    <FilterBar
      search={{
        value: value.keyword,
        onChange: (keyword) => onChange({ ...value, keyword }),
        placeholder: t.searchPlaceholder,
        ariaLabel: t.searchAria,
      }}
      end={
        <>
          <Select<DeviceStatus>
            className="adm-filter-select"
            allowClear
            value={value.status}
            placeholder={t.allStatuses}
            aria-label={t.statusAria}
            onChange={(status) => onChange({ ...value, status })}
            options={DEVICE_STATUSES.map((s) => ({
              value: s,
              label: t.statuses[s],
            }))}
          />
          <Select<string>
            className="adm-filter-select"
            allowClear
            value={value.modelId}
            placeholder={t.allModels}
            aria-label={t.modelAria}
            onChange={(modelId) => onChange({ ...value, modelId })}
            options={models.map((m) => ({ value: m.id, label: m.name }))}
          />
          <Button disabled={!dirty} onClick={() => onChange(NO_DEVICE_FILTERS)}>
            {t.reset}
          </Button>
        </>
      }
    />
  )
}
