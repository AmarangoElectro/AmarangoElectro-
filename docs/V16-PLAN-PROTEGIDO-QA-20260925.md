# AmarangoElectro V16 — Plan Protegido QA — 2026-09-25

## Scope
Second, independent financing formula for the existing Admin calculator.

Safety invariants:
- Formula 1 source remains unchanged.
- No change to existing prices.
- No change to existing commission policy.
- No Supabase writes.
- No production publish.
- No automatic deploy.

## Formula 1 preserved
The two authoritative Formula 1 files retain their pre-change blob SHAs:
- `lib/internal/finance/amarango-calculator.ts`: `fbadde0b96ce11f2307b49da984f91768df273fe`
- `lib/internal/finance/amarango-policy.ts`: `f71f7fdcf7d978f6c66073b6b5b9074c9df439d1`

Current Formula 1 active financing remains:
- 2 installments: +15%
- 4 installments: +55%
- 6 installments: +78%

Plan Protegido reuses Formula 1's active 6-installment rule through `quoteInstallmentPlan(cashPriceExact, 6, policy)`; it does not define a new 6-installment percentage.

## Protected markup boundary QA

| Cost | Required markup | Exact cash price | Displayed cash |
| ---: | ---: | ---: | ---: |
| $49.999 | 80% | $89.998,20 | $89.998 |
| $50.000 | 60% | $80.000,00 | $80.000 |
| $99.999 | 60% | $159.998,40 | $159.998 |
| $100.000 | 50% | $150.000,00 | $150.000 |
| $249.999 | 50% | $374.998,50 | $374.999 |
| $250.000 | 40% | $350.000,00 | $350.000 |
| $349.999 | 40% | $489.998,60 | $489.999 |
| $350.000 | 30% | $455.000,00 | $455.000 |

Implementation is an ordered half-open ladder:
- `cost < 50_000`
- `cost < 100_000`
- `cost < 250_000`
- `cost < 350_000`
- otherwise

Therefore there are no gaps and no overlapping branches.

## Peso-closing QA

For every boundary case above and additional irregular costs, both schedules were checked with:

`displayedInitial + sum(displayedLaterPayments) === displayedFinancedTotal`

Result: PASS for Plan 3 and Plan 6.

Any peso difference caused by final display rounding is assigned only to the final later payment.

Examples after the balanced-initial policy:
- Cost $49.999, markup 80%, initial 90% of cost:
  - Plan 3 displayed: initial $44.999 + $38.249 + $38.250 = $121.498.
  - Plan 6 displayed: initial $44.999 + $23.040 + $23.040 + $23.040 + $23.040 + $23.038 = $160.197.
- Cost $50.000, markup 60%, initial 80% of cost:
  - Plan 3: initial $40.000 + 2 × $34.000 = $108.000.
  - Plan 6: initial $40.000 + 5 × $20.480 = $142.400.

## User example QA — cash price $357.999

Using real cost **$238.666**:
- protected markup: 50%
- exact cash price: **$357.999**
- exact initial: $178.999,50 → displayed **$179.000**
- cash commission 10%: $35.799,90 → displayed **$35.800**
- financed commission 15%: $53.699,85 → displayed **$53.700**
- Plan 3 commission payout: 2 × **$26.850**
- Plan 6 commission payout: 3 × **$17.900**

Plan 3:
- exact financed total: $483.298,65 → displayed $483.299
- later exact payment: $152.149,575
- displayed collection: initial $179.000 + $152.150 + final $152.149 = $483.299
- exact Amarango net: $190.932,80 → displayed $190.933

Plan 6:
- Formula 1 surcharge reused: 78%
- exact financed total: $637.238,22 → displayed $637.238
- later exact payment: $91.647,744
- displayed collection: initial $179.000 + 4 × $91.648 + final $91.646 = $637.238
- exact Amarango net: $344.872,37 → displayed $344.872

Cash:
- exact Amarango net: $83.533,10 → displayed $83.533

## Commercial-copy privacy QA
Generated customer copy contains:
- product name;
- take-it-today initial;
- Plan 3;
- Plan 6;
- cash price;
- fixed-payment benefits;
- @AmarangoElectro.

It does not contain:
- cost;
- markup;
- the internal initial-percentage table;
- commissions;
- Amarango net profit.

## Files
- `lib/internal/finance/plan-protegido.ts`
- `components/internal/admin/amarango-calculator-panel.tsx`
- `tests/v16-plan-protegido-calculator.test.mjs`

Status: implementation prepared and QA'd in branch only. No deploy performed.


## Balanced protected-initial rule

Owner requirement: the first payment must always be higher than every later payment, while keeping a coherent commercial effort across all cost tiers and avoiding unnecessary pressure on high-ticket sales.

Final rule:
- markup 80% → initial 90% of cost;
- markup 60% → initial 80% of cost;
- markup 50% → initial 75% of cost;
- markup 40% → initial 70% of cost;
- markup 30% → initial 65% of cost.

Equivalent invariant:
`initialExact = cashPriceExact × 50%`.

This is intentionally balanced:
- Plan 3 total remains 135% of cash price.
- After a 50%-of-cash initial, the remaining 85% of cash is split in two.
- Each later Plan 3 payment is therefore 42.5% of cash.
- Before peso rounding, initial / later payment = 50 / 42.5 = **1.176470588...**.
- Therefore the initial is consistently about **17.65% higher** than each later Plan 3 payment at every markup tier.
- Plan 6 uses the same initial and its later payments are even lower.

This changes only payment distribution. It does not change:
- cash price;
- financed totals;
- the +35% Plan 3 surcharge;
- Formula 1's +78% Plan 6 surcharge;
- advisor commission percentages/bases;
- Amarango net profitability.

Examples:
- Cost $40.000, markup 80%:
  - cash $72.000;
  - initial 90% of cost = $36.000;
  - Plan 3 later payments = $30.600 / $30.600.
- Cost $50.000, markup 60%:
  - cash $80.000;
  - initial 80% of cost = $40.000;
  - Plan 3 later payments = $34.000 / $34.000.
- Cost $100.000, markup 50%:
  - cash $150.000;
  - initial 75% of cost = $75.000;
  - Plan 3 later payments = $63.750 / $63.750.
- Cost $250.000, markup 40%:
  - cash $350.000;
  - initial 70% of cost = $175.000;
  - Plan 3 later payments = $148.750 / $148.750.
- Cost $350.000, markup 30%:
  - cash $455.000;
  - initial 65% of cost = $227.500;
  - Plan 3 later payments = $193.375 / $193.375.

QA sweep:
- mandatory boundary costs 49.999 / 50.000 / 99.999 / 100.000 / 249.999 / 250.000 / 349.999 / 350.000;
- irregular representative costs;
- broad sampled costs from $1.000 through $1.000.000.

Result: zero detected failures for:
- initial > every later Plan 3 payment;
- initial > every later Plan 6 payment;
- initial + later payments = displayed financed total exactly.

The engine also retains a whole-peso rounding guard: if display rounding could ever threaten the strict inequality, only the charged initial may move by the minimum whole-peso amount needed to preserve it.
