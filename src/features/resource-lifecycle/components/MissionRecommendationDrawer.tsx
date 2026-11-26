import { useState } from 'react'
import { Alert, Button, Drawer, Space, Table, Tag, Typography } from 'antd'
import { resourceLifecycleApi } from '../api'
import type { RecommendationResponse, ScoredCandidate } from '../types'

interface MissionRecommendationDrawerProps {
  missionId: string
  missionCode?: string
  onSelectDevice?: (deviceId: string) => void
  onSelectStaff?: (staffId: string) => void
}

export function MissionRecommendationDrawer({
  missionId,
  missionCode,
  onSelectDevice,
  onSelectStaff,
}: MissionRecommendationDrawerProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RecommendationResponse | null>(null)

  const handleOpen = async () => {
    setOpen(true)
    setLoading(true)
    setError(null)
    try {
      setResult(await resourceLifecycleApi.recommendForMission(missionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tính gợi ý phân bổ.')
    } finally {
      setLoading(false)
    }
  }

  const renderColumns = (onSelect?: (id: string) => void) => [
    {
      title: 'Nguồn lực',
      dataIndex: 'displayName',
    },
    {
      title: 'Điều kiện',
      render: (_: unknown, c: ScoredCandidate) =>
        c.eligible ? (
          <Tag color={c.warningReasons.length > 0 ? 'orange' : 'green'}>
            {c.warningReasons.length > 0 ? 'Đủ điều kiện (Cảnh báo)' : 'Đủ điều kiện'}
          </Tag>
        ) : (
          <Tag color="red">Bị chặn</Tag>
        ),
    },
    {
      title: 'Điểm xác định',
      render: (_: unknown, c: ScoredCandidate) =>
        c.totalScore == null ? 'Chưa xác định' : `${c.totalScore.toFixed(1)}`,
    },
    {
      title: 'Lý do / Thiếu dữ liệu',
      render: (_: unknown, c: ScoredCandidate) => {
        const items = [...c.blockingReasons, ...c.warningReasons, ...c.missingDataFlags]
        return items.length > 0 ? items.join(', ') : '—'
      },
    },
    ...(onSelect
      ? [
          {
            title: 'Chọn',
            render: (_: unknown, c: ScoredCandidate) => (
              <Button
                size="small"
                type="primary"
                disabled={!c.eligible}
                onClick={() => {
                  onSelect(c.resourceId)
                  setOpen(false)
                }}
              >
                Áp dụng
              </Button>
            ),
          },
        ]
      : []),
  ]

  return (
    <>
      <Button size="small" onClick={() => void handleOpen()}>
        Gợi ý phân bổ xác định
      </Button>
      <Drawer
        open={open}
        width={760}
        onClose={() => setOpen(false)}
        title={`Gợi ý phân bổ nguồn lực — ${missionCode ?? missionId}`}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {error && <Alert type="error" showIcon message={error} />}
          {result && (
            <>
              <Alert
                type={result.aiExplanationAvailable ? 'info' : 'warning'}
                showIcon
                message={`${result.componentType} · ${result.algorithmVersion} (${result.elapsedMs}ms)`}
                description={result.aiExplanation}
              />
              <div>
                <Typography.Title level={5}>Drone ứng viên</Typography.Title>
                <Table<ScoredCandidate>
                  rowKey="resourceId"
                  size="small"
                  loading={loading}
                  pagination={false}
                  dataSource={result.devices}
                  columns={renderColumns(onSelectDevice)}
                />
              </div>
              <div>
                <Typography.Title level={5}>Nhân sự ứng viên</Typography.Title>
                <Table<ScoredCandidate>
                  rowKey="resourceId"
                  size="small"
                  loading={loading}
                  pagination={false}
                  dataSource={result.staff}
                  columns={renderColumns(onSelectStaff)}
                />
              </div>
            </>
          )}
        </Space>
      </Drawer>
    </>
  )
}
