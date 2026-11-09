/** Presentation of the legacy summary; customer notes and stored values stay unchanged. */
export function localizeRevisionFeedback(
  value: string,
  reasons: Record<string, string>,
) {
  return value.replace(/^([A-Z_]+):/gm, (prefix: string, code: string) =>
    reasons[code] ? `${reasons[code]}:` : prefix,
  )
}
