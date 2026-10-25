import type { ReactNode } from 'react'

export const ICONS: Record<string, ReactNode> = {
  drone: (
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M8 8l2.5 2.5M16 8l-2.5 2.5M8 16l2.5-2.5M16 16l-2.5-2.5" />
      <rect x="10" y="10" width="4" height="4" rx="1" />
    </>
  ),
  link: (
    <>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  battery: (
    <>
      <rect x="7" y="4" width="10" height="17" rx="2" />
      <path d="M10 2h4" />
    </>
  ),
  review: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M21 16l-5-5-8 8" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
  expand: <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />,
  chevron: <path d="M6 15l6-6 6 6" />,
  altitude: (
    <>
      <path d="M4 18l8-4 8 4" />
      <path d="M4 13l8-4 8 4" />
      <path d="M12 3v6" />
    </>
  ),
  speed: (
    <>
      <path d="M5 18a8 8 0 1 1 14 0" />
      <path d="M12 14l4-5" />
    </>
  ),
  vertical: <path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4" />,
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.5 8.5l-2 5-5 2 2-5z" />
    </>
  ),
  home: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v10h12V10" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  mode: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  takeoff: <path d="M12 20V5M6 11l6-6 6 6" />,
  fly: <path d="M3 11l18-8-8 18-2-8z" />,
  pause: <path d="M9 5v14M15 5v14" />,
  photo: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  rtl: (
    <>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v10h12V10" />
    </>
  ),
  land: <path d="M12 4v13M6 11l6 6 6-6M5 21h14" />,
  stop: (
    <>
      <circle cx="12" cy="12" r="9" />
      <rect x="8.5" y="8.5" width="7" height="7" rx="1" />
    </>
  ),
}

export function Ico({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}
