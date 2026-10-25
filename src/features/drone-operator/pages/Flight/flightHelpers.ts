export function missionIdFromCurrentFlightHash() {
  const match = window.location.hash.match(
    /^#portal\/drone-operator\/flight\/([^/?#]+)/,
  )
  return match?.[1] ? decodeURIComponent(match[1]) : null
}
