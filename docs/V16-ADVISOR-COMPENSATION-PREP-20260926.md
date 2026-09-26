# AmarangoElectro V16 — Advisor Commissions + Monthly Bonus Prep — 2026-09-26

## Purpose
Auxiliary branch used to advance the definitive advisor compensation gate while Work's local independence checkpoint is still unable to push.

Branch:
`work/v16-advisor-commissions-bonus-prep-20260926`

Base:
`65eb51691c86226a25b59850f0015666bcd8291b`

Current HEAD at handoff creation:
`3b399739b44b23a7fe2f262af9a65d1c528e0dac`

Current TREE:
`e08021131b006361df9a31604e6831358c15be1e`

This branch MUST NOT replace Work's unpublished local checkpoint `568423661eeb98144177658da0b1061df8dd53c9`.
Integrate only after that checkpoint is safely published.

## Implemented

### Definitive financed advisor commission
Central engine:
`lib/internal/finance/advisor-compensation.ts`

Based only on definitive cash price:
- 0–49,999 → 7,500
- 50,000–99,999 → 12,000
- 100,000–149,999 → 16,000
- 150,000–199,999 → 20,000
- 200,000–249,999 → 24,000
- 250,000–299,999 → 28,000
- 300,000–399,999 → 37,500
- 400,000–499,999 → 45,000
- 500,000–599,999 → 52,500
- 600,000–699,999 → 60,000
- 700,000–799,999 → 70,000
- 800,000–899,999 → 80,000
- 900,000–999,999 → 90,000
- 1,000,000+ → 100,000

Financed commission is split into exactly 2 payments.
Cash commission remains 10%.

### Monthly bonus
- 5 equivalent sales → 10,000
- 10 → 35,000
- 15 → 65,000
- 20 → 100,000
- each completed equivalent sale above 20 → +7,500

Milestone bonuses are not cumulative.

Products with definitive cash price below 50,000 contribute 0.5 equivalent sale.
Products at 50,000 or above contribute 1.

Monthly bonus eligibility:
- valid payment;
- delivered;
- not cancelled;
- financed operations require installments-current=true at month close.

Cancelled sales generate neither bonus units nor generated commission.

### Plan Protegido
`lib/internal/finance/plan-protegido.ts`
now uses the fixed financed advisor commission for both Plan 3 and Plan 6.
Both financed commission schedules use two commission payments.
Customer plan totals, initial-protection formula and customer installment schedules were not changed.

### Calculator
`components/internal/admin/amarango-calculator-panel.tsx`
shows fixed financed advisor commission in Classic and Protected financing.
No 15% financed commission copy remains in active V16 calculator surfaces.

### Mi Amarango / advisor
- `app/components/advisor-compensation-summary.tsx`
- `app/components/advisor-workspace.tsx`
- `app/components/advisor-sale-draft-panel.tsx`

Added:
- "TU MES" section;
- monthly milestones;
- next-target framing;
- commission generated/paid/pending surface contract;
- per-product financed commission;
- financed commission while preparing a new sale;
- 2-payment commission display.

No product real cost is exposed to advisor UI.

### Admin
- `components/internal/admin/advisor-compensation-admin-summary.tsx`
- integrated into `components/internal/admin/advisors-panel.tsx`

Shows the definitive policy and reserves real monthly rows for secure backend data.

### Backend boundary
No Supabase migration or write was executed for this compensation gate.

Read-only audit found:
- historical `ventas.pagoRev` exists;
- there is no documented current V16 source proving it means current advisor commission paid;
- therefore it is NOT used as source of truth;
- live monthly compensation adapter remains fail-closed.

Files:
- `lib/advisors/advisor-compensation-contract.ts`
- `lib/advisors/advisor-compensation-adapter.ts`

The adapter intentionally returns `not_connected` until an authenticated backend contract exists for:
- advisor sale identity;
- commission payout ledger;
- month-close eligibility;
- frozen monthly settlement.

Do not infer advisor ownership from legacy free-text fields.

## QA written
`tests/v16-advisor-compensation-bonus.test.mjs`

Coverage:
- every commission boundary;
- 49,999 / 50,000;
- 999,999 / 1,000,000;
- commission split in two;
- 0.5 small-product units;
- 4.5 / 5;
- 9.5 / 10;
- 14.5 / 15;
- 19.5 / 20;
- 20.5 / 21 / 21.5 / 25;
- cancelled;
- payment pending;
- delivery pending;
- financed installments not current;
- duplicate sale id prevention;
- Plan Protegido fixed commission parity;
- advisor UI privacy/fail-closed source.

Existing Plan Protegido test was updated to expect fixed financed commission and 2 commission payments.

## Not executed here
A full Node/build run was not executed in this environment because there is no checked-out runner for this auxiliary branch.
Work must run the repository's real test/build commands after integration.

## Integration rule
After Work publishes:
- branch `work/v16-modelo-correcto-live-20260919`
- checkpoint/tag `v16-work-independence-20260926`
- expected Work commit `568423661eeb98144177658da0b1061df8dd53c9`

rebase/cherry-pick or otherwise integrate this auxiliary branch carefully.
Do not force-push.
Do not overwrite Work's handoff changes.
Resolve any overlapping finance/docs/tests deliberately.

## Still pending
1. authenticated monthly compensation read contract;
2. explicit commission payout ledger;
3. frozen month-close settlement;
4. exact delinquency/current-installment backend definition at month close;
5. build/test execution;
6. final browser QA;
7. deployment only after explicit authorization.
