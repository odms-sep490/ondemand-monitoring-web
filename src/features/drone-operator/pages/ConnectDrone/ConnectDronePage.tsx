import { PreflightPage } from '../Preflight'

/** Legacy route compatibility: the former connection step now opens preflight. */
export function ConnectDronePage({ missionId }: { missionId?: string }) {
  return <PreflightPage missionId={missionId} />
}
