import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { CalendarDays, Clock3, ExternalLink, Link2, Pencil, Plus, Search, Trash2, Trophy, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { getChyusenTimelineStatus } from "../../../shared/chyusen";

type ResultStatus = "pending" | "won" | "lost" | "not_entered" | "cancelled";
type FilterStatus = "all" | "open" | "deadline" | "expired" | "result";
type FormState = { title: string; productName: string; sourceName: string; sourceUrl: string; registrationStartAt: string; registrationDeadline: string; drawAt: string; resultStatus: ResultStatus; notes: string };

const emptyForm: FormState = { title: "", productName: "", sourceName: "", sourceUrl: "", registrationStartAt: "", registrationDeadline: "", drawAt: "", resultStatus: "pending", notes: "" };

function toLocalInput(value: Date | string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
function fromLocalInput(value: string) { return value ? new Date(value) : undefined; }
function formatDate(value: Date | string | null | undefined) { return value ? new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" }) : "Chưa đặt"; }

type EntryDateFields = { registrationStartAt: Date | string | null; registrationDeadline: Date | string | null; drawAt: Date | string | null; resultStatus: ResultStatus };
const getTimelineStatus = getChyusenTimelineStatus;

function TimelineBadge({ entry }: { entry: EntryDateFields }) {
  const timeline = getTimelineStatus(entry);
  if (timeline === "result") {
    const map: Record<ResultStatus, { label: string; className: string }> = {
      pending: { label: "Chờ kết quả", className: "bg-amber-100 text-amber-800" }, won: { label: "Đã trúng", className: "bg-emerald-100 text-emerald-800" }, lost: { label: "Không trúng", className: "bg-slate-100 text-slate-700" }, not_entered: { label: "Không tham gia", className: "bg-slate-100 text-slate-700" }, cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
    };
    return <Badge className={map[entry.resultStatus].className}>{map[entry.resultStatus].label}</Badge>;
  }
  const map = { upcoming: { label: "Sắp mở", className: "bg-indigo-100 text-indigo-700" }, open: { label: "Đang mở", className: "bg-emerald-100 text-emerald-700" }, deadline: { label: "Sắp hết hạn", className: "bg-orange-100 text-orange-700" }, expired: { label: "Đã hết hạn", className: "bg-red-100 text-red-700" }, draw_pending: { label: "Chờ quay số", className: "bg-amber-100 text-amber-800" } } as const;
  return <Badge className={map[timeline].className}>{map[timeline].label}</Badge>;
}

export default function Chyusen() {
  const utils = trpc.useUtils();
  const { data: entries = [], isLoading } = trpc.chyusen.list.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");

  function resetForm() { setEditingId(null); setForm(emptyForm); }
  const createMutation = trpc.chyusen.create.useMutation({ onSuccess: () => { toast.success("Đã thêm chương trình Chyusen"); setDialogOpen(false); resetForm(); void utils.chyusen.list.invalidate(); }, onError: (error) => toast.error(error.message) });
  const updateMutation = trpc.chyusen.update.useMutation({ onSuccess: () => { toast.success("Đã cập nhật chương trình"); setDialogOpen(false); resetForm(); void utils.chyusen.list.invalidate(); }, onError: (error) => toast.error(error.message) });
  const deleteMutation = trpc.chyusen.delete.useMutation({ onSuccess: () => { toast.success("Đã xóa chương trình"); void utils.chyusen.list.invalidate(); }, onError: (error) => toast.error(error.message) });

  function openCreate() { resetForm(); setDialogOpen(true); }
  function openEdit(entry: (typeof entries)[number]) {
    setEditingId(entry.id);
    setForm({ title: entry.title, productName: entry.productName ?? "", sourceName: entry.sourceName ?? "", sourceUrl: entry.sourceUrl ?? "", registrationStartAt: toLocalInput(entry.registrationStartAt), registrationDeadline: toLocalInput(entry.registrationDeadline), drawAt: toLocalInput(entry.drawAt), resultStatus: entry.resultStatus, notes: entry.notes ?? "" });
    setDialogOpen(true);
  }
  function submitForm(event: FormEvent) {
    event.preventDefault();
    if (!form.title.trim()) { toast.error("Vui lòng nhập tên chương trình"); return; }
    const payload = { title: form.title.trim(), productName: form.productName.trim() || undefined, sourceName: form.sourceName.trim() || undefined, sourceUrl: form.sourceUrl.trim() || undefined, registrationStartAt: fromLocalInput(form.registrationStartAt), registrationDeadline: fromLocalInput(form.registrationDeadline), drawAt: fromLocalInput(form.drawAt), resultStatus: form.resultStatus, notes: form.notes.trim() || undefined };
    if (editingId) updateMutation.mutate({ id: editingId, ...payload }); else createMutation.mutate(payload);
  }
  function handleDelete(id: number, title: string) { if (window.confirm(`Bạn có chắc muốn xóa chương trình “${title}”?`)) deleteMutation.mutate({ id }); }

  const filteredEntries = useMemo(() => entries.filter((entry) => {
    const haystack = `${entry.title} ${entry.productName ?? ""} ${entry.sourceName ?? ""}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    if (filter === "all") return true;
    const timeline = getTimelineStatus(entry);
    if (filter === "open") return timeline === "open" || timeline === "upcoming" || timeline === "deadline";
    if (filter === "deadline") return timeline === "deadline";
    if (filter === "expired") return timeline === "expired";
    return timeline === "result";
  }), [entries, filter, query]);
  const metrics = useMemo(() => ({ total: entries.length, open: entries.filter((entry) => { const status = getTimelineStatus(entry); return status === "open" || status === "upcoming" || status === "deadline"; }).length, deadline: entries.filter((entry) => getTimelineStatus(entry) === "deadline").length, won: entries.filter((entry) => entry.resultStatus === "won").length }), [entries]);
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }));

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">抽選 Tracker</p><h1 className="mt-1 text-3xl font-black tracking-tight text-foreground">Chyusen</h1><p className="mt-2 text-sm text-muted-foreground">Theo dõi chương trình quay số, hạn đăng ký và kết quả từ website/app bên ngoài.</p></div><Button onClick={openCreate} className="bg-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Thêm chương trình</Button></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><MetricCard label="Tổng chương trình" value={metrics.total} icon={<CalendarDays className="h-4 w-4" />} tone="blue" /><MetricCard label="Đang theo dõi" value={metrics.open} icon={<Clock3 className="h-4 w-4" />} tone="green" /><MetricCard label="Sắp hết hạn (3 ngày)" value={metrics.deadline} icon={<XCircle className="h-4 w-4" />} tone="amber" /><MetricCard label="Đã trúng" value={metrics.won} icon={<Trophy className="h-4 w-4" />} tone="red" /></div>
    <Card className="border-border shadow-sm"><CardContent className="space-y-3 p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="relative w-full lg:max-w-md"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm chương trình, sản phẩm, website..." className="pl-9" /></div><div className="flex flex-wrap gap-2">{([['all', `Tất cả (${metrics.total})`], ['open', `Đang mở (${metrics.open})`], ['deadline', `Sắp hết hạn (${metrics.deadline})`], ['expired', "Đã hết hạn"], ['result', "Có kết quả"]] as const).map(([value, label]) => <Button key={value} size="sm" variant={filter === value ? "default" : "outline"} onClick={() => setFilter(value)} className={filter === value ? "bg-primary text-primary-foreground" : ""}>{label}</Button>)}</div></div></CardContent></Card>
    {isLoading ? <Card><CardContent className="p-10 text-center text-sm text-muted-foreground">Đang tải danh sách Chyusen...</CardContent></Card> : filteredEntries.length === 0 ? <Card className="border-dashed"><CardContent className="flex flex-col items-center justify-center gap-3 p-12 text-center"><div className="rounded-full bg-red-50 p-4 text-primary"><CalendarDays className="h-8 w-8" /></div><h2 className="text-lg font-bold">Chưa có chương trình phù hợp</h2><p className="max-w-md text-sm text-muted-foreground">Thêm chương trình quay số từ website/app để theo dõi ngày đăng ký và hạn tham gia.</p><Button onClick={openCreate} className="bg-primary text-primary-foreground"><Plus className="mr-2 h-4 w-4" /> Thêm chương trình đầu tiên</Button></CardContent></Card> : <div className="grid gap-4 xl:grid-cols-2">{filteredEntries.map((entry) => <Card key={entry.id} className="border-border shadow-sm transition-shadow hover:shadow-md"><CardHeader className="space-y-3 pb-3"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><CardTitle className="truncate text-lg">{entry.title}</CardTitle><p className="mt-1 truncate text-sm text-muted-foreground">{entry.productName || "Chưa gắn sản phẩm"}{entry.sourceName ? ` · ${entry.sourceName}` : ""}</p></div><TimelineBadge entry={entry} /></div></CardHeader><CardContent className="space-y-4 pt-0"><div className="grid gap-3 rounded-lg bg-muted/40 p-3 sm:grid-cols-3"><DateInfo label="Mở đăng ký" value={entry.registrationStartAt} /><DateInfo label="Hạn đăng ký" value={entry.registrationDeadline} emphasize /><DateInfo label="Ngày quay số" value={entry.drawAt} /></div>{entry.notes && <p className="line-clamp-2 text-sm text-muted-foreground">{entry.notes}</p>}<div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">{entry.sourceUrl ? <><Link2 className="h-3.5 w-3.5 shrink-0" /><a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">Mở website/app chương trình <ExternalLink className="ml-1 inline h-3 w-3" /></a></> : <span>Chưa có link chương trình</span>}</div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => openEdit(entry)}><Pencil className="mr-1.5 h-3.5 w-3.5" /> Sửa</Button><Button size="sm" variant="outline" onClick={() => handleDelete(entry.id, entry.title)} className="text-red-600 hover:bg-red-50 hover:text-red-700"><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Xóa</Button></div></div></CardContent></Card>)}</div>}
    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{editingId ? "Sửa chương trình Chyusen" : "Thêm chương trình Chyusen"}</DialogTitle><DialogDescription>Nhập thông tin công khai. TCG Manager không tự động đăng ký hoặc truy cập tài khoản ứng dụng bên ngoài.</DialogDescription></DialogHeader><form onSubmit={submitForm} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label htmlFor="chyusen-title">Tên chương trình *</Label><Input id="chyusen-title" value={form.title} onChange={(event) => setField("title", event.target.value)} placeholder="Ví dụ: Pokémon Center抽選 Mega Dream ex" required /></div><div className="space-y-2"><Label htmlFor="chyusen-product">Sản phẩm</Label><Input id="chyusen-product" value={form.productName} onChange={(event) => setField("productName", event.target.value)} placeholder="Tên Card / Box / Pack" /></div><div className="space-y-2"><Label htmlFor="chyusen-source">Website/App</Label><Input id="chyusen-source" value={form.sourceName} onChange={(event) => setField("sourceName", event.target.value)} placeholder="Pokémon Center, SNKRDUNK..." /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="chyusen-url">Link chương trình</Label><Input id="chyusen-url" type="url" value={form.sourceUrl} onChange={(event) => setField("sourceUrl", event.target.value)} placeholder="https://..." /></div><div className="space-y-2"><Label htmlFor="chyusen-start">Mở đăng ký</Label><Input id="chyusen-start" type="datetime-local" value={form.registrationStartAt} onChange={(event) => setField("registrationStartAt", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="chyusen-deadline">Hạn đăng ký</Label><Input id="chyusen-deadline" type="datetime-local" value={form.registrationDeadline} onChange={(event) => setField("registrationDeadline", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="chyusen-draw">Ngày quay số/kết quả</Label><Input id="chyusen-draw" type="datetime-local" value={form.drawAt} onChange={(event) => setField("drawAt", event.target.value)} /></div><div className="space-y-2"><Label htmlFor="chyusen-result">Kết quả</Label><select id="chyusen-result" value={form.resultStatus} onChange={(event) => setField("resultStatus", event.target.value as ResultStatus)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"><option value="pending">Chờ kết quả</option><option value="won">Đã trúng</option><option value="lost">Không trúng</option><option value="not_entered">Không tham gia</option><option value="cancelled">Đã hủy</option></select></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="chyusen-notes">Ghi chú</Label><Textarea id="chyusen-notes" value={form.notes} onChange={(event) => setField("notes", event.target.value)} placeholder="Điều kiện, số lượng, tài khoản/app cần dùng..." rows={3} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button><Button type="submit" disabled={isSaving} className="bg-primary text-primary-foreground">{isSaving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm chương trình"}</Button></DialogFooter></form></DialogContent></Dialog>
  </div>;
}

function DateInfo({ label, value, emphasize }: { label: string; value: Date | string | null; emphasize?: boolean }) { return <div><p className="text-[11px] text-muted-foreground">{label}</p><p className={`mt-1 text-sm font-semibold ${emphasize ? "text-primary" : "text-foreground"}`}>{formatDate(value)}</p></div>; }
function MetricCard({ label, value, icon, tone }: { label: string; value: number; icon: ReactNode; tone: "blue" | "green" | "amber" | "red" }) { const styles = { blue: "border-blue-200 bg-blue-50 text-blue-700", green: "border-emerald-200 bg-emerald-50 text-emerald-700", amber: "border-amber-200 bg-amber-50 text-amber-700", red: "border-red-200 bg-red-50 text-red-700" }[tone]; return <Card className="border-border shadow-sm"><CardContent className="flex items-center justify-between p-4"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-black text-foreground">{value}</p></div><div className={`rounded-xl border p-3 ${styles}`}>{icon}</div></CardContent></Card>; }
