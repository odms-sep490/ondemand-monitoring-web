import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { missionsApi } from '../../../api/missionsApi'
import { DispatchLoading } from './DispatchLoading'
import { DispatchErrorState } from './DispatchErrorState'
import { SuggestionsErrorState } from './SuggestionsErrorState'
import { DispatchBody } from './DispatchBody'

export function MockDispatchPage({
  missionId,
  setupMode,
}: {
  missionId: string
  setupMode: boolean
}) {
  const missionQuery = useApiQuery(
    (signal) => missionsApi.getMission(missionId, signal),
    [missionId],
  )
  const suggestionsQuery = useApiQuery(
    (signal) => missionsApi.getResourceSuggestions(missionId, { signal }),
    [missionId],
  )

  if (missionQuery.loading || suggestionsQuery.loading) {
    return <DispatchLoading />
  }

  if (missionQuery.error || !missionQuery.data) {
    return (
      <DispatchErrorState
        error={missionQuery.error}
        onRetry={missionQuery.reload}
      />
    )
  }

  if (suggestionsQuery.error) {
    return (
      <SuggestionsErrorState
        error={suggestionsQuery.error}
        onRetry={suggestionsQuery.reload}
      />
    )
  }

  if (!suggestionsQuery.data) return null

  return (
    <DispatchBody
      mission={missionQuery.data}
      suggestions={suggestionsQuery.data}
      onMissionChanged={missionQuery.reload}
      setupMode={setupMode}
    />
  )
}
