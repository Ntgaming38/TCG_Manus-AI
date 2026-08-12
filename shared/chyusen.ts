export type ChyusenResultStatus = "pending" | "won" | "lost" | "not_entered" | "cancelled";
export type ChyusenTimelineStatus = "upcoming" | "open" | "deadline" | "expired" | "draw_pending" | "result";

export type ChyusenDateFields = {
  registrationStartAt: Date | string | null | undefined;
  registrationDeadline: Date | string | null | undefined;
  drawAt: Date | string | null | undefined;
  resultStatus: ChyusenResultStatus;
};

export function getChyusenTimelineStatus(entry: ChyusenDateFields, nowMs = Date.now()): ChyusenTimelineStatus {
  if (entry.resultStatus !== "pending") return "result";
  const day = 24 * 60 * 60 * 1000;
  const start = entry.registrationStartAt ? new Date(entry.registrationStartAt).getTime() : null;
  const deadline = entry.registrationDeadline ? new Date(entry.registrationDeadline).getTime() : null;
  const draw = entry.drawAt ? new Date(entry.drawAt).getTime() : null;
  if (start !== null && nowMs < start) return "upcoming";
  if (deadline !== null && nowMs > deadline) return "expired";
  if (deadline !== null && deadline - nowMs <= 3 * day) return "deadline";
  if (draw !== null && nowMs > draw) return "draw_pending";
  return "open";
}
