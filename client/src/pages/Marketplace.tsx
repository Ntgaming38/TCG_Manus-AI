import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, TrendingUp, RefreshCw, ExternalLink, Link2, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Marketplace() {
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();
  const { data: products } = trpc.products.list.useQuery({
    status: "in_stock",
    search: search || undefined,
  });

  const refreshProducts = () => utils.products.list.invalidate();

  const updatePrice = trpc.products.updateMarketPrice.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật giá thị trường thủ công!");
      refreshProducts();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateUrl = trpc.products.updateSnkrdunkUrl.useMutation({
    onSuccess: () => {
      toast.success("Đã lưu link sản phẩm SNKRDUNK!");
      refreshProducts();
    },
    onError: (err) => toast.error(err.message),
  });

  const syncPrice = trpc.products.syncSnkrdunkPrice.useMutation({
    onSuccess: (result) => {
      toast.success(`${result.productName}: giá SNKRDUNK ¥${result.marketPrice.toLocaleString("ja-JP")}`);
      refreshProducts();
    },
    onError: (err) => toast.error(err.message),
  });

  const syncAll = trpc.products.syncAllSnkrdunk.useMutation({
    onSuccess: (result) => {
      refreshProducts();
      if (result.updatedCount > 0) {
        toast.success(`Đã đồng bộ ${result.updatedCount} sản phẩm SNKRDUNK. Bỏ qua ${result.skippedCount} sản phẩm.`);
      } else if (result.errors.length === 0) {
        toast.info(`Chưa có sản phẩm nào được gắn link SNKRDUNK. Đã bỏ qua ${result.skippedCount} sản phẩm.`);
      }
      result.errors.forEach((error) => toast.error(`${error.productName}: ${error.message}`));
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Marketplace</h1>
          <p className="text-muted-foreground text-sm mt-1">Đồng bộ giá công khai từ từng trang sản phẩm SNKRDUNK</p>
        </div>
        <Button
          className="bg-primary text-primary-foreground"
          onClick={() => syncAll.mutate()}
          disabled={syncAll.isPending}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${syncAll.isPending ? "animate-spin" : ""}`} />
          Đồng bộ tất cả giá SNKRDUNK
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Tìm sản phẩm..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

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
            const diffPercent = buyPrice > 0 ? ((diff / buyPrice) * 100).toFixed(1) : "0";

            return (
              <Card key={product.id} className="bg-card neon-card">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-sm">{product.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{product.type} • {product.series}</p>
                    </div>
                    {product.snkrdunkUrl && (
                      <a
                        href={product.snkrdunkUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-500 hover:text-red-600"
                        title="Mở trang SNKRDUNK"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Giá mua:</span>
                      <span>¥{buyPrice.toLocaleString("ja-JP")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Giá SNKRDUNK:</span>
                      <span className="font-medium">¥{marketPrice.toLocaleString("ja-JP")}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Chênh lệch:</span>
                      <span className={`font-bold ${diff >= 0 ? "text-green-600" : "text-red-500"}`}>
                        {diff >= 0 ? "+" : ""}¥{diff.toLocaleString("ja-JP")} ({diffPercent}%)
                      </span>
                    </div>
                  </div>

                  <SnkrdunkControls
                    product={product}
                    onSaveUrl={(snkrdunkUrl) => updateUrl.mutate({ id: product.id, snkrdunkUrl })}
                    onSync={() => syncPrice.mutate({ id: product.id })}
                    isSavingUrl={updateUrl.isPending}
                    isSyncing={syncPrice.isPending}
                  />

                  <div className="pt-3 border-t border-border/50">
                    <ManualPriceInput
                      productId={product.id}
                      currentPrice={marketPrice}
                      onUpdate={(payload) => updatePrice.mutate(payload)}
                      disabled={updatePrice.isPending}
                    />
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

function SnkrdunkControls({
  product,
  onSaveUrl,
  onSync,
  isSavingUrl,
  isSyncing,
}: {
  product: any;
  onSaveUrl: (url: string) => void;
  onSync: () => void;
  isSavingUrl: boolean;
  isSyncing: boolean;
}) {
  const [url, setUrl] = useState(product.snkrdunkUrl ?? "");
  const lastSynced = product.snkrdunkLastSyncedAt
    ? new Date(product.snkrdunkLastSyncedAt).toLocaleString("vi-VN")
    : null;

  return (
    <div className="space-y-2 rounded-lg bg-muted/40 p-3">
      <div className="flex items-center gap-2 text-xs font-medium">
        <Link2 className="h-3.5 w-3.5 text-red-500" />
        Link sản phẩm SNKRDUNK
      </div>
      <div className="flex gap-2">
        <Input
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://snkrdunk.com/en/trading-cards/..."
          className="h-8 text-xs"
          aria-label={`Link SNKRDUNK cho ${product.name}`}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2"
          onClick={() => onSaveUrl(url.trim())}
          disabled={!url.trim() || isSavingUrl}
          title="Lưu link SNKRDUNK"
        >
          <Save className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          {lastSynced ? `Đồng bộ lần cuối: ${lastSynced}` : "Chưa đồng bộ"}
        </span>
        <Button
          size="sm"
          className="h-8 bg-primary text-primary-foreground"
          onClick={onSync}
          disabled={!product.snkrdunkUrl || isSyncing}
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
          Đồng bộ
        </Button>
      </div>
    </div>
  );
}

function ManualPriceInput({
  productId,
  currentPrice,
  onUpdate,
  disabled,
}: {
  productId: number;
  currentPrice: number;
  onUpdate: (payload: { id: number; marketPrice: number }) => void;
  disabled: boolean;
}) {
  const [price, setPrice] = useState(String(currentPrice));
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setEditing(true)}>
        Nhập giá thủ công
      </Button>
    );
  }

  return (
    <div className="flex gap-2">
      <Input
        type="number"
        min="0"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        className="h-8 text-xs"
        placeholder="Giá mới"
      />
      <Button
        size="sm"
        className="h-8 text-xs bg-primary text-primary-foreground"
        disabled={disabled}
        onClick={() => {
          onUpdate({ id: productId, marketPrice: parseFloat(price) || 0 });
          setEditing(false);
        }}
      >
        Lưu
      </Button>
    </div>
  );
}
