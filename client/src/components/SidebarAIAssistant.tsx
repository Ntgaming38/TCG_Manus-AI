import { Bot, Loader2, Sparkles, Trash2, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const STORAGE_KEY = "tcg-manager-ai-assistant-history";

const suggestedPrompts = [
  "Phân tích xu hướng giá và lợi nhuận thẻ bài",
  "Thẻ bài nào đang có ROI cao nhất?",
  "Đánh giá danh mục Card trong kho",
];

export function SidebarAIAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

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

  const { data: chartContext, isLoading: isChartLoading } = trpc.ai.analysisChartData.useQuery(undefined, { enabled: open });

  const assistantMutation = trpc.ai.chat.useMutation({
    onSuccess: (answer) => setMessages((current): Message[] => [...current, { role: "assistant" as const, content: answer }].slice(-12)),
    onError: (error) => {
      toast.error("Trợ lý AI chưa thể trả lời", { description: error.message });
      setMessages((current): Message[] => [...current, { role: "assistant" as const, content: "Tôi chưa thể xử lý câu hỏi này. Vui lòng thử lại sau." }].slice(-12));
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
                  <AlertDialogDescription>Lịch sử chat của phiên hiện tại sẽ bị xóa khỏi thiết bị này. Dữ liệu kho, mua bán và Chyusen sẽ không bị ảnh hưởng.</AlertDialogDescription>
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
          {assistantMutation.isPending && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-background/70 px-3 py-2 text-xs text-primary" role="status" aria-live="polite">
              <Loader2 className="size-4 animate-spin" />
              <span className="font-semibold">Trợ lý AI đang phân tích dữ liệu</span>
              <span className="flex gap-1" aria-hidden="true"><i className="size-1 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" /><i className="size-1 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" /><i className="size-1 animate-bounce rounded-full bg-primary" /></span>
            </div>
          )}
        </DialogHeader>
        <div className="space-y-4 px-4 pb-4 sm:px-5">
          {/* Visual Analysis Chart */}
          <div className="rounded-xl border border-border bg-card/60 p-3 shadow-sm">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <BarChart2 className="size-4 text-primary" />
                <span>Biểu đồ phân bổ lợi nhuận chưa thực hiện & ROI (Top Thẻ Bài)</span>
              </div>
              <span className="text-[11px] text-muted-foreground">SNKRDUNK vs Vốn</span>
            </div>
            {isChartLoading ? (
              <div className="flex h-44 items-center justify-center text-xs text-muted-foreground">Đang tải dữ liệu biểu đồ...</div>
            ) : !chartContext || !chartContext.topCardsAnalysis || chartContext.topCardsAnalysis.length === 0 ? (
              <div className="flex h-44 flex-col items-center justify-center gap-1 text-center text-xs text-muted-foreground">
                <p>Chưa có thẻ bài (Card) nào trong kho để vẽ biểu đồ.</p>
                <p className="text-[11px]">Hãy thêm sản phẩm loại Card để xem phân tích trực quan.</p>
              </div>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartContext.topCardsAnalysis.slice(0, 6)} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" stroke="currentColor" fontSize={10} tickLine={false} interval={0} angle={-15} textAnchor="end" className="text-muted-foreground" />
                    <YAxis stroke="currentColor" fontSize={10} tickLine={false} className="text-muted-foreground" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#12122b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px", color: "#fff" }}
                      formatter={(val: any, name: string) => [
                        name === "unrealizedProfit" ? `¥${Number(val || 0).toLocaleString()}` : `${val}%`,
                        name === "unrealizedProfit" ? "Lợi nhuận (¥)" : "ROI (%)"
                      ]}
                    />
                    <Bar dataKey="unrealizedProfit" fill="#22c55e" radius={[4, 4, 0, 0]} name="unrealizedProfit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={assistantMutation.isPending}
            placeholder={placeholder}
            height="min(45vh, 360px)"
            emptyStateMessage="Tôi có thể phân tích sâu xu hướng giá, ROI và lợi nhuận thẻ bài cho bạn."
            suggestedPrompts={suggestedPrompts}
            className="border-primary/20 shadow-none"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
