import { getChyusenDaysRemaining } from "./chyusenDate";

export type ChyusenResultReminderEntry = {
  resultDate?: Date | string | null;
  applicationStatus: string;
  resultStatus?: string | null;
};

export function isChyusenResultAnnouncementToday(entry: ChyusenResultReminderEntry, now = new Date()) {
  if (entry.applicationStatus === "won" || entry.applicationStatus === "lost" || entry.resultStatus === "won" || entry.resultStatus === "lost") return false;
  return getChyusenDaysRemaining(entry.resultDate, now) === 0;
}

export function formatChyusenResultCountdown(value: Date | string | null | undefined, now = new Date()) {
  const days = getChyusenDaysRemaining(value, now);
  if (days === null) return null;
  if (days < 0) return "Đã đến ngày công bố";
  if (days === 0) return "Hôm nay công bố kết quả";
  return `Còn ${days} ngày đến công bố`;
}
