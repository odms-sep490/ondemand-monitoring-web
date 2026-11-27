/**
 * Thin wrapper over the browser Web Speech API (Chrome/Edge). Gives live, near-instant transcripts;
 * callers keep a server ASR fallback for browsers without support or when the speech service fails.
 */
type RecognitionResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>

type RecognitionInstance = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: { resultIndex: number; results: RecognitionResultList }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type RecognitionCtor = new () => RecognitionInstance

export function getBrowserSpeechRecognition(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/** Errors after which the server ASR should take over instead of telling the user to retry. */
export const FALLBACK_ERRORS = new Set(['network', 'service-not-allowed', 'language-not-supported', 'bad-grammar'])

export type BrowserRecognitionHandlers = {
  /** Full transcript so far (final + interim), for showing live in the input. */
  onTranscript: (text: string) => void
  /** Recognition stopped; `finalText` contains only confirmed words. */
  onEnd: (finalText: string) => void
  onError: (error: string) => void
}

export type BrowserRecognitionSession = { stop: () => void; abort: () => void }

export function startBrowserRecognition(
  handlers: BrowserRecognitionHandlers,
  lang = 'vi-VN',
): BrowserRecognitionSession | null {
  const Ctor = getBrowserSpeechRecognition()
  if (!Ctor) return null
  const recognition = new Ctor()
  recognition.lang = lang
  recognition.continuous = true
  recognition.interimResults = true
  recognition.maxAlternatives = 1

  let finalText = ''
  let ended = false
  recognition.onresult = (event) => {
    let interim = ''
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i]
      const piece = result[0]?.transcript ?? ''
      if (result.isFinal) finalText = `${finalText} ${piece}`.trim()
      else interim += piece
    }
    handlers.onTranscript(`${finalText} ${interim}`.trim())
  }
  recognition.onerror = (event) => handlers.onError(event.error)
  recognition.onend = () => {
    if (ended) return
    ended = true
    handlers.onEnd(finalText)
  }
  recognition.start()
  return {
    stop: () => recognition.stop(),
    abort: () => {
      ended = true
      recognition.abort()
    },
  }
}
