import { useState } from "react";
import { BellRing, ChevronDown, ChevronUp, CircleAlert, CircleCheck, ImageUp, PackageSearch, Radio, RefreshCw, Save, SlidersHorizontal, Sparkles, TimerReset, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { createChyusenSourceUpdatePayload } from "@shared/chyusenSourceUpdate";
import { marketplaceAutoSyncStatusLabel } from "@shared/marketplaceAutoSync";
import { DEFAULT_RGB_EFFECT_COLORS, DEFAULT_RGB_EFFECTS_ENABLED, DEFAULT_RGB_EFFECTS_SPEED, readRgbEffectsColors, readRgbEffectsEnabled, readRgbEffectsSpeed, RGB_EFFECT_SPEEDS, saveRgbEffectsColors, saveRgbEffectsEnabled, saveRgbEffectsSpeed, type RgbEffectColors, type RgbEffectSpeed } from "@/lib/rgbEffects";
import { DEFAULT_LOGIN_BACKGROUND_URL, readLoginBackgroundDailyRandom, readLoginBackgroundHistory, readLoginBackgroundUrl, rememberLoginBackgroundUrl, removeLoginBackgroundUrl, saveLoginBackgroundDailyRandom, saveLoginBackgroundUrl, type LoginBackgroundHistoryItem } from "@/lib/loginBackground";
import { DEFAULT_LOGIN_BACKGROUND_EDIT, renderLoginBackgroundDataUrl, type LoginBackgroundEdit } from "@/lib/loginBackgroundEditor";

const INTERVALS = [{ value: "60", label: "1 giờ" }, { value: "180", label: "3 giờ" }, { value: "360", label: "6 giờ" }, { value: "720", label: "12 giờ" }, { value: "1440", label: "24 giờ" }] as const;
const BATCH_SIZES = [6, 12, 18, 20] as const;
const TRASH_RETENTION_DAYS = [7, 14, 30, 60, 90, 180] as const;
type SourceDraft = { label: string; sourceUrl: string; checkIntervalMinutes: string; isActive: boolean };
type SourceFilter = "all" | "errors";
type SettingsSection = "rgb" | "chyusen" | "sources" | "marketplace" | "trash" | "background" | "backgroundDaily" | "backgroundHistory";

function statusStyle(status?: string | null) {
  if (status === "unavailable") return "border-red-200 bg-red-50 text-red-700";
  if (status === "detected") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function Settings() {
  const utils = trpc.useUtils();
  const { data: notificationSettings } = trpc.chyusen.notificationSettings.useQuery();
  const { data: sources = [] } = trpc.chyusen.sources.useQuery();
  const { data: autoSyncStatus } = trpc.products.autoSyncStatus.useQuery();
  const { data: trashAutoCleanup } = trpc.trash.autoCleanupStatus.useQuery();
  const [sourceDrafts, setSourceDrafts] = useState<Record<number, SourceDraft>>({});
  const [deleteSourceId, setDeleteSourceId] = useState<number | null>(null);
  const [newSource, setNewSource] = useState({ label: "", sourceUrl: "", checkIntervalMinutes: "360" });
  const [sourcesExpanded, setSourcesExpanded] = useState(true);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [rgbEffectsEnabled, setRgbEffectsEnabled] = useState(() => readRgbEffectsEnabled(typeof window === "undefined" ? undefined : window.localStorage));
  const [rgbEffectsSpeed, setRgbEffectsSpeed] = useState<RgbEffectSpeed>(() => readRgbEffectsSpeed(typeof window === "undefined" ? undefined : window.localStorage));
  const [rgbEffectsColors, setRgbEffectsColors] = useState<RgbEffectColors>(() => readRgbEffectsColors(typeof window === "undefined" ? undefined : window.localStorage));
  const [loginBackgroundUrl, setLoginBackgroundUrl] = useState(() => readLoginBackgroundUrl(typeof window === "undefined" ? undefined : window.localStorage));
  const [loginBackgroundHistory, setLoginBackgroundHistory] = useState<LoginBackgroundHistoryItem[]>(() => readLoginBackgroundHistory(typeof window === "undefined" ? undefined : window.localStorage));
  const [loginBackgroundDailyRandom, setLoginBackgroundDailyRandom] = useState(() => readLoginBackgroundDailyRandom(typeof window === "undefined" ? undefined : window.localStorage));
  const [loginBackgroundDraft, setLoginBackgroundDraft] = useState<{ source: string; edit: LoginBackgroundEdit } | null>(null);
  const [pendingBackgroundRemoval, setPendingBackgroundRemoval] = useState<string | null>(null);
  const [collapsedSettingsSections, setCollapsedSettingsSections] = useState<Record<SettingsSection, boolean>>({ rgb: true, chyusen: true, sources: true, marketplace: true, trash: true, background: true, backgroundDaily: true, backgroundHistory: true });

  const updateSettings = trpc.chyusen.updateNotificationSettings.useMutation({ onSuccess: () => { utils.chyusen.notificationSettings.invalidate(); toast.success("Đã cập nhật cài đặt nhắc hạn."); } });
  const updateSource = trpc.chyusen.updateSource.useMutation({ onSuccess: () => { utils.chyusen.sources.invalidate(); toast.success("Đã lưu thay đổi nguồn theo dõi."); } });
  const deleteSource = trpc.chyusen.deleteSource.useMutation({ onSuccess: () => { setDeleteSourceId(null); setSourceDrafts({}); utils.chyusen.sources.invalidate(); toast.success("Đã xóa nguồn theo dõi."); } });
  const createSource = trpc.chyusen.createSource.useMutation({ onSuccess: () => { setNewSource({ label: "", sourceUrl: "", checkIntervalMinutes: "360" }); utils.chyusen.sources.invalidate(); toast.success("Đã thêm nguồn theo dõi."); } });
  const checkSourceNow = trpc.chyusen.checkSourceNow.useMutation({
    onSuccess: (result) => { utils.chyusen.sources.invalidate(); utils.chyusen.sourceHistory.invalidate(); toast[result.unavailable ? "error" : "success"](result.unavailable ? `Không thể kiểm tra nguồn: ${result.latestError || "lỗi không xác định"}` : result.changed ? "Đã kiểm tra: phát hiện nội dung nguồn thay đổi." : "Đã kiểm tra: nguồn hiện không có thay đổi."); },
    onError: (error) => toast.error(error.message || "Không thể kiểm tra nguồn ngay bây giờ."),
  });
  const updateAutoSync = trpc.products.updateAutoSyncSettings.useMutation({ onSuccess: () => { utils.products.autoSyncStatus.invalidate(); toast.success("Đã lưu cấu hình đồng bộ Marketplace."); }, onError: (error) => toast.error(error.message || "Không thể lưu cấu hình Marketplace.") });
  const syncMarketplaceNow = trpc.products.syncAllSnkrdunk.useMutation({
    onSuccess: (result) => {
      utils.products.list.invalidate();
      utils.dashboard.stats.invalidate();
      utils.reports.overview.invalidate();
      utils.products.autoSyncStatus.invalidate();
      toast.success(`Đã đồng bộ ${result.updatedCount} sản phẩm${result.errors.length ? `; ${result.errors.length} sản phẩm chưa cập nhật được` : ""}.`);
    },
    onError: (error) => toast.error(error.message || "Không thể đồng bộ Marketplace ngay bây giờ."),
  });
  const updateTrashAutoCleanup = trpc.trash.updateAutoCleanupSettings.useMutation({
    onSuccess: (settings) => {
      utils.trash.autoCleanupStatus.invalidate();
      toast.success(settings.isEnabled ? "Đã bật tự động dọn Thùng rác." : "Đã lưu cấu hình dọn Thùng rác.");
    },
    onError: (error) => toast.error(error.message || "Không thể lưu cấu hình tự động dọn Thùng rác."),
  });
  const uploadLoginBackground = trpc.loginBackground.upload.useMutation({
    onSuccess: (result) => {
      const url = saveLoginBackgroundUrl(result.url, window.localStorage);
      setLoginBackgroundUrl(url);
      setLoginBackgroundHistory(rememberLoginBackgroundUrl(url, window.localStorage));
      setLoginBackgroundDraft(null);
      toast.success("Đã cập nhật nền đăng nhập trên thiết bị này.");
    },
    onError: (error) => toast.error(error.message || "Không thể tải ảnh nền lên."),
  });

  const deadlineHours = notificationSettings?.deadlineHours || [168, 72, 24, 12, 3, 1];
  const failedSources = sources.filter((source: any) => source.latestStatus === "unavailable");
  const visibleSources = sourceFilter === "errors" ? failedSources : sources;
  const sourceDraft = (source: any): SourceDraft => sourceDrafts[source.id] || { label: source.label || "", sourceUrl: source.sourceUrl || "", checkIntervalMinutes: String(source.checkIntervalMinutes || 360), isActive: Boolean(source.isActive) };
  const updateDraft = (source: any, patch: Partial<SourceDraft>) => setSourceDrafts((current) => ({ ...current, [source.id]: { ...sourceDraft(source), ...patch } }));
  const saveSource = (source: any) => {
    try {
      updateSource.mutate(createChyusenSourceUpdatePayload(source.id, sourceDraft(source)), { onSuccess: () => setSourceDrafts((current) => { const next = { ...current }; delete next[source.id]; return next; }) });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu nguồn theo dõi.");
    }
  };
  const updateRgbEffects = (enabled: boolean) => {
    saveRgbEffectsEnabled(enabled, window.localStorage);
    setRgbEffectsEnabled(enabled);
    toast.success(enabled ? "Đã bật hiệu ứng RGB cho logo và tiêu đề." : "Đã tắt hiệu ứng RGB trên thiết bị này.");
  };
  const updateRgbEffectsSpeed = (speed: RgbEffectSpeed) => {
    saveRgbEffectsSpeed(speed, window.localStorage);
    setRgbEffectsSpeed(speed);
    toast.success(`Đã đặt tốc độ hiệu ứng RGB: ${speed === "slow" ? "Chậm" : speed === "fast" ? "Nhanh" : "Bình thường"}.`);
  };
  const updateRgbEffectsColor = (index: number, color: string) => {
    const next = rgbEffectsColors.map((current, currentIndex) => currentIndex === index ? color : current) as RgbEffectColors;
    saveRgbEffectsColors(next, window.localStorage);
    setRgbEffectsColors(next);
  };
  const resetRgbEffects = () => {
    saveRgbEffectsEnabled(DEFAULT_RGB_EFFECTS_ENABLED, window.localStorage);
    saveRgbEffectsSpeed(DEFAULT_RGB_EFFECTS_SPEED, window.localStorage);
    saveRgbEffectsColors(DEFAULT_RGB_EFFECT_COLORS, window.localStorage);
    setRgbEffectsEnabled(DEFAULT_RGB_EFFECTS_ENABLED);
    setRgbEffectsSpeed(DEFAULT_RGB_EFFECTS_SPEED);
    setRgbEffectsColors(DEFAULT_RGB_EFFECT_COLORS);
    toast.success("Đã khôi phục hiệu ứng RGB mặc định.");
  };
  const uploadLoginBackgroundFile = (file?: File) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { toast.error("Hãy chọn ảnh PNG, JPEG hoặc WEBP."); return; }
    if (file.size > 4_000_000) { toast.error("Ảnh nền phải có dung lượng tối đa 4 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setLoginBackgroundDraft({ source: String(reader.result), edit: DEFAULT_LOGIN_BACKGROUND_EDIT });
    reader.onerror = () => toast.error("Không thể đọc tệp ảnh nền.");
    reader.readAsDataURL(file);
  };
  const resetLoginBackground = () => {
    const url = saveLoginBackgroundUrl(DEFAULT_LOGIN_BACKGROUND_URL, window.localStorage);
    setLoginBackgroundUrl(url);
    toast.success("Đã khôi phục nền đăng nhập mặc định.");
  };
  const selectLoginBackground = (url: string) => {
    setLoginBackgroundUrl(saveLoginBackgroundUrl(url, window.localStorage));
    toast.success("Đã đổi nền đăng nhập.");
  };
  const removeRecentLoginBackground = (url: string) => {
    const next = removeLoginBackgroundUrl(url, window.localStorage);
    setLoginBackgroundHistory(next);
    if (loginBackgroundUrl === url) setLoginBackgroundUrl(saveLoginBackgroundUrl(DEFAULT_LOGIN_BACKGROUND_URL, window.localStorage));
    toast.success("Đã xóa nền khỏi danh sách gần đây.");
  };
  const updateLoginBackgroundDailyRandom = (enabled: boolean) => {
    saveLoginBackgroundDailyRandom(enabled, window.localStorage);
    setLoginBackgroundDailyRandom(enabled);
    toast.success(enabled ? "Đã bật đổi nền ngẫu nhiên mỗi ngày." : "Đã tắt đổi nền ngẫu nhiên mỗi ngày.");
  };
  const toggleSettingsSection = (section: SettingsSection, event: React.MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest("button, input, [role=switch], [role=combobox]")) return;
    setCollapsedSettingsSections((current) => ({ ...current, [section]: !current[section] }));
  };
  const updateLoginBackgroundEdit = (patch: Partial<LoginBackgroundEdit>) => setLoginBackgroundDraft((current) => current ? { ...current, edit: { ...current.edit, ...patch } } : current);
  const saveEditedLoginBackground = async () => {
    if (!loginBackgroundDraft) return;
    try {
      const imageDataUrl = await renderLoginBackgroundDataUrl(loginBackgroundDraft.source, loginBackgroundDraft.edit);
      if (imageDataUrl.length > 5_500_000) { toast.error("Ảnh sau khi chỉnh vẫn quá lớn. Hãy giảm độ phóng to hoặc dùng ảnh nhẹ hơn."); return; }
      uploadLoginBackground.mutate({ imageDataUrl });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể chỉnh ảnh nền.");
    }
  };

  return <div className="settings-stack mx-auto max-w-5xl">
    <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Workspace settings</p><h1 className="mt-1 text-3xl font-black tracking-tight">Cài đặt</h1><p className="mt-1 text-sm text-muted-foreground">Quản lý nhắc hạn, nguồn Chyusen và tự động đồng bộ giá ở một nơi.</p></div>

    <Card className="settings-collapsible-panel" data-collapsed={collapsedSettingsSections.rgb}>
      <CardHeader data-settings-header onClick={(event) => toggleSettingsSection("rgb", event)}><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-fuchsia-400" />Hiệu ứng RGB</CardTitle><CardDescription>Bật hoặc tắt hiệu ứng màu chạy ngang cho logo TCG Manager và tiêu đề chính. Lựa chọn được lưu riêng trên thiết bị này.</CardDescription></CardHeader>
      <CardContent className="space-y-3"><div className="flex items-center justify-between gap-4 rounded-lg border p-3"><div><p className="text-sm font-semibold">Dải màu RGB</p><p className="mt-1 text-xs text-muted-foreground">{rgbEffectsEnabled ? "Đang bật cho logo và tiêu đề trang" : "Đang tắt — tiêu đề hiển thị màu mặc định"}</p></div><Switch checked={rgbEffectsEnabled} onCheckedChange={updateRgbEffects} aria-label="Bật hoặc tắt hiệu ứng RGB" /></div><div className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_180px] sm:items-center"><div><p className="text-sm font-semibold">Tốc độ hiệu ứng</p><p className="mt-1 text-xs text-muted-foreground">Áp dụng cho dải màu RGB của logo và tiêu đề.</p></div><Select value={rgbEffectsSpeed} onValueChange={(value) => updateRgbEffectsSpeed(value as RgbEffectSpeed)}><SelectTrigger aria-label="Tốc độ hiệu ứng RGB"><SelectValue /></SelectTrigger><SelectContent>{RGB_EFFECT_SPEEDS.map((speed) => <SelectItem key={speed} value={speed}>{speed === "slow" ? "Chậm" : speed === "fast" ? "Nhanh" : "Bình thường"}</SelectItem>)}</SelectContent></Select></div><div className="rounded-lg border p-3"><p className="text-sm font-semibold">Màu gradient</p><p className="mt-1 text-xs text-muted-foreground">Chọn bốn màu để tạo dải gradient chạy theo ý thích.</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">{rgbEffectsColors.map((color, index) => <label key={`${color}-${index}`} className="flex items-center gap-2 rounded-md border bg-background/40 px-2 py-1.5 text-xs"><input type="color" value={color} onChange={(event) => updateRgbEffectsColor(index, event.target.value.toUpperCase())} className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0" aria-label={`Chọn màu gradient ${index + 1}`} /><span className="font-mono text-muted-foreground">{color}</span></label>)}</div></div><div className={`rgb-effects-preview ${rgbEffectsEnabled ? "" : "is-disabled"}`} data-rgb-speed={rgbEffectsSpeed}><div className="flex items-center justify-between gap-3"><span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Xem trước hiệu ứng</span><span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{rgbEffectsSpeed === "slow" ? "Chậm" : rgbEffectsSpeed === "fast" ? "Nhanh" : "Bình thường"}</span></div><p className="rgb-effects-preview-logo mt-3">TCG Manager</p><p className="rgb-effects-preview-title mt-1">Tiêu đề trang của bạn</p><p className="mt-2 text-xs text-muted-foreground">{rgbEffectsEnabled ? "Bản xem trước thay đổi ngay theo tốc độ và màu bạn chọn." : "Bật hiệu ứng RGB để xem chuyển động màu."}</p></div><div className="flex justify-end"><Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={resetRgbEffects}><TimerReset className="h-3.5 w-3.5" />Đặt lại mặc định</Button></div></CardContent>
    </Card>

    <Card className="settings-collapsible-panel" data-collapsed={collapsedSettingsSections.chyusen}>
      <CardHeader data-settings-header onClick={(event) => toggleSettingsSection("chyusen", event)}><CardTitle className="flex items-center gap-2"><BellRing className="h-5 w-5 text-red-600" />Nhắc hạn Chyusen</CardTitle><CardDescription>Chọn các mốc nhắc áp dụng riêng cho tài khoản của bạn.</CardDescription></CardHeader>
      <CardContent className="space-y-5"><div className="flex flex-wrap gap-2">{[168, 72, 24, 12, 3, 1].map((hour) => { const selected = deadlineHours.includes(hour); return <Button key={hour} variant={selected ? "default" : "outline"} size="sm" className={selected ? "bg-red-600 hover:bg-red-700" : ""} onClick={() => updateSettings.mutate({ deadlineHours: selected ? deadlineHours.filter((value: number) => value !== hour) : [...deadlineHours, hour] })}>{hour >= 24 ? `${hour / 24} ngày` : `${hour} giờ`}</Button>; })}</div><div className="grid gap-3 border-t pt-4 sm:grid-cols-2">{[["lotteryNew", "Chyusen mới"], ["lotteryExpiring", "Sắp hết hạn"], ["lotteryResult", "Ngày công bố"], ["lotteryChanged", "Nguồn thay đổi"]].map(([key, label]) => <div key={key} className="flex items-center justify-between rounded-lg border p-3"><span className="text-sm font-medium">{label}</span><Switch checked={notificationSettings ? Boolean((notificationSettings as any)[key]) : true} onCheckedChange={(checked) => updateSettings.mutate({ [key]: checked })} /></div>)}</div></CardContent>
    </Card>

    <Card className="settings-collapsible-panel" data-collapsed={collapsedSettingsSections.sources}>
      <CardHeader data-settings-header onClick={(event) => toggleSettingsSection("sources", event)} className="gap-3 sm:flex sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2"><Radio className="h-5 w-5 text-red-600" />Nguồn theo dõi</CardTitle><CardDescription className="mt-1">Thu gọn danh sách khi không cần chỉnh sửa; dùng bộ lọc để xem nhanh nguồn lỗi.</CardDescription></div><div className="flex flex-wrap gap-2"><Button size="sm" variant={sourceFilter === "errors" ? "default" : "outline"} className={sourceFilter === "errors" ? "bg-red-600 hover:bg-red-700" : ""} onClick={() => setSourceFilter((current) => current === "errors" ? "all" : "errors")}><CircleAlert className="mr-1.5 h-3.5 w-3.5" />{sourceFilter === "errors" ? "Đang lọc lỗi" : `Nguồn lỗi (${failedSources.length})`}</Button><Button size="sm" variant="outline" onClick={() => setSourcesExpanded((current) => !current)} aria-expanded={sourcesExpanded}>{sourcesExpanded ? <ChevronUp className="mr-1.5 h-3.5 w-3.5" /> : <ChevronDown className="mr-1.5 h-3.5 w-3.5" />}{sourcesExpanded ? "Thu gọn" : `Mở rộng (${visibleSources.length})`}</Button></div></CardHeader>
      <Collapsible open={sourcesExpanded} onOpenChange={setSourcesExpanded}><CollapsibleContent><CardContent className="space-y-3">{visibleSources.length === 0 ? <div className="rounded-lg border border-dashed px-4 py-7 text-center"><CircleAlert className="mx-auto mb-2 h-5 w-5 text-muted-foreground" /><p className="text-sm font-semibold">Không có nguồn đang lỗi</p><p className="mt-1 text-xs text-muted-foreground">Đổi bộ lọc để xem tất cả nguồn theo dõi.</p></div> : visibleSources.map((source: any) => { const draft = sourceDraft(source); const hasError = source.latestStatus === "unavailable"; return <div key={source.id} className="space-y-3 rounded-lg border p-3"><div className="grid gap-3 md:grid-cols-[1fr_1.5fr_110px_auto]"><Input value={draft.label} onChange={(event) => updateDraft(source, { label: event.target.value })} placeholder="Tên nguồn" /><Input value={draft.sourceUrl} onChange={(event) => updateDraft(source, { sourceUrl: event.target.value })} placeholder="URL công khai" /><Select value={draft.checkIntervalMinutes} onValueChange={(value) => updateDraft(source, { checkIntervalMinutes: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{INTERVALS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select><div className="flex items-center gap-2"><Switch checked={draft.isActive} onCheckedChange={(checked) => updateDraft(source, { isActive: checked })} /><span className="text-xs text-muted-foreground">{draft.isActive ? "Bật" : "Tắt"}</span></div></div><div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3"><div className="flex flex-wrap items-center gap-2 text-xs"><span className={`rounded-full border px-2 py-0.5 font-semibold ${statusStyle(source.latestStatus)}`}>{source.latestStatus === "unavailable" ? "Không truy cập được" : source.latestStatus === "detected" ? "Có thay đổi" : "Hoạt động bình thường"}</span><span className="text-muted-foreground">Kiểm tra gần nhất: {source.lastCheckedAt ? new Date(source.lastCheckedAt).toLocaleString("vi-VN") : "Chưa có"}</span>{hasError && <span className="inline-flex items-center gap-1 text-red-700"><CircleAlert className="h-3.5 w-3.5" />{source.latestError || "Lỗi không xác định"}</span>}</div><div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={checkSourceNow.isPending} onClick={() => checkSourceNow.mutate({ id: source.id })}><RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${checkSourceNow.isPending ? "animate-spin" : ""}`} />{checkSourceNow.isPending ? "Đang kiểm tra" : "Kiểm tra ngay"}</Button><Button variant="outline" size="sm" disabled={updateSource.isPending} onClick={() => saveSource(source)}><Save className="mr-1.5 h-3.5 w-3.5" />{updateSource.isPending ? "Đang lưu" : "Lưu"}</Button><Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800" onClick={() => setDeleteSourceId(source.id)}><Trash2 className="mr-1.5 h-3.5 w-3.5" />Xóa</Button></div></div></div>; })}<div className="grid gap-3 rounded-lg border border-dashed p-3 md:grid-cols-[1fr_1.5fr_110px_auto]"><Input value={newSource.label} onChange={(e) => setNewSource({ ...newSource, label: e.target.value })} placeholder="Tên nguồn mới" /><Input value={newSource.sourceUrl} onChange={(e) => setNewSource({ ...newSource, sourceUrl: e.target.value })} placeholder="https://..." /><Select value={newSource.checkIntervalMinutes} onValueChange={(value) => setNewSource({ ...newSource, checkIntervalMinutes: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{INTERVALS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select><Button disabled={!newSource.sourceUrl || createSource.isPending} className="bg-red-600 hover:bg-red-700" onClick={() => createSource.mutate({ label: newSource.label, sourceUrl: newSource.sourceUrl, checkIntervalMinutes: Number(newSource.checkIntervalMinutes) as 60 | 180 | 360 | 720 | 1440 })}>{createSource.isPending ? "Đang lưu" : "Thêm nguồn"}</Button></div></CardContent></CollapsibleContent></Collapsible>
    </Card>

    <Card className="settings-collapsible-panel" data-collapsed={collapsedSettingsSections.marketplace}>
      <CardHeader data-settings-header onClick={(event) => toggleSettingsSection("marketplace", event)}><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><PackageSearch className="h-5 w-5 text-red-600" />Đồng bộ giá Marketplace</CardTitle><CardDescription className="mt-1">Tự động đồng bộ SNKRDUNK mỗi 6 giờ. Bạn có thể chạy thủ công theo yêu cầu bất cứ lúc nào.</CardDescription></div><Button className="bg-red-600 hover:bg-red-700" disabled={syncMarketplaceNow.isPending} onClick={() => syncMarketplaceNow.mutate()}><RefreshCw className={`mr-1.5 h-4 w-4 ${syncMarketplaceNow.isPending ? "animate-spin" : ""}`} />{syncMarketplaceNow.isPending ? "Đang đồng bộ" : "Đồng bộ ngay"}</Button></div></CardHeader>
      <CardContent className="space-y-4"><div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_auto]"><div><p className="text-sm font-semibold">Đồng bộ tự động</p><p className="text-xs text-muted-foreground">Tối đa {autoSyncStatus?.batchSize || 12} sản phẩm/lần, giữ nguyên giá cũ nếu nguồn không trả giá hợp lệ.</p></div><div className="flex items-center gap-2"><Switch checked={Boolean(autoSyncStatus?.isEnabled)} disabled={!autoSyncStatus || updateAutoSync.isPending} onCheckedChange={(isEnabled) => updateAutoSync.mutate({ isEnabled })} /><span className="text-xs font-medium">{autoSyncStatus?.isEnabled ? "Đang bật" : "Đang tắt"}</span></div></div><div className="grid gap-3 sm:grid-cols-2"><div><p className="mb-2 text-xs font-semibold text-muted-foreground">Kích thước lô tự động</p><Select value={String(autoSyncStatus?.batchSize || 12)} onValueChange={(value) => updateAutoSync.mutate({ batchSize: Number(value) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BATCH_SIZES.map((size) => <SelectItem key={size} value={String(size)}>{size} sản phẩm / lần</SelectItem>)}</SelectContent></Select></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Lần chạy tự động gần nhất</p><p className="mt-1 flex items-center gap-1 text-sm font-semibold"><CircleCheck className="h-4 w-4 text-emerald-600" />{autoSyncStatus?.lastRunStatus ? marketplaceAutoSyncStatusLabel(autoSyncStatus.lastRunStatus) : "Chưa chạy"}</p><p className="mt-1 text-xs text-muted-foreground">{autoSyncStatus?.lastRunAt ? new Date(autoSyncStatus.lastRunAt).toLocaleString("vi-VN") : "Lịch nền đã sẵn sàng"}</p></div></div>{autoSyncStatus?.lastRunSummary && <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">{autoSyncStatus.lastRunSummary}</p>}</CardContent>
    </Card>

    <Card className="settings-collapsible-panel" data-collapsed={collapsedSettingsSections.trash}>
      <CardHeader data-settings-header onClick={(event) => toggleSettingsSection("trash", event)}><CardTitle className="flex items-center gap-2"><TimerReset className="h-5 w-5 text-red-600" />Tự động dọn Thùng rác</CardTitle><CardDescription>Tự động xóa vĩnh viễn các mục đã nằm trong Thùng rác quá số ngày bạn chọn. Lịch này chỉ áp dụng cho dữ liệu của tài khoản bạn.</CardDescription></CardHeader>
      <CardContent className="space-y-4"><div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_auto]"><div><p className="text-sm font-semibold">Dọn dẹp tự động mỗi ngày</p><p className="text-xs text-muted-foreground">Mục đã khôi phục sẽ không bị dọn. Bạn vẫn có thể dọn thủ công trong Thùng rác bất cứ lúc nào.</p></div><div className="flex items-center gap-2"><Switch checked={Boolean(trashAutoCleanup?.isEnabled)} disabled={!trashAutoCleanup || updateTrashAutoCleanup.isPending} onCheckedChange={(isEnabled) => updateTrashAutoCleanup.mutate({ isEnabled })} /><span className="text-xs font-medium">{trashAutoCleanup?.isEnabled ? "Đang bật" : "Đang tắt"}</span></div></div><div className="grid gap-3 sm:grid-cols-2"><div><p className="mb-2 text-xs font-semibold text-muted-foreground">Giữ mục đã xóa trong</p><Select value={String(trashAutoCleanup?.retentionDays || 30)} disabled={!trashAutoCleanup || updateTrashAutoCleanup.isPending} onValueChange={(value) => updateTrashAutoCleanup.mutate({ retentionDays: Number(value) })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TRASH_RETENTION_DAYS.map((days) => <SelectItem key={days} value={String(days)}>{days} ngày</SelectItem>)}</SelectContent></Select></div><div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Lần dọn tự động gần nhất</p><p className="mt-1 flex items-center gap-1 text-sm font-semibold"><CircleCheck className={`h-4 w-4 ${trashAutoCleanup?.lastRunStatus === "failed" ? "text-red-600" : "text-emerald-600"}`} />{trashAutoCleanup?.lastRunStatus === "success" ? "Hoàn tất" : trashAutoCleanup?.lastRunStatus === "failed" ? "Không thành công" : trashAutoCleanup?.lastRunStatus === "skipped" ? "Đã bỏ qua" : "Chưa chạy"}</p><p className="mt-1 text-xs text-muted-foreground">{trashAutoCleanup?.lastRunAt ? new Date(trashAutoCleanup.lastRunAt).toLocaleString("vi-VN") : "Chạy hằng ngày khi bạn bật cấu hình"}</p></div></div>{trashAutoCleanup?.lastRunSummary && <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">{trashAutoCleanup.lastRunSummary}</p>}</CardContent>
    </Card>

    <Card className="settings-login-background-card settings-collapsible-panel" data-collapsed={collapsedSettingsSections.background}>
      <CardHeader data-settings-header onClick={(event) => toggleSettingsSection("background", event)}><CardTitle className="flex items-center gap-2"><ImageUp className="h-5 w-5 text-sky-400" />Nền đăng nhập</CardTitle><CardDescription>Tải ảnh PNG, JPEG hoặc WEBP tối đa 4 MB để thay nền đăng nhập trên thiết bị này.</CardDescription></CardHeader>
      <CardContent className="space-y-3"><div className="h-28 rounded-lg border bg-cover bg-center" style={{ backgroundImage: `linear-gradient(rgba(3, 7, 18, 0.15), rgba(3, 7, 18, 0.48)), url(${loginBackgroundUrl})` }}><div className="flex h-full items-end p-3"><span className="rounded bg-black/55 px-2 py-1 text-xs font-semibold text-white">Xem trước nền đăng nhập</span></div></div><div className="flex flex-col gap-2 sm:flex-row"><Input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploadLoginBackground.isPending} onChange={(event) => { uploadLoginBackgroundFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /><Button type="button" variant="outline" disabled={uploadLoginBackground.isPending} onClick={resetLoginBackground}><TimerReset className="mr-1.5 h-4 w-4" />Nền mặc định</Button></div>{loginBackgroundDraft && <div className="space-y-3 rounded-lg border border-sky-500/25 bg-sky-500/5 p-3"><div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-sky-400" /><p className="text-sm font-semibold">Cắt và chỉnh ảnh trước khi lưu</p></div><div className="relative aspect-video overflow-hidden rounded-md border bg-black"><img src={loginBackgroundDraft.source} alt="Bản xem trước ảnh nền đang chỉnh" className="h-full w-full object-cover" style={{ transform: `translate(${loginBackgroundDraft.edit.positionX * 12}%, ${loginBackgroundDraft.edit.positionY * 12}%) scale(${loginBackgroundDraft.edit.zoom})`, filter: `brightness(${loginBackgroundDraft.edit.brightness})` }} /></div><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium">Phóng to: {loginBackgroundDraft.edit.zoom.toFixed(1)}×<Input className="mt-1" type="range" min="1" max="2.5" step="0.1" value={loginBackgroundDraft.edit.zoom} onChange={(event) => updateLoginBackgroundEdit({ zoom: Number(event.target.value) })} /></label><label className="text-xs font-medium">Độ sáng: {Math.round(loginBackgroundDraft.edit.brightness * 100)}%<Input className="mt-1" type="range" min="0.6" max="1.4" step="0.05" value={loginBackgroundDraft.edit.brightness} onChange={(event) => updateLoginBackgroundEdit({ brightness: Number(event.target.value) })} /></label><label className="text-xs font-medium">Vị trí ngang<Input className="mt-1" type="range" min="-1" max="1" step="0.05" value={loginBackgroundDraft.edit.positionX} onChange={(event) => updateLoginBackgroundEdit({ positionX: Number(event.target.value) })} /></label><label className="text-xs font-medium">Vị trí dọc<Input className="mt-1" type="range" min="-1" max="1" step="0.05" value={loginBackgroundDraft.edit.positionY} onChange={(event) => updateLoginBackgroundEdit({ positionY: Number(event.target.value) })} /></label></div><div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setLoginBackgroundDraft(null)}>Hủy chỉnh ảnh</Button><Button type="button" size="sm" className="bg-red-600 hover:bg-red-700" disabled={uploadLoginBackground.isPending} onClick={() => void saveEditedLoginBackground()}>{uploadLoginBackground.isPending ? "Đang lưu" : "Lưu nền đã chỉnh"}</Button></div></div>}<p className="text-xs text-muted-foreground">{uploadLoginBackground.isPending ? "Đang tải ảnh nền lên..." : "Ảnh được cắt theo khung 16:9 và chỉ dùng làm nền đăng nhập cho trình duyệt này."}</p></CardContent>
    </Card>

    <Card className="settings-login-background-card settings-collapsible-panel" data-collapsed={collapsedSettingsSections.backgroundHistory}>
      <CardHeader data-settings-header onClick={(event) => toggleSettingsSection("backgroundHistory", event)}><CardTitle className="text-base">Nền đã tải gần đây</CardTitle><CardDescription>Chọn nhanh một trong tối đa sáu hình nền đã lưu trên thiết bị này.</CardDescription></CardHeader>
      <CardContent>{loginBackgroundHistory.length > 0 ? <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">{loginBackgroundHistory.map((item) => <div key={item.url} className="relative aspect-video"><button type="button" aria-label="Dùng nền đã tải" onClick={() => selectLoginBackground(item.url)} className={`h-full w-full overflow-hidden rounded-md border transition ${loginBackgroundUrl === item.url ? "ring-2 ring-red-500" : "hover:border-sky-400"}`}><img src={item.url} alt="Nền đăng nhập đã tải" className="h-full w-full object-cover" /></button><button type="button" aria-label="Xóa nền khỏi danh sách gần đây" title="Xóa nền khỏi danh sách gần đây" onClick={() => setPendingBackgroundRemoval(item.url)} className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow transition hover:bg-red-700"><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div> : <p className="rounded-lg border border-dashed px-3 py-5 text-center text-sm text-muted-foreground">Chưa có hình nền tùy chỉnh. Hãy tải và lưu ảnh đầu tiên ở mục Nền đăng nhập.</p>}</CardContent>
    </Card>

    <Card className="settings-login-background-card settings-collapsible-panel" data-collapsed={collapsedSettingsSections.backgroundDaily}>
      <CardHeader data-settings-header onClick={(event) => toggleSettingsSection("backgroundDaily", event)}><CardTitle className="text-base">Nền ngẫu nhiên mỗi ngày</CardTitle><CardDescription>Tự chọn một ảnh khác mỗi ngày từ các nền bạn đã tải lên.</CardDescription></CardHeader>
      <CardContent><div className="flex items-center justify-between gap-4 rounded-lg border p-3"><div><p className="text-sm font-semibold">Đổi nền tự động mỗi ngày</p><p className="mt-1 text-xs text-muted-foreground">{loginBackgroundHistory.length > 0 ? "Ảnh được chọn theo ngày trên thiết bị này khi mở màn hình đăng nhập." : "Tải ít nhất một nền tùy chỉnh để bật tính năng này."}</p></div><Switch checked={loginBackgroundDailyRandom} disabled={loginBackgroundHistory.length === 0} onCheckedChange={updateLoginBackgroundDailyRandom} aria-label="Bật đổi nền ngẫu nhiên mỗi ngày" /></div></CardContent>
    </Card>

    <AlertDialog open={deleteSourceId !== null} onOpenChange={(open) => !open && setDeleteSourceId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Xóa nguồn theo dõi?</AlertDialogTitle><AlertDialogDescription>Nguồn sẽ không còn được kiểm tra tự động. Các Chyusen và audit log hiện có vẫn được giữ nguyên.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteSourceId && deleteSource.mutate({ id: deleteSourceId })}>Xóa nguồn</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    <AlertDialog open={pendingBackgroundRemoval !== null} onOpenChange={(open) => !open && setPendingBackgroundRemoval(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle><AlertDialogDescription>Hình nền sẽ bị xóa khỏi danh sách gần đây trên thiết bị này. Nếu đây là nền đang dùng, ứng dụng sẽ chuyển về nền mặc định.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Hủy</AlertDialogCancel><AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => { if (pendingBackgroundRemoval) removeRecentLoginBackground(pendingBackgroundRemoval); setPendingBackgroundRemoval(null); }}>Xóa nền</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
