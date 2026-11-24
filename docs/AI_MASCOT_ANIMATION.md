# AI mascot animation

## Asset and integration

The supplied transparent robot image is optimized to `public/assets/ai/ondemand-ai-mascot.webp` and loaded by `AIAnimatedMascot`. The floating launcher keeps its draggable position, accessible button behavior, and 80 px desktop / 72 px mobile footprint. The same mascot appears as a smaller companion beside the chat greeting and the latest assistant message. A small robot icon is used only if the image fails to load.

## Animation states

`OrderConversation` is the animation state controller. It derives the mascot state from the real microphone recording, TTS playback, request progress, and API error state. A short welcome reaction plays after opening the chat; service selection and a validated draft trigger a brief success reaction.

- `idle`: slow, low-amplitude floating motion on the launcher.
- `welcome`: brief entrance bounce after the chat opens.
- `listening`: small attentive motion while microphone capture is active.
- `thinking`: gentle motion while a request or transcription is processing.
- `speaking`: subtle whole-image pulse while the authenticated ZeroTTS audio element is actually playing; stopping or muting audio clears the pulse and its analyser.
- `success`: a brief acknowledgement after a service response or draft validation.
- `error`: restrained blue movement, without red flashing.

Motion owns each animated image transform. The launcher drag continues to own only the button position. Repeating animation is disabled when the page is hidden or reduced motion is requested; old chat messages render without active loops.

## Voice and visual limits

The reference is one flattened raster image, not a rig. The source does not provide separate hand, face, eye, mouth, antenna, or orbit layers. The implementation keeps the artwork intact and animates the whole character subtly. It does not claim hand articulation, directed pointing, blinking, or lip sync. A rigged asset or separate layers are needed for those motions. `speaking` follows the actual ZeroTTS audio element's playback events, and its analyser gently varies the blue glow with audio amplitude because the mouth cannot be moved faithfully from this image. The microphone state follows the actual `MediaRecorder` recording flag; transcription switches to `thinking` while its request is in flight.

## Voice playback

The order conversation receives WAV audio from the authenticated backend TTS endpoint. The selected local default is ZeroTTS `maichi`; VieNeu-TTS remains a configurable provider option. The voice toggle aborts a pending request or pauses the current audio and clears the speaking state. Three actual ZeroTTS comparison WAVs are stored under `on-demand-monitoring-system/docs/audio/`.

## Performance and verification

The PNG was converted to a 1254 × 1254 alpha-preserving WebP at about 344 KB. The existing `motion` dependency is used; no animation or WebGL package was added. The launcher image loads eagerly, chat avatars load lazily, and failed image requests retain a usable fallback.

Verification: `npm run build` and scoped ESLint passed. The authenticated audio playback/mute test passed, as did all 7 `httpClient` tests. The full `OrderConversation.test.tsx` file still has 9 failures and 4 passes in existing flow, copy, and microphone expectations; the new TTS playback test is among the passing tests. The two `AIAnimatedMascot` component tests passed in the earlier mascot pass. Playwright loaded the WebP at 1254 × 1254 over both light and dark backgrounds; the capture is [`ai-mascot-asset-transparency.png`](screenshots/ai-mascot-asset-transparency.png). The Create Order route redirected to the login page in the browser test, so an authenticated full-screen chat session was not verified in the browser.
