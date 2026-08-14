export const RGB_EFFECTS_STORAGE_KEY = "tcg-rgb-effects-enabled";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function readRgbEffectsEnabled(storage?: StorageLike) {
  return storage?.getItem(RGB_EFFECTS_STORAGE_KEY) !== "false";
}

export function applyRgbEffectsEnabled(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.rgbEffects = enabled ? "enabled" : "disabled";
}

export function saveRgbEffectsEnabled(enabled: boolean, storage?: StorageLike) {
  storage?.setItem(RGB_EFFECTS_STORAGE_KEY, String(enabled));
  applyRgbEffectsEnabled(enabled);
}

export function initializeRgbEffects() {
  if (typeof window === "undefined") return;
  applyRgbEffectsEnabled(readRgbEffectsEnabled(window.localStorage));
}
