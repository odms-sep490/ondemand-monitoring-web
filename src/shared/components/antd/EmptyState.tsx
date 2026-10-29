import type { ReactNode } from 'react'

type Props = {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  /** Optional icon rendered in a tinted tile above the title. */
  icon?: ReactNode
  /** Set false to omit the illustration (used by error states). */
  art?: boolean
}

/** Centered empty/placeholder block for cards and tables. */
export function EmptyState({ title, description, action, icon, art = true }: Props) {
  return (
    <div className="mgr-empty">
      {icon ? (
        <span className="mgr-tile mgr-tone-blue" aria-hidden="true">
          {icon}
        </span>
      ) : art ? (
        <svg className="mgr-empty-art" viewBox="0 0 120 96" fill="none" aria-hidden="true">
          <ellipse cx="60" cy="86" rx="38" ry="6" fill="currentColor" opacity="0.1" />
          <rect x="22" y="14" width="76" height="62" rx="10" fill="currentColor" opacity="0.08" />
          <rect x="22" y="14" width="76" height="62" rx="10" stroke="currentColor" strokeWidth="2" opacity="0.45" />
          <path d="M22 34h76" stroke="currentColor" strokeWidth="2" opacity="0.35" />
          <circle cx="32" cy="24" r="2.5" fill="currentColor" opacity="0.5" />
          <circle cx="40" cy="24" r="2.5" fill="currentColor" opacity="0.35" />
          <rect x="34" y="44" width="34" height="5" rx="2.5" fill="currentColor" opacity="0.3" />
          <rect x="34" y="55" width="52" height="5" rx="2.5" fill="currentColor" opacity="0.18" />
          <circle cx="88" cy="68" r="13" fill="var(--mgr-card)" stroke="currentColor" strokeWidth="2" opacity="0.9" />
          <path d="m82 68 4.5 4.5L95 63" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : null}
      <div className="mgr-empty-title">{title}</div>
      {description ? <div className="mgr-empty-desc">{description}</div> : null}
      {action ? <div className="mgr-empty-action">{action}</div> : null}
    </div>
  )
}
