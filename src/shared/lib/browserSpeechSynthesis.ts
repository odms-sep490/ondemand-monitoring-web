/**
 * Instant text-to-speech through the browser's built-in voices (Edge: Microsoft HoaiMy/NamMinh,
 * Chrome: Google Tiếng Việt). Callers fall back to server TTS when no Vietnamese voice exists.
 */
let cachedVoice: SpeechSynthesisVoice | null | undefined

function pickVietnameseVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const vi = voices.filter((v) => v.lang?.toLowerCase().replace('_', '-').startsWith('vi'))
  if (!vi.length) return null
  // Prefer natural/neural voices, then online Google voice, then anything Vietnamese.
  return (
    vi.find((v) => /natural|neural|online/i.test(v.name)) ??
    vi.find((v) => /google/i.test(v.name)) ??
    vi[0]
  )
}

export function getVietnameseBrowserVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice
  const voice = pickVietnameseVoice()
  if (voice) cachedVoice = voice
  return voice
}

/** Voices load asynchronously in Chrome; call early so the first reply can use them. */
export function warmUpBrowserVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.getVoices()
  window.speechSynthesis.addEventListener?.('voiceschanged', () => void getVietnameseBrowserVoice(), { once: true })
}

export type BrowserSpeakHandlers = { onStart: () => void; onEnd: () => void; onError: () => void }

/** Speaks `text`; returns false when no Vietnamese voice is available (use server TTS then). */
export function speakWithBrowser(text: string, handlers: BrowserSpeakHandlers): boolean {
  const voice = getVietnameseBrowserVoice()
  if (!voice || typeof SpeechSynthesisUtterance === 'undefined') return false
  const synth = window.speechSynthesis
  synth.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = voice
  utterance.lang = voice.lang || 'vi-VN'
  utterance.rate = 1.05
  let started = false
  utterance.onstart = () => {
    started = true
    handlers.onStart()
  }
  utterance.onend = () => handlers.onEnd()
  utterance.onerror = (event) => {
    if (event.error === 'canceled' || event.error === 'interrupted') return handlers.onEnd()
    if (!started) handlers.onError()
    else handlers.onEnd()
  }
  synth.speak(utterance)
  return true
}
