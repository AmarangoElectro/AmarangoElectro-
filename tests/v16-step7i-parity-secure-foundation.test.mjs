import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else files.push(full);
  }
  return files;
}

test("Step 7I role model is fail-closed and admin security requirements are explicit", async () => {
  const script = `
    import { capabilitiesForRole, roleHasCapability, internalAccessRequirements } from './lib/internal/auth/roles.ts';
    process.stdout.write(JSON.stringify({
      customer: capabilitiesForRole('customer'),
      advisor: capabilitiesForRole('advisor'),
      admin: capabilitiesForRole('admin'),
      advisorCanPublish: roleHasCapability('advisor', 'catalog.publish'),
      advisorCanCalculate: roleHasCapability('advisor', 'calculator.use'),
      advisorCanSeeCost: roleHasCapability('advisor', 'cost.view'),
      advisorCanManageFx: roleHasCapability('advisor', 'fx.manage'),
      advisorCanSeeCommission: roleHasCapability('advisor', 'commission.view'),
      advisorCanSeeInvestment: roleHasCapability('advisor', 'investment.view'),
      advisorCanRegisterSale: roleHasCapability('advisor', 'sale.register'),
      advisorCanSeeCash: roleHasCapability('advisor', 'price.cash.view'),
      advisorCanSeeFinancingOptions: roleHasCapability('advisor', 'financing.options.view'),
      adminCanPublish: roleHasCapability('admin', 'catalog.publish'),
      adminCanCalculate: roleHasCapability('admin', 'calculator.use'),
      adminCanSeeCost: roleHasCapability('admin', 'cost.view'),
      adminCanManageFx: roleHasCapability('admin', 'fx.manage'),
      adminCanSeeCommission: roleHasCapability('admin', 'commission.view'),
      adminCanSeeInvestment: roleHasCapability('admin', 'investment.view'),
      adminCanImportCatalog: roleHasCapability('admin', 'catalog.import'),
      adminCanManageSuppliers: roleHasCapability('admin', 'supplier.manage'),
      requirements: internalAccessRequirements,
    }));
  `;
  const { stdout } = await execFileAsync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", script], { cwd: new URL("../", import.meta.url) });
  const result = JSON.parse(stdout);
  assert.equal(result.advisorCanPublish, false);
  assert.equal(result.advisorCanCalculate, false);
  assert.equal(result.advisorCanSeeCost, false);
  assert.equal(result.advisorCanManageFx, false);
  assert.equal(result.advisorCanSeeCommission, false);
  assert.equal(result.advisorCanSeeInvestment, false);
  assert.equal(result.advisorCanRegisterSale, true);
  assert.equal(result.advisorCanSeeCash, true);
  assert.equal(result.advisorCanSeeFinancingOptions, true);
  assert.equal(result.adminCanPublish, true);
  assert.equal(result.adminCanCalculate, true);
  assert.equal(result.adminCanSeeCost, true);
  assert.equal(result.adminCanManageFx, true);
  assert.equal(result.adminCanSeeCommission, true);
  assert.equal(result.adminCanSeeInvestment, true);
  assert.equal(result.adminCanImportCatalog, true);
  assert.equal(result.adminCanManageSuppliers, true);
  assert.equal(result.requirements.adminMfaRequired, true);
  assert.equal(result.requirements.serverSideEnforcementRequired, true);
  assert.equal(result.requirements.clientSidePasswordAccepted, false);
  assert.equal(result.requirements.localStorageSessionAccepted, false);
  assert.ok(result.customer.length < result.advisor.length);
  assert.ok(result.advisor.length < result.admin.length);
});

