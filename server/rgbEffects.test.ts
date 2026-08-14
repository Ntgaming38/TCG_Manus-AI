import { describe, expect, it } from "vitest";
import { readRgbEffectsEnabled, readRgbEffectsSpeed, RGB_EFFECTS_SPEED_STORAGE_KEY, RGB_EFFECTS_STORAGE_KEY, RGB_EFFECT_SPEEDS, saveRgbEffectsEnabled, saveRgbEffectsSpeed } from "../client/src/lib/rgbEffects";

function createStorage(initial?: Record<string, string>) {
  const values = new Map<string, string>();
  Object.entries(initial || {}).forEach(([key, value]) => values.set(key, value));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("RGB effect preference", () => {
  it("bật hiệu ứng mặc định và tôn trọng lựa chọn tắt đã lưu", () => {
    expect(readRgbEffectsEnabled(createStorage())).toBe(true);
    expect(readRgbEffectsEnabled(createStorage({ [RGB_EFFECTS_STORAGE_KEY]: "false" }))).toBe(false);
  });

  it("lưu lựa chọn hiệu ứng theo thiết bị", () => {
    const storage = createStorage();
    saveRgbEffectsEnabled(false, storage);
    expect(storage.getItem(RGB_EFFECTS_STORAGE_KEY)).toBe("false");
  });

  it("hỗ trợ tốc độ chậm, bình thường và nhanh với mặc định an toàn", () => {
    expect(RGB_EFFECT_SPEEDS).toEqual(["slow", "normal", "fast"]);
    expect(readRgbEffectsSpeed(createStorage())).toBe("normal");
    expect(readRgbEffectsSpeed(createStorage({ [RGB_EFFECTS_SPEED_STORAGE_KEY]: "fast" }))).toBe("fast");
    expect(readRgbEffectsSpeed(createStorage({ [RGB_EFFECTS_SPEED_STORAGE_KEY]: "unknown" }))).toBe("normal");
  });

  it("lưu tốc độ RGB đã chọn theo thiết bị", () => {
    const storage = createStorage();
    saveRgbEffectsSpeed("slow", storage);
    expect(storage.getItem(RGB_EFFECTS_SPEED_STORAGE_KEY)).toBe("slow");
  });
});
