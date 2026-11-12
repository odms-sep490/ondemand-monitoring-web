import type {
  EvidenceCandidateLoadResult,
  EvidenceCandidatePage,
} from '../types/checklistExecution'

export function evidenceCandidatePage(
  result: EvidenceCandidateLoadResult,
): EvidenceCandidatePage {
  if (Array.isArray(result))
    return {
      items: result,
      unavailableSources: [],
      hasMore: result.length >= 50,
    }
  if (
    !result ||
    !Array.isArray(result.items) ||
    !Array.isArray(result.unavailableSources) ||
    typeof result.hasMore !== 'boolean'
  )
    throw new Error('Invalid evidence candidate response')
  return result
}
