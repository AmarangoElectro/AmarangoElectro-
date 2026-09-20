import { createHash } from "node:crypto";

function sha256(value: Uint8Array | string) {
  return createHash("sha256").update(value).digest("hex");
}

export function fingerprintImageBytes(bytes: Uint8Array) {
  if (!bytes.byteLength) throw new Error("image_bytes_required");
  return `sha256-bytes-v1:${sha256(bytes)}`;
}

export function canonicalizeImageUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("https_image_required");
  url.hash = "";
  url.search = "";
  return url.toString();
}

export function fingerprintImageUrl(value: string) {
  const canonicalUrl = canonicalizeImageUrl(value);
  return `sha256-url-v1:${sha256(canonicalUrl)}`;
}

export function isByteFingerprint(value: string) {
  return /^sha256-bytes-v1:[a-f0-9]{64}$/.test(value);
}

export function isUrlFingerprint(value: string) {
  return /^sha256-url-v1:[a-f0-9]{64}$/.test(value);
}
