export const DEFAULT_LOGIN_BACKGROUND_URL = "/manus-storage/tcg-manager-login-background_ab4c32e6.png";
export const LOGIN_BACKGROUND_STORAGE_KEY = "tcg-login-background-url";
export const LOGIN_BACKGROUND_HISTORY_STORAGE_KEY = "tcg-login-background-history";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export type LoginBackgroundHistoryItem = { url: string; savedAt: number };

function isSafeLoginBackgroundUrl(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/manus-storage/");
}

export function readLoginBackgroundUrl(storage?: StorageLike) {
  const stored = storage?.getItem(LOGIN_BACKGROUND_STORAGE_KEY);
  return isSafeLoginBackgroundUrl(stored) ? stored : DEFAULT_LOGIN_BACKGROUND_URL;
}

export function saveLoginBackgroundUrl(url: string, storage?: StorageLike) {
  const safeUrl = isSafeLoginBackgroundUrl(url) ? url : DEFAULT_LOGIN_BACKGROUND_URL;
  storage?.setItem(LOGIN_BACKGROUND_STORAGE_KEY, safeUrl);
  return safeUrl;
}

export function readLoginBackgroundHistory(storage?: StorageLike): LoginBackgroundHistoryItem[] {
  try {
    const parsed = JSON.parse(storage?.getItem(LOGIN_BACKGROUND_HISTORY_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is LoginBackgroundHistoryItem => isSafeLoginBackgroundUrl(item?.url) && typeof item?.savedAt === "number")
      .slice(0, 6);
  } catch {
    return [];
  }
}

export function rememberLoginBackgroundUrl(url: string, storage?: StorageLike) {
  if (!isSafeLoginBackgroundUrl(url) || url === DEFAULT_LOGIN_BACKGROUND_URL) return readLoginBackgroundHistory(storage);
  const next = [{ url, savedAt: Date.now() }, ...readLoginBackgroundHistory(storage).filter((item) => item.url !== url)].slice(0, 6);
  storage?.setItem(LOGIN_BACKGROUND_HISTORY_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function removeLoginBackgroundUrl(url: string, storage?: StorageLike) {
  const next = readLoginBackgroundHistory(storage).filter((item) => item.url !== url);
  storage?.setItem(LOGIN_BACKGROUND_HISTORY_STORAGE_KEY, JSON.stringify(next));
  return next;
}
