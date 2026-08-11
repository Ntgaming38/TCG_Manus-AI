import { describe, expect, it } from "vitest";
import { isValidSnkrdunkUrl, parseSnkrdunkPrice } from "./snkrdunk";

describe("SNKRDUNK adapter", () => {
  it("parses a JPY price from JSON-LD", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      offers: { priceCurrency: "JPY", price: "13,300" },
    })}</script>`;
    expect(parseSnkrdunkPrice(html)).toBe(13300);
  });

  it("parses the first choice price from visible markup", () => {
    expect(parseSnkrdunkPrice("<div>1個 (99+) ¥13,300~</div>")).toBe(13300);
  });

  it("does not create a price when the page has no public price", () => {
    expect(parseSnkrdunkPrice("<div>Loading...</div>")).toBeNull();
  });

  it("ignores a non-JPY JSON price", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      offers: { priceCurrency: "USD", price: "84" },
    })}</script>`;
    expect(parseSnkrdunkPrice(html)).toBeNull();
  });

  it("accepts a specific HTTPS product URL", () => {
    expect(isValidSnkrdunkUrl("https://snkrdunk.com/en/trading-cards/example")).toBe(true);
    expect(isValidSnkrdunkUrl("https://www.snkrdunk.com/en/trading-cards/example")).toBe(true);
  });

  it("rejects category URLs and non-SNKRDUNK URLs", () => {
    expect(isValidSnkrdunkUrl("https://snkrdunk.com/categories/6")).toBe(false);
    expect(isValidSnkrdunkUrl("http://snkrdunk.com/en/trading-cards/example")).toBe(false);
    expect(isValidSnkrdunkUrl("https://example.com/product")).toBe(false);
  });
});
