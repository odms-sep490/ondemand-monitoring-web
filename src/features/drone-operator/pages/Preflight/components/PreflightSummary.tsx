import { SummaryBanner } from './SummaryBanner'
import type { PreflightItemDef } from './PreflightItem'

export function PreflightSummary({
  nOk,
  nTotal,
  progress,
  canContinueToHandover,
  isFailed,
  failedItems,
  error,
  hasTriggered,
  triggering,
  handleTriggerCheck,
  onReady,
  missionId,
  backendPreflightMessage,
  backendPreflightRegistering,
}: {
  nOk: number
  nTotal: number
  progress: number
  canContinueToHandover: boolean
  isFailed: boolean
  failedItems: PreflightItemDef[]
  error: string | null
  hasTriggered: boolean
  triggering: boolean
  handleTriggerCheck: () => Promise<void>
  onReady: (() => void) | undefined
  missionId: string
  backendPreflightMessage: string | null
  backendPreflightRegistering: boolean
}) {
  return (
    <SummaryBanner
      nOk={nOk}
      nTotal={nTotal}
      progress={progress}
      isReady={canContinueToHandover}
      isFailed={isFailed}
      failedItems={failedItems}
      error={error}
      hasTriggered={hasTriggered}
      triggering={triggering}
      onTrigger={handleTriggerCheck}
      onReady={onReady}
      missionId={missionId}
      backendPreflightMessage={backendPreflightMessage}
      backendPreflightRegistering={backendPreflightRegistering}
    />
  )
}