test("internal calculator is policy-driven and does not hardcode the legacy commercial policy", async () => {
  const script = `
    import { quoteSaleFromCost, quoteInstallmentPlan, quoteAdvisorCommission, quoteCapitalRequired } from './lib/internal/finance/calculator-engine.ts';
    const policy = {
      currency: 'ARS',
      pricingTiers: [{ maxCost: 100, markupPercent: 20 }, { maxCost: null, markupPercent: 10 }],
      installmentPlans: [{ installments: 2, surchargePercent: 12, active: true }, { installments: 4, surchargePercent: 25, active: true }],
      commission: { cashPercent: 5, financedPercent: 7 },
      rounding: { sale: 1, installment: 1, commission: 1 },
    };
    process.stdout.write(JSON.stringify({
      sale: quoteSaleFromCost(80, policy),
      plan: quoteInstallmentPlan(96, 2, policy),
      commission: quoteAdvisorCommission(96, true, policy),
      capital: quoteCapitalRequired({ cost: 80, salePrice: 96, firstCustomerPayment: 40, deliveryCost: 5, firstCommissionPayment: 3 }),
    }));
  `;
  const { stdout } = await execFileAsync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", script], { cwd: new URL("../", import.meta.url) });
  const result = JSON.parse(stdout);
  assert.deepEqual(result.sale, { cost: 80, salePrice: 96, markupPercent: 20 });
  assert.equal(result.plan.installments, 2);
  assert.equal(result.plan.installmentAmount, 54);
  assert.equal(result.commission.commission, 7);
  assert.equal(result.capital, 48);

  const engine = await source("lib/internal/finance/calculator-engine.ts");
  assert.doesNotMatch(engine, /1\.80|1\.60|1\.50|1\.40|1\.30|Amara4|Moro6/);
  assert.doesNotMatch(engine, /localStorage|sessionStorage|fetch\s*\(|createClient|SUPABASE/i);
});

test("internal foundation is not imported by the public storefront", async () => {
  const appDir = fileURLToPath(new URL("../app", import.meta.url));
  const publicLibDir = fileURLToPath(new URL("../lib/commerce", import.meta.url));
  const catalogLibDir = fileURLToPath(new URL("../lib/catalog", import.meta.url));
  const files = [
    ...await walk(appDir),
    ...await walk(publicLibDir),
    ...await walk(catalogLibDir),
  ];
  const sources = await Promise.all(files.filter((file) => /\.(?:ts|tsx)$/.test(file)).map((file) => readFile(file, "utf8")));
  assert.doesNotMatch(sources.join("\n"), /lib\/internal|@\/lib\/internal/);
});

test("Step 7I.1 uses one admin-only 30-day price review clock and honors manual confirmation", async () => {
  const script = `
    import { priceAgeStatus } from './lib/internal/finance/price-age.ts';
    const day = 86400000;
    const now = 100 * day;
    process.stdout.write(JSON.stringify({
      fresh: priceAgeStatus({ priceUpdatedAt: 90 * day }, now),
      warning: priceAgeStatus({ priceUpdatedAt: 75 * day }, now),
      review: priceAgeStatus({ priceUpdatedAt: 60 * day }, now),
      confirmed: priceAgeStatus({ priceUpdatedAt: 60 * day, priceConfirmedAt: 95 * day }, now),
    }));
  `;
  const { stdout } = await execFileAsync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e", script], { cwd: new URL("../", import.meta.url) });
  const result = JSON.parse(stdout);
  assert.equal(result.fresh.status, "fresh");
  assert.equal(result.warning.status, "warning");
  assert.equal(result.review.status, "review");
  assert.equal(result.confirmed.status, "fresh");
  assert.equal(result.confirmed.days, 5);
});

test("Step 7I documents full legacy parity without activating protected systems", async () => {
  const inventory = await source("docs/LEGACY-FEATURE-INVENTORY.md");
  const report = await source("docs/V16-STEP7I-LEGACY-PARITY-SECURE-FOUNDATION.md");
  const index = await source("lib/catalog/index.ts");
  assert.match(inventory, /Calculadora contado\/costo\/USD/);
  assert.match(inventory, /Registrar venta/);
  assert.match(inventory, /Alta \/ edición de productos/);
  assert.match(inventory, /Backups/);
  assert.match(report, /MFA/);
  assert.match(report, /no se conectó Supabase Auth/i);
  assert.match(index, /new V411AuditedPilotCatalogAdapter\(\)/);
  assert.doesNotMatch([inventory, report].join("\n"), /service_role|SUPABASE_URL|NEXT_PUBLIC_SUPABASE/);
});
