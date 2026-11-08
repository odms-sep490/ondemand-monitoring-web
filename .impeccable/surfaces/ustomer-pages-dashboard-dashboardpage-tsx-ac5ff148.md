---
version: 1
slug: "ustomer-pages-dashboard-dashboardpage-tsx-ac5ff148"
primary_target: "src/features/customer/pages/Dashboard/DashboardPage.tsx"
related_targets: ["src/features/customer/pages/Dashboard/components/DashboardStats.tsx","src/features/customer/pages/Dashboard/components/RecentOrdersCard.tsx","src/features/customer/pages/Dashboard/components/RecentMissionsCard.tsx","src/features/customer/pages/Dashboard/components/StatusBreakdown.tsx"]
---

# Customer overview — surface brief

Scope: Customer portal overview screen. Mode: operate within the established light-blue customer portal.

Audience and job: Customers who have submitted monitoring requests need to see their orders, progress, and the next useful step. Primary action: open an order’s details or create a request. Evidence: existing order data, status counts, payment-action indicators, and recent mission history. Constraints: preserve the current brand and bilingual support; use existing routes and APIs; do not invent mission progress or actions.

## Direction contract

THESIS: Make recent orders the working surface so customers can scan what is happening and open its details; keep status counts supportive and empty mission history compact. Avoid a tall status rail beside a short table and a detached, oversized empty panel.

OWN-WORLD: Keep the portal’s cool light-blue ground (#f4f7fc), white surfaces, navy ink (#0f1b3d), and blue primary (#1565e8). Use thin pale borders, restrained status tints, compact spacing, and no stacked card shadows. Remove the large colored icon tiles from the overview metrics.

STORY: Customers first understand their order totals, then scan recent orders and current status, open details for progress or payment information, and glance at recent missions. Empty mission history says plainly that there are no recent missions.

FIRST VIEWPORT: Keep the existing app shell. Place the page title, one-line explanation, and create-request button in a compact header. Follow with four equal KPIs in one divided strip. Below, use a two-column grid: recent orders with recent missions stacked in the wider left column; seven status counts in a compact right column. Keep loading, error, empty, and populated states inside the same layout and let the columns stack cleanly on narrow screens.

FORM: The user chose “Đơn hàng làm trọng tâm”, option 1 on the decision page and candidate 3 in the ordered list (the order-centered layout). The HTML sketch is the fixed composition reference. Seed reference:8e51d55b3672fcd1.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
