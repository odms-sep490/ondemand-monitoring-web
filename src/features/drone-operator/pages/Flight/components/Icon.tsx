import type { IconName } from '../inFlightTypes'

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {name === 'drone' && (
        <>
          <path {...common} d="M10 10h4v4h-4z" />
          <path {...common} d="M12 10V5M12 19v-5M10 12H5M19 12h-5" />
          <circle {...common} cx="5" cy="5" r="2" />
          <circle {...common} cx="19" cy="5" r="2" />
          <circle {...common} cx="5" cy="19" r="2" />
          <circle {...common} cx="19" cy="19" r="2" />
        </>
      )}
      {name === 'settings' && (
        <>
          <circle {...common} cx="12" cy="12" r="3" />
          <path
            {...common}
            d="M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 5h-4l-.4 3a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 .1 2l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 3h4l.4-3a8 8 0 0 0 1.7-1l2.4 1 2-3.5z"
          />
        </>
      )}
      {name === 'crosshair' && (
        <>
          <circle {...common} cx="12" cy="12" r="6" />
          <path {...common} d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </>
      )}
      {name === 'camera' && (
        <>
          <path {...common} d="M5 7h3l1.5-2h5L16 7h3v12H5z" />
          <circle {...common} cx="12" cy="13" r="3" />
        </>
      )}
      {name === 'eye' && (
        <>
          <path
            {...common}
            d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
          />
          <circle {...common} cx="12" cy="12" r="2.5" />
        </>
      )}
      {name === 'joystick' && (
        <>
          <circle {...common} cx="12" cy="7" r="3" />
          <path {...common} d="M12 10v5M7 20h10M9 15h6l2 5H7z" />
        </>
      )}
      {name === 'map' && (
        <>
          <path {...common} d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2z" />
          <path {...common} d="M9 4v14M15 6v14" />
        </>
      )}
      {name === 'plus' && <path {...common} d="M12 5v14M5 12h14" />}
      {name === 'minus' && <path {...common} d="M5 12h14" />}
      {name === 'takeoff' && (
        <>
          <path {...common} d="M12 19V5M7 10l5-5 5 5" />
          <path {...common} d="M5 19h14" />
        </>
      )}
      {name === 'land' && (
        <>
          <path {...common} d="M12 5v14M7 14l5 5 5-5" />
          <path {...common} d="M5 19h14" />
        </>
      )}
      {name === 'alert' && (
        <>
          <path {...common} d="M12 3 22 20H2z" />
          <path {...common} d="M12 9v5M12 17h.01" />
        </>
      )}
      {name === 'arrowUp' && <path {...common} d="M12 19V5M6 11l6-6 6 6" />}
      {name === 'arrowDown' && <path {...common} d="M12 5v14M6 13l6 6 6-6" />}
      {name === 'arrowLeft' && <path {...common} d="M19 12H5M11 6l-6 6 6 6" />}
      {name === 'arrowRight' && <path {...common} d="M5 12h14M13 6l6 6-6 6" />}
      {name === 'moveForward' && (
        <>
          <path {...common} d="M12 19V6" />
          <path {...common} d="m7 11 5-5 5 5" />
          <path {...common} d="M6 21h12" />
        </>
      )}
      {name === 'moveBack' && (
        <>
          <path {...common} d="M12 5v13" />
          <path {...common} d="m7 13 5 5 5-5" />
          <path {...common} d="M6 3h12" />
        </>
      )}
      {name === 'moveLeft' && (
        <>
          <path {...common} d="M19 12H6" />
          <path {...common} d="m11 7-5 5 5 5" />
          <path {...common} d="M21 6v12" />
        </>
      )}
      {name === 'moveRight' && (
        <>
          <path {...common} d="M5 12h13" />
          <path {...common} d="m13 7 5 5-5 5" />
          <path {...common} d="M3 6v12" />
        </>
      )}
      {name === 'altitudeUp' && (
        <>
          <path {...common} d="M12 20V7" />
          <path {...common} d="m8 11 4-4 4 4" />
          <path {...common} d="M7 20h10" />
          <path {...common} d="M18 5h3M19.5 3.5v3" />
        </>
      )}
      {name === 'altitudeDown' && (
        <>
          <path {...common} d="M12 4v13" />
          <path {...common} d="m8 13 4 4 4-4" />
          <path {...common} d="M7 20h10" />
          <path {...common} d="M18 5h3" />
        </>
      )}
      {name === 'rotateLeft' && (
        <>
          <path {...common} d="M4 7v6h6" />
          <path {...common} d="M5 13a7 7 0 1 0 2-7" />
        </>
      )}
      {name === 'rotateRight' && (
        <>
          <path {...common} d="M20 7v6h-6" />
          <path {...common} d="M19 13a7 7 0 1 1-2-7" />
        </>
      )}
      {name === 'gauge' && (
        <>
          <path {...common} d="M4 14a8 8 0 1 1 16 0" />
          <path {...common} d="m12 14 4-4" />
          <path {...common} d="M6 18h12" />
        </>
      )}
      {name === 'photo' && (
        <>
          <rect {...common} x="4" y="5" width="16" height="14" rx="2" />
          <circle {...common} cx="9" cy="10" r="1.5" />
          <path {...common} d="m20 15-4-4-8 8" />
        </>
      )}
      {name === 'video' && (
        <>
          <rect {...common} x="3" y="6" width="13" height="12" rx="2" />
          <path {...common} d="m16 10 5-3v10l-5-3z" />
        </>
      )}
      {name === 'radar' && (
        <>
          <circle {...common} cx="12" cy="12" r="8" />
          <path {...common} d="M12 12 18 8M12 4v2M12 18v2M4 12h2M18 12h2" />
        </>
      )}
      {name === 'activity' && <path {...common} d="M3 12h4l2-7 4 14 2-7h6" />}
      {name === 'shield' && (
        <path {...common} d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      )}
      {name === 'thermometer' && (
        <>
          <path {...common} d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0z" />
          <path {...common} d="M12 7v7" />
        </>
      )}
      {name === 'check' && <path {...common} d="m5 12 4 4 10-10" />}
      {name === 'chevronRight' && <path {...common} d="m9 6 6 6-6 6" />}
    </svg>
  )
}
