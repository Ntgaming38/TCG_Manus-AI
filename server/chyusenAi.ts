import { invokeLLM, listLLMModels } from "./_core/llm";

export type ChyusenAiSchedule = {
  title: string | null;
  registrationStartAt: Date | null;
  registrationDeadline: Date | null;
  drawAt: Date | null;
  confidence: "high" | "medium" | "low";
  note: string;
};

type RawAiSchedule = {
  title: string | null;
  registrationStartAt: string | null;
  registrationDeadline: string | null;
  drawAt: string | null;
  confidence: "high" | "medium" | "low";
  note: string;
};

function parseExactJapaneseDate(value: string | null): Date | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function normalizeChyusenAiSchedule(raw: RawAiSchedule): ChyusenAiSchedule {
  return {
    title: raw.title?.trim() || null,
    registrationStartAt: parseExactJapaneseDate(raw.registrationStartAt),
    registrationDeadline: parseExactJapaneseDate(raw.registrationDeadline),
    drawAt: parseExactJapaneseDate(raw.drawAt),
    confidence: raw.confidence,
    note: raw.note.trim(),
  };
}

export function parseChyusenAiOutput(content: string): ChyusenAiSchedule {
  const candidate = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const objectText = candidate.startsWith("{") ? candidate : candidate.match(/\{[\s\S]*\}/)?.[0];
  if (!objectText) {
    return { title: null, registrationStartAt: null, registrationDeadline: null, drawAt: null, confidence: "low", note: "AI không trả về dữ liệu có cấu trúc; vui lòng nhập ngày thủ công." };
  }
  try {
    return normalizeChyusenAiSchedule(JSON.parse(objectText) as RawAiSchedule);
  } catch {
    return { title: null, registrationStartAt: null, registrationDeadline: null, drawAt: null, confidence: "low", note: "AI trả về dữ liệu không hợp lệ; vui lòng nhập ngày thủ công." };
  }
}

export async function extractChyusenScheduleWithAI(postText: string): Promise<ChyusenAiSchedule> {
  const { data: models } = await listLLMModels();
  const model = models.find((item) => item.id === "claude-haiku-4-5")?.id ?? models.find((item) => item.id.startsWith("gpt-5"))?.id;
  const response = await invokeLLM({
    model,
    maxTokens: 800,
    messages: [
      {
        role: "system",
        content: "You extract Chyusen (Japanese lottery sale) schedules from official Japanese social posts. Return ONE JSON object only, with exactly these keys: title, registrationStartAt, registrationDeadline, drawAt, confidence, note. Values for date keys must be ISO 8601 including +09:00 or null. Extract a date only when the post explicitly includes calendar year, month, day, and time. Never infer missing year, missing time, current date, or any unmentioned value. Interpret explicit Japanese time as Japan Standard Time (+09:00). confidence must be high, medium, or low. note must be Vietnamese and explain missing values. Do not use Markdown or commentary.",
      },
      {
        role: "user",
        content: `Trích xuất lịch Chyusen từ nội dung bài đăng sau:\n\n${postText.slice(0, 6000)}`,
      },
    ],
  });
  const content = response.choices[0]?.message.content;
  if (typeof content !== "string") return { title: null, registrationStartAt: null, registrationDeadline: null, drawAt: null, confidence: "low", note: "AI không trả về nội dung; vui lòng nhập ngày thủ công." };
  return parseChyusenAiOutput(content);
}
