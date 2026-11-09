import { describe, expect, it } from 'vitest'

import { preflightPageMessages } from '../PreflightPage.messages'
import { friendlyPreflightErrorMessage } from '../PreflightPage'

describe('friendlyPreflightErrorMessage', () => {
  it('replaces technical airspace fault codes with localized guidance', () => {
    const message =
      'Digital pre-device check FAILED - fault classified: airspace_permission'

    expect(
      friendlyPreflightErrorMessage(message, preflightPageMessages.vi),
    ).toBe(preflightPageMessages.vi.airspacePermissionDenied)
  })

  it('uses a localized general message for other classified preflight failures', () => {
    const message =
      'Digital pre-device check FAILED - fault classified: unknown'

    expect(
      friendlyPreflightErrorMessage(message, preflightPageMessages.vi),
    ).toBe(preflightPageMessages.vi.preflightCheckFailed)
  })
})
