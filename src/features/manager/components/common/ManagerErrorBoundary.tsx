import { Component, type ErrorInfo, type ReactNode } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { ErrorState } from './ErrorState'
import { managerErrorBoundaryMessages } from './ManagerErrorBoundary.messages'

type Props = {
  children: ReactNode
  /** Changing this value (e.g. the route hash) clears a caught error. */
  resetKey?: string
}

type State = { error: Error | null }

function Fallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n(managerErrorBoundaryMessages)
  return (
    <ErrorState title={t.title} description={t.description} onRetry={onRetry} />
  )
}

/** Keeps a malformed payload from blanking the whole Manager content area. */
export class ManagerErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Manager screen crashed', error, info.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    if (this.state.error) {
      return <Fallback onRetry={() => this.setState({ error: null })} />
    }
    return this.props.children
  }
}
