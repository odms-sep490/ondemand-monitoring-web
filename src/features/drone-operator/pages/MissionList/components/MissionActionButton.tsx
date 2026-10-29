import { Button } from 'antd'

/** Maps the legacy `odm-btn-*` action class onto an antd Button style. */
export function MissionActionButton({
  cls,
  href,
  label,
  block,
  onClick,
}: {
  cls: string
  href: string
  label: string
  block?: boolean
  onClick?: () => void
}) {
  const danger = cls.includes('odm-btn-rd')
  const primary =
    danger || cls.includes('odm-btn-p') || cls.includes('odm-btn-ok')
  return (
    <Button
      size="small"
      block={block}
      type={primary ? 'primary' : 'default'}
      danger={danger}
      href={href}
      onClick={onClick}
    >
      {label}
    </Button>
  )
}
