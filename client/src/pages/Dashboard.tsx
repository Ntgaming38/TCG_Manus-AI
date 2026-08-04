import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { TrendingUp, Package, ShoppingCart, DollarSign, BarChart3, Activity } from "lucide-react";
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

export default function Dashboard() {
  const { data: stats } = trpc.dashboard.stats.useQuery();

  const totalCapital = stats?.totalCapital ?? 0;
  const currentValue = stats?.currentValue ?? 0;
  const totalProfit = stats?.totalProfit ?? 0;
  const totalProducts = stats?.totalProducts ?? 0;
  const totalCards = stats?.totalCards ?? 0;
  const totalBoxes = stats?.totalBoxes ?? 0;
  const totalPacks = stats?.totalPacks ?? 0;
  const recentActivities = stats?.recentActivities ?? [];
  const chartData = stats?.chartData ?? monthlyData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Thống kê chi tiết</h1>
        <p className="text-muted-foreground text-sm mt-1">Tổng quan tình hình kinh doanh của bạn</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
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

        <Card className="bg-card border-border">
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

        <Card className="bg-card border-border">
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

        <Card className="bg-card border-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
                <p className="text-2xl font-bold text-foreground mt-1">{totalProducts}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Card: {totalCards} | Box: {totalBoxes} | Pack: {totalPacks}
                </p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-card border-border">
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

        <Card className="bg-card border-border">
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
      <Card className="bg-card border-border">
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
                    <p className="text-xs text-muted-foreground">{activity.createdAt}</p>
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
