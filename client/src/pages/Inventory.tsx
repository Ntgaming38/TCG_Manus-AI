import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Search, Package, Warehouse, AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("in_stock");
  const [showDamageDialog, setShowDamageDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [damageQty, setDamageQty] = useState(1);
  const [damageNote, setDamageNote] = useState("");

  const { data: products, refetch } = trpc.products.list.useQuery({
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search || undefined,
  });

  const markDamaged = trpc.products.markDamaged.useMutation({
    onSuccess: () => {
      toast.success("Đã đánh dấu sản phẩm bị hỏng!");
      setShowDamageDialog(false);
      setSelectedProduct(null);
      setDamageQty(1);
      setDamageNote("");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const totalItems = products?.reduce((sum: number, p: any) => sum + p.quantity, 0) ?? 0;
  const totalDamaged = products?.reduce((sum: number, p: any) => sum + (p.damagedQuantity || 0), 0) ?? 0;
  const totalValue = products?.reduce((sum: number, p: any) => sum + (Number(p.marketPrice || p.buyPrice || 0) * (p.quantity - (p.damagedQuantity || 0))), 0) ?? 0;

  const openDamageDialog = (product: any) => {
    setSelectedProduct(product);
    setDamageQty(1);
    setDamageNote("");
    setShowDamageDialog(true);
  };

  const handleMarkDamaged = () => {
    if (!selectedProduct) return;
    markDamaged.mutate({
      productId: selectedProduct.id,
      damagedQty: damageQty,
      damageNote: damageNote || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kho Hàng</h1>
        <p className="text-muted-foreground text-sm mt-1">Quản lý tồn kho sản phẩm</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              <p className="text-sm text-muted-foreground">Giá trị kho (hàng tốt)</p>
              <p className="text-xl font-bold">¥{totalValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Hàng hỏng/rác</p>
              <p className="text-xl font-bold text-red-400">{totalDamaged}</p>
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
            <SelectItem value="damaged">Hỏng/Rác</SelectItem>
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
          {products.map((product: any) => {
            const goodQty = (product.quantity || 0) - (product.damagedQuantity || 0);
            const hasDamaged = (product.damagedQuantity || 0) > 0;
            return (
              <Card key={product.id} className={`bg-card border-border hover:border-primary/30 transition-colors ${hasDamaged ? 'border-red-500/30' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="secondary" className="text-xs capitalize">{product.type}</Badge>
                    <div className="flex gap-1">
                      {hasDamaged && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {product.damagedQuantity} hỏng
                        </Badge>
                      )}
                      <Badge variant={product.status === 'in_stock' ? 'default' : 'secondary'} className="text-xs">
                        {product.status === 'in_stock' ? 'Trong kho' : product.status === 'sold' ? 'Đã bán' : product.status === 'damaged' ? 'Hỏng' : product.status}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm">{product.name}</h3>
                  <p className="text-xs text-muted-foreground">{product.series}</p>
                  
                  {product.damageNote && (
                    <p className="text-xs text-red-400 mt-1 italic line-clamp-2">
                      {product.damageNote}
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-border/50 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Tổng SL:</span>
                      <span className="font-medium">{product.quantity}</span>
                    </div>
                    {hasDamaged && (
                      <>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Hàng tốt:</span>
                          <span className="font-medium text-green-400">{goodQty}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Hàng hỏng:</span>
                          <span className="font-medium text-red-400">{product.damagedQuantity}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Giá vốn:</span>
                      <span className="font-medium">¥{Number(product.buyPrice).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Giá TT:</span>
                      <span className="font-medium">¥{Number(product.marketPrice).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Mark as damaged button */}
                  {product.status === 'in_stock' && goodQty > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      onClick={() => openDamageDialog(product)}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                      Đánh dấu hỏng/rác
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Mark as Damaged Dialog */}
      <Dialog open={showDamageDialog} onOpenChange={setShowDamageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Đánh dấu sản phẩm hỏng/rác
            </DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 mt-2">
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="font-medium text-sm">{selectedProduct.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Loại: {selectedProduct.type} • Số lượng tốt còn lại: {(selectedProduct.quantity || 0) - (selectedProduct.damagedQuantity || 0)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Số lượng bị hỏng</Label>
                <Input
                  type="number"
                  min={1}
                  max={(selectedProduct.quantity || 0) - (selectedProduct.damagedQuantity || 0)}
                  value={damageQty}
                  onChange={(e) => setDamageQty(parseInt(e.target.value) || 1)}
                />
              </div>

              <div className="space-y-2">
                <Label>Lý do hỏng</Label>
                <Textarea
                  value={damageNote}
                  onChange={(e) => setDamageNote(e.target.value)}
                  placeholder="VD: Rách bao bì, móp góc, ướt nước, bị trầy xước..."
                  rows={3}
                />
              </div>

              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-xs text-red-400">
                  <strong>Lưu ý:</strong> Sản phẩm hỏng vẫn nằm trong kho nhưng được tách riêng. 
                  Bạn có thể bán chúng dưới dạng "hàng rác" với giá thấp hơn.
                </p>
              </div>

              <Button
                className="w-full bg-red-600 hover:bg-red-700 text-white"
                onClick={handleMarkDamaged}
                disabled={markDamaged.isPending}
              >
                {markDamaged.isPending ? "Đang xử lý..." : `Đánh dấu ${damageQty} sản phẩm hỏng`}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
