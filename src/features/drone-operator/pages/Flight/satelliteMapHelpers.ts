import type { GpsPoint } from './gpsRoutePlanner'
import L from 'leaflet'

export function sameGpsPoint(from: GpsPoint, to: GpsPoint) {
  return from.latitude === to.latitude && from.longitude === to.longitude
}

export function lerpGpsPoint(
  from: GpsPoint,
  to: GpsPoint,
  progress: number,
): GpsPoint {
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * progress,
    longitude: from.longitude + (to.longitude - from.longitude) * progress,
  }
}

export function droneArrowIcon(rotationDegrees: number) {
  return L.divIcon({
    className: 'satellite-drone-arrow-icon',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    html: `
      <div class="satellite-drone-arrow" style="transform: rotate(${rotationDegrees}deg)">
        <svg viewBox="0 0 60 60" aria-hidden="true" focusable="false">
          <circle class="satellite-drone-pulse" cx="30" cy="30" r="27" fill="rgba(21,101,232,.18)" stroke="rgba(255,255,255,.6)" stroke-width="1.5"></circle>
          <path d="M17 17 43 43M43 17 17 43" stroke="#0f172a" stroke-width="5" stroke-linecap="round"></path>
          <path d="M17 17 43 43M43 17 17 43" stroke="#475569" stroke-width="2.4" stroke-linecap="round"></path>
          <g transform="translate(15 15)">
            <circle r="11" fill="rgba(15,23,42,.35)" stroke="#e2e8f0" stroke-width="1.6"></circle>
            <g class="satellite-drone-rotor" style="animation-duration:0.5s"><rect x="-10" y="-1.6" width="20" height="3.2" rx="1.6" fill="#f8fafc"></rect><rect x="-1.6" y="-10" width="3.2" height="20" rx="1.6" fill="#f8fafc" opacity=".55"></rect></g>
            <circle r="2.2" fill="#1e293b"></circle>
          </g>
          <g transform="translate(45 15)">
            <circle r="11" fill="rgba(15,23,42,.35)" stroke="#e2e8f0" stroke-width="1.6"></circle>
            <g class="satellite-drone-rotor" style="animation-duration:0.55s"><rect x="-10" y="-1.6" width="20" height="3.2" rx="1.6" fill="#f8fafc"></rect><rect x="-1.6" y="-10" width="3.2" height="20" rx="1.6" fill="#f8fafc" opacity=".55"></rect></g>
            <circle r="2.2" fill="#1e293b"></circle>
          </g>
          <g transform="translate(15 45)">
            <circle r="11" fill="rgba(15,23,42,.35)" stroke="#e2e8f0" stroke-width="1.6"></circle>
            <g class="satellite-drone-rotor" style="animation-duration:0.55s"><rect x="-10" y="-1.6" width="20" height="3.2" rx="1.6" fill="#f8fafc"></rect><rect x="-1.6" y="-10" width="3.2" height="20" rx="1.6" fill="#f8fafc" opacity=".55"></rect></g>
            <circle r="2.2" fill="#1e293b"></circle>
          </g>
          <g transform="translate(45 45)">
            <circle r="11" fill="rgba(15,23,42,.35)" stroke="#e2e8f0" stroke-width="1.6"></circle>
            <g class="satellite-drone-rotor" style="animation-duration:0.5s"><rect x="-10" y="-1.6" width="20" height="3.2" rx="1.6" fill="#f8fafc"></rect><rect x="-1.6" y="-10" width="3.2" height="20" rx="1.6" fill="#f8fafc" opacity=".55"></rect></g>
            <circle r="2.2" fill="#1e293b"></circle>
          </g>
          <rect x="24" y="21" width="12" height="18" rx="6" fill="#1565e8" stroke="#ffffff" stroke-width="2"></rect>
          <circle cx="30" cy="33" r="3" fill="#0f172a" stroke="#93c5fd" stroke-width="1.2"></circle>
          <path d="M30 4 35 12H25Z" fill="#f97316" stroke="#ffffff" stroke-width="1.6" stroke-linejoin="round"></path>
        </svg>
      </div>
    `,
  })
}
