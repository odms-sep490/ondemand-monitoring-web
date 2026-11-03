import { expect, it } from 'vitest'
import { customerDeliveryPanelMessages } from './customerDeliveryPanel.messages'
import { localizeRevisionFeedback } from './revisionFeedback'

it('localizes reason prefixes and preserves the customer notes and line breaks', () => {
  const value =
    'WRONG_LOCATION: lên trên tí nữa\nREQUIREMENT_NOT_MET: Đằng sau toà nhà'
  expect(
    localizeRevisionFeedback(
      value,
      customerDeliveryPanelMessages.vi.reasonCodes,
    ),
  ).toBe('Sai vị trí: lên trên tí nữa\nChưa đáp ứng yêu cầu: Đằng sau toà nhà')
})

it('keeps free text and unknown reason prefixes unchanged', () => {
  const value = 'Ghi chú: kiểm tra khu B\nUNKNOWN_CODE: keep this note'
  expect(
    localizeRevisionFeedback(
      value,
      customerDeliveryPanelMessages.en.reasonCodes,
    ),
  ).toBe(value)
})
