const SNKRDUNK_HOSTS = new Set(["snkrdunk.com", "www.snkrdunk.com"]);

export class SnkrdunkSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnkrdunkSyncError";
  }
}

export type SnkrdunkPriceResult = {
  price: number;
  sourceUrl: string;
};

export function isValidSnkrdunkUrl(sourceUrl: string): boolean {
  try {
    const url = new URL(sourceUrl);
    const pathname = url.pathname.replace(/\/+$/, "");
    return (
      url.protocol === "https:" &&
      SNKRDUNK_HOSTS.has(url.hostname.toLowerCase()) &&
      pathname.length > 1 &&
      !pathname.startsWith("/categories/")
    );
  } catch {
    return false;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&yen;|&#165;|&#xA5;/gi, "¥")
    .replace(/&nbsp;/gi, " ")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&");
}

function parseJpyNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.round(value) : null;
  }
  if (typeof value !== "string") return null;
  const normalized = decodeHtmlEntities(value).replace(/[,\s円¥]/g, "");
  const match = normalized.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : null;
}

function findFirstJsonPrice(value: unknown, inheritedCurrency?: string): number | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) {
    for (const item of value) {
      const price = findFirstJsonPrice(item, inheritedCurrency);
      if (price !== null) return price;
    }
    return null;
  }

  const objectValue = value as Record<string, unknown>;
  const localCurrency = objectValue.priceCurrency ?? objectValue.currency;
  const currency = String(localCurrency ?? inheritedCurrency ?? "").toUpperCase();
  const isJpy = !currency || currency === "JPY" || currency === "¥" || currency === "円";

  for (const [key, nestedValue] of Object.entries(objectValue)) {
    const normalizedKey = key.toLowerCase();
    if (isJpy && ["lowestprice", "lowprice", "minprice", "price"].includes(normalizedKey)) {
      const price = parseJpyNumber(nestedValue);
      if (price !== null) return price;
    }
    const nestedPrice = findFirstJsonPrice(nestedValue, currency || inheritedCurrency);
    if (nestedPrice !== null) return nestedPrice;
  }
  return null;
}

function findFirstScriptJsonPrice(html: string): number | null {
  const scriptPattern = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptPattern.exec(html)) !== null) {
    const content = decodeHtmlEntities(match[1].trim());
    if (!content) continue;
    try {
      const price = findFirstJsonPrice(JSON.parse(content));
      if (price !== null) return price;
    } catch {
      const currencyMatch = content.match(/["'](?:priceCurrency|currency)["']\s*:\s*["']?([A-Za-z¥円]+)/i);
      const currency = currencyMatch?.[1]?.toUpperCase();
      const isJpy = !currency || currency === "JPY" || currency === "¥" || currency === "円";
      if (!isJpy) continue;
      const priceMatch = content.match(/["'](?:lowestPrice|lowPrice|minPrice|price)["']\s*:\s*["']?([\d,]+(?:\.\d+)?)/i);
      const price = priceMatch ? parseJpyNumber(priceMatch[1]) : null;
      if (price !== null) return price;
    }
  }
  return null;
}

function parseFirstChoiceMarkupPrice(html: string): number | null {
  const decoded = decodeHtmlEntities(html);
  const firstChoicePatterns = [
    /1個\s*\(\s*99\+\s*\)[\s\S]{0,180}?¥\s*([\d,]+)/i,
    /1個\s*[\s\S]{0,180}?¥\s*([\d,]+)/i,
    /1\s*(?:個|item)\s*[\s\S]{0,180}?(?:¥|円)\s*([\d,]+)/i,
  ];

  for (const pattern of firstChoicePatterns) {
    const match = decoded.match(pattern);
    const price = match ? parseJpyNumber(match[1]) : null;
    if (price !== null) return price;
  }
  return null;
}

export function parseSnkrdunkPrice(html: string): number | null {
  return findFirstScriptJsonPrice(html) ?? parseFirstChoiceMarkupPrice(html);
}

export async function fetchSnkrdunkPrice(sourceUrl: string): Promise<SnkrdunkPriceResult> {
  if (!isValidSnkrdunkUrl(sourceUrl)) {
    throw new SnkrdunkSyncError(
      "Link phải là trang sản phẩm https://snkrdunk.com, không phải link danh mục.",
    );
  }

  let response: Response;
  try {
    response = await fetch(sourceUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Mozilla/5.0 (compatible; TCGManager/1.0; +https://snkrdunk.com)",
      },
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new SnkrdunkSyncError("Không thể truy cập trang sản phẩm SNKRDUNK.");
  }

  if (!response.ok) {
    throw new SnkrdunkSyncError(`SNKRDUNK trả về lỗi HTTP ${response.status}.`);
  }

  const html = await response.text();
  const price = parseSnkrdunkPrice(html);
  if (price === null) {
    throw new SnkrdunkSyncError(
      "Không tìm thấy giá công khai trên trang SNKRDUNK. Giá chưa được cập nhật.",
    );
  }

  return { price, sourceUrl };
}
