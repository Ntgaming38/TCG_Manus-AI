export const RGB_EFFECTS_STORAGE_KEY = "tcg-rgb-effects-enabled";
export const RGB_EFFECTS_SPEED_STORAGE_KEY = "tcg-rgb-effects-speed";
export const DEFAULT_RGB_EFFECTS_ENABLED = true;

export const RGB_EFFECT_SPEEDS = ["slow", "normal", "fast"] as const;
export type RgbEffectSpeed = (typeof RGB_EFFECT_SPEEDS)[number];
export const DEFAULT_RGB_EFFECTS_SPEED: RgbEffectSpeed = "normal";

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function readRgbEffectsEnabled(storage?: StorageLike) {
  return storage?.getItem(RGB_EFFECTS_STORAGE_KEY) !== "false" ? DEFAULT_RGB_EFFECTS_ENABLED : false;
}

export function readRgbEffectsSpeed(storage?: StorageLike): RgbEffectSpeed {
  const stored = storage?.getItem(RGB_EFFECTS_SPEED_STORAGE_KEY);
  return RGB_EFFECT_SPEEDS.includes(stored as RgbEffectSpeed) ? stored as RgbEffectSpeed : DEFAULT_RGB_EFFECTS_SPEED;
}

export function applyRgbEffectsEnabled(enabled: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.rgbEffects = enabled ? "enabled" : "disabled";
}

export function applyRgbEffectsSpeed(speed: RgbEffectSpeed) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.rgbSpeed = speed;
}

export function saveRgbEffectsEnabled(enabled: boolean, storage?: StorageLike) {
  storage?.setItem(RGB_EFFECTS_STORAGE_KEY, String(enabled));
  applyRgbEffectsEnabled(enabled);
}

export function saveRgbEffectsSpeed(speed: RgbEffectSpeed, storage?: StorageLike) {
  storage?.setItem(RGB_EFFECTS_SPEED_STORAGE_KEY, speed);
  applyRgbEffectsSpeed(speed);
}

export function initializeRgbEffects() {
  if (typeof window === "undefined") return;
  applyRgbEffectsEnabled(readRgbEffectsEnabled(window.localStorage));
  applyRgbEffectsSpeed(readRgbEffectsSpeed(window.localStorage));
}
