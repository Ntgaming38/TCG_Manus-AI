import { useMemo, useState } from "react";
import { AlertTriangle, BellRing, CheckCircle2, ExternalLink, Link2, Loader2, Pause, Play, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

type SourcePreview = {
  status: "detected" | "monitoring" | "unavailable";
  sourceUrl: string;
  title?: string;
  productName?: string;
  registrationStartAt?: Date | string;
  registrationDeadline?: Date | string;
  drawAt?: Date | string;
  contentHash?: string;
  error?: string;
  aiSchedule?: {
    title: string | null;
    registrationStartAt: Date | string | null;
    registrationDeadline: Date | string | null;
    drawAt: Date | string | null;
    confidence: "high" | "medium" | "low";
    note: string;
  };
};

function formatDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : "Chưa kiểm tra";
}

function SourceStatus({ status }: { status: "monitoring" | "detected" | "unavailable" | "error" }) {
  const map = {
    monitoring: { label: "Đang theo dõi", className: "border border-blue-200 bg-blue-50 text-blue-700" },
    detected: { label: "Đã phát hiện", className: "border border-emerald-200 bg-emerald-50 text-emerald-700" },
    unavailable: { label: "Chưa đọc được", className: "border border-amber-200 bg-amber-50 text-amber-800" },
    error: { label: "Lỗi kiểm tra", className: "border border-red-200 bg-red-50 text-red-700" },
  } as const;
  return <Badge className={map[status].className}>{map[status].label}</Badge>;
}

