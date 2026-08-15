export type ChyusenNotificationFilter = "all" | "deadline" | "result";

export function getChyusenNotificationFilterGroup(type?: string | null): Exclude<ChyusenNotificationFilter, "all"> | "other" {
  if (type?.startsWith("deadline_")) return "deadline";
  if (type === "result_day") return "result";
  return "other";
}

export function matchesChyusenNotificationFilter(type: string | null | undefined, filter: ChyusenNotificationFilter) {
  return filter === "all" || getChyusenNotificationFilterGroup(type) === filter;
}

export function shouldPlayChyusenAlert(input: { priority?: string | null; soundNewEnabled?: boolean | number | null; soundUrgentEnabled?: boolean | number | null }) {
  const urgent = input.priority === "high" || input.priority === "critical";
  return urgent ? Boolean(input.soundUrgentEnabled) : Boolean(input.soundNewEnabled);
}
