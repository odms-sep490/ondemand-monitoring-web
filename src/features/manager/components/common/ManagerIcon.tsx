// Nav / brand icons for the Manager sidebar, copied verbatim (path data)
// from evd/design/MNG-01.dc.html so the sidebar matches the design exactly.
// Kept local to the manager feature rather than added to the shared
// `Icon.tsx` set, since these are MNG-* specific glyphs.
import type { ReactNode } from 'react'

export type ManagerIconName =
  | 'brand'
  | 'dashboard'
  | 'order-queue'
  | 'mission'
  | 'schedule'
  | 'live'
  | 'drones'
  | 'maintenance'
  | 'media'
  | 'reports'
  | 'menu'
  | 'sun'
  | 'moon'

const paths: Record<ManagerIconName, ReactNode> = {
  brand: (
    <>
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
      <path d="M9.5 9.5 6.5 6.5M14.5 9.5l3-3M9.5 14.5l-3 3M14.5 14.5l3 3" />
      <circle cx="5" cy="5" r="2.3" />
      <circle cx="19" cy="5" r="2.3" />
      <circle cx="5" cy="19" r="2.3" />
      <circle cx="19" cy="19" r="2.3" />
    </>
  ),
  dashboard: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h5v-6h4v6h5V10" />
    </>
  ),
  'order-queue': <path d="M5 12.5 9.5 17 19 7.5" />,
  mission: (
    <>
      <path d="M12 3l9 5-9 5-9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  schedule: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  live: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M8 8a5.5 5.5 0 000 8M16 8a5.5 5.5 0 010 8M5 5a10 10 0 000 14M19 5a10 10 0 010 14" />
    </>
  ),
  drones: (
    <>
      <rect x="9" y="9" width="6" height="6" rx="1.5" />
      <path d="M9.5 9.5 6.5 6.5M14.5 9.5l3-3M9.5 14.5l-3 3M14.5 14.5l3 3" />
      <circle cx="5" cy="5" r="2.3" />
      <circle cx="19" cy="5" r="2.3" />
      <circle cx="5" cy="19" r="2.3" />
      <circle cx="19" cy="19" r="2.3" />
    </>
  ),
  maintenance: (
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94z" />
  ),
  media: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.7" />
      <path d="M4 18l5-5 4 4 3-3 4.5 4.5" />
    </>
  ),
  reports: <path d="M5 20V11M12 20V4M19 20v-6" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z" />,
}

export function ManagerIcon({
  name,
  size = 16,
}: {
  name: ManagerIconName
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flex: 'none' }}
    >
      {paths[name]}
    </svg>
  )
}
