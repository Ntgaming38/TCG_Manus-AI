import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, TrendingUp, RefreshCw, ExternalLink } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Marketplace() {
  const [search, setSearch] = useState("");

  const { data: products } = trpc.products.list.useQuery({
    status: "in_stock",
    search: search || undefined,
  });

  const updatePrice = trpc.products.updateMarketPrice.useMutation({
    onSuccess: () => toast.success("Đã cập nhật giá thị trường!"),
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
        <p className="text-muted-foreground text-sm mt-1">Theo dõi giá thị trường SNKRDUNK</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm sản phẩm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Products with market prices */}
      {!products || products.length === 0 ? (
        <div className="text-center py-16">
          <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-muted-foreground">Chưa có sản phẩm nào</h3>
          <p className="text-sm text-muted-foreground/70 mt-1">Thêm sản phẩm vào kho để theo dõi giá</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product: any) => {
            const buyPrice = Number(product.buyPrice);
            const marketPrice = Number(product.marketPrice);
            const diff = marketPrice - buyPrice;
            const diffPercent = buyPrice > 0 ? ((diff / buyPrice) * 100).toFixed(1) : '0';

            return (
              <Card key={product.id} className="bg-card border-border">
                <CardContent className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm">{product.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{product.type} • {product.series}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Giá mua:</span>
                      <span>¥{buyPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Giá SNKRDUNK:</span>
                      <span className="font-medium">¥{marketPrice.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Chênh lệch:</span>
                      <span className={`font-bold ${diff >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {diff >= 0 ? '+' : ''}¥{diff.toLocaleString()} ({diffPercent}%)
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <MarketPriceInput productId={product.id} currentPrice={marketPrice} onUpdate={updatePrice.mutate} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MarketPriceInput({ productId, currentPrice, onUpdate }: { productId: number; currentPrice: number; onUpdate: any }) {
  const [price, setPrice] = useState(String(currentPrice));
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setEditing(true)}>
        <RefreshCw className="h-3 w-3 mr-1" />
        Cập nhật giá
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="h-8 text-xs"
        placeholder="Giá mới"
      />
      <Button size="sm" className="h-8 text-xs" onClick={() => {
        onUpdate({ id: productId, marketPrice: parseFloat(price) || 0 });
        setEditing(false);
      }}>
        Lưu
      </Button>
    </div>
  );
}
