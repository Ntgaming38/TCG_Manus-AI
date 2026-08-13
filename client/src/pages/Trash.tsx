import { useMemo, useState } from "react";
import { Bell, Box, CheckCircle2, ChevronLeft, DollarSign, Package, Radio, RotateCcw, ShoppingCart, Ticket, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function Trash() {
  const [filter, setFilter] = useState<"all" | TrashType>("all");
  const { data: items = [], isLoading } = trpc.trash.list.useQuery();
  const utils = trpc.useUtils();
  const restore = trpc.trash.restore.useMutation({
    onSuccess: (data) => {
      toast.success(`Đã khôi phục ${data.title}.`);
      utils.trash.list.invalidate();
      utils.products.list.invalidate();
      utils.purchases.list.invalidate();
      utils.sales.list.invalidate();
      utils.chyusen.list.invalidate();
      utils.chyusen.sources.invalidate();
      utils.chyusen.notifications.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const filteredItems = useMemo(() => filter === "all" ? items : items.filter((item) => item.entityType === filter), [filter, items]);

  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-red-600"><Trash2 className="h-5 w-5" /><span className="text-sm font-bold uppercase tracking-[0.16em]">Khôi phục dữ liệu</span></div>
            <h1 className="text-3xl font-black tracking-tight">Thùng rác</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Các mục bạn xóa từ sản phẩm, giao dịch, 抽選, nguồn theo dõi và thông báo sẽ nằm ở đây để có thể khôi phục.</p>
          </div>
          <Select value={filter} onValueChange={(value) => setFilter(value as "all" | TrashType)}>
            <SelectTrigger className="w-full sm:w-52"><SelectValue placeholder="Lọc loại dữ liệu" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả dữ liệu</SelectItem>
              {Object.entries(TYPES).map(([key, config]) => <SelectItem key={key} value={key}>{config.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </header>

        <Card className="border-red-200 bg-red-50/60 dark:border-red-900/60 dark:bg-red-950/20">
          <CardContent className="flex gap-3 p-4 text-sm text-red-900 dark:text-red-100"><ChevronLeft className="mt-0.5 h-4 w-4 shrink-0" /><p>Khôi phục sẽ đưa dữ liệu về trạng thái ngay trước khi xóa. Dữ liệu phụ thuộc như giao dịch mua/bán của sản phẩm cũng được khôi phục cùng bản ghi liên quan.</p></CardContent>
        </Card>

        <section className="space-y-3">
          <div className="flex items-center justify-between"><h2 className="font-bold">Mục đã xóa</h2><span className="text-sm text-muted-foreground">{filteredItems.length} mục</span></div>
          {isLoading ? (
            <div className="grid gap-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />)}</div>
          ) : filteredItems.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center gap-3 py-14 text-center"><CheckCircle2 className="h-10 w-10 text-emerald-500" /><div><p className="font-bold">Thùng rác đang trống</p><p className="mt-1 text-sm text-muted-foreground">Các mục đã xóa sẽ xuất hiện tại đây để bạn khôi phục khi cần.</p></div></CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {filteredItems.map((item) => {
                const config = TYPES[item.entityType as TrashType] || TYPES.product;
                const Icon = config.icon;
                return <Card key={item.id} className="transition-shadow hover:shadow-md"><CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3"><div className="rounded-lg bg-muted p-2"><Icon className="h-5 w-5" /></div><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold">{item.title}</p><Badge variant="outline" className={config.className}>{config.label}</Badge></div><p className="mt-1 text-sm text-muted-foreground">Đã xóa {formatDeletedAt(item.deletedAt)}</p></div></div>
                  <Button className="w-full sm:w-auto" onClick={() => restore.mutate({ id: item.id })} disabled={restore.isPending}><RotateCcw className="mr-2 h-4 w-4" />Khôi phục</Button>
                </CardContent></Card>;
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
