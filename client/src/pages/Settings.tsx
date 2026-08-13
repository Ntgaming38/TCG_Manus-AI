import { useState } from "react";
import { BellRing, Radio, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const INTERVALS = [
  { value: "60", label: "1 giờ" }, { value: "180", label: "3 giờ" }, { value: "360", label: "6 giờ" }, { value: "720", label: "12 giờ" }, { value: "1440", label: "24 giờ" },
] as const;

export default function Settings() {
  const utils = trpc.useUtils();
  const { data: notificationSettings } = trpc.chyusen.notificationSettings.useQuery();
  const { data: sources = [] } = trpc.chyusen.sources.useQuery();
  const [newSource, setNewSource] = useState({ label: "", sourceUrl: "", checkIntervalMinutes: "360" });
  const updateSettings = trpc.chyusen.updateNotificationSettings.useMutation({ onSuccess: () => { utils.chyusen.notificationSettings.invalidate(); toast.success("Đã cập nhật cài đặt nhắc hạn."); } });
  const updateSource = trpc.chyusen.updateSource.useMutation({ onSuccess: () => { utils.chyusen.sources.invalidate(); toast.success("Đã lưu nguồn theo dõi."); } });
  const createSource = trpc.chyusen.createSource.useMutation({ onSuccess: () => { setNewSource({ label: "", sourceUrl: "", checkIntervalMinutes: "360" }); utils.chyusen.sources.invalidate(); toast.success("Đã thêm nguồn theo dõi."); } });

  const deadlineHours = notificationSettings?.deadlineHours || [168, 72, 24, 12, 3, 1];
  return <div className="mx-auto max-w-5xl space-y-6">
    <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-red-600">Workspace settings</p><h1 className="mt-1 text-3xl font-black tracking-tight">Cài đặt</h1><p className="mt-1 text-sm text-muted-foreground">Quản lý nhắc hạn và các nguồn theo dõi Chyusen ở một nơi riêng gọn gàng.</p></div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><BellRing className="h-5 w-5 text-red-600" />Nhắc hạn Chyusen</CardTitle><CardDescription>Chọn các mốc nhắc áp dụng riêng cho tài khoản của bạn.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="flex flex-wrap gap-2">{[168, 72, 24, 12, 3, 1].map((hour) => { const selected = deadlineHours.includes(hour); return <Button key={hour} variant={selected ? "default" : "outline"} size="sm" className={selected ? "bg-red-600 hover:bg-red-700" : ""} onClick={() => updateSettings.mutate({ deadlineHours: selected ? deadlineHours.filter((value: number) => value !== hour) : [...deadlineHours, hour] })}>{hour >= 24 ? `${hour / 24} ngày` : `${hour} giờ`}</Button>; })}</div><div className="grid gap-3 border-t pt-4 sm:grid-cols-2">{[["lotteryNew", "Chyusen mới"], ["lotteryExpiring", "Sắp hết hạn"], ["lotteryResult", "Ngày công bố"], ["lotteryChanged", "Nguồn thay đổi"]].map(([key, label]) => <div key={key} className="flex items-center justify-between rounded-lg border p-3"><span className="text-sm font-medium">{label}</span><Switch checked={notificationSettings ? Boolean((notificationSettings as any)[key]) : true} onCheckedChange={(checked) => updateSettings.mutate({ [key]: checked })} /></div>)}</div></CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2"><Radio className="h-5 w-5 text-red-600" />Nguồn theo dõi</CardTitle><CardDescription>Từng nguồn được kiểm tra khi đến hạn. Chỉnh URL, bật/tắt và tần suất tại đây.</CardDescription></CardHeader><CardContent className="space-y-3">{sources.map((source: any) => <div key={source.id} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1.5fr_110px_auto_auto]"><Input defaultValue={source.label || ""} onBlur={(e) => e.target.value !== (source.label || "") && updateSource.mutate({ id: source.id, label: e.target.value })} placeholder="Tên nguồn" /><Input defaultValue={source.sourceUrl} onBlur={(e) => e.target.value !== source.sourceUrl && updateSource.mutate({ id: source.id, sourceUrl: e.target.value })} placeholder="URL công khai" /><Select defaultValue={String(source.checkIntervalMinutes || 360)} onValueChange={(value) => updateSource.mutate({ id: source.id, checkIntervalMinutes: Number(value) as 60 | 180 | 360 | 720 | 1440 })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{INTERVALS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select><div className="flex items-center gap-2"><Switch checked={Boolean(source.isActive)} onCheckedChange={(checked) => updateSource.mutate({ id: source.id, isActive: checked })} /><span className="text-xs text-muted-foreground">{source.isActive ? "Bật" : "Tắt"}</span></div><span className="text-xs text-muted-foreground self-center">Lần tới: {source.nextCheckAt ? new Date(source.nextCheckAt).toLocaleString("vi-VN") : "—"}</span></div>)}<div className="grid gap-3 rounded-lg border border-dashed p-3 md:grid-cols-[1fr_1.5fr_110px_auto]"><Input value={newSource.label} onChange={(e) => setNewSource({ ...newSource, label: e.target.value })} placeholder="Tên nguồn mới" /><Input value={newSource.sourceUrl} onChange={(e) => setNewSource({ ...newSource, sourceUrl: e.target.value })} placeholder="https://..." /><Select value={newSource.checkIntervalMinutes} onValueChange={(value) => setNewSource({ ...newSource, checkIntervalMinutes: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{INTERVALS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select><Button disabled={!newSource.sourceUrl || createSource.isPending} className="bg-red-600 hover:bg-red-700" onClick={() => createSource.mutate({ label: newSource.label, sourceUrl: newSource.sourceUrl, checkIntervalMinutes: Number(newSource.checkIntervalMinutes) as 60 | 180 | 360 | 720 | 1440 })}>{createSource.isPending ? "Đang lưu" : "Thêm nguồn"}</Button></div></CardContent></Card>
  </div>;
}
