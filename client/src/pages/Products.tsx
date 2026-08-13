import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { CARD_RARITY_OPTIONS } from "@shared/cardRarity";
import { Plus, Search, Filter, Package, CreditCard, Box, Gift, MoreVertical, Pencil, Trash2, ImagePlus } from "lucide-react";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Products() {
  const [location] = useLocation();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
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

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Đã cập nhật sản phẩm!");
      setShowEditDialog(false);
      setEditingProduct(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Đã xóa sản phẩm!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleImageUpload = async (productId: number, file: File) => {
    setUploadingId(productId);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        const response = await fetch("/api/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64, filename: file.name, contentType: file.type }),
        });
        if (response.ok) {
          const { url } = await response.json();
          await updateProduct.mutateAsync({ id: productId, image: url });
          toast.success("Đã upload ảnh!");
        } else {
          toast.error("Upload ảnh thất bại");
        }
        setUploadingId(null);
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Upload ảnh thất bại");
      setUploadingId(null);
    }
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa "${name}"?`)) {
      deleteProduct.mutate({ id });
    }
  };

  const openEdit = (product: any) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      series: product.series || "Pokemon",
      setName: product.setName || "",
      quantity: product.quantity,
      buyPrice: Number(product.buyPrice),
      marketPrice: Number(product.marketPrice) || 0,
      description: product.description || "",
      cardNumber: product.cardNumber || "",
      language: product.language || "Japanese",
      rarity: product.rarity || "",
      condition: product.condition || "New",
      psaGrade: product.psaGrade || "",
    });
    setShowEditDialog(true);
  };

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
                          {CARD_RARITY_OPTIONS.map((rarity) => (
                            <SelectItem key={rarity.value} value={rarity.value}>{rarity.label}</SelectItem>
                          ))}
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

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sửa sản phẩm</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Tên sản phẩm</Label>
                <Input value={editingProduct.name} onChange={(e) => setEditingProduct((p: any) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Series</Label>
                  <Input value={editingProduct.series} onChange={(e) => setEditingProduct((p: any) => ({ ...p, series: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Set</Label>
                  <Input value={editingProduct.setName} onChange={(e) => setEditingProduct((p: any) => ({ ...p, setName: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Số lượng</Label>
                  <Input type="number" min={0} value={editingProduct.quantity} onChange={(e) => setEditingProduct((p: any) => ({ ...p, quantity: parseInt(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Giá mua (¥)</Label>
                  <Input type="number" min={0} value={editingProduct.buyPrice} onChange={(e) => setEditingProduct((p: any) => ({ ...p, buyPrice: parseFloat(e.target.value) || 0 }))} />
                </div>
                <div className="space-y-2">
                  <Label>Giá thị trường (¥)</Label>
                  <Input type="number" min={0} value={editingProduct.marketPrice} onChange={(e) => setEditingProduct((p: any) => ({ ...p, marketPrice: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Textarea value={editingProduct.description} onChange={(e) => setEditingProduct((p: any) => ({ ...p, description: e.target.value }))} />
              </div>
              <Button
                className="w-full"
                onClick={() => updateProduct.mutate(editingProduct)}
                disabled={updateProduct.isPending}
              >
                {updateProduct.isPending ? "Đang lưu..." : "Cập nhật"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && uploadingId) {
            handleImageUpload(uploadingId, file);
          }
          e.target.value = "";
        }}
      />

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
            <Card key={product.id} className="bg-card neon-card hover:border-primary/30 transition-colors group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {getTypeIcon(product.type)}
                    <span className="ml-1 capitalize">{product.type}</span>
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Badge variant={product.status === 'in_stock' ? 'default' : 'secondary'} className="text-xs">
                      {product.status === 'in_stock' ? 'Trong kho' : product.status === 'sold' ? 'Đã bán' : product.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/10 hover:bg-black/20 rounded-full">
                          <MoreVertical className="h-5 w-5 text-gray-800" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(product)}>
                          <Pencil className="h-3 w-3 mr-2" />
                          Sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setUploadingId(product.id);
                          fileInputRef.current?.click();
                        }}>
                          <ImagePlus className="h-3 w-3 mr-2" />
                          Upload ảnh
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400" onClick={() => handleDelete(product.id, product.name)}>
                          <Trash2 className="h-3 w-3 mr-2" />
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {/* Product image */}
                {product.image && (
                  <div className="mb-3 rounded-lg overflow-hidden bg-secondary/30 aspect-[4/3]">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                )}
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
