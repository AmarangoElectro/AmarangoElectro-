import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const source = (file) => readFile(new URL(file, root), "utf8");

test("Mi Balance financial pulse uses a travelling waveform", async () => {
  const html = await source("prototypes/mi-balance-v1/index.html");

  assert.match(html, /class="pulseFlow"/);
  assert.equal((html.match(/class="pulseLine"/g) || []).length, 2);
  assert.match(html, /@keyframes pulseTravel/);
  assert.match(html, /translate3d\(-50%,0,0\)/);
  assert.doesNotMatch(html, /pulseDash|stroke-dasharray/);
});

test("Mi Balance replaces app-owned native Android dialogs with branded UI", async () => {
  const html = await source("prototypes/mi-balance-v1/index.html");

  assert.match(html, /id="appNotice"/);
  assert.match(html, /function notify\(/);
  assert.match(html, /id="resetConfirmModal"/);
  assert.match(html, /id="shareFallbackModal"/);

  assert.doesNotMatch(html, /\balert\s*\(/);
  assert.doesNotMatch(html, /\bconfirm\s*\(/);
  assert.doesNotMatch(html, /(^|[^.])\bprompt\s*\(/m);
});

test("PWA auto-install banner stays suppressed and cache version is refreshed", async () => {
  const html = await source("prototypes/mi-balance-v1/index.html");
  const sw = await source("prototypes/mi-balance-v1/service-worker.js");

  assert.match(html, /beforeinstallprompt",e=>\{e\.preventDefault\(\)/);
  assert.match(html, /p\.prompt\(\)/);
  assert.match(sw, /mi-balance-v5-live-pulse-native-dialog-cleanup/);
});
