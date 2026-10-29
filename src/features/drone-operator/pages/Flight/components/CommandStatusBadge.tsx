import { GlassPanel } from './GlassPanel'

export function CommandStatusBadge({
  operationalMessage,
  lastCommand,
}: {
  operationalMessage: string | undefined
  lastCommand: string
}) {
  return (
    <GlassPanel
      style={{
        position: 'absolute',
        right: 14,
        bottom: 14,
        padding: '7px 11px',
        color: 'var(--fc-tx)',
        fontSize: 11,
      }}
    >
      {operationalMessage ?? lastCommand}
    </GlassPanel>
  )
}
