import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../../../shared/api/httpClient'
import { setLanguage } from '../../../../../shared/i18n'
import type { RefundResponse } from '../../../../finance/refundApi'
import { RefundManagementPage } from '../RefundManagementPage'

const baseRefund: RefundResponse = {
  id: 'refund-1',
  orderId: 'order-1',
  orderCode: 'ORD-001',
  orderTitle: 'Survey order',
  customerId: 'customer-1',
  customerName: 'Customer One',
  customerEmail: 'customer@example.test',
  invoiceId: 'invoice-1',
  invoiceNumber: 'INV-001',
  depositPayments: [
    {
      paymentId: 'payment-1',
      amount: 500000,
      currency: 'VND',
      provider: 'VNPAY',
      transactionReference: 'DEP-001',
      paidAt: '2026-10-01T10:00:00Z',
    },
  ],
  reason: 'The required permit was rejected.',
  status: 'PROCESSING',
  requestedById: 'manager-1',
  requestedByName: 'Manager One',
  requestedAt: '2026-10-02T10:00:00Z',
  processingAdminId: 'admin-1',
  processingAdminName: 'Admin One',
  processingAt: '2026-10-03T10:00:00Z',
  completedById: null,
  completedByName: null,
  completedAt: null,
  rejectedById: null,
  rejectedByName: null,
  rejectedAt: null,
  rejectionReason: null,
  cancelledById: null,
  cancelledByName: null,
  cancelledAt: null,
  cancellationReason: null,
  refundableAmount: 500000,
  refundedAmount: 0,
  attempts: [
    {
      id: 'attempt-1',
      attemptNumber: 1,
      executionChannel: 'BANK_TRANSFER',
      beneficiaryBank: 'Example Bank',
      beneficiaryName: 'Customer One',
      beneficiaryAccountNumber: '1234567890',
      beneficiaryConfirmedWithCustomer: true,
      amount: 500000,
      transactionReference: 'BANK-001',
      transferredAt: '2026-10-04T10:00:00Z',
      note: null,
      outcome: 'SUCCESSFUL',
      failureReason: null,
      recordedById: 'admin-1',
      recordedByName: 'Admin One',
      createdAt: '2026-10-04T10:01:00Z',
      receipts: [],
    },
  ],
}

let refund: RefundResponse
let calls: string[]

