import { RocketOutlined } from '@ant-design/icons'
import { Tag } from 'antd'

export function DroneChip({ label }: { label: string }) {
  return (
    <Tag
      bordered={false}
      icon={<RocketOutlined aria-hidden="true" />}
      style={{ margin: 0, padding: '4px 12px', fontWeight: 700 }}
    >
      {label}
    </Tag>
  )
}
