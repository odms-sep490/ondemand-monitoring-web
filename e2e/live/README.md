# Live order journey

This Playwright spec sends real HTTP requests using four separate role contexts. Run it against a disposable test backend with its own PostgreSQL database, test storage, payment sandbox and flight test environment. It creates an Order and uses the returned ID for checkpoints throughout the run.

Set ODMS_LIVE_API to the backend origin, ODMS_LIVE_WRITE to 1 and ODMS_LIVE_SCENARIO to an absolute path to a JSON file. Supply ODMS_TOKEN_CUSTOMER, ODMS_TOKEN_MANAGER, ODMS_TOKEN_PILOT and ODMS_TOKEN_INSPECTOR through the process environment. Do not commit tokens or put them in the scenario file.

Run with:

    npx playwright test --config playwright.live.config.ts

The JSON file needs a createOrder object matching OrderCreateRequest and a steps object containing arrays named contractAndDeposit, planning, flightAndMedia, inspection, delivery, customerRework and redelivery. Each step declares name, role, method, path and expected HTTP status. It may also declare body, capture (variable names mapped to response field paths) and verify (response field paths mapped to expected values). Field paths are dot separated and can include array indexes. Use {{orderId}} in paths and bodies, {{runId}} for unique values, and {{variable}} to refer to captured fields. Each phase needs at least one response assertion. For multipart requests use multipart.fields and multipart.file with field, path, name and mimeType.

Populate the steps with the actual fixture IDs, payment authorization and flight events of the target environment. This repo does not yet include a complete environment-specific fixture or a browser UI journey for this flow. A failed setup or missing fixture means the workflow was not exercised.
