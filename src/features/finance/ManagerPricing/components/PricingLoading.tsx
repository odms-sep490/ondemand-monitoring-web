export function PricingLoading() {
  return (
    <div className="finance-workspace">
      <section className="odm-or-card finance-panel finance-fallback">
        Đang tải thông tin giá...
      </section>
      <div className="finance-sidebar">
        <aside className="odm-or-card finance-quote finance-fallback">
          {null}
          <div className="finance-quote-body">
            <div className="finance-quote-content">Đang tải báo giá...</div>
          </div>
        </aside>
      </div>
    </div>
  )
}
