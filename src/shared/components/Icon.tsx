import type { SVGProps } from 'react'

export type IconName =
  | 'arrow-up-right'
  | 'arrow-right'
  | 'arrow-up'
  | 'arrow-down'
  | 'trash'
  | 'edit'
  | 'more'
  | 'check'
  | 'chevron-down'
  | 'activity'
  | 'camera'
  | 'shield'
  | 'radio'
  | 'route'
  | 'users'
  | 'sun'
  | 'moon'
  | 'menu'
  | 'x'
  | 'file-text'
  | 'ticket'
  | 'plus'
  | 'clock'
  | 'clipboard'
  | 'chart'
  | 'mail'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'arrow-left'
  | 'google'
  | 'map-pin'
  | 'cpu'
  | 'building'
  | 'leaf'
  | 'zap'
  | 'home'
  | 'minus'
  | 'sparkle'
  | 'search'
  | 'bell'
  | 'key'
  | 'link'

type IconProps = SVGProps<SVGSVGElement> & { name: IconName }

export function Icon({ name, ...props }: IconProps) {
  const paths: Record<IconName, React.ReactNode> = {
    'arrow-up': (
      <>
        <path d="M12 19V5" />
        <path d="m5 12 7-7 7 7" />
      </>
    ),
    'arrow-down': (
      <>
        <path d="M12 5v14" />
        <path d="m5 12 7 7 7-7" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
      </>
    ),
    edit: (
      <>
        <path d="m16 3 5 5-12 12-6 1 1-6zM14 5l5 5" />
      </>
    ),
    more: (
      <>
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="19" r="1" />
      </>
    ),
    'arrow-up-right': (
      <>
        <path d="M7 17 17 7" />
        <path d="M7 7h10v10" />
      </>
    ),
    'arrow-right': (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    'chevron-down': <path d="m6 9 6 6 6-6" />,
    activity: (
      <>
        <path d="M3 12h4l2-7 4 14 2-7h6" />
      </>
    ),
    camera: (
      <>
        <path d="M14.5 4h-5L8 6H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6z" />
        <path d="m8.5 12 2.2 2.2 4.8-4.8" />
      </>
    ),
    radio: (
      <>
        <circle cx="12" cy="12" r="2" />
        <path d="M7.1 7.1a7 7 0 0 0 0 9.8M16.9 7.1a7 7 0 0 1 0 9.8M4.3 4.3a11 11 0 0 0 0 15.4M19.7 4.3a11 11 0 0 1 0 15.4" />
      </>
    ),
    route: (
      <>
        <circle cx="6" cy="18" r="2" />
        <circle cx="18" cy="6" r="2" />
        <path d="M8 18h2a4 4 0 0 0 4-4v-4a4 4 0 0 1 4-4" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </>
    ),
    moon: (
      <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 8.5 8.5 0 1 0 20.5 14.5Z" />
    ),
    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
    x: (
      <>
        <path d="m6 6 12 12M18 6 6 18" />
      </>
    ),
    'file-text': (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h6" />
      </>
    ),
    ticket: (
      <>
        <path d="M3 8a3 3 0 0 0 0 6v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a3 3 0 0 0 0-6V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z" />
        <path d="M13 5v2M13 11v2M13 17v2" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    clipboard: (
      <>
        <rect width="14" height="16" x="5" y="4" rx="2" />
        <path d="M9 4V2h6v2M8 10h8M8 14h5" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5M4 19h16" />
        <path d="m7 15 3-4 3 2 5-7" />
      </>
    ),
    mail: (
      <>
        <rect width="18" height="14" x="3" y="5" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    lock: (
      <>
        <rect width="14" height="11" x="5" y="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),
    'eye-off': (
      <>
        <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.3A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a17.4 17.4 0 0 1-3.1 3.9M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 3.4-.6" />
      </>
    ),
    'arrow-left': (
      <>
        <path d="M19 12H5" />
        <path d="m11 18-6-6 6-6" />
      </>
    ),
    'map-pin': (
      <>
        <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </>
    ),
    cpu: (
      <>
        <rect x="7" y="7" width="10" height="10" rx="1.5" />
        <path d="M9.5 9.5 6.5 6.5M14.5 9.5l3-3M9.5 14.5l-3 3M14.5 14.5l3 3" />
        <circle cx="5" cy="5" r="1.5" />
        <circle cx="19" cy="5" r="1.5" />
        <circle cx="5" cy="19" r="1.5" />
        <circle cx="19" cy="19" r="1.5" />
      </>
    ),
    building: (
      <>
        <rect x="4" y="3" width="10" height="18" rx="1" />
        <path d="M14 8h6v13h-6M7 7h1M11 7h1M7 11h1M11 11h1M7 15h1M11 15h1" />
      </>
    ),
    leaf: (
      <>
        <path d="M5 12c0-5 4-9 14-9 0 10-4 14-9 14-3 0-5-2-5-5Z" />
        <path d="M5 19c4-4 8-6 14-14" />
      </>
    ),
    zap: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />,
    home: (
      <>
        <path d="M4 11 12 4l8 7" />
        <path d="M6 9.5V20h12V9.5" />
        <path d="M10 20v-6h4v6" />
      </>
    ),
    minus: <path d="M5 12h14" />,
    sparkle: (
      <>
        <path d="M12 3 14 9 20 11 14 13 12 19 10 13 4 11 10 9Z" />
        <path d="M19 3v3M17.5 4.5h3" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="M20 20l-4.2-4.2" />
      </>
    ),
    bell: (
      <>
        <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </>
    ),
    key: (
      <>
        <circle cx="8" cy="15" r="4" />
        <path d="M11 12l9-9M16 7l3 3" />
      </>
    ),
    link: (
      <>
        <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72" />
        <path d="M14 11a5 5 0 0 0-7.07 0l-3 3A5 5 0 0 0 11 21.07l1.72-1.72" />
      </>
    ),
    google: (
      <>
        <path
          fill="#4285F4"
          stroke="none"
          d="M21.35 12.27c0-.79-.07-1.55-.22-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.15c1.84-1.69 2.9-4.18 2.9-7.42Z"
        />
        <path
          fill="#34A853"
          stroke="none"
          d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.15-2.45c-.87.58-1.98.92-3.3.92-2.54 0-4.7-1.72-5.47-4.03H3.28v2.53A9.75 9.75 0 0 0 12 21.75Z"
        />
        <path
          fill="#FBBC05"
          stroke="none"
          d="M6.53 13.83A5.86 5.86 0 0 1 6.22 12c0-.64.11-1.26.31-1.83V7.64H3.28A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.03 4.36l3.25-2.53Z"
        />
        <path
          fill="#EA4335"
          stroke="none"
          d="M12 6.14c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.27 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.72 5.39l3.25 2.53C7.3 7.86 9.46 6.14 12 6.14Z"
        />
      </>
    ),
  }

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width="20"
      {...props}
    >
      {paths[name]}
    </svg>
  )
}
