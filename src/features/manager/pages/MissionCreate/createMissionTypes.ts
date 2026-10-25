import type { WeatherForecast } from '../../../customer/api/customerApi'

export type SubmitState =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'planFailed'; message: string }
  | { kind: 'validationFailed'; message: string }

export type ForecastRow =
  | { date: string; label: string; status: 'loading' }
  | { date: string; label: string; status: 'unavailable' }
  | { date: string; label: string; status: 'error' }
  | { date: string; label: string; status: 'ready'; forecast: WeatherForecast }
