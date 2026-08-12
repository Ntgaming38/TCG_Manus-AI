import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { getChyusenDeadlineUrgency, getChyusenTimelineStatus } from "../../../shared/chyusen";
import { BellRing, TrendingUp, Package, ShoppingCart, DollarSign, BarChart3, Activity, PackageCheck, ExternalLink, ArrowRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

// Sample chart data - will be replaced with real data from API
const monthlyData = [
  { month: "T1", revenue: 0, profit: 0 },
  { month: "T2", revenue: 0, profit: 0 },
  { month: "T3", revenue: 0, profit: 0 },
  { month: "T4", revenue: 0, profit: 0 },
  { month: "T5", revenue: 0, profit: 0 },
  { month: "T6", revenue: 0, profit: 0 },
  { month: "T7", revenue: 0, profit: 0 },
  { month: "T8", revenue: 0, profit: 0 },
];

const DAY = 24 * 60 * 60 * 1000;
function formatReminderDate(value: Date | string | null | undefined) {
  return value ? new Date(value).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" }) : "Chưa đặt";
}
function formatRemaining(value: Date | string) {
  const remaining = new Date(value).getTime() - Date.now();
  if (remaining <= 0) return "Đã hết hạn";
  const days = Math.floor(remaining / DAY);
  const hours = Math.floor((remaining % DAY) / (60 * 60 * 1000));
  const minutes = Math.max(1, Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000)));
  if (days > 0) return `Còn ${days} ngày${hours > 0 ? ` ${hours} giờ` : ""}`;
  if (hours > 0) return `Còn ${hours} giờ`;
  return `Còn ${minutes} phút`;
}

function DashboardUrgencyBadge({ entry }: { entry: { registrationStartAt: Date | string | null; registrationDeadline: Date | string | null; drawAt: Date | string | null; resultStatus: "pending" | "won" | "lost" | "not_entered" | "cancelled" } }) {
  const urgency = getChyusenDeadlineUrgency(entry);
  const map = {
    notice: { label: "≤72 giờ", className: "border border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-100" },
    urgent: { label: "≤24 giờ", className: "border border-orange-400 bg-orange-500 text-white hover:bg-orange-500" },
    critical: { label: "≤6 giờ", className: "border border-red-700 bg-red-600 text-white hover:bg-red-600" },
  } as const;
  return urgency ? <Badge className={map[urgency].className}>{map[urgency].label}</Badge> : <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Sắp hết hạn</Badge>;
}

