import { Bot, Loader2, Sparkles, Trash2, ArrowUpRight, ArrowDownRight, Check } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

const STORAGE_KEY = "tcg-manager-ai-assistant-history";

export function SidebarAIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [updatingProductId, setUpdatingProductId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: analysisContext } = trpc.ai.analysisChartData.useQuery(undefined, { enabled: open });

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as Message[];
      if (Array.isArray(parsed)) setMessages(parsed.filter((item) => item?.role !== "system" && typeof item?.content === "string").slice(-12));
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-12)));
  }, [messages]);

  const dynamicPrompts = useMemo(() => {
    const topCards = analysisContext?.topCardsAnalysis || [];
    if (topCards.length === 0) {
      return [
        "📈 Hướng dẫn thêm thẻ bài (Card) vào kho",
        "💡 Cách theo dõi lợi nhuận và ROI trong TCG Manager",
        "🔍 Tổng quan tính năng quản lý kho hàng",
      ];
    }

    const bestCard = topCards[0];
    const cardCount = analysisContext?.inventorySummary?.totalCardsInStock || topCards.length;

    const prompts = [
      `📈 Phân tích xu hướng giá và lợi nhuận cho thẻ "${bestCard.name}"`,
      `⭐ Thẻ bài nào trong ${cardCount} thẻ đang có tỷ suất ROI cao nhất?`,
      `💰 Đánh giá chi tiết lợi nhuận chưa thực hiện của danh mục Card`,
    ];

    if (topCards.length > 1) {
      const secondCard = topCards[1];
      prompts.push(`🔍 So sánh tiềm năng sinh lời giữa "${bestCard.name}" và "${secondCard.name}"`);
    } else {
      prompts.push(`🔍 Đánh giá toàn diện danh mục Card trong kho`);
    }

    return prompts;
  }, [analysisContext]);

  const updateMarketPriceMutation = trpc.products.updateMarketPrice.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật giá thị trường thành công từ Trợ lý AI!");
      setUpdatingProductId(null);
      utils.products.list.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Không thể cập nhật giá.");
      setUpdatingProductId(null);
    },
  });

  const handleUpdatePrice = (productId: number, newPrice: number) => {
    setUpdatingProductId(productId);
    updateMarketPriceMutation.mutate({ id: productId, marketPrice: newPrice });
  };

  const assistantMutation = trpc.ai.chat.useMutation({
    onSuccess: (answer: string) => setMessages((current): Message[] => [...current, { role: "assistant" as const, content: answer }].slice(-12)),
    onError: (error: any) => {
      toast.error("Trợ lý AI chưa thể trả lời", { description: error.message });
      setMessages((current): Message[] => [...current, { role: "assistant" as const, content: "Xin lỗi, hiện tại Trợ lý AI đang bận hoặc gặp sự cố kết nối tạm thời. Vui lòng thử lại câu hỏi sau ít phút." }].slice(-12));
    },
  });

  const placeholder = useMemo(() => "Hỏi về xu hướng giá, ROI, lợi nhuận thẻ bài...", []);

  const handleSendMessage = (content: string) => {
    const nextMessages: Message[] = [...messages, { role: "user" as const, content }].slice(-12);
    setMessages(nextMessages);
    assistantMutation.mutate({
      messages: nextMessages.map(({ role, content: text }) => ({ role: role === "assistant" ? "assistant" as const : "user" as const, content: text })),
    });
  };

  const clearHistory = () => {
    setMessages([]);
    sessionStorage.removeItem(STORAGE_KEY);
    toast.success("Đã xóa lịch sử trò chuyện của phiên này.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="mb-3 h-auto w-full justify-start gap-3 border-primary/30 bg-primary/5 px-3 py-2.5 text-left text-foreground hover:border-primary/60 hover:bg-primary/10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
          aria-label="Mở Trợ lý AI"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="size-4" />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block text-sm font-bold">Trợ lý AI</span>
            <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">Phân tích giá & lợi nhuận Card</span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl gap-4 border-primary/25 p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-border bg-primary/5 px-5 py-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary"><Bot className="size-4" /></span>
              Trợ lý AI TCG Manager & Cập nhật giá
            </DialogTitle>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={messages.length === 0 || assistantMutation.isPending} className="gap-1.5 text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3.5" />
                  Xóa lịch sử
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xóa lịch sử trò chuyện?</AlertDialogTitle>
                  <AlertDialogDescription>Lịch sử chat của phiên hiện tại sẽ bị xóa khỏi thiết bị này. Dữ liệu kho, mua bán và thống kê sẽ không bị ảnh hưởng.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Xóa lịch sử</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <DialogDescription>
            Phân tích sâu về xu hướng giá, tỷ suất ROI và lợi nhuận thẻ bài trong kho. Bạn có thể bấm cập nhật giá trực tiếp vào kho từ các gợi ý của trợ lý.
          </DialogDescription>
          {assistantMutation.isPending && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-background/70 px-3 py-2 text-xs text-primary" role="status" aria-live="polite">
              <Loader2 className="size-4 animate-spin" />
              <span className="font-semibold">Trợ lý AI đang phân tích dữ liệu</span>
              <span className="flex gap-1" aria-hidden="true"><i className="size-1 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" /><i className="size-1 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" /><i className="size-1 animate-bounce rounded-full bg-primary" /></span>
            </div>
          )}
        </DialogHeader>

        {/* Quick Price Update Suggestions Bar */}
        {analysisContext?.topCardsAnalysis && analysisContext.topCardsAnalysis.length > 0 && (
          <div className="mx-5 rounded-xl border border-primary/20 bg-card/60 p-3">
            <p className="mb-2 text-xs font-bold text-foreground">💡 Đề xuất cập nhật giá nhanh từ kho (SNKRDUNK vs Giá hiện tại):</p>
            <div className="flex flex-wrap gap-2">
              {analysisContext.topCardsAnalysis.slice(0, 4).map((card: any) => {
                const currentPrice = Number(card.marketPrice || card.buyPrice || 0);
                const suggestedPrice = Number(card.suggestedMarketPrice || card.marketPrice || card.buyPrice || 0);
                const diff = suggestedPrice - currentPrice;
                const isUp = diff > 0;
                const isDown = diff < 0;

                return (
                  <div key={card.id} className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs shadow-xs">
                    <div>
                      <p className="font-semibold text-foreground">{card.name}</p>
                      <p className="text-[11px] text-muted-foreground">Hiện: ¥{currentPrice.toLocaleString()} → Đề xuất: <span className="font-medium text-primary">¥{suggestedPrice.toLocaleString()}</span></p>
                    </div>
                    <div className="flex items-center gap-1">
                      {isUp && <span className="flex items-center text-green-500 font-bold" title="Tăng giá"><ArrowUpRight className="size-3.5" />+{diff.toLocaleString()}</span>}
                      {isDown && <span className="flex items-center text-red-500 font-bold" title="Giảm giá"><ArrowDownRight className="size-3.5" />{diff.toLocaleString()}</span>}
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 px-2 text-[11px] bg-red-600 hover:bg-red-700 text-white"
                        disabled={updatingProductId === card.id}
                        onClick={() => handleUpdatePrice(card.id, suggestedPrice)}
                      >
                        {updatingProductId === card.id ? <Loader2 className="size-3 animate-spin" /> : "Áp dụng"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-4 pb-4 sm:px-5">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={assistantMutation.isPending}
            placeholder={placeholder}
            height="min(50vh, 400px)"
            emptyStateMessage="Tôi có thể phân tích xu hướng giá, ROI và lợi nhuận thẻ bài dựa trên kho hàng thực tế của bạn."
            suggestedPrompts={dynamicPrompts}
            className="border-primary/20 shadow-none"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
