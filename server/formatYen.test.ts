import { describe, expect, it } from "vitest";
import { formatSignedYen, formatYen } from "../shared/formatYen";

describe("formatYen", () => {
  it("đặt ký hiệu ¥ sau số tiền và dấu âm trước số tiền", () => {
    expect(formatYen(1000)).toBe("1,000 ¥");
    expect(formatYen(-1250)).toBe("- 1,250 ¥");
  });

  it("giữ dấu cộng hoặc âm đứng trước số tiền", () => {
    expect(formatSignedYen(8750)).toBe("+ 8,750 ¥");
    expect(formatSignedYen(-8750)).toBe("- 8,750 ¥");
  });

  it("dùng giá trị an toàn khi đầu vào không hợp lệ", () => {
    expect(formatYen(Number.NaN)).toBe("0 ¥");
  });
});
