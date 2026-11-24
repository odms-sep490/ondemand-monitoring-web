/** Keep browser speech consistent across the AI assistant and spoken alerts. */
export async function createAssistantVoiceUtterance(
  text: string,
): Promise<SpeechSynthesisUtterance | null> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null

  const synthesis = window.speechSynthesis
  const hasVietnameseVoice = () =>
    synthesis.getVoices().some((item) => item.lang.toLowerCase().startsWith('vi'))
  let voices = synthesis.getVoices()
  if (!hasVietnameseVoice()) {
    await new Promise<void>((resolve) => {
      const finish = () => {
        window.clearTimeout(timeout)
        synthesis.removeEventListener('voiceschanged', onVoicesChanged)
        resolve()
      }
      const onVoicesChanged = () => {
        if (hasVietnameseVoice()) finish()
      }
      const timeout = window.setTimeout(finish, 2500)
      synthesis.addEventListener('voiceschanged', onVoicesChanged)
      if (hasVietnameseVoice()) finish()
    })
    voices = synthesis.getVoices()
  }

  const vietnameseVoices = voices.filter((item) =>
    item.lang.toLowerCase().startsWith('vi'),
  )
  const voice =
    vietnameseVoices.find((item) =>
      item.name.toLowerCase().includes('mai anh'),
    ) ?? vietnameseVoices[0]
  if (!voice) return null

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = voice
  utterance.lang = 'vi-VN'
  utterance.rate = 0.9
  return utterance
}
