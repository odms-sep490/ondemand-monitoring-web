import { type OrderDispatchContext } from './liveDispatchTypes'
import { LiveDispatchContent } from './LiveDispatchContent'

/** Real resource assignment in the existing manager shell; no invented ranking data. */
export function LiveDispatchPage(props: {
  missionId: string
  orderContext?: OrderDispatchContext
}) {
  return <LiveDispatchContent key={props.missionId} {...props} />
}
