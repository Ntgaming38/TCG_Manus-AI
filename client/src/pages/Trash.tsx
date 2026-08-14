import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, ChevronLeft, DollarSign, FilterX, Package, Radio, RotateCcw, Search, ShoppingCart, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

const TYPES = {
  product: { label: "Sản phẩm", icon: Package, className: "border-sky-300 bg-sky-50 text-sky-900" },
  purchase: { label: "Mua hàng", icon: ShoppingCart, className: "border-emerald-300 bg-emerald-50 text-emerald-900" },
  sale: { label: "Bán hàng", icon: DollarSign, className: "border-amber-300 bg-amber-50 text-amber-900" },
  chyusen: { label: "抽選", icon: Ticket, className: "border-red-300 bg-red-50 text-red-900" },
  source: { label: "Nguồn theo dõi", icon: Radio, className: "border-violet-300 bg-violet-50 text-violet-900" },
  notification: { label: "Thông báo", icon: Bell, className: "border-slate-300 bg-slate-50 text-slate-900" },
} as const;

type TrashType = keyof typeof TYPES;

function formatDeletedAt(value: Date | string) {
  return new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" });
}

function deletedDateKey(value: Date | string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export default function Trash() {
  const [filter, setFilter] = useState<"all" | TrashType>("all");
  const [search, setSearch] = useState("");
  const [deletedDate, setDeletedDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const { data: items = [], isLoading } = trpc.trash.list.useQuery();
  const utils = trpc.useUtils();
  const invalidateRestoredData = () => {
    utils.trash.list.invalidate();
    utils.products.list.invalidate();
    utils.purchases.list.invalidate();
    utils.sales.list.invalidate();
    utils.chyusen.list.invalidate();
    utils.chyusen.sources.invalidate();
    utils.chyusen.notifications.invalidate();
    utils.dashboard.stats.invalidate();
  };
  const restore = trpc.trash.restore.useMutation({
    onSuccess: (data) => { toast.success(`Đã khôi phục ${data.title}.`); invalidateRestoredData(); },
    onError: (error) => toast.error(error.message),
  });
  const restoreMany = trpc.trash.restoreMany.useMutation({
    onSuccess: ({ restoredCount }) => { toast.success(`Đã khôi phục ${restoredCount} mục đã chọn.`); setSelectedIds([]); invalidateRestoredData(); },
    onError: (error) => toast.error(error.message),
  });
  const emptyTrash = trpc.trash.empty.useMutation({
    onSuccess: ({ purgedCount }) => { toast.success(purgedCount ? `Đã xóa vĩnh viễn ${purgedCount} mục trong Thùng rác.` : "Thùng rác đã trống."); setSelectedIds([]); utils.trash.list.invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const purgeMany = trpc.trash.purgeMany.useMutation({
    onSuccess: ({ purgedCount }) => { toast.success(`Đã xóa vĩnh viễn ${purgedCount} mục đã chọn.`); setSelectedIds([]); utils.trash.list.invalidate(); },
    onError: (error) => toast.error(error.message),
  });

  const hasFilters = filter !== "all" || Boolean(search.trim()) || Boolean(deletedDate);
  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi-VN");
    return items.filter((item) => {
      const config = TYPES[item.entityType as TrashType] || TYPES.product;
      return (filter === "all" || item.entityType === filter)
        && (!keyword || item.title.toLocaleLowerCase("vi-VN").includes(keyword) || config.label.toLocaleLowerCase("vi-VN").includes(keyword))
        && (!deletedDate || deletedDateKey(item.deletedAt) === deletedDate);
    });
  }, [deletedDate, filter, items, search]);
  const visibleIds = useMemo(() => filteredItems.map((item) => item.id), [filteredItems]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedSet.has(id));

  useEffect(() => setSelectedIds((current) => {
    const next = current.filter((id) => items.some((item) => item.id === id));
    return next.length === current.length ? current : next;
  }), [items]);

  const clearFilters = () => { setFilter("all"); setSearch(""); setDeletedDate(""); };
  const toggleSelected = (id: number, checked: boolean) => setSelectedIds((current) => checked ? Array.from(new Set([...current, id])) : current.filter((selectedId) => selectedId !== id));
  const toggleAllVisible = (checked: boolean) => setSelectedIds((current) => checked ? Array.from(new Set([...current, ...visibleIds])) : current.filter((id) => !visibleIds.includes(id)));

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-2 flex items-center gap-2 text-red-600"><Trash2 className="h-5 w-5" /><span className="text-sm font-bold uppercase tracking-[0.16em]">Khôi phục dữ liệu</span></div><h1 className="text-3xl font-black tracking-tight">Thùng rác</h1><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Các mục bạn xóa từ sản phẩm, giao dịch, 抽選, nguồn theo dõi và thông báo sẽ nằm ở đây để có thể khôi phục.</p></div><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" disabled={!items.length || emptyTrash.isPending}><Trash2 className="mr-2 h-4 w-4" />Làm sạch thùng rác</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa vĩnh viễn toàn bộ Thùng rác?</AlertDialogTitle><AlertDialogDescription>Thao tác này xóa vĩnh viễn tất cả mục đang nằm trong Thùng rác và không thể hoàn tác.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => emptyTrash.mutate({ confirmed: true })}>Xóa vĩnh viễn</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></header>

        <Card className="border-red-200 bg-red-50/60 dark:border-red-900/60 dark:bg-red-950/20"><CardContent className="flex gap-3 p-4 text-sm text-red-900 dark:text-red-100"><ChevronLeft className="mt-0.5 h-4 w-4 shrink-0" /><p>Khôi phục sẽ đưa dữ liệu về trạng thái ngay trước khi xóa. Dữ liệu phụ thuộc như giao dịch mua/bán của sản phẩm cũng được khôi phục cùng bản ghi liên quan.</p></CardContent></Card>

        <section className="space-y-3 rounded-2xl border border-border bg-card/70 p-3 shadow-sm"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên mục hoặc loại dữ liệu..." className="pl-9" aria-label="Tìm trong Thùng rác" /></div><div className="grid grid-cols-2 gap-2 sm:flex sm:items-center"><Select value={filter} onValueChange={(value) => setFilter(value as "all" | TrashType)}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Lọc loại dữ liệu" /></SelectTrigger><SelectContent><SelectItem value="all">Tất cả dữ liệu</SelectItem>{Object.entries(TYPES).map(([key, config]) => <SelectItem key={key} value={key}>{config.label}</SelectItem>)}</SelectContent></Select><div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="date" value={deletedDate} onChange={(event) => setDeletedDate(event.target.value)} className="w-full pl-9 sm:w-44" aria-label="Lọc theo ngày xóa" /></div></div></div>{hasFilters && <div className="flex items-center justify-between gap-3 border-t border-border pt-3 text-xs"><span className="text-muted-foreground">Đang lọc {filteredItems.length} mục theo điều kiện đã chọn.</span><Button size="sm" variant="ghost" onClick={clearFilters}><FilterX className="mr-1.5 h-3.5 w-3.5" />Xóa bộ lọc</Button></div>}</section>

        {selectedIds.length > 0 && <section className="sticky top-3 z-10 flex flex-col gap-3 rounded-xl border border-red-500/30 bg-card/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold">Đã chọn {selectedIds.length} mục</p><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => restoreMany.mutate({ ids: selectedIds })} disabled={restoreMany.isPending || purgeMany.isPending}><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Khôi phục đã chọn</Button><AlertDialog><AlertDialogTrigger asChild><Button size="sm" variant="destructive" disabled={restoreMany.isPending || purgeMany.isPending}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Xóa vĩnh viễn</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa vĩnh viễn {selectedIds.length} mục đã chọn?</AlertDialogTitle><AlertDialogDescription>Các mục đã chọn sẽ không thể khôi phục sau thao tác này.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => purgeMany.mutate({ ids: selectedIds, confirmed: true })}>Xóa vĩnh viễn</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog><Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Bỏ chọn</Button></div></section>}

        <section className="space-y-3"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Checkbox id="select-all-trash" checked={allVisibleSelected} onCheckedChange={(checked) => toggleAllVisible(checked === true)} disabled={!visibleIds.length} aria-label="Chọn tất cả mục đang hiển thị" /><label htmlFor="select-all-trash" className="cursor-pointer text-sm font-bold">Mục đã xóa</label></div><span className="text-sm text-muted-foreground">{filteredItems.length} mục</span></div>{isLoading ? <div className="grid gap-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div> : filteredItems.length === 0 ? <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center"><CheckCircle2 className="h-10 w-10 text-emerald-500" /><div><p className="font-bold">{items.length ? "Không tìm thấy mục phù hợp" : "Thùng rác đang trống"}</p><p className="mt-1 text-sm text-muted-foreground">{items.length ? "Thử thay đổi từ khóa hoặc ngày xóa." : "Các mục đã xóa sẽ xuất hiện tại đây để bạn khôi phục khi cần."}</p></div></CardContent></Card> : <div className="grid gap-3">{filteredItems.map((item) => { const config = TYPES[item.entityType as TrashType] || TYPES.product; const Icon = config.icon; const selected = selectedSet.has(item.id); return <Card key={item.id} className={`transition-all ${selected ? "border-red-400/60 bg-red-50/40 shadow-sm dark:bg-red-950/20" : "hover:shadow-md"}`}><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-start gap-3"><Checkbox checked={selected} onCheckedChange={(checked) => toggleSelected(item.id, checked === true)} aria-label={`Chọn ${item.title}`} className="mt-1" /><div className="rounded-lg bg-muted p-2"><Icon className="h-5 w-5" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold">{item.title}</p><Badge variant="outline" className={config.className}>{config.label}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Đã xóa {formatDeletedAt(item.deletedAt)}</p></div></div><Button className="w-full sm:w-auto" onClick={() => restore.mutate({ id: item.id })} disabled={restore.isPending || restoreMany.isPending}><RotateCcw className="mr-2 h-4 w-4" />Khôi phục</Button></CardContent></Card>; })}</div>}</section>
      </div>
    </main>
  );
}
