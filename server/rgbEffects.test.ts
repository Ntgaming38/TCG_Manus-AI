import { describe, expect, it } from "vitest";
import { readRgbEffectsEnabled, RGB_EFFECTS_STORAGE_KEY, saveRgbEffectsEnabled } from "../client/src/lib/rgbEffects";

function createStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial !== undefined) values.set(RGB_EFFECTS_STORAGE_KEY, initial);
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("RGB effect preference", () => {
  it("bật hiệu ứng mặc định và tôn trọng lựa chọn tắt đã lưu", () => {
    expect(readRgbEffectsEnabled(createStorage())).toBe(true);
    expect(readRgbEffectsEnabled(createStorage("false"))).toBe(false);
  });

  it("lưu lựa chọn hiệu ứng theo thiết bị", () => {
    const storage = createStorage();
    saveRgbEffectsEnabled(false, storage);
    expect(storage.getItem(RGB_EFFECTS_STORAGE_KEY)).toBe("false");
  });
});
