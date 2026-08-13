export type ChyusenDashboardEntry = {
  timeState: string;
  applicationStatus: string;
  resultStatus?: string | null;
};

export function summarizeChyusenDashboard(entries: ChyusenDashboardEntry[]) {
  const isResolved = (entry: ChyusenDashboardEntry) => entry.applicationStatus === "won" || entry.applicationStatus === "lost" || entry.resultStatus === "won" || entry.resultStatus === "lost";
  return {
    expiring: entries.filter((entry) => !isResolved(entry) && entry.applicationStatus !== "registered" && entry.timeState === "expiring").length,
    waitingResult: entries.filter((entry) => !isResolved(entry) && (entry.applicationStatus === "registered" || entry.timeState === "waiting_result")).length,
    won: entries.filter((entry) => entry.applicationStatus === "won" || entry.resultStatus === "won").length,
    lost: entries.filter((entry) => entry.applicationStatus === "lost" || entry.resultStatus === "lost").length,
  };
}
