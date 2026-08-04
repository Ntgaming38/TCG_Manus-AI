import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Plus, Search, DollarSign, Calendar, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const PLATFORMS = [
  { value: "snkrdunk", label: "SNKRDUNK" },
  { value: "mercari", label: "Mercari" },
  { value: "yahoo", label: "Yahoo Auction" },
  { value: "shop", label: "Card Shop" },
  { value: "offline", label: "Offline" },
  { value: "other", label: "Khác" },
];

type SortField = "date" | "price" | "name";
type SortDirection = "asc" | "desc";

export default function Sales() {
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSale, setNewSale] = useState({
    productId: 0, quantity: 1, salePrice: 0,
    platform: "snkrdunk" as any, fee: 0, shippingFee: 0, otherCost: 0, note: "",
  });

  const { data: sales, refetch } = trpc.sales.list.useQuery({ search: search || undefined });
  const { data: inventoryProducts } = trpc.products.inStock.useQuery();

  const createSale = trpc.sales.create.useMutation({
    onSuccess: () => {
      toast.success("Đã tạo giao dịch bán thành công!");
      setShowAddDialog(false);
      setNewSale({ productId: 0, quantity: 1, salePrice: 0, platform: "snkrdunk", fee: 0, shippingFee: 0, otherCost: 0, note: "" });
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const selectedProduct = inventoryProducts?.find((p: any) => p.id === newSale.productId);
  const totalRevenue = newSale.quantity * newSale.salePrice;
  const totalCost = newSale.fee + newSale.shippingFee + newSale.otherCost;
  const netRevenue = totalRevenue - totalCost;
  const profit = selectedProduct ? netRevenue - (Number(selectedProduct.buyPrice) * newSale.quantity) : 0;

  // Sort sales
  const sortedSales = useMemo(() => {
    if (!sales || sales.length === 0) return [];
    const sorted = [...sales].sort((a: any, b: any) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = new Date(a.saleDate).getTime() - new Date(b.saleDate).getTime();
          break;
        case "price":
          cmp = Number(a.totalRevenue) - Number(b.totalRevenue);
          break;
        case "name":
          cmp = (a.productName || "").localeCompare(b.productName || "", "vi");
          break;
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [sales, sortField, sortDirection]);

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
          <h1 className="text-2xl font-bold text-foreground">Bán Hàng</h1>
          <p className="text-muted-foreground text-sm mt-1">Quản lý giao dịch bán hàng</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Tạo giao dịch bán
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tạo giao dịch bán</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Chọn sản phẩm từ kho</Label>
                <Select value={newSale.productId ? String(newSale.productId) : ""} onValueChange={(v) => setNewSale(p => ({ ...p, productId: parseInt(v) }))}>
                  <SelectTrigger><SelectValue placeholder="Chọn sản phẩm..." /></SelectTrigger>
                  <SelectContent>
                    {inventoryProducts?.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} ({p.type}) - SL: {p.quantity}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedProduct && (
                  <p className="text-xs text-muted-foreground">
                    Đang có: {selectedProduct.quantity} | Giá vốn: ¥{Number(selectedProduct.buyPrice).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Số lượng bán</Label>
                  <Input type="number" min={1} max={selectedProduct?.quantity || 999} value={newSale.quantity} onChange={(e) => setNewSale(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Giá bán (¥/sp)</Label>
                  <Input type="number" min={0} value={newSale.salePrice} onChange={(e) => setNewSale(p => ({ ...p, salePrice: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nơi bán</Label>
                <Select value={newSale.platform} onValueChange={(v) => setNewSale(p => ({ ...p, platform: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLATFORMS.map(pl => (
                      <SelectItem key={pl.value} value={pl.value}>{pl.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Phí nền tảng (¥)</Label>
                  <Input type="number" min={0} value={newSale.fee} onChange={(e) => setNewSale(p => ({ ...p, fee: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Phí ship (¥)</Label>
                  <Input type="number" min={0} value={newSale.shippingFee} onChange={(e) => setNewSale(p => ({ ...p, shippingFee: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Chi phí khác (¥)</Label>
                  <Input type="number" min={0} value={newSale.otherCost} onChange={(e) => setNewSale(p => ({ ...p, otherCost: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="p-3 bg-secondary/50 rounded-lg space-y-1">
                <p className="text-sm text-muted-foreground">Doanh thu: <span className="font-medium text-foreground">¥{totalRevenue.toLocaleString()}</span></p>
                <p className="text-sm text-muted-foreground">Phí: <span className="font-medium text-foreground">-¥{totalCost.toLocaleString()}</span></p>
                <p className="text-sm text-muted-foreground">Thực nhận: <span className="font-medium text-foreground">¥{netRevenue.toLocaleString()}</span></p>
                <p className={`text-sm font-bold ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  Lợi nhuận: {profit >= 0 ? '+' : ''}¥{profit.toLocaleString()}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Textarea value={newSale.note} onChange={(e) => setNewSale(p => ({ ...p, note: e.target.value }))} placeholder="VD: Bán cho khách quen..." />
              </div>
              <Button
                className="w-full"
                onClick={() => createSale.mutate(newSale)}
                disabled={!newSale.productId || !newSale.salePrice || createSale.isPending}
              >
                {createSale.isPending ? "Đang lưu..." : "Lưu giao dịch bán"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Tìm kiếm giao dịch bán..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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

      {/* Sales List */}
      {sortedSales.length === 0 ? (
        <div className="text-center py-16">
          <DollarSign className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-muted-foreground">Chưa có giao dịch bán nào</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">Bấm "Tạo giao dịch bán" để bắt đầu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSales.map((sale: any) => (
            <Card key={sale.id} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{sale.productName || 'Sản phẩm'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {new Date(sale.saleDate).toLocaleDateString('vi-VN')}
                        <span>•</span>
                        {PLATFORMS.find(p => p.value === sale.platform)?.label || sale.platform}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">¥{Number(sale.totalRevenue).toLocaleString()}</p>
                    <p className={`text-xs font-medium ${Number(sale.profit) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {Number(sale.profit) >= 0 ? '+' : ''}¥{Number(sale.profit).toLocaleString()}
                    </p>
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