export default function Dashboard() {
  const utils = trpc.useUtils();
  const { data: stats } = trpc.dashboard.stats.useQuery();
  const { data: chyusenEntries = [], isLoading: isChyusenLoading } = trpc.chyusen.list.useQuery();
  const { data: chyusenNotifications = [] } = trpc.chyusen.notifications.useQuery();
  const markChyusenNotificationRead = trpc.chyusen.markNotificationRead.useMutation({ onSuccess: () => void utils.chyusen.notifications.invalidate() });
  const unreadChyusenNotifications = useMemo(() => chyusenNotifications.filter((item) => !item.isRead), [chyusenNotifications]);
  const expiringChyusen = useMemo(() => chyusenEntries
    .filter((entry) => getChyusenTimelineStatus(entry) === "deadline" && entry.registrationDeadline && !entry.isRegistered)
    .sort((a, b) => new Date(a.registrationDeadline!).getTime() - new Date(b.registrationDeadline!).getTime())
    .slice(0, 3), [chyusenEntries]);

  const totalCapital = stats?.totalCapital ?? 0;
  const currentValue = stats?.currentValue ?? 0;
  const totalProfit = stats?.totalProfit ?? 0;
  const totalInStock = stats?.totalInStock ?? 0;
  const inStockCards = stats?.inStockCards ?? 0;
  const inStockBoxes = stats?.inStockBoxes ?? 0;
  const inStockPacks = stats?.inStockPacks ?? 0;
  const totalSold = stats?.totalSold ?? 0;
  const soldCards = stats?.soldCards ?? 0;
  const soldBoxes = stats?.soldBoxes ?? 0;
  const soldPacks = stats?.soldPacks ?? 0;
  const recentActivities = stats?.recentActivities ?? [];
  const chartData = stats?.chartData ?? monthlyData;

  return (
    <div className="space-y-6">
      <div>
      <h1 className="text-2xl font-bold text-foreground">TCG Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">Tổng quan tình hình kinh doanh của bạn</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-card neon-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng vốn</p>
                <p className="text-2xl font-bold text-foreground mt-1">¥{totalCapital.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card neon-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Giá trị hiện tại</p>
                <p className="text-2xl font-bold text-foreground mt-1">¥{currentValue.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card neon-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lợi nhuận</p>
                <p className={`text-2xl font-bold mt-1 ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totalProfit >= 0 ? '+' : ''}¥{totalProfit.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card neon-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng sản phẩm trong kho</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalInStock}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Card: {inStockCards} | Box: {inStockBoxes} | Pack: {inStockPacks}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card neon-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng sản phẩm đã bán</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalSold}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Card: {soldCards} | Box: {soldBoxes} | Pack: {soldPacks}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <PackageCheck className="h-5 w-5 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chyusen reminders */}
      <Card className="border-orange-200 bg-orange-50/60 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-orange-100 p-2.5 text-orange-700"><BellRing className="h-5 w-5" /></div>
              <div><CardTitle className="text-base font-bold text-orange-950">Nhắc nhở Chyusen</CardTitle><p className="mt-1 text-sm text-orange-800/80">Chương trình chưa đăng ký sắp hết hạn đăng ký.</p></div>
            </div>
            <div className="flex items-center gap-2"><Badge className="bg-orange-600 text-white hover:bg-orange-600">{expiringChyusen.length} cảnh báo</Badge><Button asChild size="sm" variant="outline" className="border-orange-300 text-orange-800 hover:bg-orange-100"><a href="/chyusen">Xem Chyusen <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></a></Button></div>
          </div>
          {isChyusenLoading ? <div className="mt-4 rounded-lg border border-dashed border-orange-200 bg-white/70 px-4 py-3 text-sm text-orange-900/70">Đang tải thông báo...</div> : expiringChyusen.length === 0 ? <div className="mt-4 rounded-lg border border-dashed border-orange-200 bg-white/70 px-4 py-3 text-sm text-orange-900/70">Hiện không có chương trình chưa đăng ký nào sắp hết hạn.</div> : <div className="mt-4 grid gap-2 lg:grid-cols-3">{expiringChyusen.map((entry) => <div key={entry.id} className="flex min-w-0 flex-col gap-2 rounded-xl border border-orange-200 bg-white p-3"><div className="flex items-start justify-between gap-2"><p className="min-w-0 truncate font-semibold text-foreground">{entry.title}</p><DashboardUrgencyBadge entry={entry} /></div><p className="text-xs text-muted-foreground">Hạn: <span className="font-medium text-orange-700">{formatReminderDate(entry.registrationDeadline)}</span></p><div className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-orange-700">{formatRemaining(entry.registrationDeadline!)}</span>{entry.sourceUrl ? <a href={entry.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-semibold text-primary hover:underline">Mở link <ExternalLink className="ml-1 h-3 w-3" /></a> : <span className="text-xs text-muted-foreground">Chưa có link</span>}</div></div>)}</div>}
        </CardContent>
      </Card>

      {unreadChyusenNotifications.length > 0 && <Card className="border-emerald-200 bg-emerald-50/60 shadow-sm"><CardContent className="p-4 sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700"><BellRing className="h-5 w-5" /></div><div><CardTitle className="text-base font-bold text-emerald-950">Phát hiện Chyusen mới</CardTitle><p className="mt-1 text-sm text-emerald-800/80">Thông tin được tìm thấy từ các link P-Bandai bạn đang theo dõi.</p></div></div><Badge className="w-fit bg-emerald-600 text-white hover:bg-emerald-600">{unreadChyusenNotifications.length} mới</Badge></div><div className="mt-4 grid gap-2 lg:grid-cols-2">{unreadChyusenNotifications.slice(0, 4).map((item) => <div key={item.id} className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="truncate font-semibold text-foreground">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.message}</p></div><Button size="sm" variant="outline" className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-100" onClick={() => markChyusenNotificationRead.mutate({ id: item.id })}>Đã xem</Button></div>)}</div></CardContent></Card>}
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card neon-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Doanh thu theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#FFCB05" fill="#FFCB05" fillOpacity={0.1} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card neon-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Lợi nhuận theo tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1a3e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="profit" fill="#4ade80" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="bg-card neon-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            Hoạt động gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Chưa có hoạt động nào</p>
              <p className="text-xs mt-1">Bắt đầu bằng cách thêm sản phẩm hoặc tạo giao dịch mua</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString('vi-VN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
