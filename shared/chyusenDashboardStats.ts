export type ChyusenDashboardEntry = {
  timeState: string;
  urgency?: string | null;
  daysRemaining?: number | null;
  applicationStatus: string;
  resultStatus?: string | null;
};

export function summarizeChyusenDashboard(entries: ChyusenDashboardEntry[]) {
  const isResolved = (entry: ChyusenDashboardEntry) => entry.applicationStatus === "won" || entry.applicationStatus === "lost" || entry.resultStatus === "won" || entry.resultStatus === "lost";
  const isExpiring = (entry: ChyusenDashboardEntry) => !isResolved(entry) && entry.daysRemaining !== null && entry.daysRemaining !== undefined && entry.daysRemaining >= 0 && entry.daysRemaining <= 1;
  return {
    expiring: entries.filter(isExpiring).length,
    deadlineToday: entries.some((entry) => isExpiring(entry) && entry.daysRemaining === 0),
    deadlineTomorrow: entries.some((entry) => isExpiring(entry) && entry.daysRemaining === 1),
    waitingResult: entries.filter((entry) => !isResolved(entry) && (entry.applicationStatus === "registered" || entry.timeState === "waiting_result")).length,
    won: entries.filter((entry) => entry.applicationStatus === "won" || entry.resultStatus === "won").length,
    lost: entries.filter((entry) => entry.applicationStatus === "lost" || entry.resultStatus === "lost").length,
  };
}
