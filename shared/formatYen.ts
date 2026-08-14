export function formatYen(value: number, locale = "ja-JP"): string {
  const normalizedValue = Number.isFinite(value) ? value : 0;
  const amount = Math.abs(normalizedValue).toLocaleString(locale);
  return `${normalizedValue < 0 ? "- " : ""}${amount} ¥`;
}

export function formatSignedYen(value: number, locale = "ja-JP"): string {
  return `${value > 0 ? "+ " : ""}${formatYen(value, locale)}`;
}
