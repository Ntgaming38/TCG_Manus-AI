import { normalizeCardRank } from "@shared/cardRank";
import { Badge } from "@/components/ui/badge";

type RankBadgeProps = {
  rank?: string | null;
  className?: string;
};

const RANK_BADGE_STYLES: Record<string, string> = {
  A: "border-yellow-400 bg-gradient-to-r from-yellow-700 via-amber-400 to-yellow-200 text-slate-950 shadow-[0_0_10px_rgba(250,204,21,0.55)]",
  B: "border-red-500 bg-gradient-to-r from-red-800 via-red-500 to-rose-400 text-white shadow-[0_0_10px_rgba(239,68,68,0.52)]",
  C: "border-cyan-400 bg-gradient-to-r from-blue-800 via-sky-500 to-cyan-300 text-white shadow-[0_0_10px_rgba(56,189,248,0.52)]",
  D: "border-slate-500 bg-gradient-to-r from-black via-slate-900 to-slate-700 text-white shadow-[0_0_10px_rgba(15,23,42,0.72)]",
};

export function RankBadge({ rank, className = "" }: RankBadgeProps) {
  const value = normalizeCardRank(rank);
  return (
    <Badge
      variant="outline"
      className={`shrink-0 border px-1.5 py-0.5 text-[10px] font-extrabold tracking-wide ${RANK_BADGE_STYLES[value]} ${className}`}
      aria-label={`Rank Card ${value}`}
    >
      <span className="rank-rgb-text">Rank {value}</span>
    </Badge>
  );
}
