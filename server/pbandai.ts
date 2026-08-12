import { createHash } from "node:crypto";

export type PBandaiInspection = {
  status: "detected" | "monitoring" | "unavailable";
  sourceUrl: string;
  title?: string;
  productName?: string;
  registrationStartAt?: Date;
  registrationDeadline?: Date;
  drawAt?: Date;
  contentHash?: string;
  error?: string;
};

const PBANDAI_HOST = /(^|\.)p-bandai\.jp$/i;

export function isValidPBandaiUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && PBANDAI_HOST.test(url.hostname);
  } catch {
    return false;
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

function toText(html: string) {
  return decodeHtml(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function parseJapaneseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const match = value.match(/(20\d{2})\D{0,3}(\d{1,2})\D{0,3}(\d{1,2})\D{0,8}(\d{1,2})(?::(\d{2}))?/);
  if (!match) return undefined;
  const [, year, month, day, hour, minute = "0"] = match;
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour) - 9, Number(minute)));
}

export function parsePBandaiPage(html: string, sourceUrl: string): PBandaiInspection {
  const text = toText(html);
  const title = decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "").replace(/\s+/g, " ").trim();
  const contentHash = createHash("sha256").update(text).digest("hex");
  if (/global_newpc|Premium Bandai is International/i.test(html) || /Premium Bandai is International/i.test(text)) {
    return { status: "unavailable", sourceUrl, contentHash, error: "P-Bandai chuyển sang trang quốc tế nên chưa đọc được nội dung chương trình." };
  }

  const isLottery = /抽選(?:販売|受付|申込)?/.test(text);
  if (!isLottery) return { status: "monitoring", sourceUrl, title: title || undefined, productName: title || undefined, contentHash };

  const period = text.match(/(?:受付期間|申込期間|応募期間|抽選販売)[^。]{0,160}/)?.[0] ?? "";
  const dateMatches = Array.from(period.matchAll(/20\d{2}[^0-9]{0,3}\d{1,2}[^0-9]{0,3}\d{1,2}[^0-9]{0,8}\d{1,2}(?::\d{2})?/g)).map((match) => parseJapaneseDate(match[0])).filter(Boolean) as Date[];
  return {
    status: "detected",
    sourceUrl,
    title: title || "Chương trình Chyusen P-Bandai",
    productName: title || undefined,
    registrationStartAt: dateMatches[0],
    registrationDeadline: dateMatches[1],
    drawAt: dateMatches[2],
    contentHash,
  };
}

export async function inspectPBandaiUrl(sourceUrl: string): Promise<PBandaiInspection> {
  if (!isValidPBandaiUrl(sourceUrl)) throw new Error("Chỉ hỗ trợ link HTTPS từ p-bandai.jp.");
  try {
    const response = await fetch(sourceUrl, {
      redirect: "follow",
      headers: {
        "accept-language": "ja-JP,ja;q=0.9,en;q=0.6",
        "user-agent": "TCG-Manager-Chyusen-Monitor/1.0 (public-link monitoring)",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return { status: "unavailable", sourceUrl, error: `P-Bandai trả về HTTP ${response.status}.` };
    const html = await response.text();
    const parsed = parsePBandaiPage(html, sourceUrl);
    if (response.url.includes("global_newpc")) return { ...parsed, status: "unavailable", error: "P-Bandai chuyển sang trang quốc tế nên chưa đọc được nội dung chương trình." };
    return parsed;
  } catch (error) {
    return { status: "unavailable", sourceUrl, error: error instanceof Error ? error.message : "Không thể đọc link P-Bandai." };
  }
}
