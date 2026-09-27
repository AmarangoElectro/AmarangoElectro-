import { spawnSync } from "node:child_process";
import process from "node:process";

const currentContracts = [
  "tests/v16-work-independence.test.mjs",
  "tests/v16-catalog-expansion-391-regression.test.mjs",
  "tests/v16-90-cellphones-materialization.test.mjs",
  "tests/v16-product-card-catalog-parity.test.mjs",
  "tests/v16-catalog-category-normalization-audit.test.mjs",
  "tests/v16-plan-protegido-calculator.test.mjs",
  "tests/v16-advisor-commissions-monthly-bonus.test.mjs",
  "tests/v16-price-coherence-calculators.test.mjs",
  "tests/v16-crm-contract-integration.test.mjs",
  "tests/v16-growth-referrals-system.test.mjs",
  "tests/v16-real-navigation-reconciliation.test.mjs",
  "tests/v16-mobile-320-412-regression.test.mjs",
  "tests/v16-internal-route-auth-guard.test.mjs",
  "tests/v16-user-access-server-contract.test.mjs",
  "tests/v16-server-role-source-preflight.test.mjs",
  "tests/v16-admin-customer-surface-separation.test.mjs",
  "tests/v16-home-header-navigation-regression.test.mjs",
  "tests/v16-final-banner-brand-integration.test.mjs",
  "tests/v16-correct-visual-model.test.mjs",
  "tests/v16-product-data-truth-audit.test.mjs",
  "tests/v16-core-operational-contract.test.mjs",
];

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit", shell: false });
  if (result.status !== 0) process.exitCode = result.status ?? 1;
  return result.status === 0;
}

const availableContracts = currentContracts.filter((file) => {
  try { return Boolean(process.getBuiltinModule("node:fs").existsSync(file)); } catch { return false; }
});

if (!run("npm", ["run", "v16:preflight"]) ||
    !run("npm", ["run", "build"]) ||
    !run(process.execPath, ["--test", ...availableContracts])) {
  console.error("BLOCKED_V16_QA");
  process.exit(1);
}
console.log(`Current V16 contracts: ${availableContracts.length} files`);
console.log("PASS_V16_QA");
