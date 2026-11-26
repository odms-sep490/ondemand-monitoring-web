import { useCallback, useEffect, useState } from 'react'
import { Alert, Button, Tabs, Typography } from 'antd'
import { resourceLifecycleApi } from './api'
import { resourceLifecycleMessages } from './messages'
import { useI18n } from '../../shared/i18n'
import { OverviewTab } from './components/OverviewTab'
import { DroneLifecycleTab } from './components/DroneLifecycleTab'
import { StaffWorkloadTab } from './components/StaffWorkloadTab'
import { PoliciesTab } from './components/PoliciesTab'
import { AlertsAndForecastTab } from './components/AlertsAndForecastTab'
import { AuditTab } from './components/AuditTab'
import './resource-lifecycle.scss'
import type {
  AlertResponse,
  AuditLogResponse,
  DroneHealthResponse,
  MaintenanceCycleResponse,
  OverviewResponse,
  PolicyResponse,
  ScheduleForecastItem,
  StaffWorkloadResponse,
  UsageResponse,
} from './types'

export function ResourceLifecyclePage({
  embedded = false,
}: {
  embedded?: boolean
} = {}) {
  const { t } = useI18n(resourceLifecycleMessages)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [overview, setOverview] = useState<OverviewResponse | null>(null)
  const [drones, setDrones] = useState<DroneHealthResponse[]>([])
  const [staff, setStaff] = useState<StaffWorkloadResponse[]>([])
  const [pendingUsage, setPendingUsage] = useState<UsageResponse[]>([])
  const [policies, setPolicies] = useState<PolicyResponse[]>([])
  const [cycles, setCycles] = useState<MaintenanceCycleResponse[]>([])
  const [alerts, setAlerts] = useState<AlertResponse[]>([])
  const [forecasts, setForecasts] = useState<ScheduleForecastItem[]>([])
  const [audits, setAudits] = useState<AuditLogResponse[]>([])

  const loadAll = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const [
        ov,
        droneList,
        staffList,
        pendingList,
        policyList,
        cycleList,
        alertList,
        forecastList,
        auditList,
      ] = await Promise.all([
        resourceLifecycleApi.getOverview(signal),
        resourceLifecycleApi.listDrones(signal),
        resourceLifecycleApi.listStaff(signal),
        resourceLifecycleApi.listUsage({ status: 'PENDING' }, signal),
        resourceLifecycleApi.listPolicies(undefined, signal),
        resourceLifecycleApi.listMaintenanceCycles(false, signal),
        resourceLifecycleApi.listAlerts(undefined, signal),
        resourceLifecycleApi.getScheduleForecasts(signal),
        resourceLifecycleApi.listAudits(signal),
      ])
      if (signal?.aborted) return
      setOverview(ov)
      setDrones(droneList)
      setStaff(staffList)
      setPendingUsage(pendingList)
      setPolicies(policyList)
      setCycles(cycleList)
      setAlerts(alertList)
      setForecasts(forecastList)
      setAudits(auditList)
    } catch (err) {
      if (signal?.aborted) return
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu vòng đời nguồn lực.')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadAll(controller.signal)
    return () => controller.abort()
  }, [loadAll])

  return (
    <div className="rl-page">
      {!embedded && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {t.pageTitle}
            </Typography.Title>
            <Typography.Text type="secondary">{t.pageSubtitle}</Typography.Text>
          </div>
          <Button onClick={() => void loadAll()} loading={loading}>
            {t.refresh}
          </Button>
        </div>
      )}

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          action={
            <Button size="small" onClick={() => void loadAll()}>
              {t.refresh}
            </Button>
          }
        />
      )}

      <Tabs
        defaultActiveKey="overview"
        tabBarExtraContent={
          embedded ? (
            <Button size="small" onClick={() => void loadAll()} loading={loading}>
              {t.refresh}
            </Button>
          ) : undefined
        }
        items={[
          {
            key: 'overview',
            label: t.tabs.overview,
            children: (
              <OverviewTab
                overview={overview}
                drones={drones}
                staff={staff}
                loading={loading}
              />
            ),
          },
          {
            key: 'drones',
            label: t.tabs.drones,
            children: (
              <DroneLifecycleTab
                drones={drones}
                pendingUsage={pendingUsage}
                cycles={cycles}
                loading={loading}
                onRefresh={() => void loadAll()}
              />
            ),
          },
          {
            key: 'staff',
            label: t.tabs.staff,
            children: <StaffWorkloadTab staff={staff} loading={loading} />,
          },
          {
            key: 'maintenancePolicies',
            label: t.tabs.maintenancePolicies,
            children: (
              <PoliciesTab
                family="MAINTENANCE"
                policies={policies}
                drones={drones}
                staff={staff}
                loading={loading}
                onRefresh={() => void loadAll()}
              />
            ),
          },
          {
            key: 'workforcePolicies',
            label: t.tabs.workforcePolicies,
            children: (
              <PoliciesTab
                family="WORKFORCE"
                policies={policies}
                drones={drones}
                staff={staff}
                loading={loading}
                onRefresh={() => void loadAll()}
              />
            ),
          },
          {
            key: 'allocationPolicies',
            label: t.tabs.allocationPolicies,
            children: (
              <PoliciesTab
                family="ALLOCATION"
                policies={policies}
                drones={drones}
                staff={staff}
                loading={loading}
                onRefresh={() => void loadAll()}
              />
            ),
          },
          {
            key: 'alerts',
            label: t.tabs.alerts,
            children: (
              <AlertsAndForecastTab
                alerts={alerts}
                forecasts={forecasts}
                loading={loading}
                onRefresh={() => void loadAll()}
              />
            ),
          },
          {
            key: 'audits',
            label: t.tabs.audits,
            children: <AuditTab audits={audits} loading={loading} />,
          },
        ]}
      />
    </div>
  )
}
