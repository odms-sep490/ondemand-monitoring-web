import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { setLanguage } from '../../../../../shared/i18n'
import { RuntimePreflightItemRow } from '../components/RuntimePreflightItemRow'

describe('RuntimePreflightItemRow', () => {
  beforeEach(() => setLanguage('vi'))

  it('keeps checklist keys out of the displayed item copy', () => {
    render(
      <RuntimePreflightItemRow
        def={{
          key: 'battery_health',
          label: 'Pin máy bay',
          detail: 'Dung lượng và tình trạng pin theo dữ liệu thiết bị',
          code: 'battery_health',
        }}
        state={{ result: 'ok' }}
        manual={false}
        updating={false}
        onUpdate={vi.fn()}
      />,
    )

    expect(screen.getByText('Pin máy bay')).toBeTruthy()
    expect(
      screen.getByText('Dung lượng và tình trạng pin theo dữ liệu thiết bị'),
    ).toBeTruthy()
    expect(screen.queryByText(/_/)).toBeNull()
  })
})
