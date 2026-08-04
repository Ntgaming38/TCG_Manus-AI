import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Search, Filter, Package, Warehouse } from "lucide-react";
import { useState } from "react";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("in_stock");

  const { data: products } = trpc.products.list.useQuery({
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search || undefined,
  });

  const totalItems = products?.reduce((sum: number, p: any) => sum + p.quantity, 0) ?? 0;
  const totalValue = products?.reduce((sum: number, p: any) => sum + (Number(p.marketPrice) * p.quantity), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kho Hàng</h1>
        <p className="text-muted-foreground text-sm mt-1">Quản lý tồn kho sản phẩm</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
              <p className="text-xl font-bold">{totalItems}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Warehouse className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Giá trị kho</p>
              <p className="text-xl font-bold">¥{totalValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="box">Box</SelectItem>
            <SelectItem value="pack">Pack</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="in_stock">Trong kho</SelectItem>
            <SelectItem value="sold">Đã bán</SelectItem>
            <SelectItem value="reserved">Đang giữ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Grid */}
      {!products || products.length === 0 ? (
        <div className="text-center py-16">
          <Warehouse className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-muted-foreground">Kho trống</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">Thêm sản phẩm hoặc tạo giao dịch mua để cập nhật kho</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product: any) => (
            <Card key={product.id} className="bg-card border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="secondary" className="text-xs capitalize">{product.type}</Badge>
                  <Badge variant={product.status === 'in_stock' ? 'default' : 'secondary'} className="text-xs">
                    {product.status === 'in_stock' ? 'Trong kho' : product.status === 'sold' ? 'Đã bán' : product.status}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm">{product.name}</h3>
                <p className="text-xs text-muted-foreground">{product.series}</p>
                <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Số lượng:</span>
                    <span className="font-medium">{product.quantity}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Giá vốn:</span>
                    <span className="font-medium">¥{Number(product.buyPrice).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Giá TT:</span>
                    <span className="font-medium">¥{Number(product.marketPrice).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Lợi nhuận:</span>
                    <span className={`font-medium ${Number(product.marketPrice) - Number(product.buyPrice) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Number(product.marketPrice) - Number(product.buyPrice) >= 0 ? '+' : ''}¥{((Number(product.marketPrice) - Number(product.buyPrice)) * product.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
