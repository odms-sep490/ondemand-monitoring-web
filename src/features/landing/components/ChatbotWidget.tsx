import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AudioMutedOutlined,
  AudioOutlined,
  CustomerServiceOutlined,
  PauseCircleFilled,
  PlayCircleFilled,
  SoundOutlined,
} from '@ant-design/icons'

import { apiRequest } from '../../../shared/api/httpClient'
import { useI18n } from '../../../shared/i18n'
import { createAssistantVoiceUtterance } from '../../../shared/lib/assistantVoice'
import {
  AIAnimatedMascot,
  type AIMascotState,
} from '../../customer/pages/CreateOrder/components/AIAnimatedMascot'
import {
  chatbotWidgetMessages,
  kbPatterns,
  kbSeedAudioUrls,
  landingSeedAudioByText,
  type TourChapter,
} from './ChatbotWidget.messages'
import { CORE_TOPIC_IDS, matchLandingEntry } from './landingKnowledge'

type Msg = {
  id: number
  text: string
  from: 'user' | 'bot'
  audioUrl?: string | null
}

type BrowserSpeechRecognitionEvent = {
  results: ArrayLike<{
    isFinal: boolean
    0: { transcript: string }
  }>
}

type BrowserSpeechRecognition = {
  lang: string
  interimResults: boolean
  continuous: boolean
  maxAlternatives: number
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type SpeechRecognitionCtor = new () => BrowserSpeechRecognition

const PUBLIC_SPEECH_ENDPOINT = '/api/public/assistant/speech'
const PUBLIC_CHAT_ENDPOINT = '/api/public/assistant/chat'
const MAX_SPEECH_CACHE = 40
const publicSpeechCache = new Map<string, Blob>()

function rememberSpeechBlob(key: string, blob: Blob) {
  if (publicSpeechCache.size >= MAX_SPEECH_CACHE) {
    const oldest = publicSpeechCache.keys().next().value
    if (oldest !== undefined) publicSpeechCache.delete(oldest)
  }
  publicSpeechCache.set(key, blob)
}

/** Split text into natural sentence chunks so ZeroTTS starts fast and streams gaplessly. */
function splitSpeechChunks(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []
  const raw = cleaned
    .split(/(?<=[.!?…;])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (raw.length <= 1) return [cleaned]
  const merged: string[] = []
  for (const part of raw) {
    const prev = merged[merged.length - 1]
    if (prev && prev.length + part.length < 110) {
      merged[merged.length - 1] = `${prev} ${part}`
    } else {
      merged.push(part)
    }
  }
  return merged
}

async function fetchStaticSeedBlob(
  seedUrl: string,
  signal: AbortSignal,
): Promise<Blob | null> {
  const cached = publicSpeechCache.get(seedUrl)
  if (cached) return cached
  try {
    const res = await fetch(seedUrl, { signal })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('audio') && !contentType.includes('octet-stream')) {
      return null
    }
    const blob = await res.blob()
    if (blob.size < 1000) return null
    rememberSpeechBlob(seedUrl, blob)
    return blob
  } catch {
    return null
  }
}

async function fetchOrderAiSpeechBlob(
  chunkText: string,
  signal: AbortSignal,
): Promise<Blob> {
  const key = chunkText.trim()
  const cached = publicSpeechCache.get(key)
  if (cached) return cached

  const blob = await apiRequest<Blob>(PUBLIC_SPEECH_ENDPOINT, {
    method: 'POST',
    body: { text: chunkText },
    responseType: 'blob',
    signal,
  })
  if (!blob || blob.size < 44) {
    throw new Error('Empty audio response')
  }
  rememberSpeechBlob(key, blob)
  return blob
}

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

async function buildBrowserUtterance(
  text: string,
  lang: 'vi' | 'en',
): Promise<SpeechSynthesisUtterance | null> {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null

  if (lang === 'vi') {
    const preferred = await createAssistantVoiceUtterance(text)
    if (preferred) return preferred
  }

  if (typeof SpeechSynthesisUtterance === 'undefined') return null
  const utterance = new SpeechSynthesisUtterance(text)
  const voices = window.speechSynthesis.getVoices()
  if (lang === 'en') {
    const enVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith('en-us')) ??
      voices.find((v) => v.lang.toLowerCase().startsWith('en'))
    if (enVoice) utterance.voice = enVoice
    utterance.lang = 'en-US'
    utterance.rate = 0.98
  } else {
    utterance.lang = 'vi-VN'
    utterance.rate = 0.94
  }
  return utterance
}