beforeEach(() => {
  act(() => setLanguage('en'))
  refund = structuredClone(baseRefund)
  calls = []
  if (!URL.createObjectURL) {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: () => 'blob:receipt',
    })
  }
  if (!URL.revokeObjectURL) {
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: () => undefined,
    })
  }
  setHttpTransport(async (input, init) => {
    const path = new URL(String(input)).pathname
    const method = init?.method ?? 'GET'
    calls.push(`${method} ${path}`)
    if (path === '/api/admin/deposit-refunds/summary' && method === 'GET')
      return json({ successfulPaymentsTotal: 1000000, completedRefundsTotal: 0, pendingRefundsTotal: 500000, pendingRefundCount: 1, outstandingMissionMilestonesTotal: 1500000, outstandingMissionMilestoneCount: 2 })
    if (path === '/api/admin/deposit-refunds' && method === 'GET')
      return json([refund])
    if (path.endsWith('/attempts') && method === 'POST') {
      const body = JSON.parse(String(init?.body)) as {
        executionChannel: 'BANK_TRANSFER' | 'VNPAY_MERCHANT_PORTAL'
        beneficiaryBank: string | null
        beneficiaryName: string | null
        beneficiaryAccountNumber: string | null
        beneficiaryConfirmedWithCustomer: boolean
        amount: number
        transactionReference: string
        transferredAt: string
        note: string | null
        outcome: 'SUCCESSFUL' | 'FAILED'
        failureReason: string | null
      }
      const attemptNumber = refund.attempts.length + 1
      refund = {
        ...refund,
        attempts: [
          ...refund.attempts,
          {
            id: `attempt-${attemptNumber}`,
            attemptNumber,
            executionChannel: body.executionChannel,
            beneficiaryBank: body.beneficiaryBank,
            beneficiaryName: body.beneficiaryName,
            beneficiaryAccountNumber: body.beneficiaryAccountNumber,
            beneficiaryConfirmedWithCustomer:
              body.beneficiaryConfirmedWithCustomer,
            amount: body.amount,
            transactionReference: body.transactionReference,
            transferredAt: body.transferredAt,
            note: body.note,
            outcome: body.outcome,
            failureReason: body.failureReason,
            recordedById: 'admin-1',
            recordedByName: 'Admin One',
            createdAt: '2026-10-04T10:01:00Z',
            receipts: [],
          },
        ],
      }
      return json(refund)
    }
    if (path.endsWith('/receipts') && method === 'POST') {
      const receipt = {
        id: 'receipt-1',
        fileName: 'bank-receipt.png',
        contentType: 'image/png',
        byteSize: 120,
        uploadedAt: '2026-10-04T10:02:00Z',
        accessPath: '/api/deposit-refunds/refund-1/receipts/receipt-1/access',
      }
      refund = {
        ...refund,
        attempts: refund.attempts.map((attempt) =>
          attempt.id === 'attempt-1'
            ? { ...attempt, receipts: [receipt] }
            : attempt,
        ),
      }
      return json(refund)
    }
    if (path.endsWith('/confirm') && method === 'POST') {
      refund = {
        ...refund,
        status: 'COMPLETED',
        refundedAmount: refund.refundableAmount,
        completedById: 'admin-1',
        completedByName: 'Admin One',
        completedAt: '2026-10-05T10:00:00Z',
      }
      return json(refund)
    }
    if (path.endsWith('/reject') && method === 'POST') {
      refund = {
        ...refund,
        status: 'REJECTED',
        rejectedById: 'admin-1',
        rejectedByName: 'Admin One',
        rejectedAt: '2026-10-05T10:00:00Z',
        rejectionReason: 'Need more permit information.',
      }
      return json(refund)
    }
    if (path.endsWith('/cancel') && method === 'POST') {
      refund = {
        ...refund,
        status: 'CANCELLED',
        cancelledById: 'admin-1',
        cancelledByName: 'Admin One',
        cancelledAt: '2026-10-05T10:00:00Z',
        cancellationReason: 'Customer asked to continue the permit process.',
      }
      return json(refund)
    }
    return json(refund)
  })
})

afterEach(() => {
  resetHttpTransport()
  act(() => setLanguage('vi'))
})

