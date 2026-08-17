import { useEffect, useRef, useState } from "react";
import { Camera, Crop, ExternalLink, History, Loader2, Move, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AVATAR_BORDER_PRESETS, normalizeAvatarBorderColor } from "@shared/avatarBorder";

type AccountUser = {
  name?: string | null;
  nickname?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  avatarUrl?: string | null;
  avatarBorderColor?: string | null;
};

type AccountSettingsDialogProps = { open: boolean; onOpenChange: (open: boolean) => void; user: AccountUser | null | undefined };

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Không thể đọc ảnh."));
    reader.onerror = () => reject(new Error("Không thể đọc ảnh."));
    reader.readAsDataURL(file);
  });
}

function loadImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không thể xử lý ảnh này."));
    image.src = source;
  });
}

async function createCroppedAvatar(source: string, zoom: number, offsetX: number, offsetY: number) {
  const image = await loadImage(source);
  const minSide = Math.min(image.naturalWidth, image.naturalHeight);
  const cropSide = minSide / zoom;
  const horizontalRange = Math.max(0, image.naturalWidth - cropSide);
  const verticalRange = Math.max(0, image.naturalHeight - cropSide);
  const sourceX = Math.min(horizontalRange, Math.max(0, (horizontalRange / 2) + (horizontalRange / 2) * (offsetX / 100)));
  const sourceY = Math.min(verticalRange, Math.max(0, (verticalRange / 2) + (verticalRange / 2) * (offsetY / 100)));
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 640;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Không thể tạo ảnh đại diện.");
  context.drawImage(image, sourceX, sourceY, cropSide, cropSide, 0, 0, 640, 640);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function loginProviderLabel(loginMethod?: string | null) {
  if (loginMethod?.toLowerCase() === "google") return "Google";
  if (loginMethod?.toLowerCase() === "apple") return "Apple";
  if (loginMethod?.toLowerCase() === "email") return "Email / Manus";
  return loginMethod || "Manus OAuth";
}

export function AccountSettingsDialog({ open, onOpenChange, user }: AccountSettingsDialogProps) {
  const utils = trpc.useUtils();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [borderColor, setBorderColor] = useState<string>(AVATAR_BORDER_PRESETS[0].value);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);
  const uploadAvatar = trpc.auth.uploadAvatar.useMutation();
  const { data: loginEvents = [], isLoading: isLoginHistoryLoading } = trpc.auth.loginHistory.useQuery(undefined, { enabled: open, staleTime: 30_000 });
  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: (profile) => {
      utils.auth.me.setData(undefined, profile);
      toast.success("Đã cập nhật thông tin tài khoản.");
      onOpenChange(false);
    },
    onError: (error) => toast.error(error.message || "Không thể cập nhật tài khoản."),
  });

  useEffect(() => {
    if (!open) return;
    setNickname(user?.nickname || user?.name || "");
    setAvatarUrl(user?.avatarUrl || null);
    setBorderColor(normalizeAvatarBorderColor(user?.avatarBorderColor));
    setCropSource(null);
  }, [open, user?.avatarBorderColor, user?.avatarUrl, user?.name, user?.nickname]);

  const displayName = nickname.trim() || user?.name || "Người dùng";
  const provider = loginProviderLabel(user?.loginMethod);
  const isGoogleLogin = user?.loginMethod?.toLowerCase() === "google";
  const securityUrl = isGoogleLogin ? "https://support.google.com/accounts/answer/41078" : "https://manus.im";

  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/image\/(png|jpeg|webp)/.test(file.type) || file.size > 3 * 1024 * 1024) {
      toast.error("Chỉ hỗ trợ PNG, JPEG hoặc WEBP, tối đa 3 MB.");
      return;
    }
    try {
      setCropSource(await readFileAsDataUrl(file));
      setCropZoom(1);
      setCropX(0);
      setCropY(0);
    } catch (error: any) {
      toast.error(error?.message || "Không thể đọc ảnh đại diện.");
    }
  };

  const applyAvatarCrop = async () => {
    if (!cropSource) return;
    try {
      const imageDataUrl = await createCroppedAvatar(cropSource, cropZoom, cropX, cropY);
      const result = await uploadAvatar.mutateAsync({ imageDataUrl });
      setAvatarUrl(result.url);
      setCropSource(null);
      toast.success("Đã cắt ảnh đại diện. Bấm Lưu thay đổi để áp dụng.");
    } catch (error: any) {
      toast.error(error?.message || "Không thể cắt ảnh đại diện.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto" onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Cài đặt tài khoản</DialogTitle>
          <DialogDescription>Quản lý tên hiển thị, ảnh đại diện, lịch sử đăng nhập và bảo mật.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <section className="rounded-xl border border-border bg-secondary/20 p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 shadow-lg" style={{ borderColor }}>
                <AvatarImage src={avatarUrl || undefined} alt={displayName} className="object-cover" />
                <AvatarFallback className="bg-primary/15 text-xl font-bold text-primary">{displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{displayName}</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{user?.email || "Không có email"}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploadAvatar.isPending}>
                    {uploadAvatar.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Camera className="mr-1.5 h-3.5 w-3.5" />}
                    Đổi ảnh
                  </Button>
                  {avatarUrl && <Button type="button" size="sm" variant="ghost" className="text-muted-foreground" onClick={() => setAvatarUrl(null)}>Bỏ ảnh</Button>}
                </div>
                <Input ref={inputRef} className="hidden" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarSelect} />
              </div>
            </div>
            <div className="mt-4 border-t border-border/70 pt-3">
              <Label className="text-xs">Màu viền ảnh đại diện</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {AVATAR_BORDER_PRESETS.map((preset) => <button key={preset.value} type="button" title={preset.label} aria-label={`Chọn viền ${preset.label}`} onClick={() => setBorderColor(preset.value)} className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${borderColor === preset.value ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "border-white/30"}`} style={{ backgroundColor: preset.value }} />)}
              </div>
            </div>
          </section>

          {cropSource && <section className="rounded-xl border border-primary/40 bg-primary/5 p-4">
            <div className="flex items-center gap-2"><Crop className="h-4 w-4 text-primary" /><p className="font-semibold">Cắt và căn ảnh đại diện</p></div>
            <p className="mt-1 text-xs text-muted-foreground">Phóng to và di chuyển ảnh để chọn vùng vuông hiển thị trong avatar.</p>
            <div className="mx-auto mt-4 h-40 w-40 overflow-hidden rounded-full border-2 bg-black/30" style={{ borderColor }}>
              <img src={cropSource} alt="Xem trước vùng cắt avatar" className="h-full w-full object-cover transition-transform duration-150" style={{ transform: `scale(${cropZoom}) translate(${cropX}%, ${cropY}%)` }} />
            </div>
            <div className="mt-4 space-y-3">
              <Label className="flex items-center justify-between text-xs">Phóng to <span>{cropZoom.toFixed(1)}×</span></Label>
              <Input type="range" min="1" max="2.5" step="0.1" value={cropZoom} onChange={(event) => setCropZoom(Number(event.target.value))} />
              <Label className="flex items-center gap-2 text-xs"><Move className="h-3.5 w-3.5" />Dịch ngang</Label>
              <Input type="range" min="-100" max="100" value={cropX} onChange={(event) => setCropX(Number(event.target.value))} />
              <Label className="flex items-center gap-2 text-xs"><Move className="h-3.5 w-3.5 rotate-90" />Dịch dọc</Label>
              <Input type="range" min="-100" max="100" value={cropY} onChange={(event) => setCropY(Number(event.target.value))} />
            </div>
            <div className="mt-4 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setCropSource(null)}>Hủy cắt</Button><Button type="button" onClick={applyAvatarCrop} disabled={uploadAvatar.isPending}>{uploadAvatar.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Dùng vùng cắt</Button></div>
          </section>}

          <section className="space-y-2">
            <Label htmlFor="account-nickname" className="flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" />Tên hiển thị / Nickname</Label>
            <Input id="account-nickname" value={nickname} maxLength={60} onChange={(event) => setNickname(event.target.value)} placeholder="Nhập nickname muốn hiển thị" />
            <p className="text-xs text-muted-foreground">Nickname sẽ thay tên tài khoản ở thanh bên. Để trống để dùng tên đăng nhập gốc.</p>
          </section>

          <section className="rounded-xl border border-border bg-secondary/15 p-4">
            <div className="flex items-center gap-2"><History className="h-4 w-4 text-primary" /><p className="font-semibold">Đăng nhập gần đây</p></div>
            {isLoginHistoryLoading ? <p className="mt-3 text-xs text-muted-foreground">Đang tải lịch sử...</p> : loginEvents.length ? <div className="mt-3 space-y-2">{loginEvents.map((event) => <div key={event.id} className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"><span className="text-xs font-medium">{loginProviderLabel(event.loginMethod)}</span><time className="text-right text-[11px] text-muted-foreground">{new Date(event.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" })}</time></div>)}</div> : <p className="mt-3 text-xs text-muted-foreground">Lịch sử sẽ xuất hiện sau lần đăng nhập tiếp theo.</p>}
          </section>

          <section className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-4">
            <div className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" /><div><p className="font-semibold text-sky-100">Bảo mật đăng nhập</p><p className="mt-1 text-xs leading-5 text-sky-100/80">Bạn đang đăng nhập bằng <strong>{provider}</strong>. TCG Manager không lưu mật khẩu riêng, vì vậy mật khẩu cần được đổi trực tiếp tại nhà cung cấp đăng nhập.</p>{isGoogleLogin && <p className="mt-2 text-xs leading-5 text-sky-100/80">Liên kết dưới đây mở hướng dẫn chính thức của Google thay vì trang tài khoản trực tiếp, giúp tránh lỗi quyền truy cập 403 khi phiên đăng nhập Google không phù hợp.</p>}<a href={securityUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center text-xs font-semibold text-sky-200 hover:text-white hover:underline">{isGoogleLogin ? "Hướng dẫn đổi mật khẩu Google" : `Quản lý hoặc đổi mật khẩu ${provider}`}<ExternalLink className="ml-1.5 h-3.5 w-3.5" /></a></div></div>
          </section>

          <div className="flex justify-end gap-2 pt-1"><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button><Button type="button" className="bg-primary text-primary-foreground" disabled={updateProfile.isPending || uploadAvatar.isPending} onClick={() => updateProfile.mutate({ nickname: nickname.trim(), avatarUrl, avatarBorderColor: borderColor })}>{updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu thay đổi</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
