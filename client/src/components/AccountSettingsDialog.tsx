import { useEffect, useRef, useState } from "react";
import { Camera, ExternalLink, Loader2, ShieldCheck, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

type AccountUser = {
  name?: string | null;
  nickname?: string | null;
  email?: string | null;
  loginMethod?: string | null;
  avatarUrl?: string | null;
};

type AccountSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AccountUser | null | undefined;
};

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Không thể đọc ảnh."));
    reader.onerror = () => reject(new Error("Không thể đọc ảnh."));
    reader.readAsDataURL(file);
  });
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
  const uploadAvatar = trpc.auth.uploadAvatar.useMutation();
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
  }, [open, user?.avatarUrl, user?.name, user?.nickname]);

  const displayName = nickname.trim() || user?.name || "Người dùng";
  const provider = loginProviderLabel(user?.loginMethod);
  const securityUrl = user?.loginMethod?.toLowerCase() === "google" ? "https://myaccount.google.com/security" : "https://manus.im";

  const handleAvatarSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/image\/(png|jpeg|webp)/.test(file.type) || file.size > 3 * 1024 * 1024) {
      toast.error("Chỉ hỗ trợ PNG, JPEG hoặc WEBP, tối đa 3 MB.");
      return;
    }

    try {
      const imageDataUrl = await readFileAsDataUrl(file);
      const result = await uploadAvatar.mutateAsync({ imageDataUrl });
      setAvatarUrl(result.url);
      toast.success("Đã tải ảnh đại diện. Bấm Lưu thay đổi để áp dụng.");
    } catch (error: any) {
      toast.error(error?.message || "Không thể tải ảnh đại diện.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto" onOpenAutoFocus={(event) => event.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Cài đặt tài khoản</DialogTitle>
          <DialogDescription>Quản lý tên hiển thị, ảnh đại diện và bảo mật đăng nhập.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <section className="rounded-xl border border-border bg-secondary/20 p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/40 shadow-lg">
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
          </section>

          <section className="space-y-2">
            <Label htmlFor="account-nickname" className="flex items-center gap-2"><UserRound className="h-4 w-4 text-primary" />Tên hiển thị / Nickname</Label>
            <Input id="account-nickname" value={nickname} maxLength={60} onChange={(event) => setNickname(event.target.value)} placeholder="Nhập nickname muốn hiển thị" />
            <p className="text-xs text-muted-foreground">Nickname sẽ thay tên tài khoản ở thanh bên. Để trống để dùng tên đăng nhập gốc.</p>
          </section>

          <section className="rounded-xl border border-sky-400/30 bg-sky-500/10 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" />
              <div>
                <p className="font-semibold text-sky-100">Bảo mật đăng nhập</p>
                <p className="mt-1 text-xs leading-5 text-sky-100/80">Bạn đang đăng nhập bằng <strong>{provider}</strong>. TCG Manager không lưu mật khẩu riêng, vì vậy mật khẩu cần được đổi trực tiếp tại nhà cung cấp đăng nhập.</p>
                <a href={securityUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center text-xs font-semibold text-sky-200 hover:text-white hover:underline">
                  Quản lý hoặc đổi mật khẩu {provider}<ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button type="button" className="bg-primary text-primary-foreground" disabled={updateProfile.isPending || uploadAvatar.isPending} onClick={() => updateProfile.mutate({ nickname: nickname.trim(), avatarUrl })}>
              {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Lưu thay đổi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
