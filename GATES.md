# Gates: customer create-order UI

OWNS: src/features/customer/pages/CreateOrder/**, src/features/customer/components/checklist/Checklist.css, GATES.md

Scope: deliver a consistent, responsive, non-overlapping customer create-order experience across steps 1 through 5

- [x] G0: this ledger states outcome-oriented checks that can fail
  CHECK: node C:\Users\ACER\.codex\skills\unlazy\scripts\gate-lint.mjs GATES.md
  EXPECT: LINT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0361d2bbcd6419d81a7cfc87051b30559c7a7ac7a0d15d987173365b4db4aa86; exit=0; EXPECT=matched; output-sha256=7a7922f0e3f69de36db176b084b74091e068cc8772d7b0d01d49001e587c54e0; output-bytes=150; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\ACER\Documents\GitHub\doan\ondemand-monitoring-web; path=fd7a444b1c8a/66 entries

- [x] G1: create-order TypeScript compiles without errors
  CHECK: npm run typecheck && echo CREATE_ORDER_TYPECHECK_OK
  EXPECT: CREATE_ORDER_TYPECHECK_OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e8ea0cb718026ef28240ff34ddcaf81ae856bfab7bd11dcab1f4c39f7f53eae2; exit=0; EXPECT=matched; output-sha256=ff1e556f298099374407b57be1824af434225cc210049a4e075cfba2d8dc24d4; output-bytes=80; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\ACER\Documents\GitHub\doan\ondemand-monitoring-web; path=fd7a444b1c8a/66 entries

- [x] G2: create-order components pass targeted lint checks
  CHECK: npx eslint src/features/customer/pages/CreateOrder/CreateOrderPage.tsx src/features/customer/pages/CreateOrder/components/ContentStep.tsx src/features/customer/pages/CreateOrder/components/LocationStep.tsx src/features/customer/pages/CreateOrder/components/ScheduleStep.tsx src/features/customer/pages/CreateOrder/components/PricingEstimateCard.tsx src/features/customer/components/checklist/ChecklistEditor.tsx && echo CREATE_ORDER_LINT_OK
  EXPECT: CREATE_ORDER_LINT_OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0e97f7d32f33ccbc6ffb5bc9a864125c8ee218f44bd086befa8e12fcc3a1259e; exit=0; EXPECT=matched; output-sha256=86f4bb9ee3a917bbafeedf2c55febb91040b7da82c848c27d465190754b65938; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\ACER\Documents\GitHub\doan\ondemand-monitoring-web; path=38bbcfb845a1/66 entries

- [x] G3: create-order page component tests pass
  CHECK: npx vitest run src/features/customer/pages/CreateOrder/tests/CreateOrderPage.test.tsx && echo CREATE_ORDER_TESTS_OK
  EXPECT: CREATE_ORDER_TESTS_OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7b60417db65033a8253a3dffeae02e8e26242e1857ba8448a4481fd3d4d886bc; exit=0; EXPECT=matched; output-sha256=01bc4051eebe842477b83286e7bbe2706a5216c7bf022306715479ff127ab59b; output-bytes=258; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\ACER\Documents\GitHub\doan\ondemand-monitoring-web; path=fd7a444b1c8a/66 entries

- [x] G4: the production application builds successfully
  CHECK: npm run build && echo CREATE_ORDER_BUILD_OK
  EXPECT: CREATE_ORDER_BUILD_OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2868014ac20f695e2d2d661f4636c23e9cc76e729db698fea57ce2d2c7b332aa; exit=0; EXPECT=matched; output-sha256=b5d848aaa6904f608dd9fac3ad18ff34cb7934d55dd4e09142e1da1282229bd6; output-bytes=869; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\ACER\Documents\GitHub\doan\ondemand-monitoring-web; path=fd7a444b1c8a/66 entries

- [x] G5: all five steps share a coherent hierarchy, spacing system, responsive behavior, and in-flow actions without covering content
  EVIDENCE: Source review confirms one shared 1.65fr/340px layout, unified 12px cards and spacing, single-column breakpoints at 1000px/640px, and actions rendered in-flow for steps 1-5; the former fixed overlay is disabled.
