import { createHash } from "node:crypto";
import { normalizeCellphoneText, type V413ParsedPhone } from "./v413-cellphone-parser";

export const V413_FINGERPRINT_VERSION = "lcfp-v1" as const;

function normalizedImagePath(value: string) {
  try {
    return new URL(value).pathname.toLocaleLowerCase("en");
  } catch {
    return "";
  }
}

export function v413FingerprintInputs(phone: V413ParsedPhone) {
  return Object.freeze({
    brand: normalizeCellphoneText(phone.brand.value ?? ""),
    modelFamily: normalizeCellphoneText(phone.modelFamily.value ?? ""),
    memory: normalizeCellphoneText(phone.memory.value ?? ""),
    ram: normalizeCellphoneText(phone.ram.value ?? ""),
    normalizedName: phone.normalizedName,
    imagePath: normalizedImagePath(phone.image),
  });
}

export function proposeLegacyCellphoneKey(phone: V413ParsedPhone) {
  const inputs = v413FingerprintInputs(phone);
  const digest = createHash("sha256")
    .update(JSON.stringify([V413_FINGERPRINT_VERSION, inputs]))
    .digest("hex")
    .slice(0, 20);
  return `${V413_FINGERPRINT_VERSION}-${digest}`;
}

export function proposedLabSlug(legacyCellphoneKey: string) {
  return `cellphone-lab-${legacyCellphoneKey.replace(/^lcfp-v1-/, "")}`;
}

export function identityTuple(phone: V413ParsedPhone) {
  return [
    normalizeCellphoneText(phone.brand.value ?? ""),
    normalizeCellphoneText(phone.modelFamily.value ?? ""),
    normalizeCellphoneText(phone.memory.value ?? ""),
    normalizeCellphoneText(phone.ram.value ?? ""),
  ].join("|");
}

export function modelFamilyTuple(phone: V413ParsedPhone) {
  return [
    normalizeCellphoneText(phone.brand.value ?? ""),
    normalizeCellphoneText(phone.modelFamily.value ?? ""),
  ].join("|");
}
