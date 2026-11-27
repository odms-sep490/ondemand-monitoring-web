# AI Chatbot V7 — Autonomous Training, Evaluation & Continuous Improvement Factory

Production-grounded training, synthetic scenario generation, multi-turn customer simulation, deterministic state evaluation, and regression factory for the **On-Demand Drone Monitoring** customer AI assistant.

## Reference Repositories & Attribution

| Repository | License | Borrowed Pattern Applied Here |
| :--- | :--- | :--- |
| `sierra-research/tau2-bench` | MIT | Dual-control multi-turn customer simulation, domain policies, isolated simulated DB, final world-state verification |
| `apple/ToolSandbox` | CC-BY-NC 4.0 (research) | Stateful tool execution, implicit step dependencies, intermediate milestone tracking, failure/recovery verification |
| `ShishirPatil/gorilla` (BFCL) | Apache 2.0 | Single/multi/sequential/parallel tool call assertions, argument extraction, tool relevance & abstention checks |
| `argilla-io/distilabel` | Apache 2.0 | Incremental pilot-then-scale synthetic dataset pipeline with schema validation & deduplication |
| `promptfoo/promptfoo` | MIT | Declarative regression suites, adversarial/safety red-teaming assertions, before/after scorecards |
| `stanfordnlp/dspy` | MIT | Metric-driven dynamic few-shot demonstration selection & compact prompt versioning (no prompt bloat) |
| `confident-ai/deepeval` | Apache 2.0 | Deterministic unit/metric assertions separated from subjective language checks |
| `RasaHQ/rasa` | Apache 2.0 (Core) | Goal-driven conversational scenarios with persona variation |
| `microsoft/TaskWeaver` | MIT | Stateful execution verification against real typed plugin/action contracts |
| `microsoft/playwright` | Apache 2.0 | Real-browser DOM & visible-section E2E verification (`e2e/ai-chatbot-v7-regression.e2e.ts`) |

> **Honesty & Data Governance**:
> - Official benchmark examples from external repos are **never** copied or translated verbatim; only methodology patterns are adapted to the Vietnamese `drone-monitoring` domain.
> - Zero real customer PII is used; all identities, phone numbers, emails, and addresses are synthetic.
> - No model-weight fine-tuning is claimed unless explicitly executed and approved; optimization targets production parsers, tool schemas, state handlers, retrieval demonstrations, and system instructions.

## Budget & Cost Controls

- Local deterministic generation, validation, simulation, and exact-state evaluation cost **$0.00 API**.
- Optional live Gemini evaluation / LLM augmentation requires explicit developer approval and enforces `--max-live-calls` (default `0`).

## Commands (run from `ondemand-monitoring-web/`)

```bash
# 1. Discover domain directly from FE + BE source code
npx tsx ai-training/domain/discover-domain.ts

# 2. Generate validated pilot dataset (~1,200 scenarios) & grouped 70/15/15 split
npx tsx ai-training/generators/scenario-factory.ts --pilot

# 2b. Scale up to full 10,000 validated scenarios (after pilot validation)
npx tsx ai-training/generators/scenario-factory.ts --scale 10000

# 3. Validate schemas, deduplicate, generate coverage report & grouped splits
npx tsx ai-training/validators/validate-and-split.ts

# 4. Run deterministic exact-state evaluation on dev / held-out / critical-regression
npx tsx ai-training/evaluations/evaluate.ts --split dev --out ai-training/reports/dev-report.json
npx tsx ai-training/evaluations/evaluate.ts --split held-out --out ai-training/reports/held-out-report.json
npx tsx ai-training/evaluations/evaluate.ts --split critical-regression --out ai-training/reports/critical-report.json

# 5. Run dynamic multi-turn Tau-Bench-style customer simulator (15 personas)
npx tsx ai-training/simulators/customer-simulator.ts

# 6. Generate validated hard-case variants from any failed evaluation report
npx tsx ai-training/generators/hard-case-generator.ts --report ai-training/reports/baseline-report.json

# 7. Select compact few-shot demonstrations from train split only (never held-out)
npx tsx ai-training/optimizers/select-demonstrations.ts

# 8. Run real browser Playwright E2E regression
$env:E2E_PORT="5179"; npx playwright test e2e/ai-chatbot-v7-regression.e2e.ts
```
