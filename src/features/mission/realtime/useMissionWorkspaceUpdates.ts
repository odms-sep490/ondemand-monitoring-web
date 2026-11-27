import { useEffect, useRef } from 'react'
import {
  subscribeMissionWorkspace,
  type WorkspaceComponent,
} from './missionWorkspaceUpdates'

export function useMissionWorkspaceUpdates(
  missionId: string,
  components: readonly WorkspaceComponent[],
  onChange: (changed: readonly WorkspaceComponent[]) => void,
  enabled = true,
) {
  const callback = useRef(onChange)
  const watched = useRef(components)
  callback.current = onChange
  watched.current = components
  useEffect(() => {
    if (!enabled || !missionId) return
    return subscribeMissionWorkspace(missionId, (changed) => {
      const relevant = changed.filter((key) => watched.current.includes(key))
      if (relevant.length) callback.current(relevant)
    })
  }, [missionId, enabled])
}