export function ChyusenSourcePanel() {
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [preview, setPreview] = useState<SourcePreview | null>(null);
  const { data: sources = [], isLoading: sourcesLoading } = trpc.chyusen.sources.useQuery();
  const { data: notifications = [] } = trpc.chyusen.notifications.useQuery();
  const previewMutation = trpc.chyusen.previewSource.useMutation({ onSuccess: setPreview, onError: (error) => toast.error(error.message) });
  const addMutation = trpc.chyusen.addSource.useMutation();
  const refreshMutation = trpc.chyusen.refreshSource.useMutation();
  const updateMutation = trpc.chyusen.updateSource.useMutation();
  const deleteMutation = trpc.chyusen.deleteSource.useMutation();
  const markReadMutation = trpc.chyusen.markNotificationRead.useMutation();
  const unreadNotifications = useMemo(() => notifications.filter((item) => !item.isRead), [notifications]);
  const isBusy = previewMutation.isPending || addMutation.isPending || refreshMutation.isPending;

  function invalidateAll() {
    void utils.chyusen.sources.invalidate();
    void utils.chyusen.notifications.invalidate();
    void utils.chyusen.list.invalidate();
  }

  function resetDialog() { setOpen(false); setSourceUrl(""); setSourceLabel(""); setPreview(null); }

  async function saveSource() {
    if (!sourceUrl) return;
    try {
      const result = await addMutation.mutateAsync({
        sourceUrl,
        sourceLabel: sourceLabel || undefined,
        confirmedDraft: preview?.status === "detected" ? {
          title: preview.title || sourceLabel || "Chương trình Chyusen P-Bandai",
          productName: preview.productName || undefined,
          registrationStartAt: preview.registrationStartAt ? new Date(preview.registrationStartAt) : undefined,
          registrationDeadline: preview.registrationDeadline ? new Date(preview.registrationDeadline) : undefined,
          drawAt: preview.drawAt ? new Date(preview.drawAt) : undefined,
          note: preview.aiSchedule?.note,
        } : undefined,
      });
      if (result.chyusenEntryId) {
        toast.success("Đã lưu link và tạo Chyusen từ bản nháp đã xác nhận.");
      } else {
        toast.success("Đã lưu link theo dõi. TCG Manager sẽ kiểm tra lại mỗi 6 giờ.");
      }
      invalidateAll();
      resetDialog();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu link theo dõi.");
    }
  }

  async function refreshSource(id: number) {
    try {
      const result = await refreshMutation.mutateAsync({ id });
      toast.success(result.detected ? "Đã phát hiện Chyusen mới và tạo thông báo." : result.inspection.status === "unavailable" ? "Link hiện chưa đọc được công khai; sẽ tự kiểm tra lại." : "Đã kiểm tra link theo dõi.");
      invalidateAll();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể kiểm tra link.");
    }
  }

  return <div className="space-y-4">
    <Card className="border-sky-200 bg-sky-50/55 shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3"><div className="rounded-xl bg-sky-100 p-2.5 text-sky-700"><Link2 className="h-5 w-5" /></div><div><h2 className="font-bold text-sky-950">Theo dõi thông báo Chyusen công khai</h2><p className="text-sm text-sky-900/75">Dán link P-Bandai hoặc bài đăng chính thức x.com/p_bandai. Bạn xác nhận bản nháp nếu có dữ liệu; sau đó hệ thống kiểm tra nguồn mỗi 6 giờ.</p></div></div>
        <Button onClick={() => setOpen(true)} className="bg-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Thêm link theo dõi</Button>
      </CardContent>
    </Card>

    {unreadNotifications.length > 0 && <Card className="border-emerald-200 bg-emerald-50/55 shadow-sm"><CardHeader className="pb-2"><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base text-emerald-950"><BellRing className="h-4 w-4" /> Phát hiện mới</CardTitle><Badge className="bg-emerald-600 text-white">{unreadNotifications.length}</Badge></div></CardHeader><CardContent className="space-y-2">{unreadNotifications.slice(0, 3).map((item) => <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-emerald-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold text-foreground">{item.title}</p><p className="mt-0.5 text-sm text-muted-foreground">{item.message}</p></div><Button size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-100" onClick={() => markReadMutation.mutate({ id: item.id }, { onSuccess: invalidateAll })}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Đã xem</Button></div>)}</CardContent></Card>}

    <Card className="border-border shadow-sm"><CardHeader className="pb-2"><CardTitle className="text-base">Link đang theo dõi</CardTitle></CardHeader><CardContent>{sourcesLoading ? <p className="py-3 text-sm text-muted-foreground">Đang tải link theo dõi...</p> : sources.length === 0 ? <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">Chưa có link nào. Bạn có thể thêm link P-Bandai hoặc bài đăng chính thức để nhận cảnh báo khi có Chyusen.</p> : <div className="space-y-3">{sources.map((source) => <div key={source.id} className="rounded-xl border border-border bg-card p-3"><div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-foreground">{source.sourceLabel || "P-Bandai"}</p><SourceStatus status={source.lastStatus} />{!source.isActive && <Badge variant="outline">Đã tạm dừng</Badge>}</div><a href={source.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center truncate text-sm text-primary hover:underline">{source.sourceUrl}<ExternalLink className="ml-1 h-3.5 w-3.5 shrink-0" /></a><p className="mt-1 text-xs text-muted-foreground">Kiểm tra gần nhất: {formatDate(source.lastCheckedAt)} · Lịch tự động: mỗi 6 giờ</p>{source.lastError && <p className="mt-2 flex items-start gap-1 text-xs text-amber-800"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {source.lastError}</p>}</div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => refreshSource(source.id)} disabled={refreshMutation.isPending}><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Kiểm tra</Button><Button size="sm" variant="outline" onClick={() => updateMutation.mutate({ id: source.id, isActive: !source.isActive }, { onSuccess: invalidateAll })}>{source.isActive ? <><Pause className="mr-1.5 h-3.5 w-3.5" /> Tạm dừng</> : <><Play className="mr-1.5 h-3.5 w-3.5" /> Bật lại</>}</Button><Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => { if (window.confirm("Xóa link theo dõi này?")) deleteMutation.mutate({ id: source.id }, { onSuccess: invalidateAll, onError: (error) => toast.error(error.message) }); }}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Xóa</Button></div></div></div>)}</div>}</CardContent></Card>

    <Dialog open={open} onOpenChange={(value) => { if (!value) resetDialog(); else setOpen(true); }}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>Thêm nguồn theo dõi Chyusen</DialogTitle><DialogDescription>Hỗ trợ link P-Bandai hoặc bài đăng chính thức x.com/p_bandai. TCG Manager chỉ đọc nội dung công khai; bạn tự mở link và đăng ký nếu muốn tham gia.</DialogDescription></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label htmlFor="source-url">Link nguồn *</Label><Input id="source-url" type="url" value={sourceUrl} onChange={(event) => { setSourceUrl(event.target.value); setPreview(null); }} placeholder="https://p-bandai.jp/... hoặc https://x.com/p_bandai/status/..." /></div><div className="space-y-2"><Label htmlFor="source-label">Tên gợi nhớ (tùy chọn)</Label><Input id="source-label" value={sourceLabel} onChange={(event) => setSourceLabel(event.target.value)} placeholder="Ví dụ: ONE PIECE OP-17" /></div>{preview && <div className={`rounded-xl border p-3 text-sm ${preview.status === "detected" ? "border-emerald-200 bg-emerald-50" : preview.status === "unavailable" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50"}`}><div className="flex items-center gap-2 font-semibold"><SourceStatus status={preview.status === "detected" ? "detected" : preview.status === "unavailable" ? "unavailable" : "monitoring"} />{preview.title || "Chưa đọc được tiêu đề"}</div>{preview.aiSchedule && <div className="mt-3 space-y-1 rounded-lg border border-white/70 bg-white/75 p-3 text-sm"><div className="flex items-center justify-between gap-2"><strong>AI điền sẵn lịch</strong><Badge className={preview.aiSchedule.confidence === "high" ? "bg-emerald-600 text-white" : preview.aiSchedule.confidence === "medium" ? "bg-amber-500 text-white" : "bg-slate-600 text-white"}>Độ tin cậy: {preview.aiSchedule.confidence === "high" ? "cao" : preview.aiSchedule.confidence === "medium" ? "trung bình" : "thấp"}</Badge></div><p>Bắt đầu: <strong>{preview.registrationStartAt ? formatDate(preview.registrationStartAt) : "Chưa xác định"}</strong></p><p>Hạn đăng ký: <strong>{preview.registrationDeadline ? formatDate(preview.registrationDeadline) : "Chưa xác định"}</strong></p>{preview.drawAt && <p>Quay số: <strong>{formatDate(preview.drawAt)}</strong></p>}<p className="pt-1 text-xs text-muted-foreground">{preview.aiSchedule.note} Vui lòng kiểm tra lại trước khi lưu.</p></div>}{!preview.aiSchedule && preview.registrationDeadline && <p className="mt-2">Hạn đăng ký nhận diện: <strong>{formatDate(preview.registrationDeadline)}</strong></p>}<p className="mt-2 text-muted-foreground">{preview.error || (preview.status === "detected" ? "Đã nhận diện dữ liệu công khai. Bấm lưu để xác nhận tạo Chyusen và theo dõi link." : "Chưa nhận diện chương trình Chyusen. Bạn vẫn có thể lưu link để hệ thống kiểm tra định kỳ.")}</p></div>}</div><DialogFooter><Button type="button" variant="outline" onClick={resetDialog}>Hủy</Button><Button type="button" variant="outline" disabled={!sourceUrl || isBusy} onClick={() => previewMutation.mutate({ sourceUrl })}>{previewMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Đọc link</Button><Button type="button" disabled={!sourceUrl || !preview || isBusy} onClick={saveSource} className="bg-primary text-primary-foreground">{addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{preview?.status === "detected" ? "Lưu link & tạo Chyusen" : "Lưu link theo dõi"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}
