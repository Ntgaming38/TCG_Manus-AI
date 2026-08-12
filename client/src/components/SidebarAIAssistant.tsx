import { useEffect, useMemo, useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";

const STORAGE_KEY = "tcg-manager-ai-assistant-history";

const suggestedPrompts = [
  "Tóm tắt tình hình kho của tôi",
  "Lợi nhuận hiện tại là bao nhiêu?",
  "Có Chyusen nào sắp hết hạn không?",
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

  const assistantMutation = trpc.ai.chat.useMutation({
    onSuccess: (answer) => setMessages((current): Message[] => [...current, { role: "assistant" as const, content: answer }].slice(-12)),
    onError: (error) => {
      toast.error("Trợ lý AI chưa thể trả lời", { description: error.message });
      setMessages((current): Message[] => [...current, { role: "assistant" as const, content: "Tôi chưa thể xử lý câu hỏi này. Vui lòng thử lại sau." }].slice(-12));
    },
  });

  const placeholder = useMemo(() => "Hỏi về kho, lãi hoặc Chyusen...", []);

  const handleSendMessage = (content: string) => {
    const nextMessages: Message[] = [...messages, { role: "user" as const, content }].slice(-12);
    setMessages(nextMessages);
    assistantMutation.mutate({
      messages: nextMessages.map(({ role, content: text }) => ({ role: role === "assistant" ? "assistant" as const : "user" as const, content: text })),
    });
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
            <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">Hỏi kho, lợi nhuận, Chyusen</span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl gap-4 border-primary/25 p-0 sm:rounded-2xl">
        <DialogHeader className="border-b border-border bg-primary/5 px-5 py-4 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary"><Bot className="size-4" /></span>
            Trợ lý AI TCG Manager
          </DialogTitle>
          <DialogDescription>
            Hỏi về kho, lợi nhuận và các chương trình Chyusen của bạn. Tôi không tự thay đổi dữ liệu.
          </DialogDescription>
        </DialogHeader>
        <div className="px-4 pb-4 sm:px-5">
          <AIChatBox
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={assistantMutation.isPending}
            placeholder={placeholder}
            height="min(62vh, 520px)"
            emptyStateMessage="Tôi có thể tóm tắt kho, lợi nhuận và nhắc Chyusen cho bạn."
            suggestedPrompts={suggestedPrompts}
            className="border-primary/20 shadow-none"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
