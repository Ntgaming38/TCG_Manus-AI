export function formatYen(value: number, locale = "ja-JP"): string {
  const normalizedValue = Number.isFinite(value) ? value : 0;
  return `¥ ${normalizedValue.toLocaleString(locale)}`;
}

export function formatSignedYen(value: number, locale = "ja-JP"): string {
  return `${value > 0 ? "+" : ""}${formatYen(value, locale)}`;
}
