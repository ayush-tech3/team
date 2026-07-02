import type { DataSource } from "@ledge-ai/shared";

export function LiveBadge({
  live,
  source,
}: {
  live?: boolean;
  source?: DataSource;
}) {
  if (live === false) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-error/10 text-error text-[10px] font-bold uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-error" />
        Offline / Mock
      </span>
    );
  }

  const label = source === "finnhub" ? "Live · Finnhub" : "Live · Yahoo Finance";

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-widest">
      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
      {label}
    </span>
  );
}
