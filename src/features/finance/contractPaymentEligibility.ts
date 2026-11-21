import type { Invoice } from './types'

/** A required contract must be confirmed by the manager before deposit checkout. */
export function isContractDepositReady(
  invoice:
    | Pick<
        Invoice,
        'contractRequired' | 'contractSubmittedAt' | 'contractConfirmedAt'
      >
    | null
    | undefined,
): boolean {
  return Boolean(
    invoice &&
    (!invoice.contractRequired ||
      invoice.contractConfirmedAt),
  )
}
