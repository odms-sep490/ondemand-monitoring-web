import { useEffect, useState } from 'react'
import { Alert, Card, Col, Row, Statistic, Tag } from 'antd'
import { resourceLifecycleApi } from '../api'
import { formatHoursOrUnknown, statusTagColor } from '../formatters'
import type { StaffWorkloadResponse } from '../types'

export function StaffPersonalWorkloadCard() {
  const [workload, setWorkload] = useState<StaffWorkloadResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    void resourceLifecycleApi
      .getMyWorkload(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setWorkload(data)
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Không tải được khối lượng công việc.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  return (
    <Card
      title="Khối lượng công việc cá nhân (Thực tế vs Ước tính)"
      loading={loading}
      extra={
        workload ? (
          <Tag color={statusTagColor(workload.workloadStatus)}>{workload.workloadStatus}</Tag>
        ) : null
      }
    >
      {error && <Alert type="error" showIcon message={error} />}
      {workload && (
        <Row gutter={[16, 16]}>
          <Col xs={12} md={6}>
            <Statistic
              title="Hôm nay (Thực tế / Ước tính)"
              value={`${formatHoursOrUnknown(workload.dailyActualSeconds)} / ${formatHoursOrUnknown(workload.dailyEstimatedSeconds)}`}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Tuần này (Thực tế / Ước tính)"
              value={`${formatHoursOrUnknown(workload.weeklyActualSeconds)} / ${formatHoursOrUnknown(workload.weeklyEstimatedSeconds)}`}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Tháng này (Thực tế / Ước tính)"
              value={`${formatHoursOrUnknown(workload.monthlyActualSeconds)} / ${formatHoursOrUnknown(workload.monthlyEstimatedSeconds)}`}
            />
          </Col>
          <Col xs={12} md={6}>
            <Statistic
              title="Thời gian nghỉ trước ca tiếp theo"
              value={formatHoursOrUnknown(workload.restSecondsBeforeNextMission)}
            />
          </Col>
        </Row>
      )}
    </Card>
  )
}
