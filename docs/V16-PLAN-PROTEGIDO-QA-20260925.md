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

Examples:
- Cost $49.999:
  - Plan 3 displayed: initial $37.499 + $41.999 + $42.000 = $121.498.
  - Plan 6 displayed: initial $37.499 + $24.540 + $24.540 + $24.540 + $24.540 + $24.538 = $160.197.
- Cost $50.000:
  - Plan 3: initial $37.500 + 2 × $35.250 = $108.000.
  - Plan 6: initial $37.500 + 5 × $20.980 = $142.400.

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
- the 75% internal rule;
- commissions;
- Amarango net profit.

## Files
- `lib/internal/finance/plan-protegido.ts`
- `components/internal/admin/amarango-calculator-panel.tsx`
- `tests/v16-plan-protegido-calculator.test.mjs`

Status: implementation prepared and QA'd in branch only. No deploy performed.


## Protected-initial relief rule update
Owner requirement: the first payment must always be strictly higher than every later payment so the customer's strongest effort happens at pickup and the payment burden falls afterward.

The original 75%-of-cost rule is now a **floor**, not an absolute fixed amount.

Applied rule:
1. Compute base initial = 75% of cost.
2. Compute the minimum displayed-peso initial required for Plan 3 and Plan 6 so every later payment is strictly lower.
3. Use the largest of those values.
4. Verify the actual rounded schedules; if needed, raise the initial by $1 until the invariant is true.
5. Use the same protected initial for Plan 3 and Plan 6.

This preserves total financed amounts and Amarango profitability; it only redistributes customer collections.

Examples:
- Cost $40.000, markup 80%:
  - 75% base initial = $30.000.
  - Fixed 75% would produce Plan 3 later payments of $33.600 and violate the commercial intent.
  - Protected initial becomes $32.401.
  - Plan 3 later payments: $32.400 and $32.399.
  - Plan 6 later payments remain below $32.401.
- Cost $49.999:
  - base initial = $37.499.
  - protected initial = $40.500.
  - Plan 3 later payments = $40.499 / $40.499.
- Cost $50.000:
  - base initial = protected initial = $37.500.
  - no adjustment required.

QA sweep:
- all mandatory boundary costs;
- irregular representative costs;
- thousands of sampled costs above $1.000.

Result: zero detected failures for:
- initial > every later Plan 3 payment;
- initial > every later Plan 6 payment;
- initial + later payments = displayed financed total exactly.
