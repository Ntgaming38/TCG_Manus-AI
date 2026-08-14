export function normalizeChyusenQrUrl(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  try {
    const url = new URL(normalized);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}
