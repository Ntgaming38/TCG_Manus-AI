import { Bot, Loader2, Sparkles, Trash2 } from "lucide-react";
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
          className="mb-3 h-auto w-full justify-start gap-3 border-primary/40 bg-primary/10 px-3 py-2.5 text-left text-white hover:border-primary hover:bg-primary/20 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 shadow-sm"
          aria-label="Mở Trợ lý AI"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/25 text-white">
            <Sparkles className="size-4" />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block text-sm font-bold text-white tracking-wide">Trợ lý AI</span>
            <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-300">Phân tích giá & lợi nhuận Card</span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl gap-4 border-primary/25 p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-border bg-primary/5 px-5 py-4 text-left">
          <div className="flex items-center justify-between gap-3">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary"><Bot className="size-4" /></span>
              Trợ lý AI TCG Manager
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
            Phân tích sâu về xu hướng giá, tỷ suất ROI và lợi nhuận chưa thực hiện của các thẻ bài trong kho.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-4 sm:px-5">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={assistantMutation.isPending}
            placeholder={placeholder}
            height="min(70vh, 580px)"
            emptyStateMessage="Tôi có thể phân tích xu hướng giá, ROI và lợi nhuận thẻ bài dựa trên kho hàng thực tế của bạn."
            suggestedPrompts={dynamicPrompts}
            className="border-primary/20 shadow-none"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
