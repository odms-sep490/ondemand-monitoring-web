import './missionsBanner.css'
// MNG-08: Mission list + detail panel
import { useMemo, useState } from 'react'
import { Button, Skeleton } from 'antd'
import {
  ReloadOutlined,
  RocketOutlined,
} from '@ant-design/icons'
import { CardComponent } from '../../../../shared/components/antd'
import { EmptyState } from '../../components/common/EmptyState'
import { ErrorState } from '../../components/common/ErrorState'
import { FilterBar, FilterSegments } from '../../components/common/FilterBar'
import { PageHeader } from '../../components/common/PageHeader'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { missionsApi } from '../../api/missionsApi'
import { dedupeById } from '../../lib/dedupeById'
import { missionsPageMessages } from './MissionsPage.messages'
import '../../components/layout/mgrLayout.css'
import '../../manager.css'
import './missions.scss'
import '../../components/common/missionPages.css'
import { type StatusChip } from './missionsTypes'
import { MissionsTable } from './components/MissionsTable'
import { matchesMissionSearch } from './missionsHelpers'

type MissionsListPageProps = { missionId?: string }

// missionId is accepted for route compatibility but the list page does not use it yet.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function MissionsPage(_props: MissionsListPageProps = {}) {
  const { t, lang } = useI18n(missionsPageMessages)
  const [statusFilter, setStatusFilter] = useState<StatusChip>('ALL')

  const statusChips: Array<{ value: StatusChip; label: string }> = [
    { value: 'ALL', label: t.statusChips.ALL },
    { value: 'IN_FLIGHT', label: t.statusChips.IN_FLIGHT },
    { value: 'COMPLETED', label: t.statusChips.COMPLETED },
    { value: 'FAILED', label: t.statusChips.FAILED },
    { value: 'PLANNING', label: t.statusChips.PLANNING },
    { value: 'CREATED', label: t.statusChips.CREATED },
  ]

  const query = useApiQuery(
    (signal) =>
      missionsApi.listMissions({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        signal,
      }),
    [statusFilter],
  )
  const missions = useMemo(
    () => dedupeById(query.data?.items ?? []),
    [query.data?.items],
  )
  const [search, setSearch] = useState('')

  const visible = useMemo(
    () => missions.filter((mission) => matchesMissionSearch(mission, search)),
    [missions, search],
  )
  const ready = !query.loading && !query.error

  return (
    <div className="mgr-view mgr-missions">
      <PageHeader
        title={
          <span className="mgr-mission-banner-title">
            <RocketOutlined aria-hidden="true" />
            {t.title}
          </span>
        }
        description={
          lang === 'vi'
            ? 'Quản lý lịch bay, đội ngũ và kết quả nhiệm vụ tại một nơi.'
            : 'Manage flight schedules, crews and mission results in one place.'
        }
        actions={
          <>

            <Button
              icon={<ReloadOutlined />}
              loading={query.loading}
              onClick={query.reload}
            >
              {lang === 'vi' ? 'Làm mới' : 'Refresh'}
            </Button>
          </>
        }
      >
        <div className="mgr-mission-banner-meta">
          <span>
            {ready
              ? t.missionCount(missions.length)
              : lang === 'vi'
                ? 'Đang tải danh sách…'
                : 'Loading missions…'}
          </span>
          <span>
            {lang === 'vi'
              ? 'Lập kế hoạch · Triển khai · Bàn giao kết quả'
              : 'Plan · Execute · Deliver results'}
          </span>
        </div>
      </PageHeader>

      <FilterBar
        start={
          <FilterSegments<StatusChip>
            ariaLabel={t.statusAria}
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusChips}
          />
        }
        search={{
          value: search,
          onChange: setSearch,
          placeholder: t.searchPlaceholder,
          ariaLabel: t.searchAria,
        }}
      />

      <div className="mgr-list-grid">
        <div className="mgr-detail-main">
          {query.loading && (
            <CardComponent aria-busy="true">
              <Skeleton active paragraph={{ rows: 6 }} />
            </CardComponent>
          )}

          {!query.loading && !!query.error && (
            <ErrorState
              title={t.loadError}
              description={t.loadErrorDetail}
              onRetry={query.reload}
            />
          )}

          {ready && visible.length === 0 && (
            <CardComponent>
              <EmptyState
                title={missions.length === 0 ? t.emptyTitle : t.emptySearch}
                description={
                  missions.length === 0 ? t.emptyDescription : undefined
                }
              />
            </CardComponent>
          )}

          {ready && visible.length > 0 && (
            <MissionsTable missions={visible} total={missions.length} />
          )}
        </div>
      </div>
    </div>
  )
}

export type { MissionsListPageProps }
