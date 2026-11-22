/** Formats a user-facing file label, hiding opaque UUID names behind a readable numbered label. */
export function formatDeliveryMediaLabel(
  fileName: string | null | undefined,
  index: number,
  isVideo: boolean,
  labels: {
    mediaFallbackImage: (index: number) => string
    mediaFallbackVideo: (index: number) => string
  },
): string {
  const trimmed = fileName?.trim()
  if (
    !trimmed ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i.test(trimmed) ||
    /^[0-9a-f]{32}(\.[a-z0-9]+)?$/i.test(trimmed)
  ) {
    return isVideo
      ? labels.mediaFallbackVideo(index)
      : labels.mediaFallbackImage(index)
  }
  return trimmed
}
