export function normalizeBrandFamily(value: string) {
  const normalized = value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-AR");

  if (normalized === "redmi") return "xiaomi";
  return normalized;
}

export function brandsShareFamily(left: string, right: string) {
  return normalizeBrandFamily(left) === normalizeBrandFamily(right);
}
