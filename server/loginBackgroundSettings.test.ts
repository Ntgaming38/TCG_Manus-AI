import { describe, expect, it } from "vitest";
import { DEFAULT_LOGIN_BACKGROUND_URL, LOGIN_BACKGROUND_STORAGE_KEY, readLoginBackgroundUrl, saveLoginBackgroundUrl } from "../client/src/lib/loginBackground";

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
});
