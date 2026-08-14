import { z } from "zod";
import { invokeLLM } from "./_core/llm";
import { extractAssistantText } from "./aiResponse";

const productTypes = ["card", "box", "pack", "set", "other"] as const;
const confidenceLevels = ["high", "medium", "low"] as const;

export const chyusenImageAnalysisSchema = z.object({
  title: z.string().nullable(),
  productName: z.string().nullable(),
  series: z.string().nullable(),
  productType: z.enum(productTypes),
  shop: z.string().nullable(),
  price: z.number().nullable(),
  quantityLimit: z.string().nullable(),
  applicationStart: z.string().nullable(),
  applicationEnd: z.string().nullable(),
  resultDate: z.string().nullable(),
  pickupStart: z.string().nullable(),
  pickupNote: z.string().nullable(),
  requirements: z.string().nullable(),
  fieldConfidence: z.record(z.string(), z.enum(confidenceLevels)),
  note: z.string(),
});

export type ChyusenImageAnalysis = z.infer<typeof chyusenImageAnalysisSchema>;

const dateFields = ["applicationStart", "applicationEnd", "resultDate", "pickupStart"] as const;

function currentTokyoYear(now = new Date()) {
  return new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", year: "numeric" }).format(now);
}

function normalizeVisibleJapaneseDate(value: string | null) {
  if (!value) return { value, inferredYear: false };
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime()) && /20\d{2}/.test(value)) return { value, inferredYear: false };
  const match = value.match(/^(?:(20\d{2})\s*(?:年|[-/.]))?\s*(\d{1,2})\s*(?:月|[-/.])\s*(\d{1,2})\s*(?:日)?$/);
  if (!match) return { value: null, inferredYear: false };
  const year = match[1] || currentTokyoYear();
  const month = Number(match[2]);
  const day = Number(match[3]);
  const checked = new Date(Date.UTC(Number(year), month - 1, day));
  if (checked.getUTCFullYear() !== Number(year) || checked.getUTCMonth() !== month - 1 || checked.getUTCDate() !== day) return { value: null, inferredYear: false };
  return { value: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+09:00`, inferredYear: !match[1] };
}

function normalizeImageAnalysisDates(analysis: ChyusenImageAnalysis): ChyusenImageAnalysis {
  const normalized = { ...analysis, fieldConfidence: { ...analysis.fieldConfidence } };
  const assumedCurrentYear: string[] = [];
  for (const field of dateFields) {
    const result = normalizeVisibleJapaneseDate(normalized[field]);
    normalized[field] = result.value;
    if (result.inferredYear && result.value) {
      normalized.fieldConfidence[field] = "medium";
      assumedCurrentYear.push(field);
    }
  }
  if (!assumedCurrentYear.length) return normalized;
  return {
    ...normalized,
    note: `${normalized.note} Các ngày chỉ có tháng/ngày được gán năm hiện tại theo giờ Nhật; hãy kiểm tra lại trước khi lưu.`,
  };
}

function validateImageDataUrl(imageDataUrl: string) {
  if (!/^data:image\/(png|jpe?g|webp);base64,[a-zA-Z0-9+/=\s]+$/.test(imageDataUrl)) {
    throw new Error("Ảnh không hợp lệ. Hãy dùng PNG, JPEG hoặc WEBP.");
  }
}

export function parseChyusenImageAnalysis(raw: string): ChyusenImageAnalysis {
  return normalizeImageAnalysisDates(chyusenImageAnalysisSchema.parse(JSON.parse(raw)));
}

export async function analyzeChyusenImage(imageDataUrl: string): Promise<ChyusenImageAnalysis> {
  validateImageDataUrl(imageDataUrl);
  const response = await invokeLLM({
    model: "gemini-3-flash-preview",
    maxTokens: 1600,
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "chyusen_image_analysis",
        strict: true,
        schema: {
          type: "object",
          properties: {
            title: { type: ["string", "null"] },
            productName: { type: ["string", "null"] },
            series: { type: ["string", "null"] },
            productType: { type: "string", enum: [...productTypes] },
            shop: { type: ["string", "null"] },
            price: { type: ["number", "null"] },
            quantityLimit: { type: ["string", "null"] },
            applicationStart: { type: ["string", "null"] },
            applicationEnd: { type: ["string", "null"] },
            resultDate: { type: ["string", "null"] },
            pickupStart: { type: ["string", "null"] },
            pickupNote: { type: ["string", "null"] },
            requirements: { type: ["string", "null"] },
            fieldConfidence: { type: "object", additionalProperties: { type: "string", enum: [...confidenceLevels] } },
            note: { type: "string" },
          },
          required: ["title", "productName", "series", "productType", "shop", "price", "quantityLimit", "applicationStart", "applicationEnd", "resultDate", "pickupStart", "pickupNote", "requirements", "fieldConfidence", "note"],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: "system",
        content: "Extract only facts visibly written in this Japanese Chyusen announcement image. Never invent missing facts. First distinguish labels: application start (応募開始/受付開始), deadline (応募締切/受付締切), result announcement (当選発表/結果発表), and pickup (受取). For dates with explicit year/month/day, return ISO 8601 with +09:00. If the image visibly has month/day but omits year or time, return exactly MM/DD, never guess a year or time; the application will flag it for review. Use null for unreadable or uncertain values. Keep Japanese product names exactly as shown. Use only these series: Pokemon, One Piece, Dragon Ball, Yu-Gi-Oh!, Other. For each non-null field, provide high confidence only if clearly legible and linked to the right label; use medium for visible values needing verification and low for partly obscured values. Omit confidence for null fields. Return JSON only.",
      },
      { role: "user", content: [{ type: "text", text: "Read this image and extract Chyusen details." }, { type: "image_url", image_url: { url: imageDataUrl, detail: "high" } }] },
    ],
  });
  const raw = extractAssistantText(response);
  if (!raw) throw new Error("AI chưa đọc được nội dung từ ảnh này. Hãy thử ảnh rõ hơn hoặc nhập thủ công.");
  try {
    return parseChyusenImageAnalysis(raw);
  } catch {
    throw new Error("AI trả về dữ liệu ảnh không hợp lệ. Hãy thử lại hoặc nhập thủ công.");
  }
}
