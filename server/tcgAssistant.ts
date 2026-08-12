import { getDashboardStats, getInStockProducts, listChyusenEntries } from "./db";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { getChyusenTimelineStatus } from "../shared/chyusen";

export type TcgAssistantMessage = {
  role: "user" | "assistant";
  content: string;
};

function yen(value: unknown) {
  return Math.round(Number(value || 0));
}

export async function buildTcgAssistantContext(userId: number) {
  const [stats, stock, chyusen] = await Promise.all([
    getDashboardStats(userId),
    getInStockProducts(userId),
    listChyusenEntries(userId),
  ]);

  const deadlineEntries = chyusen
    .filter((entry) => getChyusenTimelineStatus(entry) === "deadline" && !entry.isRegistered)
    .slice(0, 5)
    .map((entry) => ({ title: entry.title, deadline: entry.registrationDeadline }));

  return {
    dashboard: {
      totalCapital: yen(stats.totalCapital),
      currentValue: yen(stats.currentValue),
      totalProfit: yen(stats.totalProfit),
      totalProductsInStock: stats.totalInStock,
      totalProductsSold: stats.totalSold,
      roi: stats.totalCapital > 0 ? Number(((stats.totalProfit / stats.totalCapital) * 100).toFixed(2)) : 0,
    },
    inventory: stock.slice(0, 20).map((product) => ({
      name: product.name,
      type: product.type,
      quantity: product.quantity,
      damagedQuantity: product.damagedQuantity,
      marketPrice: yen(product.marketPrice),
    })),
    chyusen: {
      activeCount: chyusen.filter((entry) => getChyusenTimelineStatus(entry) === "open").length,
      deadlineSoon: deadlineEntries,
    },
  };
}

export async function answerTcgAssistant(userId: number, history: TcgAssistantMessage[]) {
  const context = await buildTcgAssistantContext(userId);
  const { data: models } = await listLLMModels();
  const model = models.find((item) => item.id === "gpt-5-mini")?.id
    ?? models.find((item) => item.id === "claude-haiku-4-5")?.id
    ?? models[0]?.id;

  const response = await invokeLLM({
    model,
    maxTokens: 900,
    messages: [
      {
        role: "system",
        content: `Bạn là Trợ lý AI của TCG Manager. Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng và thân thiện. Chỉ dùng dữ liệu ngữ cảnh bên dưới cho số liệu cá nhân của người dùng. Không khẳng định đã tạo, sửa, xóa, bán, mua, đăng ký Chyusen hoặc đồng bộ dữ liệu; hãy hướng dẫn người dùng thao tác trong app. Không đưa lời khuyên đầu tư chắc chắn, không bịa số liệu, và nói rõ khi dữ liệu chưa đủ.\n\nNGỮ CẢNH THEO TÀI KHOẢN:\n${JSON.stringify(context)}`,
      },
      ...history.slice(-12).map((message) => ({ role: message.role, content: message.content })),
    ],
  });

  const content = response.choices[0]?.message.content;
  return typeof content === "string" && content.trim()
    ? content.trim()
    : "Tôi chưa thể tạo câu trả lời lúc này. Vui lòng thử lại sau.";
}
