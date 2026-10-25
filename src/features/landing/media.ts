// Local, responsive copies. Source/author/license details live beside the assets.
export const landingMedia = {
  construction: '/images/landing/construction',
  infrastructure: '/images/landing/infrastructure',
  landscape: '/images/landing/landscape',
} as const

export type LandingMediaId = keyof typeof landingMedia

export function mediaSource(id: LandingMediaId) {
  const base = landingMedia[id]
  return {
    src: `${base}-1280.webp`,
    srcSet: `${base}-640.webp 640w, ${base}-1280.webp 1280w`,
    width: 1280,
    height: 800,
  }
}
