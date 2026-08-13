const japanDateParts = (date: Date) => new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit",
}).formatToParts(date).reduce<Record<string, string>>((parts, part) => ({ ...parts, [part.type]: part.value }), {});

export function formatChyusenDayMonth(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = japanDateParts(date);
  return `${parts.day}/${parts.month}`;
}

export function parseChyusenDayMonth(value: string, savedAt = new Date()) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(japanDateParts(savedAt).year);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) return null;

  return new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+09:00`);
}
