import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Search, Filter, Package, CreditCard, Box, Gift } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Products() {
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", type: "box" as "card" | "box" | "pack", series: "Pokemon",
    setName: "", quantity: 1, buyPrice: 0, marketPrice: 0, description: "",
    rarity: "", psaGrade: "", cardNumber: "", language: "Japanese", condition: "New",
  });

  // Determine filter from URL
  const pathType = location.split("/san-pham/")[1];
  const activeType = pathType || typeFilter;

  const { data: products, refetch } = trpc.products.list.useQuery({
    type: activeType !== "all" ? activeType : undefined,
    search: search || undefined,
  });

  const addProduct = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Đã thêm sản phẩm thành công!");
      setShowAddDialog(false);
      setNewProduct({ name: "", type: "box", series: "Pokemon", setName: "", quantity: 1, buyPrice: 0, marketPrice: 0, description: "", rarity: "", psaGrade: "", cardNumber: "", language: "Japanese", condition: "New" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "card": return <CreditCard className="h-4 w-4" />;
      case "box": return <Box className="h-4 w-4" />;
      case "pack": return <Gift className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getTypeLabel = () => {
    if (activeType === "card") return "Card";
    if (activeType === "box") return "Box";
    if (activeType === "pack") return "Pack";
    return "Sản phẩm";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{getTypeLabel()}</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý {getTypeLabel().toLowerCase()} của bạn</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Thêm mới
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm {getTypeLabel()} mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loại</Label>
                  <Select value={newProduct.type} onValueChange={(v) => setNewProduct(p => ({ ...p, type: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="pack">Pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Series</Label>
                  <Select value={newProduct.series} onValueChange={(v) => setNewProduct(p => ({ ...p, series: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pokemon">Pokémon</SelectItem>
                      <SelectItem value="One Piece">One Piece</SelectItem>
                      <SelectItem value="Other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tên sản phẩm</Label>
                <Input value={newProduct.name} onChange={(e) => setNewProduct(p => ({ ...p, name: e.target.value }))} placeholder="VD: Mega Dream EX" />
              </div>
              <div className="space-y-2">
                <Label>Set</Label>
                <Input value={newProduct.setName} onChange={(e) => setNewProduct(p => ({ ...p, setName: e.target.value }))} placeholder="VD: Mega Dream EX" />
              </div>
              {newProduct.type === "card" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Card Number</Label>
                      <Input value={newProduct.cardNumber} onChange={(e) => setNewProduct(p => ({ ...p, cardNumber: e.target.value }))} placeholder="001/187" />
                    </div>
                    <div className="space-y-2">
                      <Label>Rarity</Label>
                      <Select value={newProduct.rarity} onValueChange={(v) => setNewProduct(p => ({ ...p, rarity: v }))}>
                        <SelectTrigger><SelectValue placeholder="Chọn" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Common">Common</SelectItem>
                          <SelectItem value="Uncommon">Uncommon</SelectItem>
                          <SelectItem value="Rare">Rare</SelectItem>
                          <SelectItem value="AR">AR</SelectItem>
                          <SelectItem value="SR">SR</SelectItem>
                          <SelectItem value="SAR">SAR</SelectItem>
                          <SelectItem value="UR">UR</SelectItem>
                          <SelectItem value="Promo">Promo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>PSA Grade</Label>
                      <Select value={newProduct.psaGrade} onValueChange={(v) => setNewProduct(p => ({ ...p, psaGrade: v }))}>
                        <SelectTrigger><SelectValue placeholder="Không có" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Không có</SelectItem>
                          <SelectItem value="PSA10">PSA10</SelectItem>
                          <SelectItem value="PSA9">PSA9</SelectItem>
                          <SelectItem value="PSA8">PSA8</SelectItem>
                          <SelectItem value="PSA7">PSA7</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Condition</Label>
                      <Select value={newProduct.condition} onValueChange={(v) => setNewProduct(p => ({ ...p, condition: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Mint">Mint</SelectItem>
                          <SelectItem value="Near Mint">Near Mint</SelectItem>
                          <SelectItem value="Used">Used</SelectItem>
                          <SelectItem value="Damaged">Damaged</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Số lượng</Label>
                  <Input type="number" min={1} value={newProduct.quantity} onChange={(e) => setNewProduct(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Giá mua (¥)</Label>
                  <Input type="number" min={0} value={newProduct.buyPrice} onChange={(e) => setNewProduct(p => ({ ...p, buyPrice: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Giá thị trường (¥)</Label>
                  <Input type="number" min={0} value={newProduct.marketPrice} onChange={(e) => setNewProduct(p => ({ ...p, marketPrice: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Textarea value={newProduct.description} onChange={(e) => setNewProduct(p => ({ ...p, description: e.target.value }))} placeholder="Ghi chú thêm..." />
              </div>
              <Button
                className="w-full"
                onClick={() => addProduct.mutate(newProduct)}
                disabled={!newProduct.name || addProduct.isPending}
              >
                {addProduct.isPending ? "Đang lưu..." : "Lưu sản phẩm"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        {!pathType && (
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="box">Box</SelectItem>
              <SelectItem value="pack">Pack</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Products Grid */}
      {!products || products.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-muted-foreground">Chưa có sản phẩm nào</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">Bấm "Thêm mới" để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product: any) => (
            <Card key={product.id} className="bg-card border-border hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {getTypeIcon(product.type)}
                    <span className="ml-1 capitalize">{product.type}</span>
                  </Badge>
                  <Badge variant={product.status === 'in_stock' ? 'default' : 'secondary'} className="text-xs">
                    {product.status === 'in_stock' ? 'Trong kho' : product.status}
                  </Badge>
                </div>
                <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{product.series} - {product.setName || 'N/A'}</p>
                <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">SL:</span>
                    <span className="ml-1 font-medium">{product.quantity}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mua:</span>
                    <span className="ml-1 font-medium">¥{Number(product.buyPrice).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Giá TT:</span>
                    <span className="ml-1 font-medium">¥{Number(product.marketPrice).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lãi:</span>
                    <span className={`ml-1 font-medium ${Number(product.marketPrice) - Number(product.buyPrice) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Number(product.marketPrice) - Number(product.buyPrice) >= 0 ? '+' : ''}¥{(Number(product.marketPrice) - Number(product.buyPrice)).toLocaleString()}
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
