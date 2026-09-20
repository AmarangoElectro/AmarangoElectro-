import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("sonic layer is local, user-driven and has an explicit mute preference", async () => {
  const sonic = await readFile(new URL("lib/ux/sonic-feedback.ts", root), "utf8");
  const toggle = await readFile(new URL("app/components/sound-toggle.tsx", root), "utf8");

  assert.match(sonic, /AudioContext/);
  assert.match(sonic, /localStorage/);
  assert.match(sonic, /audio\.resume\(\)/);
  assert.doesNotMatch(sonic, /fetch\s*\(|XMLHttpRequest|\.mp3|\.wav/i);
  assert.match(toggle, /aria-pressed/);
  assert.match(toggle, /Silenciar sonidos de interfaz|Activar sonidos de interfaz/);
});

test("automatic hero rotation stays silent while manual navigation gets sonic feedback", async () => {
  const hero = await readFile(new URL("app/components/hero-slider.tsx", root), "utf8");
  assert.match(hero, /showManually/);
  assert.match(hero, /playSonicCue\("slide"\)/);
  assert.match(hero, /setInterval\(\(\) => show\(current \+ 1\)/);
});

test("premium motion remains accessibility-aware", async () => {
  const css = await readFile(new URL("app/globals.css", root), "utf8");
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /cubic-bezier\(\.2,\.8,\.2,1\)/);
  assert.match(css, /:focus-visible/);
});

test("Step 7B does not activate real Supabase catalog or Margarita integrations", async () => {
  const index = await readFile(new URL("lib/catalog/index.ts", root), "utf8");
  const report = await readFile(new URL("docs/V16-STEP7B-US-PREMIUM-SONIC-REPORT.md", root), "utf8");
  assert.match(index, /new V411AuditedPilotCatalogAdapter\(\)/);
  assert.doesNotMatch(index, /new SupabaseReadOnlyCatalogAdapter\(/);
  assert.match(report, /NO:\n\n- consulta Supabase/);
  assert.match(report, /migra o modifica Margarita/);
});
