import { afterEach, describe, expect, it } from 'vitest'

import { authSession } from '../../features/auth/api/authApi'
import { notificationApi } from '../../features/notifications/notificationApi'

afterEach(() => authSession.clear())

describe('notification API in demo mode', () => {
  it('uses the role-scoped mock feed with a demo session instead of the real BE', async () => {
    authSession.save(
      {
        accessToken: 'mock-customer-token',
        tokenType: 'Bearer',
        user: {
          id: 'mock-customer-bao-le',
          fullName: 'Lê Quốc Bảo',
          email: 'bao.le@logisticscatlai.vn',
          role: 'CUSTOMER',
          emailVerified: true,
          isActive: true,
        },
      },
      false,
    )

    await expect(notificationApi.list()).resolves.toEqual(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({
            type: 'ORDER_IN_PROGRESS',
            entityId: 'cus-ord-001',
          }),
        ]),
      }),
    )
  })
})
