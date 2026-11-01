/** Turns the audit `actor` string into something a person can read. */
export function actorDisplayName(
  actor: string,
  locale: string,
  labels: { unknown: string; legacy: string },
): string {
  const value = actor.trim()
  if (!value) return labels.unknown
  if (/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(value))
    return labels.legacy
  if (value.includes('@')) return value
  if (!/^[a-z\d._-]+$/i.test(value) || !/[-_.]/.test(value)) return value
  return value
    .replace(/[._-]+/g, ' ')
    .split(/\s+/)
    .map((part) => part.charAt(0).toLocaleUpperCase(locale) + part.slice(1))
    .join(' ')
}

export function actorInitials(name: string, locale: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase(locale))
    .join('')
}
