import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Search, ShoppingCart, Calendar, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const DEFAULT_SHOPS = ["Geo", "Joshin", "Fruichi", "Toysrus", "Lawson", "Seven Eleven", "Family Mart", "Khác"];

type SortField = "date" | "price" | "name";
type SortDirection = "asc" | "desc";

export default function Purchases() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPurchase, setNewPurchase] = useState({
    productName: "", productType: "box" as "card" | "box" | "pack",
    series: "Pokemon", shop: "Joshin", purchaseType: "mua_le" as any,
    quantity: 1, price: 0, note: "",
  });

  const { data: purchases, refetch } = trpc.purchases.list.useQuery({ search: search || undefined });
  const { data: productSuggestions } = trpc.products.suggestions.useQuery(
    { search: newPurchase.productName },
    { enabled: newPurchase.productName.length >= 2 }
  );

  const createPurchase = trpc.purchases.create.useMutation({
    onSuccess: () => {
      toast.success("Đã thêm giao dịch mua thành công!");
      setShowAddDialog(false);
      setNewPurchase({ productName: "", productType: "box", series: "Pokemon", shop: "Joshin", purchaseType: "mua_le", quantity: 1, price: 0, note: "" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  // Sort purchases
  const sortedPurchases = useMemo(() => {
    if (!purchases || purchases.length === 0) return [];
    const sorted = [...purchases].sort((a: any, b: any) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime();
          break;
        case "price":
          cmp = Number(a.totalPrice) - Number(b.totalPrice);
          break;
        case "name":
          cmp = (a.productName || "").localeCompare(b.productName || "", "vi");
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [purchases, sortField, sortDirection]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "name" ? "asc" : "desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />;
    return sortDirection === "asc"
      ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
      : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mua Hàng</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý lịch sử mua hàng</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Thêm mua hàng
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm giao dịch mua</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loại sản phẩm</Label>
                  <Select value={newPurchase.productType} onValueChange={(v) => setNewPurchase(p => ({ ...p, productType: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="pack">Pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hình thức</Label>
                  <Select value={newPurchase.purchaseType} onValueChange={(v) => setNewPurchase(p => ({ ...p, purchaseType: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mua_le">Mua lẻ</SelectItem>
                      <SelectItem value="coc_5">Cọc 5</SelectItem>
                      <SelectItem value="coc_10">Cọc 10</SelectItem>
                      <SelectItem value="coc_30">Cọc 30</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tên sản phẩm</Label>
                <Input
                  value={newPurchase.productName}
                  onChange={(e) => setNewPurchase(p => ({ ...p, productName: e.target.value }))}
                  placeholder="Nhập tên sản phẩm..."
                />
                {productSuggestions && productSuggestions.length > 0 && (
                  <div className="border border-border rounded-lg overflow-hidden mt-1">
                    {productSuggestions.map((s: any) => (
                      <button
                        key={s.id}
                        className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
                        onClick={() => setNewPurchase(p => ({
                          ...p, productName: s.name, productType: s.type, series: s.series || "Pokemon",
                          price: Number(s.buyPrice) || 0,
                        }))}
                      >
                        <span className="capitalize text-xs text-muted-foreground">{s.type}</span>
                        <span>{s.name}</span>
                        {s.buyPrice > 0 && <span className="ml-auto text-xs text-muted-foreground">¥{Number(s.buyPrice).toLocaleString()}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Shop mua</Label>
                <Select value={newPurchase.shop} onValueChange={(v) => setNewPurchase(p => ({ ...p, shop: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DEFAULT_SHOPS.map(shop => (
                      <SelectItem key={shop} value={shop}>{shop}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số lượng</Label>
                  <Input type="number" min={1} value={newPurchase.quantity} onChange={(e) => setNewPurchase(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Giá mua (¥/sản phẩm)</Label>
                  <Input type="number" min={0} value={newPurchase.price} onChange={(e) => setNewPurchase(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Tổng tiền: <span className="font-bold text-foreground">¥{(newPurchase.quantity * newPurchase.price).toLocaleString()}</span></p>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Textarea value={newPurchase.note} onChange={(e) => setNewPurchase(p => ({ ...p, note: e.target.value }))} placeholder="VD: Mua tại Joshin Nagaoka..." />
              </div>
              <Button
                className="w-full"
                onClick={() => createPurchase.mutate(newPurchase)}
                disabled={!newPurchase.productName || !newPurchase.price || createPurchase.isPending}
              >
                {createPurchase.isPending ? "Đang lưu..." : "Lưu giao dịch"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm giao dịch..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">Sắp xếp:</span>
          <Button
            variant={sortField === "date" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2.5 text-xs gap-1"
            onClick={() => toggleSort("date")}
          >
            Ngày <SortIcon field="date" />
          </Button>
          <Button
            variant={sortField === "price" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2.5 text-xs gap-1"
            onClick={() => toggleSort("price")}
          >
            Giá <SortIcon field="price" />
          </Button>
          <Button
            variant={sortField === "name" ? "secondary" : "ghost"}
            size="sm"
            className="h-8 px-2.5 text-xs gap-1"
            onClick={() => toggleSort("name")}
          >
            Tên <SortIcon field="name" />
          </Button>
        </div>
      </div>

      {/* Purchase List */}
      {sortedPurchases.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-muted-foreground">Chưa có giao dịch mua nào</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">Bấm "Thêm mua hàng" để bắt đầu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedPurchases.map((purchase: any) => (
            <Card key={purchase.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{purchase.productName || 'Sản phẩm'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(purchase.purchaseDate).toLocaleDateString('vi-VN')}
                        <span>•</span>
                        {purchase.shop}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">¥{Number(purchase.totalPrice).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{purchase.quantity} x ¥{Number(purchase.price).toLocaleString()}</p>
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
