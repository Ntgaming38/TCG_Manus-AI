export type ChyusenDraft = {
  title: string;
  productName: string;
  series: string;
  productType: "card" | "box" | "pack" | "set" | "other";
  shop: string;
  customShopName: string;
  sourceUrl: string;
  externalProductId: string;
  imageUrl: string;
  price: string;
  quantityLimit: string;
  applicationStart: string;
  applicationEnd: string;
  resultDate: string;
  pickupStart: string;
  pickupEnd: string;
  requirements: string;
  parserStatus: "manual" | "partial" | "detected" | "unavailable";
  parserNote: string;
  fieldConfidence: Record<string, "detected" | "needs_review" | "missing">;
  sourceContentHash?: string;
};

export const EMPTY_CHYUSEN_DRAFT: ChyusenDraft = {
  title: "", productName: "", series: "Pokemon", productType: "other", shop: "Khác", customShopName: "", sourceUrl: "", externalProductId: "", imageUrl: "", price: "", quantityLimit: "",
  applicationStart: "", applicationEnd: "", resultDate: "", pickupStart: "", pickupEnd: "", requirements: "", parserStatus: "manual", parserNote: "", fieldConfidence: {},
};

function japanInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date).reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function toChyusenDraft(data: Record<string, any>): ChyusenDraft {
  return {
    title: data.title || "", productName: data.productName || "", series: data.series || "Pokemon", productType: data.productType || "other",
    shop: data.shop || "Khác", customShopName: data.customShopName || "", sourceUrl: data.sourceUrl || "", externalProductId: data.externalProductId || "", imageUrl: data.imageUrl || "",
    price: data.price === undefined || data.price === null ? "" : String(data.price), quantityLimit: data.quantityLimit || "",
    applicationStart: japanInputValue(data.applicationStart), applicationEnd: japanInputValue(data.applicationEnd), resultDate: japanInputValue(data.resultDate),
    pickupStart: japanInputValue(data.pickupStart), pickupEnd: japanInputValue(data.pickupEnd), requirements: data.requirements || "",
    parserStatus: data.parserStatus || "manual", parserNote: data.parserNote || "", fieldConfidence: data.fieldConfidence || {}, sourceContentHash: data.sourceContentHash,
  };
}
