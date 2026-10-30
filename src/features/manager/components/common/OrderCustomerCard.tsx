import type { OrderDetail } from '../../types/orders'
import type { OrderReviewMessages } from '../../pages/OrderReview/OrderReviewPage.messages'
import { OrderIcon, type OrderIconName } from './OrderIcon'

function initialsOf(fullName: string): string {
  const letters = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return letters || '?'
}

export function OrderCustomerCard({
  order,
  t,
  hideEmpty = false,
}: {
  order: OrderDetail
  t: OrderReviewMessages
  hideEmpty?: boolean
}) {
  const { customer } = order
  const hasCompany = Boolean(customer.companyName?.trim())
  const rows: Array<{
    icon: OrderIconName
    label: string
    value: string | null
    empty: string
  }> = [
    { icon: 'mail', label: t.email, value: customer.email, empty: t.noEmail },
    { icon: 'phone', label: t.phone, value: customer.phone, empty: t.noPhone },
    {
      icon: 'building',
      label: t.company,
      value: hasCompany ? customer.companyName : null,
      empty: t.noCompany,
    },
    {
      icon: 'file',
      label: t.citizenIdentificationNumber,
      value: customer.citizenIdentificationNumber ?? null,
      empty: t.noCitizenIdentificationNumber,
    },
    {
      icon: 'file',
      label: t.companyTaxCode,
      value: customer.companyTaxCode ?? null,
      empty: t.noCompanyTaxCode,
    },
    {
      icon: 'pin',
      label: t.customerAddress,
      value: customer.address ?? null,
      empty: t.noCustomerAddress,
    },
  ]
  const visibleRows = hideEmpty ? rows.filter((row) => row.value) : rows

  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="user" size={18} />
          {t.customer}
        </span>
      </header>
      <div className="odm-or-card-body">
        <div className="odm-or-customer">
          <span className="odm-or-avatar" aria-hidden="true">
            {initialsOf(customer.fullName)}
          </span>
          <div className="odm-or-customer-main">
            <div className="odm-or-customer-name">{customer.fullName}</div>
            {hasCompany ? (
              <span className="odm-or-pill odm-or-pill-blue">
                {t.customerBusiness}
              </span>
            ) : null}
          </div>
        </div>
        {visibleRows.length > 0 ? (
          <ul className="odm-or-contact">
            {visibleRows.map((row) => (
              <li
                key={row.label}
                className={row.value ? undefined : 'is-empty'}
              >
                <OrderIcon name={row.icon} size={16} />
                <span>
                  <small>{row.label}</small>
                  {row.value || row.empty}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}
