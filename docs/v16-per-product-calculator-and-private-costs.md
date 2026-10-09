# V16 — Calculator on products, private costs

## Customer experience

The large installment price on each product card opens the Amarango installment calculator. Cards with no returned plan and the detail financing article also have a named calculator button. The dialog lets the customer choose an available installment count and see the returned installment amount, actual last installment if different, total and smaller cash amount. It uses the existing shared read-only transport and published cash price; it does not import the private cost calculator or receive costs, margins or commissions. Missing financing remains a consultation state. Comparison and sharing retain the existing commercial values.

## Administration and owners

Each private product card has a “Calculadora Amarango” action which opens the original calculator panel, including Classic and Plan Protegido, for that product. Existing authorized cost data seeds the form. Missing cost starts empty/zero and requires manual real-cost entry; it is not inferred from retail price and does not silently use a sample. ARS and USD inputs remain available. These are simulations: they do not save or change published catalogue prices automatically.

The owner view links to products/calculator only when the existing trusted access response also grants administration. The administration server page still requires admin access before creating and serializing its cost records. No grant, role, backend schema or subscriber pricing is changed. Current administrative cost data is the existing server-side snapshot for matched products, not a newly introduced live cost feed.

## Validation

- 75 relevant automated tests passed, including original markup/financing policy, product cost seeding, no invented cost for unknown products, customer plan selection and totals, absence of private finance/fixture imports from the customer calculator, advisor/client denial, comparison, sharing and navigation regressions.
- Official Sites build passed.
- Global type checking retains existing errors outside the changed files; there are no changed-file diagnostics.
- Browser/Android QA remains pending because this managed runner has no supported browser QA capability. No authorization simulation or privileged backend test was attempted.

Android checks: tap a card's large installment price, choose 2/4/6 as available, close and compare the same product. As an owner/admin, open Administration, select a product's calculator and verify the real cost or explicit missing-cost state. As a customer/advisor, ensure the private administration destination is denied and neither product dialog nor sharing shows cost, margin or commission.
