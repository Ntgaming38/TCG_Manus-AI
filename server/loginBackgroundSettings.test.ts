import { describe, expect, it } from "vitest";
import { DEFAULT_LOGIN_BACKGROUND_URL, LOGIN_BACKGROUND_STORAGE_KEY, readLoginBackgroundHistory, readLoginBackgroundUrl, rememberLoginBackgroundUrl, saveLoginBackgroundUrl } from "../client/src/lib/loginBackground";

function createStorage(initial?: string) {
  const values = new Map<string, string>();
  if (initial) values.set(LOGIN_BACKGROUND_STORAGE_KEY, initial);
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
}

describe("login background setting", () => {
  it("dùng nền mặc định nếu chưa có hoặc có URL không an toàn", () => {
    expect(readLoginBackgroundUrl(createStorage())).toBe(DEFAULT_LOGIN_BACKGROUND_URL);
    expect(readLoginBackgroundUrl(createStorage("https://example.com/image.png"))).toBe(DEFAULT_LOGIN_BACKGROUND_URL);
  });

  it("lưu và đọc lại đường dẫn nền từ kho lưu trữ", () => {
    const storage = createStorage();
    const url = "/manus-storage/login-backgrounds/1/background_abc.png";
    expect(saveLoginBackgroundUrl(url, storage)).toBe(url);
    expect(readLoginBackgroundUrl(storage)).toBe(url);
  });

  it("lưu tối đa sáu nền gần đây, ưu tiên nền mới nhất và không lặp lại", () => {
    const storage = createStorage();
    for (let index = 0; index < 7; index += 1) rememberLoginBackgroundUrl(`/manus-storage/login-backgrounds/1/background_${index}.png`, storage);
    const history = rememberLoginBackgroundUrl("/manus-storage/login-backgrounds/1/background_4.png", storage);
    expect(history).toHaveLength(6);
    expect(history[0].url).toContain("background_4.png");
    expect(readLoginBackgroundHistory(storage)).toHaveLength(6);
  });
});
