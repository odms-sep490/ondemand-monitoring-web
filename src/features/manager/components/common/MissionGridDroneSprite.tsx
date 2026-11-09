import type { RefObject } from 'react'
import { createPortal } from 'react-dom'

export function MissionGridDroneSprite({ size = 44 }: { size?: number }) {
  return (
    <svg
      className="mg-drone-sprite"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse cx="50" cy="55" rx="25" ry="20" fill="#0f172a" opacity=".12" />
      <path
        d="M50 50 21 21M50 50 79 21M50 50 21 79M50 50 79 79"
        stroke="#64748b"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M38 45c0-6 5-10 12-10s12 4 12 10v11c0 6-5 10-12 10s-12-4-12-10V45Z"
        fill="#e2e8f0"
        stroke="#475569"
        strokeWidth="2.5"
      />
      <rect x="45" y="40" width="10" height="11" rx="3" fill="#2563eb" />
      <path d="M46 62h8" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      {[
        [20, 20],
        [80, 20],
        [20, 80],
        [80, 80],
      ].map(([x, y]) => (
        <g className="mg-drone-rotor" key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="9" fill="#f8fafc" stroke="#64748b" strokeWidth="2.5" />
          <circle cx={x} cy={y} r="2.2" fill="#2563eb" />
          <g className="mg-drone-propeller">
            <path
              d={`M${x} ${y - 2}c-2-5-2-10 0-12 3 2 4 7 2 12M${x} ${y + 2}c2 5 2 10 0 12-3-2-4-7-2-12`}
              fill="#334155"
              opacity=".86"
            />
          </g>
        </g>
      ))}
    </svg>
  )
}

export function MissionGridFlyingDrone({
  overlayRef,
}: {
  overlayRef: RefObject<HTMLDivElement | null>
}) {
  if (typeof document === 'undefined') return null
  return createPortal(
    <div ref={overlayRef} className="mg-drone-flight-overlay" aria-hidden="true">
      <MissionGridDroneSprite size={72} />
    </div>,
    document.body,
  )
}
