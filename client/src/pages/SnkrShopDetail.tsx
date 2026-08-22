import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { trpc } from "@/lib/trpc";
import { formatYen } from "@shared/formatYen";
import { ArrowLeft, BarChart3, Box, ExternalLink, ImageOff, Loader2, Package, RefreshCw, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { useLocation, useRoute } from "wouter";

type DetailItem = { id: number; name: string; productType: "card" | "box" | "pack"; sourceUrl: string; sourceTitle: string | null; imageUrl: string | null; currentPrice: string | number; lastSyncedAt: Date | null; lastSyncError: string | null };
type PricePoint = { id: number; price: string | number; createdAt: Date };
const chartConfig = { price: { label: "Giá SNKRDUNK", color: "#14b8a6" } } satisfies ChartConfig;

function typeLabel(type: DetailItem["productType"]) { return type === "card" ? "Card" : type === "box" ? "Box" : "Pack"; }

export default function SnkrShopDetail() {
  const [, params] = useRoute("/shop-snkr/:id");
  const [, setLocation] = useLocation();
  const itemId = Number(params?.id);
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const [imageFailed, setImageFailed] = useState(false);
  const utils = trpc.useUtils();
  const itemQuery = trpc.snkrShop.get.useQuery({ id: itemId }, { enabled: Number.isInteger(itemId) && itemId > 0 });
  const historyQuery = trpc.snkrShop.priceHistory.useQuery({ id: itemId, days }, { enabled: Number.isInteger(itemId) && itemId > 0 });
  const sync = trpc.snkrShop.sync.useMutation({ onSuccess: (result) => { toast.success(`Đã cập nhật ${result.name}: ${formatYen(result.currentPrice)}`); void itemQuery.refetch(); void historyQuery.refetch(); void utils.snkrShop.list.invalidate(); }, onError: (error) => toast.error(error.message) });
  const item = itemQuery.data as DetailItem | undefined;
  const history = (historyQuery.data ?? []) as PricePoint[];
  const chartData = useMemo(() => history.map((point) => ({ price: Number(point.price) || 0, date: new Date(point.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) })), [history]);

  if (itemQuery.isLoading) return <div className="flex h-72 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-teal-300" /></div>;
  if (!item) return <div className="rounded-2xl border border-dashed border-border py-20 text-center"><p className="text-sm text-muted-foreground">Không tìm thấy sản phẩm theo dõi.</p><Button variant="outline" className="mt-4" onClick={() => setLocation("/shop-snkr")}>Quay lại Shop SNKR</Button></div>;
  const price = Number(item.currentPrice) || 0;
  const title = item.sourceTitle || item.name;
  return <div className="mx-auto max-w-5xl space-y-6 pb-8">
    <div className="flex items-center justify-between gap-3"><Button variant="ghost" onClick={() => setLocation("/shop-snkr")} className="-ml-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="mr-2 h-5 w-5" />Shop SNKR</Button><a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-3 text-sm font-medium text-teal-200 hover:bg-teal-500/10"><ExternalLink className="mr-2 h-4 w-4" />Mở SNKRDUNK</a></div>
    <section className="grid gap-6 rounded-3xl border border-border bg-card p-4 shadow-sm md:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] md:p-7"><div className="flex min-h-72 items-center justify-center overflow-hidden rounded-2xl bg-slate-950/50 p-5 md:min-h-[430px]">{item.imageUrl && !imageFailed ? <img src={item.imageUrl} alt={title} className="h-full max-h-[500px] w-full object-contain" referrerPolicy="no-referrer" onError={() => setImageFailed(true)} /> : <div className="flex flex-col items-center gap-3 text-teal-300/70"><ImageOff className="h-10 w-10" /><span className="text-sm">Chưa có ảnh công khai</span></div>}</div><div className="flex min-w-0 flex-col py-2"><div className="mb-3 flex flex-wrap gap-2"><Badge variant="outline" className="border-teal-500/30 bg-teal-500/10 text-teal-100">{typeLabel(item.productType)}</Badge><Badge variant="outline" className="border-border bg-background text-muted-foreground">Theo dõi giá độc lập</Badge></div><h1 className="break-words text-2xl font-black leading-tight text-foreground md:text-3xl">{title}</h1><p className="mt-4 text-xs text-muted-foreground">Giá mới nhất từ lựa chọn đầu tiên công khai trên SNKRDUNK</p><p className="mt-1 text-4xl font-black tracking-tight text-teal-300">{price > 0 ? formatYen(price) : "Chưa có giá"}</p><p className="mt-2 text-xs text-muted-foreground">{item.lastSyncedAt ? `Cập nhật ${new Date(item.lastSyncedAt).toLocaleString("vi-VN")}` : "Chưa từng đồng bộ"}</p>{item.lastSyncError && <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs leading-5 text-red-200">{item.lastSyncError}</p>}<div className="mt-auto pt-7"><Button onClick={() => sync.mutate({ id: item.id })} disabled={sync.isPending} className="w-full bg-teal-500 font-semibold text-slate-950 hover:bg-teal-400">{sync.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}Cập nhật giá theo dõi</Button><p className="mt-3 flex items-start gap-2 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />Sản phẩm này chỉ dùng để theo dõi giá, không được đưa vào Kho Hàng hoặc báo cáo tài chính.</p></div></div></section>
    <section className="rounded-2xl border border-border bg-card p-4 md:p-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="flex items-center gap-2 text-lg font-bold text-foreground"><BarChart3 className="h-5 w-5 text-teal-300" />Lịch sử biến động giá</h2><p className="mt-1 text-sm text-muted-foreground">Dữ liệu giá được lưu riêng cho sản phẩm theo dõi này.</p></div><div className="flex gap-1.5">{([7, 30, 90] as const).map((value) => <Button key={value} size="sm" variant={days === value ? "default" : "outline"} onClick={() => setDays(value)} className={days === value ? "bg-teal-500 text-slate-950 hover:bg-teal-400" : "border-border bg-background"}>{value} ngày</Button>)}</div></div>{historyQuery.isLoading ? <div className="flex h-60 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-teal-300" /></div> : history.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">Chưa có biến động giá. Đồng bộ thêm để xây dựng biểu đồ theo thời gian.</div> : <ChartContainer config={chartConfig} className="mt-5 h-[260px] w-full md:h-[320px]"><LineChart data={chartData} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="date" tickLine={false} axisLine={false} /><YAxis tickLine={false} axisLine={false} width={62} tickFormatter={(value) => formatYen(Number(value))} /><ChartTooltip content={<ChartTooltipContent hideLabel formatter={(value) => formatYen(Number(value))} />} /><Line type="monotone" dataKey="price" stroke="var(--color-price)" strokeWidth={2.8} dot={{ r: 3, fill: "var(--color-price)" }} activeDot={{ r: 5 }} /></LineChart></ChartContainer>}</section>
  </div>;
}
