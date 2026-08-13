import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { BellRing, CalendarClock, CheckCircle2, Clock3, ExternalLink, FileSearch, Gift, Link2, Pencil, Plus, Radio, Search, Settings2, Ticket, ToggleLeft, ToggleRight, Trophy, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toChyusenDraft } from "@/lib/chyusenDraft";
import { createChyusenPreviewFallback } from "@shared/chyusenPreview";

type Draft = {
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

const EMPTY_DRAFT: Draft = {
  title: "", productName: "", series: "Pokemon", productType: "other", shop: "Khác", customShopName: "", sourceUrl: "", externalProductId: "", imageUrl: "", price: "", quantityLimit: "",
  applicationStart: "", applicationEnd: "", resultDate: "", pickupStart: "", pickupEnd: "", requirements: "", parserStatus: "manual", parserNote: "", fieldConfidence: {},
};

const SHOPS = ["Geo", "Joshin", "Fruichi", "Toysrus", "Lawson", "Seven Eleven", "Family Mart", "Khác"];

function japanInputValue(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date).reduce<Record<string, string>>((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function fromInputValue(value: string) {
  return value ? new Date(`${value}:00+09:00`) : null;
}

function displayDate(value: Date | string | null | undefined) {
  if (!value) return "Chưa có thông tin";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa có thông tin";
  return new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Tokyo", dateStyle: "short", timeStyle: "short" }).format(date);
}

function toDraft(data: any): Draft {
  return {
    title: data.title || "", productName: data.productName || "", series: data.series || "Pokemon", productType: data.productType || "other",
    shop: data.shop || "Khác", customShopName: data.customShopName || "", sourceUrl: data.sourceUrl || "", externalProductId: data.externalProductId || "", imageUrl: data.imageUrl || "",
    price: data.price === undefined || data.price === null ? "" : String(data.price), quantityLimit: data.quantityLimit || "",
    applicationStart: japanInputValue(data.applicationStart), applicationEnd: japanInputValue(data.applicationEnd), resultDate: japanInputValue(data.resultDate),
    pickupStart: japanInputValue(data.pickupStart), pickupEnd: japanInputValue(data.pickupEnd), requirements: data.requirements || "",
    parserStatus: data.parserStatus || "manual", parserNote: data.parserNote || "", fieldConfidence: data.fieldConfidence || {}, sourceContentHash: data.sourceContentHash,
  };
}

function timeBadge(timeState: string) {
  const labels: Record<string, { label: string; className: string }> = {
    upcoming: { label: "Sắp mở", className: "border-sky-300 bg-sky-50 text-sky-800" },
    open: { label: "Đang đăng ký", className: "border-emerald-300 bg-emerald-50 text-emerald-800" },
    expiring: { label: "Sắp hết hạn", className: "border-amber-300 bg-amber-50 text-amber-900" },
    expired: { label: "Đã hết hạn", className: "border-red-300 bg-red-50 text-red-800" },
    waiting_result: { label: "Chờ kết quả", className: "border-blue-300 bg-blue-50 text-blue-800" },
    result_ready: { label: "Đến ngày công bố", className: "border-violet-300 bg-violet-50 text-violet-800" },
  };
  const value = labels[timeState] || labels.expired;
  return <Badge variant="outline" className={value.className}>{value.label}</Badge>;
}

function participationBadge(status: string) {
  const labels: Record<string, { label: string; className: string }> = {
    not_registered: { label: "Chưa đăng ký", className: "border-slate-300 bg-slate-50 text-slate-700" },
    registered: { label: "Đã đăng ký", className: "border-emerald-300 bg-emerald-50 text-emerald-800" },
    cancelled: { label: "Đã hủy", className: "border-slate-400 bg-slate-100 text-slate-700" },
    won: { label: "Đã trúng", className: "border-violet-300 bg-violet-50 text-violet-800" },
    lost: { label: "Đã trượt", className: "border-zinc-400 bg-zinc-100 text-zinc-800" },
    not_participating: { label: "Không tham gia", className: "border-slate-300 bg-slate-50 text-slate-600" },
  };
  const value = labels[status] || labels.not_registered;
  return <Badge variant="outline" className={value.className}>{value.label}</Badge>;
}

export default function Chyusen() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { data: entries = [], isLoading } = trpc.chyusen.list.useQuery();
  const { data: notifications = [] } = trpc.chyusen.notifications.useQuery();
  const { data: sources = [] } = trpc.chyusen.sources.useQuery();
  const { data: sourceHistory = [] } = trpc.chyusen.sourceHistory.useQuery();
  const { data: notificationSettings } = trpc.chyusen.notificationSettings.useQuery();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showDialog, setShowDialog] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [editingSourceId, setEditingSourceId] = useState<number | null>(null);
  const [deleteSourceId, setDeleteSourceId] = useState<number | null>(null);
  const [sourceDraft, setSourceDraft] = useState<{ label: string; sourceUrl: string; checkIntervalMinutes: 60 | 180 | 360 | 720 | 1440; isActive: boolean }>({ label: "", sourceUrl: "", checkIntervalMinutes: 360, isActive: true });

  const invalidate = () => {
    utils.chyusen.list.invalidate();
    utils.chyusen.notifications.invalidate();
    utils.chyusen.sources.invalidate();
    utils.chyusen.sourceHistory.invalidate();
    utils.chyusen.notificationSettings.invalidate();
    utils.dashboard.stats.invalidate();
  };
  const previewUrl = trpc.chyusen.previewUrl.useMutation({
    onSuccess: (data) => {
      setDraft(toChyusenDraft(data));
      toast.success(data.parserStatus === "detected" ? "Đã đọc thông tin. Hãy kiểm tra trước khi lưu." : "Đã đọc được một phần thông tin. Hãy bổ sung các trường còn thiếu.");
    },
    onError: () => {
      setDraft((current) => createChyusenPreviewFallback(current));
      toast.error("Không thể đọc link. Hãy nhập thủ công rồi lưu.");
    },
  });
  const create = trpc.chyusen.create.useMutation({
    onSuccess: () => { toast.success("Đã lưu Chyusen."); setShowDialog(false); setDraft(EMPTY_DRAFT); invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const update = trpc.chyusen.update.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật Chyusen."); setShowDialog(false); setEditingId(null); setDraft(EMPTY_DRAFT); invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const remove = trpc.chyusen.delete.useMutation({
    onSuccess: () => { toast.success("Đã xóa Chyusen."); setDeleteId(null); invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const setParticipation = trpc.chyusen.setParticipation.useMutation({
    onSuccess: () => { toast.success("Đã cập nhật trạng thái."); invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const purchaseDraft = trpc.chyusen.purchaseDraft.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("tcg-manager-chyusen-purchase-draft", JSON.stringify(data));
      setLocation("/mua-hang");
    },
    onError: (error) => toast.error(error.message),
  });
  const markNotificationRead = trpc.chyusen.markNotificationRead.useMutation({
    onSuccess: () => utils.chyusen.notifications.invalidate(),
    onError: (error) => toast.error(error.message),
  });
  const updateNotificationSettings = trpc.chyusen.updateNotificationSettings.useMutation({ onSuccess: () => { utils.chyusen.notificationSettings.invalidate(); toast.success("Đã cập nhật cài đặt nhắc hạn."); }, onError: (error) => toast.error(error.message) });
  const createSource = trpc.chyusen.createSource.useMutation({ onSuccess: () => { toast.success("Đã lưu nguồn theo dõi."); setShowSourceDialog(false); setSourceDraft({ label: "", sourceUrl: "", checkIntervalMinutes: 360, isActive: true }); utils.chyusen.sources.invalidate(); }, onError: (error) => toast.error(error.message) });
  const updateSource = trpc.chyusen.updateSource.useMutation({ onSuccess: () => { toast.success("Đã cập nhật nguồn theo dõi."); utils.chyusen.sources.invalidate(); }, onError: (error) => toast.error(error.message) });
  const deleteSource = trpc.chyusen.deleteSource.useMutation({ onSuccess: () => { toast.success("Đã xóa nguồn theo dõi."); setDeleteSourceId(null); invalidate(); }, onError: (error) => toast.error(error.message) });

  const filteredEntries = useMemo(() => entries.filter((entry: any) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch = !normalizedSearch || [entry.title, entry.productName, entry.shop, entry.series].some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
    const matchesFilter = filter === "all" || entry.timeState === filter || entry.applicationStatus === filter;
    return matchesSearch && matchesFilter;
  }), [entries, filter, search]);
  const unreadNotifications = notifications.filter((notification: any) => !notification.isRead);
  const sourceLabelForHistory = (sourceId: number, entryId?: number | null) => {
    const sourceLabel = sources.find((source: any) => source.id === sourceId)?.label || `Nguồn #${sourceId}`;
    const entryLabel = entryId ? entries.find((entry: any) => entry.id === entryId)?.title || `Chyusen #${entryId}` : null;
    return entryLabel ? `${sourceLabel} · ${entryLabel}` : sourceLabel;
  };

  const updateDraft = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const openNewSource = () => { setEditingSourceId(null); setSourceDraft({ label: "", sourceUrl: "", checkIntervalMinutes: 360, isActive: true }); setShowSourceDialog(true); };
  const openEditSource = (source: any) => { setEditingSourceId(source.id); setSourceDraft({ label: source.label || "", sourceUrl: source.sourceUrl || "", checkIntervalMinutes: source.checkIntervalMinutes || 360, isActive: Boolean(source.isActive) }); setShowSourceDialog(true); };
  const saveSource = () => {
    if (editingSourceId) {
      updateSource.mutate({ id: editingSourceId, ...sourceDraft }, { onSuccess: () => { toast.success("Đã sửa nguồn theo dõi."); setShowSourceDialog(false); setEditingSourceId(null); invalidate(); } });
    } else {
      createSource.mutate({ label: sourceDraft.label, sourceUrl: sourceDraft.sourceUrl, checkIntervalMinutes: sourceDraft.checkIntervalMinutes });
    }
  };
  const submit = () => {
    if (!draft.title.trim() || !draft.productName.trim()) {
      toast.error("Hãy nhập tên Chyusen và tên sản phẩm.");
      return;
    }
    const { sourceUrl, ...draftWithoutSourceUrl } = draft;
    const payload = {
      ...draftWithoutSourceUrl,
      sourceUrl: sourceUrl.trim() || undefined,
      imageUrl: draft.imageUrl || undefined,
      customShopName: draft.customShopName || undefined,
      price: draft.price ? Number(draft.price) : null,
      applicationStart: fromInputValue(draft.applicationStart), applicationEnd: fromInputValue(draft.applicationEnd), resultDate: fromInputValue(draft.resultDate),
      pickupStart: fromInputValue(draft.pickupStart), pickupEnd: fromInputValue(draft.pickupEnd),
    };
    if (editingId) update.mutate({ id: editingId, data: payload });
    else create.mutate(payload);
  };
  const openNew = () => { setEditingId(null); setDraft(EMPTY_DRAFT); setShowDialog(true); };
  const openEdit = (entry: any) => { setEditingId(entry.id); setDraft(toDraft(entry)); setShowDialog(true); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3"><Ticket className="h-7 w-7 text-red-600" /><h1 className="text-2xl font-bold text-foreground">抽選</h1></div>
          <p className="mt-1 text-sm text-muted-foreground">Lottery / Chūsen — dán link công khai, kiểm tra thông tin rồi lưu để theo dõi hạn đăng ký.</p>
        </div>
        <Button className="bg-red-600 text-white hover:bg-red-700" onClick={openNew}><Plus className="mr-2 h-4 w-4" />Thêm 抽選</Button>
      </div>

      <Card className="border-red-100 bg-red-50/40">
        <CardContent className="flex gap-3 p-4 text-sm text-red-900"><FileSearch className="mt-0.5 h-5 w-5 shrink-0 text-red-600" /><p><strong>Tự động tối đa, không tự đoán.</strong> Hệ thống chỉ đọc nguồn công khai được hỗ trợ. Thông tin lấy từ link luôn cần bạn kiểm tra và xác nhận trước khi lưu; website yêu cầu đăng nhập hoặc CAPTCHA sẽ không bị vượt qua.</p></CardContent>
      </Card>

      {unreadNotifications.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base text-amber-950"><BellRing className="h-4 w-4 text-amber-700" />Thông báo Chyusen ({unreadNotifications.length})</CardTitle><CardDescription className="text-amber-900">Nhắc hạn đăng ký, ngày công bố kết quả hoặc thay đổi từ nguồn công khai.</CardDescription></CardHeader>
          <CardContent className="space-y-2">{unreadNotifications.slice(0, 4).map((notification: any) => <div key={notification.id} className="flex flex-col gap-2 rounded-lg border border-amber-200 bg-white/80 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold text-amber-950">{notification.title}</p><p className="mt-0.5 text-xs text-amber-900">{notification.message}</p></div><Button variant="outline" size="sm" className="border-amber-300 bg-white" onClick={() => markNotificationRead.mutate({ id: notification.id, isRead: true })}>Đã xem</Button></div>)}</CardContent>
        </Card>
      )}

      <Card className="border-dashed bg-muted/20"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-semibold">Cài đặt Chyusen</p><p className="text-xs text-muted-foreground">Nhắc hạn, nguồn theo dõi và tần suất đã được chuyển vào trang Cài đặt để màn quản lý gọn hơn.</p></div><Button variant="outline" onClick={() => window.location.assign("/cai-dat")}><Settings2 className="mr-2 h-4 w-4" />Mở Cài đặt</Button></CardContent></Card>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sản phẩm, cửa hàng, series..." className="pl-9" /></div>
        <Select value={filter} onValueChange={setFilter}><SelectTrigger className="w-full lg:w-[210px]"><SelectValue /></SelectTrigger><SelectContent>
          <SelectItem value="all">Tất cả trạng thái</SelectItem><SelectItem value="open">Đang đăng ký</SelectItem><SelectItem value="expiring">Sắp hết hạn</SelectItem><SelectItem value="expired">Đã hết hạn</SelectItem><SelectItem value="waiting_result">Chờ kết quả</SelectItem><SelectItem value="registered">Đã đăng ký</SelectItem><SelectItem value="won">Đã trúng</SelectItem><SelectItem value="lost">Đã trượt</SelectItem>
        </SelectContent></Select>
      </div>

      {isLoading ? <div className="py-16 text-center text-sm text-muted-foreground">Đang tải Chyusen...</div> : filteredEntries.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-14 text-center"><Ticket className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" /><h2 className="font-semibold">Chưa có chương trình Chyusen</h2><p className="mt-1 text-sm text-muted-foreground">Dán link công khai của shop hoặc bài công bố chính thức để bắt đầu.</p><Button variant="outline" className="mt-4" onClick={openNew}>Thêm Chyusen</Button></CardContent></Card>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredEntries.map((entry: any) => (
            <Card key={entry.id} className="overflow-hidden"><CardHeader className="space-y-3 pb-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="truncate text-lg">{entry.title}</CardTitle><CardDescription className="mt-1 truncate">{entry.shop || "Khác"} · {entry.productType} · {entry.series || "Pokemon"}</CardDescription></div><div className="flex shrink-0 flex-col items-end gap-1">{timeBadge(entry.timeState)}{participationBadge(entry.applicationStatus)}</div></div></CardHeader>
              <CardContent className="space-y-4"><div className="grid grid-cols-2 gap-3 text-sm"><div className="rounded-lg bg-secondary/55 p-3"><p className="text-xs text-muted-foreground">Hết hạn đăng ký</p><p className="mt-1 font-medium">{displayDate(entry.applicationEnd)}</p></div><div className="rounded-lg bg-secondary/55 p-3"><p className="text-xs text-muted-foreground">Công bố kết quả</p><p className="mt-1 font-medium">{displayDate(entry.resultDate)}</p></div></div>
                {entry.urgency && entry.applicationStatus !== "registered" && <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"><Clock3 className="h-4 w-4" />{entry.urgency === "deadline_3h" ? "Sắp hết hạn trong 3 giờ" : entry.urgency === "deadline_24h" ? "Sắp hết hạn trong 24 giờ" : "Sắp hết hạn trong 72 giờ"}</div>}
                <div className="flex flex-wrap gap-2">
                  {entry.sourceUrl && <Button variant="outline" size="sm" asChild><a href={entry.sourceUrl} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Mở website</a></Button>}
                  {entry.applicationStatus === "not_registered" && <Button variant="outline" size="sm" onClick={() => setParticipation.mutate({ id: entry.id, applicationStatus: "registered" })}><CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />Đã đăng ký</Button>}
                  {entry.applicationStatus === "registered" && <Button variant="outline" size="sm" className="border-violet-200 text-violet-800 hover:bg-violet-50" onClick={() => setParticipation.mutate({ id: entry.id, applicationStatus: "won" })}><Trophy className="mr-1.5 h-3.5 w-3.5" />Đã trúng</Button>}
                  {entry.applicationStatus === "registered" && <Button variant="outline" size="sm" onClick={() => setParticipation.mutate({ id: entry.id, applicationStatus: "lost" })}><XCircle className="mr-1.5 h-3.5 w-3.5" />Đã trượt</Button>}
                  {entry.applicationStatus === "won" && !entry.purchaseCreatedAt && <Button size="sm" className="bg-red-600 text-white hover:bg-red-700" onClick={() => purchaseDraft.mutate({ id: entry.id })}><Gift className="mr-1.5 h-3.5 w-3.5" />Thêm vào Mua Hàng</Button>}
                  <Button variant="ghost" size="sm" onClick={() => openEdit(entry)}><Pencil className="mr-1.5 h-3.5 w-3.5" />Sửa</Button><Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteId(entry.id)}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Xóa</Button>
                </div></CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) { setEditingId(null); setDraft(EMPTY_DRAFT); } }}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto"><DialogHeader><DialogTitle>{editingId ? "Sửa 抽選" : "Thêm 抽選"}</DialogTitle><DialogDescription>URL là tùy chọn: dán link để tự động điền khi đọc được, hoặc nhập thủ công và lưu trực tiếp.</DialogDescription></DialogHeader>
          <div className="space-y-5 py-2"><div className="rounded-lg border border-border bg-secondary/30 p-4"><Label>Link website 抽選 <span className="font-normal text-muted-foreground">(tùy chọn)</span></Label><div className="mt-2 flex flex-col gap-2 sm:flex-row"><Input value={draft.sourceUrl} onChange={(event) => updateDraft("sourceUrl", event.target.value)} placeholder="https://..." /><Button type="button" variant="outline" disabled={!draft.sourceUrl || previewUrl.isPending} onClick={() => previewUrl.mutate({ sourceUrl: draft.sourceUrl })}><Link2 className="mr-2 h-4 w-4" />{previewUrl.isPending ? "Đang đọc..." : "Đọc thông tin"}</Button></div><p className="mt-2 text-xs text-muted-foreground">Nếu link không đọc được, hệ thống sẽ để trống URL để bạn tiếp tục nhập tay và lưu bình thường.</p></div>
            {draft.parserNote && <div className={`rounded-lg border px-3 py-2 text-sm ${draft.parserStatus === "unavailable" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{draft.parserNote}</div>}
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Tên chương trình"><Input value={draft.title} onChange={(event) => updateDraft("title", event.target.value)} /></Field><Field label="Tên sản phẩm"><Input value={draft.productName} onChange={(event) => updateDraft("productName", event.target.value)} /></Field><Field label="Series"><Select value={draft.series} onValueChange={(value) => updateDraft("series", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Pokemon">Pokémon</SelectItem><SelectItem value="One Piece">One Piece</SelectItem><SelectItem value="Other">Khác</SelectItem></SelectContent></Select></Field><Field label="Loại sản phẩm"><Select value={draft.productType} onValueChange={(value) => updateDraft("productType", value as Draft["productType"])}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="card">Card</SelectItem><SelectItem value="box">Box</SelectItem><SelectItem value="pack">Pack</SelectItem><SelectItem value="set">Set</SelectItem><SelectItem value="other">Khác</SelectItem></SelectContent></Select></Field><Field label="Cửa hàng"><Select value={draft.shop} onValueChange={(value) => updateDraft("shop", value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SHOPS.map((shop) => <SelectItem key={shop} value={shop}>{shop}</SelectItem>)}</SelectContent></Select></Field>{draft.shop === "Khác" && <Field label="Tên cửa hàng thực tế"><Input value={draft.customShopName} onChange={(event) => updateDraft("customShopName", event.target.value)} /></Field>}<Field label="Product ID (nếu có)"><Input value={draft.externalProductId} onChange={(event) => updateDraft("externalProductId", event.target.value)} placeholder="VD: 1000255803" /></Field><Field label="Giá (¥)"><Input type="number" min="0" value={draft.price} onChange={(event) => updateDraft("price", event.target.value)} /></Field><Field label="Giới hạn số lượng"><Input value={draft.quantityLimit} onChange={(event) => updateDraft("quantityLimit", event.target.value)} placeholder="VD: 1 Box / người" /></Field><Field label="Bắt đầu đăng ký"><Input type="datetime-local" value={draft.applicationStart} onChange={(event) => updateDraft("applicationStart", event.target.value)} /></Field><Field label="Hết hạn đăng ký"><Input type="datetime-local" value={draft.applicationEnd} onChange={(event) => updateDraft("applicationEnd", event.target.value)} /></Field><Field label="Công bố kết quả"><Input type="datetime-local" value={draft.resultDate} onChange={(event) => updateDraft("resultDate", event.target.value)} /></Field><Field label="Nhận hàng bắt đầu"><Input type="datetime-local" value={draft.pickupStart} onChange={(event) => updateDraft("pickupStart", event.target.value)} /></Field><Field label="Nhận hàng kết thúc"><Input type="datetime-local" value={draft.pickupEnd} onChange={(event) => updateDraft("pickupEnd", event.target.value)} /></Field><Field label="Ảnh sản phẩm (URL)"><Input value={draft.imageUrl} onChange={(event) => updateDraft("imageUrl", event.target.value)} /></Field></div>
            <Field label="Điều kiện tham gia"><Textarea value={draft.requirements} onChange={(event) => updateDraft("requirements", event.target.value)} placeholder="VD: Thành viên Joshin, yêu cầu đăng nhập..." /></Field>
            {Object.keys(draft.fieldConfidence).length > 0 && <div className="rounded-lg border border-border p-3"><p className="mb-2 text-sm font-medium">Độ tin cậy dữ liệu</p><div className="flex flex-wrap gap-2">{Object.entries(draft.fieldConfidence).map(([field, value]) => <Badge key={field} variant="outline" className={value === "detected" ? "border-emerald-300 bg-emerald-50 text-emerald-800" : value === "needs_review" ? "border-amber-300 bg-amber-50 text-amber-900" : "border-slate-300 bg-slate-50 text-slate-700"}>{field}: {value === "detected" ? "đã nhận diện" : value === "needs_review" ? "cần kiểm tra" : "thiếu"}</Badge>)}</div></div>}
            <Button className="w-full bg-red-600 text-white hover:bg-red-700" onClick={submit} disabled={create.isPending || update.isPending}>{create.isPending || update.isPending ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Lưu 抽選"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa chương trình Chyusen?</AlertDialogTitle><AlertDialogDescription>Hành động này xóa Chyusen và các thông báo/lịch sử liên quan trong tài khoản của bạn.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteId && remove.mutate({ id: deleteId })}>Xóa</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>

      <Dialog open={showSourceDialog} onOpenChange={(open) => { setShowSourceDialog(open); if (!open) setEditingSourceId(null); }}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>{editingSourceId ? "Sửa nguồn theo dõi" : "Thêm nguồn theo dõi"}</DialogTitle><DialogDescription>Chỉ thêm URL công khai. Bạn có thể sửa tên nguồn, URL, trạng thái và tần suất khi nhập sai.</DialogDescription></DialogHeader><div className="space-y-4 py-2"><Field label="Tên cửa hàng / nguồn"><Input value={sourceDraft.label} onChange={(event) => setSourceDraft((current) => ({ ...current, label: event.target.value }))} placeholder="VD: Joshin" /></Field><Field label="URL công khai"><Input value={sourceDraft.sourceUrl} onChange={(event) => setSourceDraft((current) => ({ ...current, sourceUrl: event.target.value }))} placeholder="https://..." /></Field><Field label="Tần suất kiểm tra"><Select value={String(sourceDraft.checkIntervalMinutes)} onValueChange={(value) => setSourceDraft((current) => ({ ...current, checkIntervalMinutes: Number(value) as 60 | 180 | 360 | 720 | 1440 }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="60">1 giờ</SelectItem><SelectItem value="180">3 giờ</SelectItem><SelectItem value="360">6 giờ</SelectItem><SelectItem value="720">12 giờ</SelectItem><SelectItem value="1440">24 giờ</SelectItem></SelectContent></Select></Field>{editingSourceId && <div className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">Bật theo dõi</p><p className="text-xs text-muted-foreground">Nguồn tắt sẽ không được kiểm tra tự động.</p></div><Switch checked={sourceDraft.isActive} onCheckedChange={(checked) => setSourceDraft((current) => ({ ...current, isActive: checked }))} /></div>}<Button className="w-full bg-red-600 text-white hover:bg-red-700" disabled={!sourceDraft.sourceUrl || createSource.isPending || updateSource.isPending} onClick={saveSource}>{createSource.isPending || updateSource.isPending ? "Đang lưu..." : editingSourceId ? "Lưu thay đổi" : "Lưu nguồn"}</Button></div></DialogContent></Dialog>
      <AlertDialog open={deleteSourceId !== null} onOpenChange={(open) => !open && setDeleteSourceId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa nguồn theo dõi?</AlertDialogTitle><AlertDialogDescription>Nguồn sẽ không còn được kiểm tra tự động. Các Chyusen và audit log đã lưu của bạn vẫn được giữ nguyên.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteSource.isPending} onClick={() => deleteSourceId && deleteSource.mutate({ id: deleteSourceId })}>{deleteSource.isPending ? "Đang xóa..." : "Xóa nguồn"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
