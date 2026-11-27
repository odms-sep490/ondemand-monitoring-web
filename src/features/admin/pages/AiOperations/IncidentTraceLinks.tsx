import { Button, Space } from 'antd'

export function IncidentTraceLinks({
  text,
  onOpen,
}: {
  text: string
  onOpen: (traceId: string) => void
}) {
  // Only canonical, bounded identifiers explicitly supplied by the incident service.
  const ids = [
    ...new Set(
      Array.from(
        text.matchAll(
          /(?:Mã truy vết(?: phục hồi)?|Trace):\s*(AI-(?:[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}|\d{8}-[\da-f]{6}))(?![\w-])/gi,
        ),
        (match) => match[1],
      ),
    ),
  ]
  if (ids.length === 0) return null
  return (
    <Space wrap>
      {ids.map((id) => (
        <Button key={id} size="small" type="link" onClick={() => onOpen(id)}>
          Xem truy vết {id}
        </Button>
      ))}
    </Space>
  )
}
