import { act } from 'react'
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import { setLanguage } from '../../../../../shared/i18n'
import { ConnectDronePage } from '../ConnectDronePage'

// No mission id / mock server needed: the step header and form chrome
// render synchronously before the (unmocked) mission fetch settles.
describe('ConnectDroneScreen', () => {
  it('renders vietnamese chrome text', () => {
    render(<ConnectDronePage />)
    expect(screen.getByText('Kết nối thiết bị')).toBeTruthy()
    expect(screen.getByText('Xác thực phiên operator')).toBeTruthy()
  })

  it('renders english chrome text when language is switched', () => {
    render(<ConnectDronePage />)
    act(() => setLanguage('en'))
    expect(screen.getByText('Connect device')).toBeTruthy()
    expect(screen.getByText('Authenticate operator session')).toBeTruthy()
  })
})