describe('RefundManagementPage', () => {
  it('requires a reason to reject a request and displays the audit entry', async () => {
    refund = { ...refund, status: 'REQUESTED', attempts: [] }
    render(<RefundManagementPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Reject request' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Reason'), {
      target: { value: 'Need more permit information.' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }))

    expect(await screen.findByText('Refund request rejected.')).toBeInTheDocument()
    expect(screen.getByText('Need more permit information.')).toBeInTheDocument()
    expect(calls).toContain('POST /api/admin/deposit-refunds/refund-1/reject')
  })

  it('cancels processing before a successful external refund', async () => {
    refund = {
      ...refund,
      attempts: [{ ...refund.attempts[0], outcome: 'FAILED', failureReason: 'Transfer failed.' }],
    }
    render(<RefundManagementPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel processing' }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.change(within(dialog).getByLabelText('Reason'), {
      target: { value: 'Customer asked to continue the permit process.' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirm' }))

    expect(await screen.findByText('Refund processing cancelled.')).toBeInTheDocument()
    expect(screen.getByText('Customer asked to continue the permit process.')).toBeInTheDocument()
    expect(calls).toContain('POST /api/admin/deposit-refunds/refund-1/cancel')
  })

  it('requires receipt evidence before offering refund confirmation', async () => {
    render(<RefundManagementPage />)
    expect(await screen.findByText('Successful refund transaction recorded')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Confirm refund' }),
    ).not.toBeInTheDocument()

    const file = new File(['receipt'], 'receipt.png', { type: 'image/png' })
    // Selecting a refund clears chosen files, so re-select until the initial
    // auto-selection has settled and the preview stays rendered.
    await waitFor(() => {
      if (!screen.queryByAltText('receipt.png')) {
        fireEvent.change(screen.getByLabelText(/Choose refund receipt images/), {
          target: { files: [file] },
        })
      }
      expect(screen.getByAltText('receipt.png')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Upload evidence' }))

    const confirm = await screen.findByRole('button', {
      name: 'Confirm refund',
    })
    fireEvent.click(confirm)
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Confirm refund' }),
    )

    expect(
      await screen.findByText('This completed refund record cannot be changed.'),
    ).toBeInTheDocument()
    expect(
      calls.indexOf(
        'POST /api/admin/deposit-refunds/refund-1/attempts/attempt-1/receipts',
      ),
    ).toBeLessThan(
      calls.indexOf('POST /api/admin/deposit-refunds/refund-1/confirm'),
    )
  })

  it('retains failed transfer history and permits a separate retry', async () => {
    refund = {
      ...refund,
      attempts: [
        {
          ...refund.attempts[0],
          outcome: 'FAILED',
          failureReason: 'Bank declined the transfer.',
        },
      ],
    }
    render(<RefundManagementPage />)
    expect(
      await screen.findByText('Bank declined the transfer.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Record external refund result')).toBeInTheDocument()
    expect(
      screen.getByText(
        'Failed attempts remain in the audit history. Record a new attempt after retrying outside OMSS.',
      ),
    ).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Receiving bank'), {
      target: { value: 'Example Bank' },
    })
    fireEvent.change(screen.getByLabelText('Beneficiary account holder'), {
      target: { value: 'Customer One' },
    })
    fireEvent.change(screen.getByLabelText('Beneficiary account number'), {
      target: { value: '1234567890' },
    })
    fireEvent.change(screen.getByLabelText('Refund amount'), {
      target: { value: '500000' },
    })
    fireEvent.change(screen.getByLabelText('Transaction outcome'), {
      target: { value: 'FAILED' },
    })
    fireEvent.change(
      screen.getByLabelText('External refund reference'),
      {
        target: { value: 'BANK-002' },
      },
    )
    fireEvent.change(screen.getByLabelText('Failure reason'), {
      target: { value: 'Insufficient transfer window' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Save transaction result' }),
    )
    expect(
      await screen.findByText(
        'Confirm beneficiary details with the customer before recording a bank transfer.',
      ),
    ).toBeInTheDocument()
    expect(refund.attempts).toHaveLength(1)
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'I confirmed the beneficiary details with the customer before transferring.',
      }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Save transaction result' }),
    )

    expect(
      await screen.findByText('Insufficient transfer window'),
    ).toBeInTheDocument()
    expect(refund.attempts).toHaveLength(2)
    expect(refund.attempts[0].failureReason).toBe('Bank declined the transfer.')
    expect(refund.attempts[1].outcome).toBe('FAILED')

    fireEvent.change(screen.getByLabelText('Transaction outcome'), {
      target: { value: 'SUCCESSFUL' },
    })
    fireEvent.change(
      screen.getByLabelText('External refund reference'),
      {
        target: { value: 'BANK-003' },
      },
    )
    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'I confirmed the beneficiary details with the customer before transferring.',
      }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Save transaction result' }),
    )

    expect(await screen.findByText('Successful refund transaction recorded')).toBeInTheDocument()
    expect(refund.attempts).toHaveLength(3)
    expect(refund.attempts[0].failureReason).toBe('Bank declined the transfer.')
    expect(refund.attempts[1].failureReason).toBe(
      'Insufficient transfer window',
    )
    expect(refund.attempts[2].outcome).toBe('SUCCESSFUL')
  })
})

function json(data: unknown) {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
