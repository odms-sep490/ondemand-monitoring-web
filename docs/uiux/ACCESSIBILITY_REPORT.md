# Accessibility Report (WCAG 2.2 AA)

## Automated Playwright DOM Audit Results (28 Route × Viewport Checks)

| Check | Before | After | Status |
| --- | --- | --- | --- |
| Unlabeled buttons (WCAG 4.1.2) | 14 failures (`lp-bot-fab` on Landing & fallback routes) | **0 failures** | **PASS** |
| Images missing `alt` (WCAG 1.1.1) | 0 | **0** | **PASS** |
| Broken images | 0 | **0** | **PASS** |
| Landing small touch targets `< 32px` (WCAG 2.5.8) | 2 per viewport | **0** | **PASS** |
| Keyboard `:focus-visible` on Landing FAB & lang toggle (WCAG 2.4.7) | Missing | **Added (`2px solid #fff`, offset `2px`)** | **PASS** |
| Reduced motion on `html` smooth scroll (WCAG 2.3.3) | Missing | **Added `@media (prefers-reduced-motion: reduce)`** | **PASS** |

## Remaining Accessibility Items
- `Register` view has 1 compact control `< 32px` (`smallTouchTargets = 1`); scheduled for follow-up.
- Authenticated role dashboards were not audited live in Chromium because local backend compilation is currently blocked by concurrent changes in `device/maintenance/`.
