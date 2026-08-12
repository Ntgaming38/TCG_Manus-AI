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
  const [stats, stock] = await Promise.all([
    getDashboardStats(userId),
    getInStockProducts(userId),
  ]);

  const cardProducts = stock.filter((p) => p.type === "card");
  const cardAnalysis = cardProducts.map((p) => {
    const buy = yen(p.buyPrice);
    const market = yen(p.marketPrice);
    const qty = p.quantity;
    const totalBuy = buy * qty;
    const totalMarket = market * qty;
    const unrealizedProfit = totalMarket - totalBuy;
    const roi = totalBuy > 0 ? Number(((unrealizedProfit / totalBuy) * 100).toFixed(1)) : 0;
    return {
      name: p.name,
      series: p.series || "Chưa phân loại",
      quantity: qty,
      buyPricePerUnit: buy,
      marketPricePerUnit: market,
      unrealizedProfit,
      roi,
      hasSnkrdunk: Boolean(p.snkrdunkUrl),
    };
  });

  cardAnalysis.sort((a, b) => b.unrealizedProfit - a.unrealizedProfit);

  return {
    dashboard: {
      totalCapital: yen(stats.totalCapital),
      currentValue: yen(stats.currentValue),
      totalProfit: yen(stats.totalProfit),
      totalProductsInStock: stats.totalInStock,
      totalProductsSold: stats.totalSold,
      roi: stats.totalCapital > 0 ? Number(((stats.totalProfit / stats.totalCapital) * 100).toFixed(2)) : 0,
    },
    topCardsAnalysis: cardAnalysis.slice(0, 10),
    inventorySummary: {
      totalCardsInStock: cardProducts.reduce((sum, p) => sum + p.quantity, 0),
      linkedToSnkrdunk: cardProducts.filter((p) => Boolean(p.snkrdunkUrl)).length,
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
        content: `Bạn là Trợ lý AI chuyên gia phân tích thị trường TCG của TCG Manager. Hãy cung cấp phân tích sâu sắc về xu hướng giá cả, tỷ suất sinh lời (ROI), lợi nhuận chưa thực hiện (unrealized profit), và đánh giá danh mục thẻ bài (Card) trong kho của người dùng dựa trên dữ liệu SNKRDUNK và giá mua.\n\nTrả lời bằng tiếng Việt, chuyên nghiệp, rõ ràng, có cấu trúc (dùng bullet points hoặc bảng tóm tắt khi phù hợp). Chỉ dùng dữ liệu ngữ cảnh bên dưới. Không khẳng định đã thực hiện giao dịch hay thay đổi dữ liệu trong hệ thống; hướng dẫn người dùng thao tác trực tiếp trên ứng dụng. Không đưa lời khuyên đầu tư chắc chắn, tuyệt đối không bịa đặt số liệu.\n\nNGỮ CẢNH PHÂN TÍCH THẺ BÀI VÀ TÀI CHÍNH:\n${JSON.stringify(context)}`,
      },
      ...history.slice(-12).map((message) => ({ role: message.role, content: message.content })),
    ],
  });

  const content = response.choices[0]?.message.content;
  return typeof content === "string" && content.trim()
    ? content.trim()
    : "Tôi chưa thể tạo câu trả lời lúc này. Vui lòng thử lại sau.";
}