export function ChatbotWidget() {
  const { t, lang } = useI18n(chatbotWidgetMessages)
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      id: 1,
      text: t.introScript,
      from: 'bot',
      audioUrl: lang === 'vi' ? landingSeedAudioByText.intro : null,
    },
  ])
  const [input, setInput] = useState('')
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [speaking, setSpeaking] = useState(false)
  const [loadingVoice, setLoadingVoice] = useState(false)
  const [speakingMsgId, setSpeakingMsgId] = useState<number | null>(null)
  const [speechAnalyser, setSpeechAnalyser] = useState<AnalyserNode | null>(null)
  const [listening, setListening] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [justOpened, setJustOpened] = useState(false)
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null)

  const msgsRef = useRef<HTMLDivElement>(null)
  const replyTimers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const openButton = useRef<HTMLButtonElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const wasOpen = useRef(false)
  const mountedRef = useRef(false)
  const autoIntroDoneRef = useRef(false)
  const nextIdRef = useRef(2)
  // Latest messages for LLM history, and request bookkeeping so a slow reply never lands after a newer one.
  const historyRef = useRef<Msg[]>([])
  const llmAbortRef = useRef<AbortController | null>(null)
  const llmSeqRef = useRef(0)
  useEffect(() => {
    historyRef.current = msgs
  }, [msgs])
  useEffect(() => () => llmAbortRef.current?.abort(), [])
  const speechTokenRef = useRef(0)
  const speechAbortRef = useRef<AbortController | null>(null)
  const activeAudioRef = useRef<HTMLAudioElement | null>(null)
  const activeAudioUrlRef = useRef<string | null>(null)
  const activeBufferSourceRef = useRef<AudioBufferSourceNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const voiceEnabledRef = useRef(voiceEnabled)
  voiceEnabledRef.current = voiceEnabled

  const speechSupported = typeof window !== 'undefined'
  const micSupported = Boolean(getSpeechRecognitionCtor())

  const cleanupAudioNodes = useCallback(() => {
    try {
      activeBufferSourceRef.current?.stop()
    } catch {
      // Ignore already stopped source
    }
    activeBufferSourceRef.current?.disconnect()
    activeBufferSourceRef.current = null

    if (activeAudioRef.current) {
      activeAudioRef.current.pause()
      activeAudioRef.current.src = ''
      activeAudioRef.current = null
    }
    if (activeAudioUrlRef.current) {
      URL.revokeObjectURL(activeAudioUrlRef.current)
      activeAudioUrlRef.current = null
    }
    const ctx = audioContextRef.current
    audioContextRef.current = null
    if (ctx && ctx.state !== 'closed') {
      void ctx.close().catch(() => undefined)
    }
    setSpeechAnalyser(null)
  }, [])

  const stopSpeech = useCallback(() => {
    speechTokenRef.current += 1
    speechAbortRef.current?.abort()
    speechAbortRef.current = null
    cleanupAudioNodes()
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setLoadingVoice(false)
    setSpeaking(false)
    setSpeakingMsgId(null)
  }, [cleanupAudioNodes])

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current
    if (rec) {
      recognitionRef.current = null
      try {
        rec.abort()
      } catch {
        // Ignore already stopped recognition
      }
    }
    setListening(false)
  }, [])

  const speakWithBrowserFallback = useCallback(
    async (text: string, msgId: number | null, token: number) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) return
      const utterance = await buildBrowserUtterance(text, lang)
      if (!utterance || speechTokenRef.current !== token) return

      utterance.onstart = () => {
        if (speechTokenRef.current !== token) return
        setLoadingVoice(false)
        setSpeaking(true)
        setSpeakingMsgId(msgId)
      }
      utterance.onend = () => {
        if (speechTokenRef.current !== token) return
        setLoadingVoice(false)
        setSpeaking(false)
        setSpeakingMsgId(null)
      }
      utterance.onerror = () => {
        if (speechTokenRef.current !== token) return
        setLoadingVoice(false)
        setSpeaking(false)
        setSpeakingMsgId(null)
      }

      setLoadingVoice(false)
      setSpeaking(true)
      setSpeakingMsgId(msgId)
      try {
        window.speechSynthesis.speak(utterance)
      } catch {
        setSpeaking(false)
        setSpeakingMsgId(null)
      }
    },
    [lang],
  )

  const speakText = useCallback(
    async (
      text: string,
      msgId: number | null = null,
      force = false,
      seedAudioUrl?: string | null,
    ) => {
      if (!speechSupported) return
      if (!force && !voiceEnabledRef.current) return

      stopListening()
      stopSpeech()
      autoIntroDoneRef.current = true
      setWaitingUnlock(false)
      const token = speechTokenRef.current

      // For English, use native browser English voice; for Vietnamese, use Order's ZeroTTS (Mai Chi) voice.
      if (lang !== 'vi') {
        await speakWithBrowserFallback(text, msgId, token)
        return
      }

      const chunks = seedAudioUrl ? [text] : splitSpeechChunks(text)
      if (chunks.length === 0) return

      const controller = new AbortController()
      speechAbortRef.current = controller
      setSpeakingMsgId(msgId)
      const isSeedCached = Boolean(seedAudioUrl && publicSpeechCache.has(seedAudioUrl))
      setLoadingVoice(!isSeedCached && !publicSpeechCache.has(chunks[0]))

      let sharedContext: AudioContext | null = null
      let sharedAnalyser: AnalyserNode | null = null
      if (typeof AudioContext !== 'undefined') {
        try {
          sharedContext = new AudioContext()
          sharedAnalyser = sharedContext.createAnalyser()
          sharedAnalyser.fftSize = 256
          sharedAnalyser.smoothingTimeConstant = 0.72
          sharedAnalyser.connect(sharedContext.destination)
          audioContextRef.current = sharedContext
          setSpeechAnalyser(sharedAnalyser)
        } catch {
          sharedContext = null
          sharedAnalyser = null
        }
      }

      type PreparedChunk = { blob: Blob; buffer: AudioBuffer | null }

      const fetchAndDecode = async (chunkText: string, useSeedUrl?: string | null): Promise<PreparedChunk> => {
        const seedBlob = useSeedUrl
          ? await fetchStaticSeedBlob(useSeedUrl, controller.signal)
          : null
        const blob = seedBlob ?? (await fetchOrderAiSpeechBlob(chunkText, controller.signal))
        let buffer: AudioBuffer | null = null
        if (
          sharedContext &&
          typeof blob.arrayBuffer === 'function' &&
          typeof sharedContext.decodeAudioData === 'function'
        ) {
          try {
            const raw = await blob.arrayBuffer()
            if (!controller.signal.aborted && sharedContext.state !== 'closed') {
              buffer = await sharedContext.decodeAudioData(raw.slice(0))
            }
          } catch {
            buffer = null
          }
        }
        return { blob, buffer }
      }

      const playPrepared = (chunk: PreparedChunk) =>
        new Promise<void>((resolve, reject) => {
          if (controller.signal.aborted || speechTokenRef.current !== token) {
            resolve()
            return
          }

          if (
            sharedContext &&
            sharedAnalyser &&
            chunk.buffer &&
            sharedContext.state !== 'closed'
          ) {
            const startBuffer = async () => {
              try {
                if (sharedContext.state === 'suspended') await sharedContext.resume()
                if (controller.signal.aborted || speechTokenRef.current !== token) {
                  resolve()
                  return
                }
                const source = sharedContext.createBufferSource()
                source.buffer = chunk.buffer
                source.connect(sharedAnalyser)
                activeBufferSourceRef.current = source
                source.onended = () => {
                  if (activeBufferSourceRef.current === source) {
                    activeBufferSourceRef.current = null
                  }
                  resolve()
                }
                setLoadingVoice(false)
                setSpeaking(true)
                source.start(0)
              } catch (err) {
                reject(err)
              }
            }
            void startBuffer()
            return
          }

          const url = URL.createObjectURL(chunk.blob)
          activeAudioUrlRef.current = url
          const audio = new Audio(url)
          activeAudioRef.current = audio
          audio.onplay = () => {
            setLoadingVoice(false)
            setSpeaking(true)
          }
          audio.onended = () => {
            URL.revokeObjectURL(url)
            if (activeAudioUrlRef.current === url) activeAudioUrlRef.current = null
            if (activeAudioRef.current === audio) activeAudioRef.current = null
            resolve()
          }
          audio.onerror = () => {
            URL.revokeObjectURL(url)
            if (activeAudioUrlRef.current === url) activeAudioUrlRef.current = null
            if (activeAudioRef.current === audio) activeAudioRef.current = null
            reject(new Error('Audio element playback failed'))
          }
          void audio.play().catch(reject)
        })

      try {
        let nextPromise: Promise<PreparedChunk> | null = fetchAndDecode(chunks[0], seedAudioUrl)
        for (let i = 0; i < chunks.length; i++) {
          if (controller.signal.aborted || speechTokenRef.current !== token) break
          const current = await nextPromise!
          if (controller.signal.aborted || speechTokenRef.current !== token) break
          // Prefetch next chunk while current chunk plays
          nextPromise =
            i + 1 < chunks.length
              ? fetchAndDecode(chunks[i + 1]).catch((err) => {
                  throw err
                })
              : null
          await playPrepared(current)
        }
        if (speechTokenRef.current === token) {
          cleanupAudioNodes()
          setLoadingVoice(false)
          setSpeaking(false)
          setSpeakingMsgId(null)
        }
      } catch {
        if (controller.signal.aborted || speechTokenRef.current !== token) return
        // Keep a single consistent Mai Chi voice for Vietnamese — never fall back to a second browser voice.
        cleanupAudioNodes()
        setLoadingVoice(false)
        setSpeaking(false)
        setSpeakingMsgId(null)
      }
    },
    [
      cleanupAudioNodes,
      lang,
      speechSupported,
      speakWithBrowserFallback,
      stopListening,
      stopSpeech,
    ],
  )

  // Chat history contains localized bot replies. Clear it on locale changes so
  // the open conversation never displays a mixture of languages.
  useEffect(() => {
    replyTimers.current.forEach(clearTimeout)
    replyTimers.current.clear()
    stopSpeech()
    stopListening()
    setMsgs([
      {
        id: 1,
        text: t.introScript,
        from: 'bot',
        audioUrl: lang === 'vi' ? landingSeedAudioByText.intro : null,
      },
    ])
    setInput('')
    setThinking(false)
    setActiveChapterId(null)
    return () => {
      replyTimers.current.forEach(clearTimeout)
      replyTimers.current.clear()
    }
  }, [lang, t.introScript, stopListening, stopSpeech])

  useEffect(() => {
    return () => {
      stopSpeech()
      stopListening()
    }
  }, [stopListening, stopSpeech])

  useEffect(() => {
    if (msgsRef.current)
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight
  }, [msgs])

  useEffect(() => {
    if (open) {
      if (mountedRef.current) {
        closeButton.current?.focus()
      }
      mountedRef.current = true
      setJustOpened(true)
      const timer = setTimeout(() => setJustOpened(false), 1150)
      return () => clearTimeout(timer)
    } else if (wasOpen.current) {
      stopSpeech()
      stopListening()
      openButton.current?.focus()
    }
    wasOpen.current = open
    mountedRef.current = true
  }, [open, stopListening, stopSpeech])

  const [waitingUnlock, setWaitingUnlock] = useState(false)

  // Auto-play the system introduction once on every page load without opening the chat box.
  // Preloads the WAV immediately on mount, attempts instant autoplay, and if the browser blocks
  // unmuted autoplay before the first gesture, calls audio.play() SYNCHRONOUSLY inside the
  // first pointer/click/key event so the browser always unlocks audio with zero delay.
  useEffect(() => {
    if (autoIntroDoneRef.current || !speechSupported) return

    const audioUrl = lang === 'vi' ? landingSeedAudioByText.intro : null
    if (!audioUrl) return

    let cancelled = false
    let cleanupGesture: (() => void) | null = null

    const introAudio = new Audio(audioUrl)
    introAudio.preload = 'auto'

    const onStarted = () => {
      if (cancelled || autoIntroDoneRef.current) {
        introAudio.pause()
        introAudio.src = ''
        return
      }
      autoIntroDoneRef.current = true
      setWaitingUnlock(false)
      activeAudioRef.current = introAudio
      setActiveChapterId('intro')
      setSpeakingMsgId(1)
      setLoadingVoice(false)
      setSpeaking(true)
      introAudio.onended = () => {
        if (activeAudioRef.current === introAudio) activeAudioRef.current = null
        setSpeaking(false)
        setSpeakingMsgId(null)
        setActiveChapterId(null)
      }
      introAudio.onerror = () => {
        if (activeAudioRef.current === introAudio) activeAudioRef.current = null
        setSpeaking(false)
        setSpeakingMsgId(null)
      }
    }

    const armGestureFallback = () => {
      if (cancelled || autoIntroDoneRef.current) return
      setWaitingUnlock(true)
      const onFirstGesture = (event: Event) => {
        cleanupGesture?.()
        cleanupGesture = null
        setWaitingUnlock(false)
        const target = event.target as HTMLElement | null
        // Only skip if the user explicitly clicked close, mute, or the manual play/stop button
        if (target?.closest('.lp-bot-close, .lp-bot-icon-btn, .lp-bot-voice-btn')) {
          autoIntroDoneRef.current = true
          introAudio.pause()
          introAudio.src = ''
          return
        }
        if (autoIntroDoneRef.current || !voiceEnabledRef.current) return
        stopSpeech()
        activeAudioRef.current = introAudio
        // Call play() synchronously inside the user gesture handler so Chrome never blocks it.
        const playPromise = introAudio.play()
        if (playPromise) {
          playPromise.then(onStarted).catch(() => {
            if (activeAudioRef.current === introAudio) activeAudioRef.current = null
          })
        } else {
          onStarted()
        }
      }
      window.addEventListener('pointerdown', onFirstGesture, true)
      window.addEventListener('touchstart', onFirstGesture, true)
      window.addEventListener('click', onFirstGesture, true)
      window.addEventListener('keydown', onFirstGesture, true)
      cleanupGesture = () => {
        window.removeEventListener('pointerdown', onFirstGesture, true)
        window.removeEventListener('touchstart', onFirstGesture, true)
        window.removeEventListener('click', onFirstGesture, true)
        window.removeEventListener('keydown', onFirstGesture, true)
      }
    }

    // Attempt immediate autoplay right on page load (zero delay).
    const tryAutoPlay = () => {
      if (cancelled || autoIntroDoneRef.current || !voiceEnabledRef.current) return
      const playPromise = introAudio.play()
      if (playPromise) {
        playPromise.then(onStarted).catch(() => {
          armGestureFallback()
        })
      } else {
        onStarted()
      }
    }

    tryAutoPlay()

    return () => {
      cancelled = true
      cleanupGesture?.()
      if (activeAudioRef.current !== introAudio) {
        introAudio.pause()
        introAudio.src = ''
      }
    }
  }, [lang, speechSupported, t.introScript])

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  const answer = useCallback(
    (text: string, forcedReply?: string, forcedAudioUrl?: string | null) => {
      // Immediately cancel any running/pending speech or auto-intro so 2 voices can never overlap.
      autoIntroDoneRef.current = true
      setWaitingUnlock(false)
      replyTimers.current.forEach(clearTimeout)
      replyTimers.current.clear()
      stopSpeech()

      let reply = forcedReply ?? t.defaultMessage
      let audioUrl: string | null =
        forcedAudioUrl !== undefined
          ? forcedAudioUrl
          : lang === 'vi'
            ? landingSeedAudioByText.default
            : null
      if (!forcedReply) {
        const matched = matchLandingEntry(text, lang === 'en' ? 'en' : 'vi')
        // Core topics keep their original answer and pre-recorded audio; everything else
        // (new topics, greetings, rude or too-short input) is answered from the knowledge base.
        const useCore = !matched || CORE_TOPIC_IDS.has(matched.id)
        let coreHit = false
        if (useCore) {
          for (let i = 0; i < kbPatterns.length; i++) {
            if (kbPatterns[i].test(text)) {
              reply = t.responses[i]
              audioUrl = lang === 'vi' ? kbSeedAudioUrls[i] ?? null : null
              coreHit = true
              break
            }
          }
        }
        if (!coreHit && matched) {
          reply = matched.answer
          audioUrl = null
        }
      }
      const userMsgId = nextIdRef.current++
      const history = historyRef.current
        .slice(-6)
        .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text.slice(0, 600) }))
      setMsgs((prev) => [...prev, { id: userMsgId, text, from: 'user' }])
      setThinking(true)

      const deliver = (finalReply: string, finalAudio: string | null) => {
        const botMsgId = nextIdRef.current++
        setThinking(false)
        setMsgs((prev) => [...prev, { id: botMsgId, text: finalReply, from: 'bot', audioUrl: finalAudio }])
        void speakText(finalReply, botMsgId, false, finalAudio)
      }

      if (forcedReply) {
        const timer = setTimeout(() => {
          replyTimers.current.delete(timer)
          deliver(reply, audioUrl)
        }, 360)
        replyTimers.current.add(timer)
        return
      }

      // Free-form question: ask the local LLM (RAG over the landing knowledge base).
      // Any failure or a slow answer falls back to the instant local knowledge-base reply.
      llmAbortRef.current?.abort()
      const controller = new AbortController()
      llmAbortRef.current = controller
      const seq = ++llmSeqRef.current
      const timeout = setTimeout(() => controller.abort(), 25_000)
      void apiRequest<{ reply: string }>(PUBLIC_CHAT_ENDPOINT, {
        method: 'POST',
        body: { message: text.slice(0, 500), lang: lang === 'en' ? 'en' : 'vi', history },
        signal: controller.signal,
      })
        .then((res) => (res?.reply?.trim() ? { text: res.reply.trim(), audio: null } : null))
        .catch(() => null)
        .then((llm) => {
          clearTimeout(timeout)
          if (seq !== llmSeqRef.current) return // a newer question superseded this one
          if (llm) deliver(llm.text, llm.audio)
          else deliver(reply, audioUrl)
        })
    },
    [lang, speakText, stopSpeech, t.defaultMessage, t.responses],
  )

  function handlePlayIntro() {
    autoIntroDoneRef.current = true
    setWaitingUnlock(false)
    replyTimers.current.forEach(clearTimeout)
    replyTimers.current.clear()
    if ((speaking || loadingVoice) && activeChapterId === 'intro') {
      stopSpeech()
      setActiveChapterId(null)
      return
    }
    setVoiceEnabled(true)
    voiceEnabledRef.current = true
    setActiveChapterId('intro')
    const audioUrl = lang === 'vi' ? landingSeedAudioByText.intro : null
    const botMsgId = nextIdRef.current++
    setMsgs((prev) => [
      ...prev,
      { id: botMsgId, text: t.introScript, from: 'bot', audioUrl },
    ])
    void speakText(t.introScript, botMsgId, true, audioUrl)
  }

  function handleSelectChapter(chapter: TourChapter) {
    setVoiceEnabled(true)
    voiceEnabledRef.current = true
    setActiveChapterId(chapter.id)
    answer(chapter.prompt, chapter.speech, lang === 'vi' ? chapter.audioUrl : null)
  }

  function handleToggleVoice() {
    if (voiceEnabled) {
      stopSpeech()
      setVoiceEnabled(false)
    } else {
      setVoiceEnabled(true)
    }
  }

  function handleToggleMic() {
    if (listening) {
      stopListening()
      return
    }
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) return

    stopSpeech()
    const recognition = new Ctor()
    recognition.lang = lang === 'vi' ? 'vi-VN' : 'en-US'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1

    let finalTranscript = ''
    recognition.onstart = () => setListening(true)
    recognition.onresult = (event) => {
      let combined = ''
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i]
        combined += res[0].transcript
        if (res.isFinal) finalTranscript = combined.trim()
      }
      setInput(combined)
    }
    recognition.onerror = () => {
      recognitionRef.current = null
      setListening(false)
    }
    recognition.onend = () => {
      recognitionRef.current = null
      setListening(false)
      const spoken = finalTranscript.trim()
      if (spoken) {
        setInput('')
        setActiveChapterId(null)
        answer(spoken)
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      recognitionRef.current = null
      setListening(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setActiveChapterId(null)
    answer(input.trim())
    setInput('')
  }

  const isBusySpeaking = speaking || loadingVoice

  const mascotState: AIMascotState = listening
    ? 'listening'
    : speaking
      ? 'speaking'
      : thinking || loadingVoice
        ? 'thinking'
        : justOpened
          ? 'welcome'
          : 'idle'

  const statusText = listening
    ? t.listeningStatus
    : speaking
      ? t.speakingStatus
      : thinking || loadingVoice
        ? t.thinkingStatus
        : t.onlineStatus

  if (open) {
    return (
      <div className="lp-bot">
        <div
          className="lp-bot-win"
          role="dialog"
          aria-modal="false"
          aria-label={t.assistantName}
        >
          <div className="lp-bot-header">
            <span className="lp-bot-header-badge" aria-hidden="true">
              <CustomerServiceOutlined />
            </span>
            <div className="lp-bot-header-meta">
              <b>{t.assistantName}</b>
              <small className={isBusySpeaking || listening ? 'is-live' : undefined}>
                {statusText}
              </small>
            </div>
            {speechSupported && (
              <button
                className={`lp-bot-icon-btn${voiceEnabled ? ' is-active' : ''}`}
                type="button"
                aria-label={voiceEnabled ? t.voiceOn : t.voiceOff}
                title={voiceEnabled ? t.voiceOn : t.voiceOff}
                onClick={handleToggleVoice}
              >
                {voiceEnabled ? <SoundOutlined /> : <AudioMutedOutlined />}
              </button>
            )}
            <button
              className="lp-bot-close"
              ref={closeButton}
              type="button"
              aria-label={t.close}
              onClick={() => setOpen(false)}
            >
              ×
            </button>
          </div>

          <div className={`lp-bot-stage${speaking ? ' is-speaking' : ''}`}>
            <div className="lp-bot-stage-mascot" aria-hidden="true">
              <AIAnimatedMascot
                size="companion"
                state={mascotState}
                speechAnalyser={speechAnalyser}
                interactivePointer
              />
            </div>
            <div className="lp-bot-stage-body">
              <p className="lp-bot-stage-sub">{t.stageSubtitle}</p>
              <button
                type="button"
                className={`lp-bot-voice-btn${isBusySpeaking ? ' is-speaking' : ''}`}
                onClick={isBusySpeaking ? stopSpeech : handlePlayIntro}
                disabled={!speechSupported}
              >
                {isBusySpeaking ? <PauseCircleFilled /> : <PlayCircleFilled />}
                <span>{isBusySpeaking ? t.stopSpeaking : t.playIntro}</span>
                {speaking && (
                  <span className="lp-bot-eq" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="lp-bot-chapters" aria-label={t.playIntro}>
            {t.tourChapters.map((ch) => (
              <button
                key={ch.id}
                type="button"
                className={activeChapterId === ch.id ? 'is-active' : undefined}
                onClick={() => handleSelectChapter(ch)}
              >
                {ch.label}
              </button>
            ))}
          </div>

          <div
            className="lp-bot-msgs"
            ref={msgsRef}
            role="log"
            aria-live="polite"
            aria-relevant="additions"
          >
            {msgs.map((m) => (
              <div
                key={m.id}
                className={`lp-bot-msg lp-bot-msg--${m.from}${speakingMsgId === m.id ? ' is-speaking' : ''}`}
              >
                <span>{m.text}</span>
                {m.from === 'bot' && speechSupported && (
                  <button
                    type="button"
                    className="lp-bot-msg-play"
                    aria-label={t.replay}
                    title={t.replay}
                    onClick={() =>
                      speakingMsgId === m.id
                        ? stopSpeech()
                        : void speakText(m.text, m.id, true, m.audioUrl)
                    }
                  >
                    {speakingMsgId === m.id ? (
                      <PauseCircleFilled />
                    ) : (
                      <SoundOutlined />
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="lp-bot-chips">
            {t.chips.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setActiveChapterId(null)
                  answer(s)
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <form className="lp-bot-form" onSubmit={handleSubmit}>
            <input
              aria-label={t.inputPlaceholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? t.listeningStatus : t.inputPlaceholder}
              autoComplete="off"
            />
            {micSupported && (
              <button
                type="button"
                className={`lp-bot-mic${listening ? ' is-listening' : ''}`}
                aria-label={listening ? t.micStop : t.micStart}
                title={listening ? t.micStop : t.micStart}
                onClick={handleToggleMic}
              >
                <AudioOutlined />
              </button>
            )}
            <button type="submit" className="lp-bot-send">
              {t.send}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="lp-bot">
      <div
        className={`lp-bot-hint${speaking || waitingUnlock ? ' is-visible' : ''}`}
      >
        {speaking
          ? lang === 'vi'
            ? 'Đang thuyết trình giới thiệu…'
            : 'Introducing OnDemand Monitor…'
          : waitingUnlock
            ? lang === 'vi'
              ? 'Bấm bất kỳ đâu để nghe AI giới thiệu'
              : 'Click anywhere to hear AI intro'
            : t.hint}
      </div>
      <button
        className="lp-bot-fab"
        ref={openButton}
        type="button"
        aria-label={t.fabAriaLabel}
        title={t.fabAriaLabel}
        onClick={() => setOpen(true)}
      >
        <span className="lp-bot-fab-halo" aria-hidden="true" />
        <AIAnimatedMascot
          size="launcher"
          state={speaking ? 'speaking' : 'idle'}
          speechAnalyser={speechAnalyser}
          interactivePointer
        />
        <span className="lp-bot-dot" aria-hidden="true">
          <SoundOutlined />
        </span>
      </button>
    </div>
  )
}
