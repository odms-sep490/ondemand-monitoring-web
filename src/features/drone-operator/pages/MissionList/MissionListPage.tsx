import { useMemo, useState } from 'react'
import {
  EmptyState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { operatorApi } from '../../api/operatorApi'
import { computeKpis } from '../../lib/computeKpis'
import { demoNow } from '../../lib/demoNow'
import { filterMissions, missionsByTab } from '../../lib/filterMissions'
import type { OperatorMissionTab } from '../../types/mission'
import { missionListPageMessages } from './MissionListPage.messages'
import { MissionListHeader } from './components/MissionListHeader'
import { CertExpiryBanner } from './components/CertExpiryBanner'
import { KpiRow } from './components/KpiRow'
import { MissionTabs } from './components/MissionTabs'

export function MissionListPage({ searchQuery }: { searchQuery: string }) {
  const [tab, setTab] = useState<OperatorMissionTab>('pending')
  const now = demoNow()
  const { t } = useI18n(missionListPageMessages)

  const profileQuery = useApiQuery(
    (signal) => operatorApi.getProfile(signal),
    [],
  )
  const missionsQuery = useApiQuery(
    (signal) => operatorApi.listMissions(undefined, signal),
    [],
  )

  const allMissions = missionsQuery.data?.items ?? []
  const filtered = useMemo(
    () => filterMissions(allMissions, searchQuery),
    [allMissions, searchQuery],
  )
  const kpis = useMemo(
    () =>
      profileQuery.data
        ? computeKpis(allMissions, profileQuery.data, now)
        : null,
    [allMissions, profileQuery.data, now],
  )
  const tabItems = useMemo(
    () => missionsByTab(filtered, tab, now),
    [filtered, tab, now],
  )
  const counts = useMemo(
    () => ({
      pending: missionsByTab(filtered, 'pending', now).length,
      upcoming: missionsByTab(filtered, 'upcoming', now).length,
      history: missionsByTab(filtered, 'history', now).length,
    }),
    [filtered, now],
  )

  if (missionsQuery.loading || profileQuery.loading) return <LoadingState />
  if (missionsQuery.error || profileQuery.error) {
    return (
      <EmptyState
        title={t.loadFailedTitle}
        description={t.loadFailedDesc}
        action={
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => {
              missionsQuery.reload()
              profileQuery.reload()
            }}
          >
            {t.retry}
          </button>
        }
      />
    )
  }

  const profile = profileQuery.data
  if (!profile || !kpis) return null

  return (
    <div>
      <MissionListHeader profile={profile} now={now} />

      {profile.certExpiry && <CertExpiryBanner profile={profile} kpis={kpis} />}

      <KpiRow kpis={kpis} profile={profile} />

      <MissionTabs
        tab={tab}
        setTab={setTab}
        counts={counts}
        tabItems={tabItems}
        now={now}
        allMissions={allMissions}
      />
    </div>
  )
}
