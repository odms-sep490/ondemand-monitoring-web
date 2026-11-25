import '@ant-design/v5-patch-for-react-19'
import { createRoot } from 'react-dom/client'
import '../../src/styles/global.css'
import '../../src/styles/odm.css'
import { setHttpTransport } from '../../src/shared/api/httpClient'
import { ReportStudio } from '../../src/features/inspection-report/ReportStudio'
const params = new URLSearchParams(window.location.search)
const actor = params.get('actor') ?? 'qa-manager'
setHttpTransport((url, options) => {
  const parsed = new URL(url, window.location.origin)
  const headers = new Headers(options?.headers)
  headers.set('X-QA-Actor', actor)
  return fetch(`http://localhost:8086${parsed.pathname}${parsed.search}`, {
    ...options,
    headers,
  })
})
createRoot(document.getElementById('root')!).render(
  <div style={{ padding: 16, background: '#f2f6fb', minHeight: '100vh' }}>
    <ReportStudio
      missionId={params.get('mission') ?? 'qa-mission'}
      customer={actor.startsWith('qa-customer') || actor === 'qa-other'}
    />
  </div>,
)
