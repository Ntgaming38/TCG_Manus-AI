export const DEFAULT_LOGIN_BACKGROUND_URL = "/manus-storage/tcg-manager-login-background_ab4c32e6.png";
export const LOGIN_BACKGROUND_STORAGE_KEY = "tcg-login-background-url";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function readLoginBackgroundUrl(storage?: StorageLike) {
  const stored = storage?.getItem(LOGIN_BACKGROUND_STORAGE_KEY);
  return stored?.startsWith("/manus-storage/") ? stored : DEFAULT_LOGIN_BACKGROUND_URL;
}

export function saveLoginBackgroundUrl(url: string, storage?: StorageLike) {
  const safeUrl = url.startsWith("/manus-storage/") ? url : DEFAULT_LOGIN_BACKGROUND_URL;
  storage?.setItem(LOGIN_BACKGROUND_STORAGE_KEY, safeUrl);
  return safeUrl;
}
