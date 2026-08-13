import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ArchiveRestore,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";

type HistoryFilter = "all" | "product" | "purchase" | "sale" | "shop";

const fieldLabels: Record<string, string> = {
  name: "Tên", type: "Loại", quantity: "Số lượng", damagedQuantity: "Số lượng hỏng",
  buyPrice: "Giá nhập", marketPrice: "Giá thị trường", sellPrice: "Giá bán",
  totalPrice: "Tổng tiền mua", totalRevenue: "Tổng doanh thu", salePrice: "Giá bán",
  profit: "Lợi nhuận", shop: "Cửa hàng", note: "Ghi chú", status: "Trạng thái",
  damageNote: "Ghi chú hàng hỏng", platform: "Nền tảng",
};

const filters: Array<{ value: HistoryFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "product", label: "Kho hàng" },
  { value: "purchase", label: "Mua hàng" },
  { value: "sale", label: "Bán hàng" },
  { value: "shop", label: "Cửa hàng" },
];

function getActionPresentation(action: string) {
  if (action.endsWith("_created")) return { label: "Đã thêm", icon: Plus, className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" };
  if (action.endsWith("_updated") || action === "market_price_updated" || action === "snkrdunk_url_updated") return { label: "Đã cập nhật", icon: Pencil, className: "border-sky-400/30 bg-sky-400/10 text-sky-300" };
  if (action.endsWith("_deleted")) return { label: "Đã xóa", icon: Trash2, className: "border-rose-400/30 bg-rose-400/10 text-rose-300" };
  if (action === "product_damaged") return { label: "Hàng hỏng", icon: ArchiveRestore, className: "border-amber-400/30 bg-amber-400/10 text-amber-300" };
  if (action.includes("synced")) return { label: "Đã đồng bộ", icon: TrendingUp, className: "border-violet-400/30 bg-violet-400/10 text-violet-300" };
  return { label: "Hoạt động", icon: Activity, className: "border-primary/30 bg-primary/10 text-primary" };
}

function getEntityIcon(entityType: string | null) {
  if (entityType === "purchase") return ShoppingBag;
  if (entityType === "sale") return TrendingUp;
  if (entityType === "shop") return Store;
  return Package;
}

function formatActivityTime(value: Date | string) {
  return new Date(value).toLocaleString("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function parseChangeValue(value: string | null) {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

function formatChangeValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Có" : "Không";
  return String(value);
}

export function getChangedFields(oldValue: string | null, newValue: string | null) {
  const before = parseChangeValue(oldValue);
  const after = parseChangeValue(newValue);
  return Array.from(new Set([...Object.keys(before), ...Object.keys(after)]))
    .filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
    .slice(0, 12)
    .map((key) => ({ key, before: before[key], after: after[key] }));
}

export default function ActivityHistory() {
  const [activeFilter, setActiveFilter] = useState<HistoryFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedActivityId, setExpandedActivityId] = useState<number | null>(null);
  const queryInput = useMemo(() => ({
    entityType: activeFilter === "all" ? undefined : activeFilter,
    search: search.trim() || undefined,
  }), [activeFilter, search]);
  const { data: activities = [], isLoading, isError, refetch } = trpc.activities.list.useQuery(queryInput);

  const additions = activities.filter((item) => item.action.endsWith("_created")).length;
  const updates = activities.filter((item) => item.action.endsWith("_updated") || item.action === "market_price_updated" || item.action === "snkrdunk_url_updated").length;
  const deletions = activities.filter((item) => item.action.endsWith("_deleted")).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Lịch Sử Hoạt Động</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Theo dõi các thao tác thêm, sửa, xóa và cập nhật dữ liệu trong tài khoản của bạn.</p>
        </div>
        <Badge variant="outline" className="w-fit border-primary/30 bg-primary/10 px-3 py-1.5 text-primary">
          {activities.length} hoạt động gần đây
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="bg-card neon-card"><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-emerald-500/10 p-2"><Plus className="h-4 w-4 text-emerald-300" /></div><div><p className="text-xs text-muted-foreground">Đã thêm</p><p className="text-xl font-bold">{additions}</p></div></CardContent></Card>
        <Card className="bg-card neon-card"><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-sky-500/10 p-2"><Pencil className="h-4 w-4 text-sky-300" /></div><div><p className="text-xs text-muted-foreground">Đã cập nhật</p><p className="text-xl font-bold">{updates}</p></div></CardContent></Card>
        <Card className="bg-card neon-card"><CardContent className="flex items-center gap-3 p-4"><div className="rounded-lg bg-rose-500/10 p-2"><Trash2 className="h-4 w-4 text-rose-300" /></div><div><p className="text-xs text-muted-foreground">Đã xóa</p><p className="text-xl font-bold">{deletions}</p></div></CardContent></Card>
      </div>

      <Card className="bg-card neon-card">
        <CardHeader className="gap-4 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">Nhật ký sử dụng</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm theo nội dung..." className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2" aria-label="Lọc lịch sử theo nhóm dữ liệu">
            {filters.map((filter) => (
              <Button key={filter.value} size="sm" variant={activeFilter === filter.value ? "default" : "outline"} onClick={() => setActiveFilter(filter.value)}>
                {filter.label}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải lịch sử...</div>
          ) : isError ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center"><p className="text-sm text-muted-foreground">Không thể tải lịch sử hoạt động. Vui lòng thử lại.</p><Button variant="outline" size="sm" onClick={() => refetch()}>Tải lại</Button></div>
          ) : activities.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center"><div className="rounded-full bg-secondary/60 p-3"><CheckCircle2 className="h-5 w-5 text-muted-foreground" /></div><div><p className="text-sm font-medium">Chưa có hoạt động phù hợp</p><p className="mt-1 text-xs text-muted-foreground">Các thao tác thêm, sửa, xóa và cập nhật sẽ được lưu tại đây.</p></div></div>
          ) : (
            <div className="divide-y divide-border/60 rounded-xl border border-border/60 bg-secondary/10">
              {activities.map((item) => {
                const presentation = getActionPresentation(item.action);
                const ActionIcon = presentation.icon;
                const EntityIcon = getEntityIcon(item.entityType);
                const changes = getChangedFields(item.oldValue, item.newValue);
                const isExpanded = expandedActivityId === item.id;
                return (
                  <div key={item.id} className="transition-colors hover:bg-secondary/40">
                    <div className="flex items-start gap-3 px-4 py-3.5">
                      <div className="mt-0.5 rounded-lg bg-background p-2 shadow-sm"><EntityIcon className="h-4 w-4 text-primary" /></div>
                      <div className="min-w-0 flex-1"><p className="text-sm font-medium leading-5 text-foreground">{item.description || "Hoạt động trong hệ thống"}</p><p className="mt-1 text-xs text-muted-foreground">{formatActivityTime(item.createdAt)}</p></div>
                      <div className="flex shrink-0 items-center gap-2">
                        {changes.length > 0 && <Button variant="ghost" size="sm" onClick={() => setExpandedActivityId(isExpanded ? null : item.id)} className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"><span className="hidden md:inline">Chi tiết</span>{isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</Button>}
                        <Badge variant="outline" className={`hidden shrink-0 items-center gap-1 sm:inline-flex ${presentation.className}`}><ActionIcon className="h-3 w-3" />{presentation.label}</Badge>
                      </div>
                    </div>
                    {isExpanded && changes.length > 0 && (
                      <div className="mx-4 mb-4 overflow-hidden rounded-lg border border-border/60 bg-background/60">
                        <div className="grid grid-cols-[minmax(90px,0.8fr)_1fr_1fr] gap-px bg-border/60 text-xs">
                          <div className="bg-secondary/40 px-3 py-2 font-medium text-muted-foreground">Trường</div><div className="bg-secondary/40 px-3 py-2 font-medium text-muted-foreground">Trước</div><div className="bg-secondary/40 px-3 py-2 font-medium text-muted-foreground">Sau</div>
                          {changes.map((change) => <><div key={`${change.key}-label`} className="bg-background px-3 py-2 font-medium text-foreground">{fieldLabels[change.key] || change.key}</div><div key={`${change.key}-before`} className="break-words bg-background px-3 py-2 text-muted-foreground">{formatChangeValue(change.before)}</div><div key={`${change.key}-after`} className="break-words bg-background px-3 py-2 text-foreground">{formatChangeValue(change.after)}</div></>)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
