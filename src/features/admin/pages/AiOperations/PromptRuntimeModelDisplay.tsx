import type { PromptSummaryView } from '../../api/promptApi'

export function isChecklistVisionPrompt(
  prompt: Pick<PromptSummaryView, 'promptKey'>,
) {
  return prompt.promptKey === 'checklist.image-vision.system'
}

/** Runtime configuration is authoritative only for the checklist vision prompt. */
export function PromptRuntimeModelDisplay({
  prompt,
}: {
  prompt: PromptSummaryView
}) {
  if (!isChecklistVisionPrompt(prompt))
    return <span>{prompt.modelBinding}</span>

  const runtime = prompt.runtimeModel
  const provider = runtime?.provider?.trim()
  const model = runtime?.model?.trim()
  const details = [
    provider && `Nhà cung cấp: ${provider}`,
    (!runtime?.configured || !model) && 'Cấu hình chưa sẵn sàng',
  ]
    .filter(Boolean)
    .join(' · ')
  return (
    <span title={details || undefined}>
      {model || 'Cấu hình chưa sẵn sàng'}
    </span>
  )
}
