import { Alert } from 'antd'

export function PostflightErrorBanner({ error }: { error: string }) {
  return <Alert type="error" showIcon message={error} />
}
