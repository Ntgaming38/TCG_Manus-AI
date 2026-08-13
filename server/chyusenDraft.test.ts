import { describe, expect, it } from "vitest";
import { toChyusenDraft } from "../client/src/lib/chyusenDraft";

describe("toChyusenDraft", () => {
  it("tạo bản nháp tự điền từ phản hồi link hợp lệ", () => {
    const draft = toChyusenDraft({
      title: "Joshin 抽選", productName: "Pikachu Box", shop: "Joshin", sourceUrl: "https://joshinweb.jp/game/lottery", price: "5400",
      parserStatus: "detected", parserNote: "Đã nhận diện", fieldConfidence: { productName: "detected" },
    });

    expect(draft).toMatchObject({
      title: "Joshin 抽選", productName: "Pikachu Box", shop: "Joshin", sourceUrl: "https://joshinweb.jp/game/lottery",
      price: "5400", parserStatus: "detected", parserNote: "Đã nhận diện",
    });
  });
});
