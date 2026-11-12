import { parseRealApiRoutes } from '../shared/api/realApiRoutes'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
const cognitoDomain = import.meta.env.VITE_AWS_COGNITO_DOMAIN
const cognitoClientId = import.meta.env.VITE_AWS_COGNITO_CLIENT_ID
const cognitoRedirectSignIn = import.meta.env.VITE_COGNITO_REDIRECT_SIGN_IN

// VITE_USE_MOCK_API: 'true' forces the mock transport on, 'false' forces it
// off. When an explicit API base URL is configured, default to the real API;
// otherwise dev builds can still use mocks without extra setup.
const useMockApiFlag = import.meta.env.VITE_USE_MOCK_API
const useMockApi =
  useMockApiFlag === 'true'
    ? true
    : useMockApiFlag === 'false'
      ? false
      : !apiBaseUrl && import.meta.env.DEV

// Simulated network latency for the mock API, in milliseconds. Zero during
// tests so vitest runs stay fast and deterministic.
const mockLatencyMs = import.meta.env.MODE === 'test' ? 0 : 250

// VITE_REAL_API_ROUTES: comma-separated "METHOD /path" patterns that are sent
// to the real backend even while the mock API is on (hybrid mode).
const staffLicenseApiRoutes = parseRealApiRoutes(
  [
    'GET /api/staff-licenses/users/*',
    'GET /api/staff-licenses/*',
    'GET /api/staff-licenses/*/document',
    'POST /api/staff-licenses',
    'PUT /api/staff-licenses/*',
    'POST /api/staff-licenses/*/verification',
    'POST /api/staff-licenses/*/revoke',
    'POST /api/staff-licenses/*/document',
  ].join(','),
)
const depositRefundApiRoutes = parseRealApiRoutes(
  [
    'POST /api/manager/orders/*/deposit-refunds',
    'GET /api/manager/orders/*/deposit-refund',
    'GET /api/orders/*/deposit-refund',
    'GET /api/admin/deposit-refunds*',
    'POST /api/admin/deposit-refunds/*/processing',
    'POST /api/admin/deposit-refunds/*/reject',
    'POST /api/admin/deposit-refunds/*/cancel',
    'POST /api/admin/deposit-refunds/*/attempts',
    'POST /api/admin/deposit-refunds/*/attempts/*/receipts',
    'POST /api/admin/deposit-refunds/*/confirm',
    'GET /api/deposit-refunds/*/receipts/*/access',
  ].join(','),
)
const realApiRoutes = [
  ...parseRealApiRoutes(import.meta.env.VITE_REAL_API_ROUTES),
  ...staffLicenseApiRoutes,
  ...depositRefundApiRoutes,
]

export const env = {
  apiBaseUrl: apiBaseUrl ?? 'http://localhost:8080',
  cognitoDomain,
  cognitoClientId,
  cognitoRedirectSignIn,
  useMockApi,
  mockLatencyMs,
  realApiRoutes,
  testPaymentsEnabled:
    (import.meta.env.DEV || import.meta.env.MODE === 'test') &&
    import.meta.env.VITE_ENABLE_TEST_PAYMENT === 'true',
} as const
